import { env } from "../env";
import type {
  AuroraProvider,
  OriginAsset,
  ProviderStatus,
  Quote,
  QuoteRequest,
  StatusResult,
} from "./types";

/**
 * Live Aurora Intents client (Swap API).
 *
 * !! UNVERIFIED !! The endpoint paths and field names below follow the
 * quote -> deposit -> status flow described in the PRD and the common
 * "intents" swap-API shape. They have NOT been checked against
 * https://docs.intents.aurora.dev/llms-full.txt (blocked in the build
 * environment). Phase 0 (`npm run phase0`) exists to confirm/adjust them.
 * Every assumption is isolated in this file.
 */

/** Solana USDC mint. */
export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** Destination asset id as Aurora would name it (ASSUMPTION). */
const DEST_ASSET = `sol:${SOLANA_USDC_MINT}`;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.auroraApiKey) throw new Error("AURORA_API_KEY is not set (server-side only).");
  const res = await fetch(`${env.auroraApiBase}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.auroraApiKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Aurora ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

const STATUS_MAP: Record<string, ProviderStatus> = {
  PENDING_DEPOSIT: "PENDING_DEPOSIT",
  KNOWN_DEPOSIT_TX: "PROCESSING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  INCOMPLETE_DEPOSIT: "INCOMPLETE_DEPOSIT",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

export const liveAurora: AuroraProvider = {
  mode: "live",

  async listOriginAssets(): Promise<OriginAsset[]> {
    // ASSUMPTION: GET /v0/tokens -> [{ assetId, blockchain, symbol, decimals, price }]
    const tokens = await call<
      { assetId: string; blockchain: string; symbol: string; decimals: number; price?: number }[]
    >("/v0/tokens");
    const stables = new Set(["USDC", "USDT", "DAI"]);
    return tokens.map((t) => ({
      assetId: t.assetId,
      chain: t.blockchain,
      chainLabel: t.blockchain.charAt(0).toUpperCase() + t.blockchain.slice(1),
      symbol: t.symbol,
      decimals: t.decimals,
      stable: stables.has(t.symbol.toUpperCase()),
      usdPrice: t.price,
    }));
  },

  async quote(req: QuoteRequest): Promise<Quote> {
    // ASSUMPTION: POST /v0/quote creates a per-tip deposit address (RF-5).
    const r = await call<{
      depositAddress: string;
      depositMemo?: string;
      amountIn: string;
      amountOut: string;
      minAmountOut: string;
      deadline: string;
      quoteId?: string;
    }>("/v0/quote", {
      method: "POST",
      body: JSON.stringify({
        dry: false,
        originAsset: req.originAssetId,
        destinationAsset: DEST_ASSET,
        amount: req.amountIn,
        swapType: "EXACT_INPUT",
        recipient: req.recipient,
        recipientType: "DESTINATION_CHAIN",
        refundTo: req.refundTo,
        refundType: "ORIGIN_CHAIN",
        depositType: "ORIGIN_CHAIN",
        appFees: [{ recipient: req.recipient, fee: req.appFeeBps }],
        slippageTolerance: 100,
        deadline: new Date(Date.now() + 30 * 60_000).toISOString(),
      }),
    });
    return {
      depositAddress: r.depositAddress,
      depositMemo: r.depositMemo,
      amountIn: r.amountIn,
      amountOutUsdc: r.amountOut,
      minAmountOutUsdc: r.minAmountOut,
      appFeeBps: req.appFeeBps,
      deadline: r.deadline,
      providerRef: r.quoteId,
    };
  },

  async status(depositAddress: string): Promise<StatusResult> {
    // ASSUMPTION: GET /v0/status?depositAddress=...
    const r = await call<{
      status: string;
      swapDetails?: { destinationChainTxHashes?: { hash: string }[]; amountOut?: string };
    }>(`/v0/status?depositAddress=${encodeURIComponent(depositAddress)}`);
    return {
      status: STATUS_MAP[r.status] ?? "PROCESSING",
      settlementTx: r.swapDetails?.destinationChainTxHashes?.[0]?.hash,
      amountOutUsdc: r.swapDetails?.amountOut,
    };
  },
};
