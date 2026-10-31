import { describe, expect, it } from "vitest";
import { clampFeeBps, fromUnits, isValidSolanaAddress, mapStatus, normalizeHandle, toUnits } from "@/lib/domain";

describe("domain", () => {
  it("validates Solana addresses", () => {
    expect(isValidSolanaAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")).toBe(true);
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
