import { createHash } from "node:crypto";
import type { AuroraProvider, OriginAsset, Quote, QuoteRequest, StatusResult } from "./types";

/**
 * LOCAL DEV SIMULATOR. Not Aurora. No funds move and nothing here proves the
 * integration works. It exists so the UI, status tracking, failure and refund
 * states can be built and tested without a funded Aurora account.
 *
 * Deterministic and stateless: status is derived from the age encoded in the
 * deposit address, so it survives server restarts and serverless instances.
 *   0-8s    PENDING_DEPOSIT
 *   8-20s   PROCESSING
 *   >20s    SUCCESS
 * Magic amounts (smallest units ending in ...13 / ...14) force REFUNDED / FAILED
 * so the error screens can be exercised on demand.
 */

const CATALOG: OriginAsset[] = [
  { assetId: "eth:native", chain: "ethereum", chainLabel: "Ethereum", symbol: "ETH", decimals: 18, stable: false, usdPrice: 3200 },
  { assetId: "eth:usdc", chain: "ethereum", chainLabel: "Ethereum", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 },
  { assetId: "base:native", chain: "base", chainLabel: "Base", symbol: "ETH", decimals: 18, stable: false, usdPrice: 3200 },
  { assetId: "base:usdc", chain: "base", chainLabel: "Base", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 },
  { assetId: "arb:native", chain: "arbitrum", chainLabel: "Arbitrum", symbol: "ETH", decimals: 18, stable: false, usdPrice: 3200 },
  { assetId: "arb:usdc", chain: "arbitrum", chainLabel: "Arbitrum", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 },
  { assetId: "btc:native", chain: "bitcoin", chainLabel: "Bitcoin", symbol: "BTC", decimals: 8, stable: false, usdPrice: 95000 },
];

const T_PROCESSING = 8_000;
const T_SUCCESS = 20_000;

function addr(ts: number, seed: string): string {
  return `sim_${ts.toString(36)}_${createHash("sha256").update(seed + ts).digest("hex").slice(0, 24)}`;
}
function ageMs(depositAddress: string): number {
  const ts = parseInt(depositAddress.split("_")[1] ?? "", 36);
  return Number.isFinite(ts) ? Date.now() - ts : Infinity;
}

export const simulatedAurora: AuroraProvider = {
  mode: "simulated",

  async listOriginAssets() {
    return CATALOG;
  },

  async quote(req: QuoteRequest): Promise<Quote> {
    const asset = CATALOG.find((a) => a.assetId === req.originAssetId);
    if (!asset) throw new Error("Unsupported origin asset");
    const usd = (Number(req.amountIn) / 10 ** asset.decimals) * (asset.usdPrice ?? 1);
    // Aurora share of the fee is part of the total appFeeBps; simulate a ~0.3% route cost on top.
    const net = usd * (1 - req.appFeeBps / 10_000) * 0.997;
    const out = Math.floor(net * 1e6);
    const ts = Date.now();
    // Keep the magic suffix in the address so status() can stay stateless.
    const flag = req.amountIn.endsWith("13") ? "r" : req.amountIn.endsWith("14") ? "f" : "s";
    return {
      depositAddress: addr(ts, req.recipient) + "_" + flag,
      amountIn: req.amountIn,
      amountInUsd: usd.toFixed(6),
      withdrawFeeUsdc: "10000",
      amountOutUsdc: String(out),
      minAmountOutUsdc: String(Math.floor(out * 0.99)),
      appFeeBps: req.appFeeBps,
      deadline: new Date(ts + 30 * 60_000).toISOString(),
      providerRef: "sim",
    };
  },

  async status(depositAddress: string): Promise<StatusResult> {
    const age = ageMs(depositAddress);
    const flag = depositAddress.split("_")[3];
    if (age < T_PROCESSING) return { status: "PENDING_DEPOSIT" };
    if (age < T_SUCCESS) return { status: "PROCESSING" };
    if (flag === "r") return { status: "REFUNDED", detail: "Simulated refund" };
    if (flag === "f") return { status: "FAILED", detail: "Simulated failure" };
    return {
      status: "SUCCESS",
      settlementTx: "SIMULATED" + createHash("sha256").update(depositAddress).digest("hex").slice(0, 40),
    };
  },
};
