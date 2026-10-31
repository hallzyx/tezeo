/** Provider-neutral shapes. The UI and DB never see Aurora's wire format. */

export interface OriginAsset {
  /** Aurora's asset identifier, opaque to us. */
  assetId: string;
  chain: string; // e.g. "ethereum", "base", "arbitrum", "bitcoin"
  chainLabel: string;
  symbol: string; // e.g. "ETH", "USDC"
  decimals: number;
  stable: boolean;
  /** Token contract on its chain; undefined for a chain's native coin. */
  contractAddress?: string;
  /** USD price used only for display hints in the simulator / indicative UI. */
  usdPrice?: number;
}

export interface QuoteRequest {
  originAssetId: string;
  /** Amount in the origin asset's smallest unit. */
  amountIn: string;
  /** Creator's Solana wallet receiving USDC. */
  recipient: string;
  /** Address on the origin chain to refund to if the swap fails. */
  refundTo: string;
  /** Total fee Tezeo charges, in bps. */
  appFeeBps: number;
}

export interface Quote {
  depositAddress: string;
  /** Opaque memo, if the origin chain needs one. */
  depositMemo?: string;
  amountIn: string;
  /** USDC (6 decimals) the creator is estimated to receive. */
  amountOutUsdc: string;
  /** Minimum USDC the creator will receive after slippage. */
  minAmountOutUsdc: string;
  /** Fee bps Aurora actually applied (configured per API key in the Client Portal). */
  appFeeBps: number;
  /** Fixed network cost of the Solana payout, USDC smallest units (6 decimals). */
  withdrawFeeUsdc?: string;
  /** Market value in USD of what the fan sends, as Aurora priced it. */
  amountInUsd?: string;
  timeEstimateSec?: number;
  /** ISO timestamp after which the deposit address stops being honoured. */
  deadline: string;
  /** Provider's own quote/correlation id, if any. */
  providerRef?: string;
}

export type ProviderStatus =
  | "PENDING_DEPOSIT"
  | "PROCESSING"
  | "SUCCESS"
  | "INCOMPLETE_DEPOSIT"
  | "REFUNDED"
  | "FAILED";

export interface StatusResult {
  status: ProviderStatus;
  /** Solana tx hash of the USDC payout, once SUCCESS. */
  settlementTx?: string;
  /** Final USDC amount actually delivered. */
  amountOutUsdc?: string;
  detail?: string;
}

export interface AuroraProvider {
  readonly mode: "live" | "simulated";
  listOriginAssets(): Promise<OriginAsset[]>;
  quote(req: QuoteRequest): Promise<Quote>;
  status(depositAddress: string): Promise<StatusResult>;
  /** Optional: tell Aurora which transaction funded a deposit address so it can pick it up sooner. */
  submitDeposit?(depositAddress: string, txHash: string, memo?: string): Promise<void>;
}
