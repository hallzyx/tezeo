/**
 * Solana wallet checks, pure and dependency-free so the browser and the server run the exact same code.
 * A Solana address is a base58 string that decodes to exactly 32 bytes.
 */

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Token mints are valid keys but never someone's wallet; Aurora rejects the USDC mint as a recipient. */
export const NOT_WALLETS: ReadonlySet<string> = new Set(["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]);

/** Decoded byte length of a base58 string, or null if it has a character outside the alphabet. */
function base58Length(s: string): number | null {
  const bytes: number[] = [];
  for (const ch of s) {
    let carry = ALPHABET.indexOf(ch);
    if (carry < 0) return null;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  return bytes.length + zeros;
}

export function isValidSolanaAddress(addr: string): boolean {
  if (typeof addr !== "string" || addr.length < 32 || addr.length > 44 || NOT_WALLETS.has(addr)) return false;
  return base58Length(addr) === 32;
}

export type WalletProblem = "eth" | "token" | "phrase" | "format";

/** Why an address can't be used, in the terms a creator needs. null = it's fine. */
export function walletProblem(raw: string): WalletProblem | null {
  const a = (raw ?? "").trim();
  if (/^0x[0-9a-f]{40}$/i.test(a)) return "eth";
  if (NOT_WALLETS.has(a)) return "token";
  if (/^[a-z]+(?:\s+[a-z]+){11,}$/i.test(a) && a.split(/\s+/).length >= 12) return "phrase";
  return isValidSolanaAddress(a) ? null : "format";
}
