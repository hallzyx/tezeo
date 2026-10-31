import { randomBytes, randomUUID } from "node:crypto";
import { q, q1 } from "./db";
import { getAurora } from "./aurora";
import { TERMINAL, clampFeeBps, mapStatus, type TipStatus } from "./domain";
import { env } from "./env";

export interface CreatorRow {
  id: string; handle: string; display_name: string; message: string; avatar_url: string;
  accent: string; wallet: string; dashboard_token: string;
  pass_enabled: number; pass_price_usd: number; pass_perk: string; created_at: string;
}
export interface TipRow {
  id: string; creator_id: string; status: TipStatus; origin_asset_id: string; origin_chain: string;
  origin_symbol: string; amount_in: string; amount_out_usdc: string; final_out_usdc: string | null;
  app_fee_bps: number; deposit_address: string; deposit_memo: string | null; refund_to: string;
  deadline: string; settlement_tx: string | null; fan_name: string; fan_message: string;
  is_pass: number; pass_token: string | null; pass_expires_at: string | null;
  /** Why it failed/refunded, e.g. "underpaid" or Aurora's refund reason. Support-only, never shown raw. */
  detail?: string | null;
  /** Creator-facing only: USD value of what the fan sent, and Aurora's delivery cost in USDC smallest units. */
  gross_usd?: string | null; delivery_fee_usdc?: string | null;
  created_at: string; updated_at: string;
}

export const PASS_DAYS = 30;
export const PASS_MAX_USD = 500;

/** Creator turns the 30-day pass on/off and sets its price and perk. Price is whole USD, paid once. */
export async function updateCreatorPass(token: string, input: { enabled: boolean; priceUsd: number; perk: string }): Promise<CreatorRow | undefined> {
  const price = Math.round(input.priceUsd);
  if (!(price >= 1 && price <= PASS_MAX_USD)) throw new Error(`Pass price must be between $1 and $${PASS_MAX_USD}.`);
  return q1<CreatorRow>("UPDATE creators SET pass_enabled=$1, pass_price_usd=$2, pass_perk=$3 WHERE dashboard_token=$4 RETURNING *",
    [input.enabled ? 1 : 0, price, input.perk.trim().slice(0, 140), token]);
}

export const getTipByPassToken = (t: string) => q1<TipRow>("SELECT * FROM tips WHERE pass_token = $1", [t]);

/**
 * How much of an origin asset to ask for so the creator still receives `priceUsd` after Aurora's
 * fixed payout cost (~$0.25), route fees and slippage. `bump` widens the margin on a retry.
 */
export function passAmountUnits(priceUsd: number, asset: { decimals: number; usdPrice?: number; stable: boolean }, bump = 1): string {
  const usd = (priceUsd * 1.02 + 0.4) * bump;
  const coins = usd / (asset.usdPrice ?? 1);
  return BigInt(Math.ceil(coins * 10 ** asset.decimals)).toString();
}

export async function createCreator(input: {
  handle: string; displayName: string; message?: string; avatarUrl?: string; accent?: string; wallet: string;
}): Promise<CreatorRow> {
  const row: CreatorRow = {
    id: randomUUID(),
    handle: input.handle,
    display_name: input.displayName,
    message: input.message ?? "",
    avatar_url: input.avatarUrl ?? "",
    accent: input.accent ?? "",
    wallet: input.wallet,
    dashboard_token: randomBytes(24).toString("base64url"),
    pass_enabled: 0, pass_price_usd: 10, pass_perk: "",
    created_at: new Date().toISOString(),
  };
  await q(
    `INSERT INTO creators (id,handle,display_name,message,avatar_url,accent,wallet,dashboard_token,pass_enabled,pass_price_usd,pass_perk,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [row.id, row.handle, row.display_name, row.message, row.avatar_url, row.accent, row.wallet, row.dashboard_token, row.pass_enabled, row.pass_price_usd, row.pass_perk, row.created_at],
  );
  return row;
}

export const getCreatorByHandle = (h: string) => q1<CreatorRow>("SELECT * FROM creators WHERE handle = $1", [h.toLowerCase()]);
export const getCreatorByToken = (t: string) => q1<CreatorRow>("SELECT * FROM creators WHERE dashboard_token = $1", [t]);
export const getTip = (id: string) => q1<TipRow>("SELECT * FROM tips WHERE id = $1", [id]);
export const listTips = (creatorId: string, limit = 100) =>
  q<TipRow>("SELECT * FROM tips WHERE creator_id = $1 ORDER BY created_at DESC LIMIT $2", [creatorId, limit]);

/** RF-4/RF-5: ask Aurora for a quote + a deposit address unique to this tip. */
export async function createTip(creator: CreatorRow, input: {
  originAssetId: string; amountIn: string; refundTo: string;
  fanName?: string; fanMessage?: string; isPass?: boolean;
}): Promise<TipRow> {
  const aurora = getAurora();
  const assets = await aurora.listOriginAssets();
  const asset = assets.find((a) => a.assetId === input.originAssetId);
  if (!asset) throw new Error("Unsupported asset"); // RF-3: only what Aurora supports
  if (input.isPass && !creator.pass_enabled) throw new Error("Pass is not available for this creator.");
  const feeBps = clampFeeBps(env.tezeoFeeBps, asset);
  const ask = (amountIn: string) => aurora.quote({
    originAssetId: asset.assetId, amountIn,
    recipient: creator.wallet, refundTo: input.refundTo, appFeeBps: feeBps,
  });
  let quote = await ask(input.amountIn);
  if (input.isPass) {
    // RF pass: the quoted amount must still cover the pass price after fees. Compare the guaranteed
    // minimum (after slippage), never the optimistic estimate.
    const need = BigInt(creator.pass_price_usd) * 1_000_000n;
    if (BigInt(quote.minAmountOutUsdc) < need) {
      // One automatic retry sized from what the first quote actually delivered.
      const ratio = Number(need) / Math.max(1, Number(quote.minAmountOutUsdc));
      quote = await ask(String(BigInt(Math.ceil(Number(input.amountIn) * ratio * 1.01))));
    }
    if (BigInt(quote.minAmountOutUsdc) < need)
      throw new Error(`Pass price not covered: this quote delivers at least ${Number(quote.minAmountOutUsdc) / 1e6} USDC but the pass costs ${creator.pass_price_usd}.`);
  }
  const now = new Date().toISOString();
  const row: TipRow = {
    id: randomUUID(), creator_id: creator.id, status: "pending",
    origin_asset_id: asset.assetId, origin_chain: asset.chain, origin_symbol: asset.symbol,
    amount_in: quote.amountIn, amount_out_usdc: quote.amountOutUsdc, final_out_usdc: null,
    app_fee_bps: quote.appFeeBps, deposit_address: quote.depositAddress, deposit_memo: quote.depositMemo ?? null,
    refund_to: input.refundTo, deadline: quote.deadline, settlement_tx: null,
    fan_name: (input.fanName ?? "").slice(0, 40), fan_message: (input.fanMessage ?? "").slice(0, 280),
    is_pass: input.isPass ? 1 : 0, pass_token: null, pass_expires_at: null, detail: null,
    gross_usd: quote.amountInUsd ?? null, delivery_fee_usdc: quote.withdrawFeeUsdc ?? null,
    created_at: now, updated_at: now,
  };
  await q(
    `INSERT INTO tips (id,creator_id,status,origin_asset_id,origin_chain,origin_symbol,amount_in,amount_out_usdc,final_out_usdc,app_fee_bps,deposit_address,deposit_memo,refund_to,deadline,settlement_tx,fan_name,fan_message,is_pass,pass_token,pass_expires_at,detail,gross_usd,delivery_fee_usdc,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
    [row.id, row.creator_id, row.status, row.origin_asset_id, row.origin_chain, row.origin_symbol, row.amount_in, row.amount_out_usdc, row.final_out_usdc, row.app_fee_bps, row.deposit_address, row.deposit_memo, row.refund_to, row.deadline, row.settlement_tx, row.fan_name, row.fan_message, row.is_pass, row.pass_token, row.pass_expires_at, row.detail ?? null, row.gross_usd ?? null, row.delivery_fee_usdc ?? null, row.created_at, row.updated_at],
  );
  return row;
}

export function setTipNote(id: string, fanName: string, fanMessage: string): Promise<TipRow | undefined> {
  return q1<TipRow>("UPDATE tips SET fan_name=$1, fan_message=$2, updated_at=$3 WHERE id=$4 RETURNING *",
    [fanName.slice(0, 40), fanMessage.slice(0, 280), new Date().toISOString(), id]);
}

/**
 * Source of truth for payment state is Aurora, never the frontend (PRD).
 * Called on each client poll (every 5-10s); terminal states are never re-queried.
 */
export async function refreshTip(tip: TipRow): Promise<TipRow> {
  if (TERMINAL.has(tip.status)) return tip;

  if (new Date(tip.deadline).getTime() < Date.now() && tip.status === "pending") {
    // One last look: a deposit may have landed right at the deadline.
    const last = await getAurora().status(tip.deposit_address).catch(() => null);
    if (!last || last.status === "PENDING_DEPOSIT") return save(tip, { status: "expired" });
  }

  const res = await getAurora().status(tip.deposit_address);
  const next = mapStatus(res.status);
  if (next === tip.status && !res.settlementTx) return tip;

  const patch: Partial<TipRow> = { status: next };
  if (next === "failed" || next === "refunded") {
    patch.detail = res.status === "INCOMPLETE_DEPOSIT" ? "underpaid" : (res.detail ?? null);
  }
  if (next === "received") {
    patch.settlement_tx = res.settlementTx ?? null;
    patch.final_out_usdc = res.amountOutUsdc ?? tip.amount_out_usdc;
    if (tip.is_pass && !tip.pass_token) {
      patch.pass_token = randomBytes(18).toString("base64url");
      patch.pass_expires_at = new Date(Date.now() + PASS_DAYS * 86_400_000).toISOString();
    }
  }
  return save(tip, patch);
}

/**
 * Several requests can refresh the same tip at once (fan page, dashboard, OBS alerts). The write is
 * therefore conditional: a tip already in a final state is never overwritten, and a pass token /
 * expiry, once issued, is never replaced (so a pass is issued exactly once and never extended).
 */
async function save(tip: TipRow, patch: Partial<TipRow>): Promise<TipRow> {
  const n = { ...tip, ...patch, updated_at: new Date().toISOString() };
  const row = await q1<TipRow>(
    `UPDATE tips SET status=$1, final_out_usdc=$2, settlement_tx=$3, detail=$4, updated_at=$5,
       pass_token=COALESCE(pass_token,$6), pass_expires_at=COALESCE(pass_expires_at,$7)
     WHERE id=$8 AND status NOT IN ('received','failed','refunded','expired') RETURNING *`,
    [n.status, n.final_out_usdc, n.settlement_tx, n.detail ?? null, n.updated_at, n.pass_token, n.pass_expires_at, tip.id],
  );
  return row ?? (await getTip(tip.id)) ?? n; // someone else already finalised it: return their result
}
