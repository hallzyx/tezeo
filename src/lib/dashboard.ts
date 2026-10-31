import { fromUnits } from "./domain";
import { listTips, type CreatorRow, type TipRow } from "./tips";
import { getExtras, goalProgress } from "./extras";
import { walletHasUsdcAccount } from "./solana";

/**
 * Where the money went, for the creator (transparency): what the fan sent (USD), Aurora's cost to deliver it
 * to the creator's wallet, any other fees/spread, and what arrived. Null for tips that predate this data.
 */
export function breakdownOf(t: TipRow) {
  if (t.status !== "received" || !t.gross_usd) return { gross: null, delivery: null, fees: null };
  const gross = Number(t.gross_usd);
  const net = Number(fromUnits(t.final_out_usdc ?? t.amount_out_usdc, 6, 6));
  const delivery = Math.min(Number(fromUnits(t.delivery_fee_usdc ?? "0", 6, 6)), Math.max(0, gross - net));
  const fees = Math.max(0, gross - net - delivery);
  return { gross, delivery, fees };
}

/** Creator-facing history (RF-8). Unpaid/expired quotes are not history, so they are hidden. */
export async function dashboardData(creator: CreatorRow) {
  const extras = await getExtras(creator.id);
  const progress = await goalProgress(creator);
  const walletHasUsdc = await walletHasUsdcAccount(creator.wallet);
  const tips = (await listTips(creator.id, 200)).filter((t) => t.status !== "pending" && t.status !== "expired");
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const received = tips.filter((t) => t.status === "received");
  const sum = (rows: typeof received) =>
    rows.reduce((s, t) => s + Number(fromUnits(t.final_out_usdc ?? t.amount_out_usdc, 6, 6)), 0);
  const now = Date.now();
  const thisMonth = received.filter((t) => new Date(t.created_at) >= monthStart);
  return {
    creator: { handle: creator.handle, displayName: creator.display_name, accent: creator.accent },
    goal: { title: extras.goal_title, targetUsd: extras.goal_target_usd, progress },
    alertToken: extras.alert_token,
    /** false = the wallet has no USDC account yet, so the first tip carries a one-time set-up cost. null = unknown. */
    walletHasUsdc,
    pass: { enabled: !!creator.pass_enabled, priceUsd: creator.pass_price_usd, perk: creator.pass_perk },
    // Passes exist only once the payment is confirmed (pass_token is issued on "received").
    passes: received.filter((t) => t.is_pass && t.pass_token && t.pass_expires_at).slice(0, 50).map((t) => ({
      id: t.id, fanName: t.fan_name, expiresAt: t.pass_expires_at as string,
      active: new Date(t.pass_expires_at as string).getTime() > now,
    })),
    stats: {
      receivedThisMonthUsdc: sum(thisMonth),
      totalUsdc: sum(received),
      tipsThisMonth: thisMonth.length,
      activePasses: received.filter((t) => t.is_pass && t.pass_expires_at && new Date(t.pass_expires_at).getTime() > now).length,
      inFlight: tips.filter((t) => t.status === "converting").length,
    },
    tips: tips.slice(0, 100).map((t) => ({
      id: t.id, status: t.status, createdAt: t.created_at,
      fanName: t.fan_name, fanMessage: t.fan_message, isPass: !!t.is_pass,
      originSymbol: t.origin_symbol, originChain: t.origin_chain,
      usdc: t.status === "received" ? Number(fromUnits(t.final_out_usdc ?? t.amount_out_usdc, 6, 6)) : null,
      ...breakdownOf(t),
    })),
  };
}
export type DashboardData = Awaited<ReturnType<typeof dashboardData>>;
