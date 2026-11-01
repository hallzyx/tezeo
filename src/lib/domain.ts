import { AURORA_MAX_BPS, AURORA_MIN_BPS } from "./env";
import type { OriginAsset, ProviderStatus } from "./aurora/types";

export type TipStatus = "pending" | "converting" | "received" | "failed" | "refunded" | "expired";

export const TERMINAL: ReadonlySet<TipStatus> = new Set(["received", "failed", "refunded", "expired"]);

export function mapStatus(p: ProviderStatus): TipStatus {
  switch (p) {
    case "PENDING_DEPOSIT": return "pending";
    case "PROCESSING": return "converting";
    case "SUCCESS": return "received";
    case "REFUNDED": return "refunded";
    case "INCOMPLETE_DEPOSIT":
    case "FAILED": return "failed";
  }
}

export { isValidSolanaAddress, walletProblem, NOT_WALLETS, type WalletProblem } from "./wallet-check";

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

/** Turns whatever was typed into the closest valid handle text (lowercase, no accents, [a-z0-9_] only, max 24). */
export function cleanHandle(raw: string): string {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^@/, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 24);
}
/** A first link idea from a display name: "Mateo Quispe" -> "mateoquispe". */
export function slugFromName(name: string): string {
  return cleanHandle(name.replace(/\s+/g, ""));
}
export function normalizeHandle(raw: string): string | null {
  const h = raw.trim().replace(/^@/, "").toLowerCase();
  return HANDLE_RE.test(h) ? h : null;
}

/** Tezeo's fee must respect Aurora's floor for the origin asset and the 500 bps ceiling. */
export function clampFeeBps(bps: number, asset: Pick<OriginAsset, "stable">): number {
  const floor = asset.stable ? AURORA_MIN_BPS.stable : AURORA_MIN_BPS.nonStable;
  return Math.min(AURORA_MAX_BPS, Math.max(floor, Math.round(bps)));
}

/** Parse a decimal string ("0.05") into smallest units without float error. */
export function toUnits(amount: string, decimals: number): string | null {
  if (!/^\d+(\.\d+)?$/.test(amount)) return null;
  const [whole, frac = ""] = amount.split(".");
  if (frac.length > decimals) return null;
  const units = BigInt(whole + frac.padEnd(decimals, "0"));
  return units > 0n ? units.toString() : null;
}

export function fromUnits(units: string, decimals: number, maxFrac = decimals): string {
  const s = units.padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  let frac = s.slice(s.length - decimals).slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** What the fan sees before paying (RF-4). All USDC values in 6-decimal smallest units. */
export interface QuoteBreakdown {
  youSend: string;
  tezeoFeeBps: number;
  creatorReceivesUsdc: string;
  minCreatorReceivesUsdc: string;
}

export const MIN_TIP_USD = 1;

/**
 * Does `units` of `asset` reach the $1 minimum tip? Dollar coins count at face value: Aurora quotes USDC at
 * ~$0.9999, which made an exact 1.00 USDC look like "less than $1". Other coins get 1% slack for the price
 * moving between the fan's screen and our server.
 */
export function meetsMinTip(units: string, asset: Pick<OriginAsset, "decimals" | "stable" | "usdPrice">): boolean {
  const amount = Number(units) / 10 ** asset.decimals;
  const usd = asset.stable ? amount : amount * (asset.usdPrice ?? 0);
  return usd >= MIN_TIP_USD * (asset.stable ? 0.999 : 0.99);
}
