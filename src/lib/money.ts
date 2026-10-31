import { fromUnits } from "./domain";

/** Format a smallest-unit USDC string (6 decimals) as "4.72". */
export function usdc(units: string | null | undefined, maxFrac = 2): string {
  if (!units) return "0";
  const n = Number(fromUnits(units, 6, 6));
  return n.toLocaleString("en-US", { minimumFractionDigits: maxFrac, maximumFractionDigits: maxFrac });
}

/** Origin amount like "0.00213" with sensible trimming, never scientific notation. */
export function coin(units: string, decimals: number, maxFrac = 6, minFrac = 0): string {
  const s = fromUnits(units, decimals, Math.min(decimals, maxFrac)) || "0";
  if (minFrac <= 0) return s;
  const [w, f = ""] = s.split(".");
  return `${w}.${f.padEnd(minFrac, "0")}`; // dollar coins read as "1.10", not "1.1"
}

export function usd(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "0:58" style countdown. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function shortAddr(a: string): string {
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/**
 * Split what the fan paid into the three lines the quote screen shows (DESIGN.md §7.C):
 * Tezeo fee, network & swap (everything else), and what the creator receives.
 * `sendUsd` is the market value of what the fan sends.
 */
export function breakdown(sendUsd: number, appFeeBps: number, receivesUsdc: number) {
  const fee = (sendUsd * appFeeBps) / 10_000;
  const network = Math.max(0, sendUsd - fee - receivesUsdc);
  return { fee, network, receives: receivesUsdc };
}
