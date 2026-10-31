import { describe, expect, it } from "vitest";
import { chainSlugById } from "@/lib/evm";
import { forgetRefund, loadRefund, looksValidRefund, refundKey, saveRefund, type KV } from "@/lib/refund-store";

const memory = (): KV & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};
const A = "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";

describe("remembered refund address", () => {
  it("saves, loads and forgets", () => {
    const kv = memory();
    expect(loadRefund(kv, "base")).toBeNull();
    saveRefund(kv, "base", A);
    expect(loadRefund(kv, "base")).toBe(A);
    forgetRefund(kv, "base");
    expect(loadRefund(kv, "base")).toBeNull();
  });
  it("shares one slot across EVM chains but keeps other chains separate", () => {
    const kv = memory();
    saveRefund(kv, "base", A);
    expect(loadRefund(kv, "arb")).toBe(A);       // same 0x address works on every EVM chain
    expect(loadRefund(kv, "btc")).toBeNull();    // a Bitcoin address is a different thing
    saveRefund(kv, "btc", "bc1qexampleaddress0000000000000000000");
    expect(loadRefund(kv, "base")).toBe(A);      // saving BTC never overwrites the EVM one
    expect(refundKey("base")).toBe(refundKey("op"));
    expect(refundKey("btc")).not.toBe(refundKey("sol"));
  });
  it("overwrites when the fan chooses a new default", () => {
    const kv = memory(); saveRefund(kv, "eth", A);
    const B = "0x" + "b".repeat(40); saveRefund(kv, "eth", B);
    expect(loadRefund(kv, "base")).toBe(B);
  });
  it("never throws when storage is blocked (private mode)", () => {
    const blocked: KV = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };
    expect(loadRefund(blocked, "base")).toBeNull();
    expect(() => saveRefund(blocked, "base", A)).not.toThrow();
    expect(() => forgetRefund(blocked, "base")).not.toThrow();
    expect(loadRefund(null, "base")).toBeNull();
  });
});

describe("address shape check", () => {
  it("EVM chains need a full 0x address", () => {
    expect(looksValidRefund("base", A)).toBe(true);
    expect(looksValidRefund("base", "0x123")).toBe(false);
    expect(looksValidRefund("base", "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false);
  });
  it("other chains only get a loose length check (Aurora validates for real)", () => {
    expect(looksValidRefund("btc", "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(true);
    expect(looksValidRefund("btc", "abc")).toBe(false);
  });
});

describe("network from the connected wallet", () => {
  it("maps wallet chain ids to Aurora slugs", () => {
    expect(chainSlugById(8453)).toBe("base");
    expect(chainSlugById(1)).toBe("eth");
    expect(chainSlugById(10)).toBe("op");
    expect(chainSlugById(999999)).toBeUndefined();
  });
});
