import { PublicKey } from "@solana/web3.js";
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

/** RF-2: a Solana address must be a valid base58 32-byte ed25519-sized key. */
export function isValidSolanaAddress(addr: string): boolean {
  if (typeof addr !== "string" || addr.length < 32 || addr.length > 44) return false;
  try {
    return new PublicKey(addr).toBytes().length === 32;
  } catch {
    return false;
  }
}

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
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
