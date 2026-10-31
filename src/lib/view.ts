import type { TipRow } from "./tips";

/**
 * Shape sent to fans. Never includes creator wallet secrets or dashboard tokens, and deliberately no fees or
 * net amounts: a fan sees what they pay, and the costs are shown to the creator (dashboard breakdown).
 */
export function tipView(t: TipRow) {
  return {
    id: t.id,
    status: t.status,
    originChain: t.origin_chain,
    originSymbol: t.origin_symbol,
    amountIn: t.amount_in,
    depositAddress: t.deposit_address,
    depositMemo: t.deposit_memo,
    refundTo: t.refund_to,
    deadline: t.deadline,
    settlementTx: t.settlement_tx,
    originAssetId: t.origin_asset_id,
    fanName: t.fan_name,
    fanMessage: t.fan_message,
    /** Coarse cause for the failure screens; raw provider text stays server-side. */
    failReason: t.detail === "underpaid" ? "underpaid" : t.detail ? "other" : null,
    refundDetail: t.status === "failed" || t.status === "refunded" ? t.detail ?? null : null,
    isPass: !!t.is_pass,
    passToken: t.pass_token,
    passExpiresAt: t.pass_expires_at,
    createdAt: t.created_at,
  };
}
