import { randomBytes, randomUUID } from "node:crypto";
import { db } from "./db";
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
  created_at: string; updated_at: string;
}

export const PASS_DAYS = 30;
export const PASS_MAX_USD = 500;

/** Creator turns the 30-day pass on/off and sets its price and perk. Price is whole USD, paid once. */
export function updateCreatorPass(token: string, input: { enabled: boolean; priceUsd: number; perk: string }): CreatorRow | undefined {
  const price = Math.round(input.priceUsd);
  if (!(price >= 1 && price <= PASS_MAX_USD)) throw new Error(`Pass price must be between $1 and $${PASS_MAX_USD}.`);
  const r = db().prepare("UPDATE creators SET pass_enabled=?, pass_price_usd=?, pass_perk=? WHERE dashboard_token=?")
    .run(input.enabled ? 1 : 0, price, input.perk.trim().slice(0, 140), token);
  return r.changes ? getCreatorByToken(token) : undefined;
}

export const getTipByPassToken = (t: string) =>
  db().prepare("SELECT * FROM tips WHERE pass_token = ?").get(t) as TipRow | undefined;

/**
 * How much of an origin asset to ask for so the creator still receives `priceUsd` after Aurora's
 * fixed payout cost (~$0.25), route fees and slippage. `bump` widens the margin on a retry.
 */
export function passAmountUnits(priceUsd: number, asset: { decimals: number; usdPrice?: number; stable: boolean }, bump = 1): string {
  const usd = (priceUsd * 1.02 + 0.4) * bump;
  const coins = usd / (asset.usdPrice ?? 1);
  return BigInt(Math.ceil(coins * 10 ** asset.decimals)).toString();
}

export function createCreator(input: {
  handle: string; displayName: string; message?: string; avatarUrl?: string; accent?: string; wallet: string;
}): CreatorRow {
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
  db().prepare(
    `INSERT INTO creators (id,handle,display_name,message,avatar_url,accent,wallet,dashboard_token,pass_enabled,pass_price_usd,pass_perk,created_at)
     VALUES (@id,@handle,@display_name,@message,@avatar_url,@accent,@wallet,@dashboard_token,@pass_enabled,@pass_price_usd,@pass_perk,@created_at)`,
  ).run(row);
  return row;
}

export const getCreatorByHandle = (h: string) =>
  db().prepare("SELECT * FROM creators WHERE handle = ?").get(h) as CreatorRow | undefined;
export const getCreatorByToken = (t: string) =>
  db().prepare("SELECT * FROM creators WHERE dashboard_token = ?").get(t) as CreatorRow | undefined;
export const getTip = (id: string) =>
  db().prepare("SELECT * FROM tips WHERE id = ?").get(id) as TipRow | undefined;
export const listTips = (creatorId: string, limit = 100) =>
  db().prepare("SELECT * FROM tips WHERE creator_id = ? ORDER BY created_at DESC LIMIT ?").all(creatorId, limit) as TipRow[];

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
    created_at: now, updated_at: now,
  };
  db().prepare(
    `INSERT INTO tips (id,creator_id,status,origin_asset_id,origin_chain,origin_symbol,amount_in,amount_out_usdc,final_out_usdc,app_fee_bps,deposit_address,deposit_memo,refund_to,deadline,settlement_tx,fan_name,fan_message,is_pass,pass_token,pass_expires_at,created_at,updated_at)
     VALUES (@id,@creator_id,@status,@origin_asset_id,@origin_chain,@origin_symbol,@amount_in,@amount_out_usdc,@final_out_usdc,@app_fee_bps,@deposit_address,@deposit_memo,@refund_to,@deadline,@settlement_tx,@fan_name,@fan_message,@is_pass,@pass_token,@pass_expires_at,@created_at,@updated_at)`,
  ).run(row);
  return row;
}

export function setTipNote(id: string, fanName: string, fanMessage: string): TipRow | undefined {
  db().prepare("UPDATE tips SET fan_name=?, fan_message=?, updated_at=? WHERE id=?")
    .run(fanName.slice(0, 40), fanMessage.slice(0, 280), new Date().toISOString(), id);
  return getTip(id);
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

function save(tip: TipRow, patch: Partial<TipRow>): TipRow {
  const next = { ...tip, ...patch, updated_at: new Date().toISOString() };
  db().prepare(
    `UPDATE tips SET status=@status, final_out_usdc=@final_out_usdc, settlement_tx=@settlement_tx,
       pass_token=@pass_token, pass_expires_at=@pass_expires_at, detail=@detail, updated_at=@updated_at WHERE id=@id`,
  ).run({ ...next, detail: next.detail ?? null });
  return next;
}
