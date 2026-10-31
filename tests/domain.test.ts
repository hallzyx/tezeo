import { describe, expect, it } from "vitest";
import { clampFeeBps, fromUnits, isValidSolanaAddress, mapStatus, meetsMinTip, normalizeHandle, toUnits } from "@/lib/domain";

describe("domain", () => {
  it("validates Solana addresses", () => {
    expect(isValidSolanaAddress("GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ")).toBe(true);
    // The USDC mint is a valid key but a token mint, not a wallet: Aurora rejects it and funds would be lost.
    expect(isValidSolanaAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")).toBe(false);
    expect(isValidSolanaAddress("0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe")).toBe(false);
    expect(isValidSolanaAddress("short")).toBe(false);
    expect(isValidSolanaAddress("")).toBe(false);
  });
  it("normalizes handles", () => {
    expect(normalizeHandle("@Ana_Dev")).toBe("ana_dev");
    expect(normalizeHandle("a")).toBeNull();
    expect(normalizeHandle("bad handle")).toBeNull();
  });
  it("clamps fee to Aurora floor and ceiling", () => {
    expect(clampFeeBps(1, { stable: false })).toBe(10);
    expect(clampFeeBps(1, { stable: true })).toBe(2);
    expect(clampFeeBps(100, { stable: false })).toBe(100);
    expect(clampFeeBps(9999, { stable: true })).toBe(500);
  });
  it("converts units without float error", () => {
    expect(toUnits("0.1", 18)).toBe("100000000000000000");
    expect(toUnits("1.234567", 6)).toBe("1234567");
    expect(toUnits("1.2345678", 6)).toBeNull();
    expect(toUnits("0", 6)).toBeNull();
    expect(toUnits("-1", 6)).toBeNull();
    expect(fromUnits("1500000", 6)).toBe("1.5");
    expect(fromUnits("5", 6)).toBe("0.000005");
  });
  it("maps provider statuses", () => {
    expect(mapStatus("PENDING_DEPOSIT")).toBe("pending");
    expect(mapStatus("PROCESSING")).toBe("converting");
    expect(mapStatus("SUCCESS")).toBe("received");
    expect(mapStatus("REFUNDED")).toBe("refunded");
    expect(mapStatus("INCOMPLETE_DEPOSIT")).toBe("failed");
  });
});

describe("minimum tip ($1)", () => {
  const usdc = { decimals: 6, stable: true, usdPrice: 0.9999 }; // Aurora quotes USDC a hair under $1
  it("accepts exactly 1.00 of a dollar coin even when its quoted price is 0.9999", () => {
    expect(meetsMinTip("1000000", usdc)).toBe(true);
  });
  it("still rejects less than a dollar", () => {
    expect(meetsMinTip("990000", usdc)).toBe(false);
    expect(meetsMinTip("500000", usdc)).toBe(false);
  });
  it("gives other coins 1% slack for price moves, no more", () => {
    const eth = { decimals: 18, stable: false, usdPrice: 3200 };
    expect(meetsMinTip(String(BigInt(Math.ceil((1 / 3200) * 1e18))), eth)).toBe(true);
    expect(meetsMinTip(String(BigInt(Math.ceil((0.995 / 3200) * 1e18))), eth)).toBe(true);
    expect(meetsMinTip(String(BigInt(Math.ceil((0.95 / 3200) * 1e18))), eth)).toBe(false);
  });
});
