import type { TipRow } from "./tips";

/** Shape sent to browsers. Never includes creator wallet secrets or dashboard tokens. */
export function tipView(t: TipRow) {
  return {
    id: t.id,
    status: t.status,
    originChain: t.origin_chain,
    originSymbol: t.origin_symbol,
    amountIn: t.amount_in,
    amountOutUsdc: t.final_out_usdc ?? t.amount_out_usdc,
    appFeeBps: t.app_fee_bps,
    depositAddress: t.deposit_address,
    depositMemo: t.deposit_memo,
    refundTo: t.refund_to,
    deadline: t.deadline,
    settlementTx: t.settlement_tx,
    isPass: !!t.is_pass,
    passToken: t.pass_token,
    passExpiresAt: t.pass_expires_at,
    createdAt: t.created_at,
  };
}
