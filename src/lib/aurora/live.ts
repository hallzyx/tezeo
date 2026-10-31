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
 * Live Aurora Intents client (Swap API / "1Click" deposit-address flow).
 *
 * VERIFIED against https://docs.intents.aurora.dev/llms-full.txt and real calls on 2026-10-31:
 *  - Host: https://intents-api.aurora.dev ; the API key is a PATH segment, not a header:
 *      GET  /api/tokens/{apiKey}
 *      POST /api/quote/{apiKey}
 *      GET  /api/status/{apiKey}?depositAddress=...
 *  - USDC on Solana as destination: `nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near`
 *    (contract EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, 6 decimals). Real quotes with
 *    recipientType=DESTINATION_CHAIN and a Solana recipient return 200 and a per-quote deposit address.
 *  - Fees are NOT a request parameter. An `appFees` field sent in the quote body is ignored; the
 *    integrator fee is configured per API key in the Client Portal and echoed back in
 *    `quoteRequest.appFees`. We therefore report the fee Aurora actually applied.
 *  - NOT verified live: an end-to-end funded conversion (needs a user deposit). See docs/PHASE0.md.
 *
 * The key lives in the URL path, so error messages are scrubbed before they can reach logs/clients.
 */

export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const DEST_ASSET_ID = "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near";

const CHAIN_LABELS: Record<string, string> = {
  eth: "Ethereum", base: "Base", arb: "Arbitrum", op: "Optimism", pol: "Polygon", bsc: "BNB Chain",
  avax: "Avalanche", sol: "Solana", near: "NEAR", btc: "Bitcoin", gnosis: "Gnosis", xlayer: "X Layer",
  monad: "Monad", sui: "Sui", ton: "TON", tron: "Tron", aptos: "Aptos", stellar: "Stellar",
  bera: "Berachain", scroll: "Scroll", plasma: "Plasma", zec: "Zcash", doge: "Dogecoin", xrp: "XRP",
};
const STABLES = new Set(["USDC", "USDT", "DAI", "USDE", "PYUSD", "USD1", "FDUSD"]);

function scrub(s: string): string {
  return env.auroraApiKey ? s.split(env.auroraApiKey).join("<key>") : s;
}

async function call<T>(kind: "tokens" | "quote" | "status", opts: { query?: string; body?: unknown } = {}): Promise<T> {
  if (!env.auroraApiKey) throw new Error("AURORA_API_KEY is not set (server-side only).");
  const url = `${env.auroraApiBase}/api/${kind}/${encodeURIComponent(env.auroraApiKey)}${opts.query ?? ""}`;
  const res = await fetch(url, {
    method: opts.body ? "POST" : "GET",
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = (JSON.parse(text) as { message?: string }).message ?? text; } catch { /* keep raw */ }
    throw new Error(`Aurora ${res.status} (${kind}): ${scrub(msg).slice(0, 300)}`);
  }
  return JSON.parse(text) as T;
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

interface AuroraToken {
  assetId: string; decimals: number; blockchain: string; symbol: string; price?: number; contractAddress?: string;
}
interface QuoteResponse {
  correlationId?: string | null;
  quoteRequest: { appFees?: { recipient: string; fee: number }[] | null };
  quote: {
    depositAddress?: string; depositMemo?: string; amountIn: string; amountOut: string; minAmountOut: string;
    deadline?: string; timeWhenInactive?: string; timeEstimate?: number; withdrawFee?: string; refundFee?: string;
  };
}
interface StatusResponse {
  status: string;
  swapDetails?: {
    amountOut?: string | null;
    destinationChainTxHashes?: { hash: string; explorerUrl?: string }[];
    refundReason?: string | null;
  };
}

export const liveAurora: AuroraProvider = {
  mode: "live",

  async listOriginAssets(): Promise<OriginAsset[]> {
    const { tokens } = await call<{ tokens: AuroraToken[] }>("tokens");
    return tokens
      .filter((t) => t.assetId !== DEST_ASSET_ID && t.price !== undefined)
      .map((t) => ({
        assetId: t.assetId,
        chain: t.blockchain,
        chainLabel: CHAIN_LABELS[t.blockchain] ?? t.blockchain.toUpperCase(),
        symbol: t.symbol,
        decimals: t.decimals,
        stable: STABLES.has(t.symbol.toUpperCase()),
        usdPrice: t.price,
      }));
  },

  async quote(req: QuoteRequest): Promise<Quote> {
    const r = await call<QuoteResponse>("quote", {
      body: {
        dry: false,
        swapType: "EXACT_INPUT",
        slippageTolerance: 100,
        originAsset: req.originAssetId,
        destinationAsset: DEST_ASSET_ID,
        amount: req.amountIn,
        depositType: "ORIGIN_CHAIN",
        recipient: req.recipient,
        recipientType: "DESTINATION_CHAIN",
        refundTo: req.refundTo,
        refundType: "ORIGIN_CHAIN",
        deadline: new Date(Date.now() + 30 * 60_000).toISOString(),
      },
    });
    if (!r.quote.depositAddress) throw new Error("Aurora returned no deposit address");
    const appliedBps = (r.quoteRequest.appFees ?? []).reduce((s, f) => s + f.fee, 0);
    return {
      depositAddress: r.quote.depositAddress,
      depositMemo: r.quote.depositMemo,
      amountIn: r.quote.amountIn,
      amountOutUsdc: r.quote.amountOut,
      minAmountOutUsdc: r.quote.minAmountOut,
      appFeeBps: appliedBps,
      withdrawFeeUsdc: r.quote.withdrawFee,
      timeEstimateSec: r.quote.timeEstimate,
      deadline: r.quote.deadline ?? r.quote.timeWhenInactive ?? new Date(Date.now() + 30 * 60_000).toISOString(),
      providerRef: r.correlationId ?? undefined,
    };
  },

  async status(depositAddress: string): Promise<StatusResult> {
    const r = await call<StatusResponse>("status", { query: `?depositAddress=${encodeURIComponent(depositAddress)}` });
    return {
      status: STATUS_MAP[r.status] ?? "PROCESSING",
      settlementTx: r.swapDetails?.destinationChainTxHashes?.[0]?.hash,
      amountOutUsdc: r.swapDetails?.amountOut ?? undefined,
      detail: r.swapDetails?.refundReason ?? undefined,
    };
  },
};
