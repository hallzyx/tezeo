import { EVM_CHAINS } from "./evm";

/**
 * Remembering the fan's refund address on their own device (localStorage only; it never leaves the browser
 * until they request a quote). One saved address per "family": all EVM chains share one (the same 0x address
 * works on every EVM chain); other chains (Bitcoin, Solana, ...) each have their own format, so their own slot.
 */
export type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const refundKey = (chain: string) => (EVM_CHAINS[chain] ? "tz-refund:evm" : `tz-refund:${chain}`);

export function loadRefund(kv: KV | null, chain: string): string | null {
  try { return kv?.getItem(refundKey(chain)) || null; } catch { return null; }
}
export function saveRefund(kv: KV | null, chain: string, address: string): void {
  try { kv?.setItem(refundKey(chain), address); } catch { /* private mode / blocked: simply not remembered */ }
}
export function forgetRefund(kv: KV | null, chain: string): void {
  try { kv?.removeItem(refundKey(chain)); } catch { /* ignore */ }
}

/** Cheap client-side shape check (Aurora validates for real). EVM chains need a full 0x address. */
export function looksValidRefund(chain: string, address: string): boolean {
  const a = address.trim();
  return EVM_CHAINS[chain] ? /^0x[0-9a-fA-F]{40}$/.test(a) : a.length >= 10;
}
