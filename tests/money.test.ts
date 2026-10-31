import { describe, expect, it } from "vitest";
import { breakdown, clock, coin, usdc } from "@/lib/money";

describe("money helpers", () => {
  it("formats USDC smallest units", () => { expect(usdc("4744330")).toBe("4.74"); expect(usdc(null)).toBe("0"); });
  it("formats coin amounts without float error", () => { expect(coin("2130000000000000", 18, 8)).toBe("0.00213"); });
  it("can pad dollar coins to cents", () => { expect(coin("1100000", 6, 8, 2)).toBe("1.10"); expect(coin("5000000", 6, 8, 2)).toBe("5.00"); expect(coin("1234567", 6, 8, 2)).toBe("1.234567"); });
  it("formats the quote hold timer", () => { expect(clock(58_000)).toBe("0:58"); expect(clock(-5)).toBe("0:00"); });
  it("splits fees so the three lines add up", () => {
    const b = breakdown(5, 100, 4.7);
    expect(b.fee + b.network + b.receives).toBeCloseTo(5, 6);
  });
});
