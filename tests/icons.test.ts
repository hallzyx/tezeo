import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { chainIcon, coinIcon } from "@/lib/icons";
import { CHAIN_ICONS, COIN_ICONS } from "@/lib/icons.generated";

describe("chain and coin logos", () => {
  it("every listed logo exists on disk and is a valid SVG", () => {
    for (const [kind, set] of [["chains", CHAIN_ICONS], ["coins", COIN_ICONS]] as const)
      for (const s of set) {
        const f = `public/icons/${kind}/${s}.svg`;
        expect(fs.existsSync(f), f).toBe(true);
        expect(fs.readFileSync(f, "utf8")).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
      }
  });
  it("covers the networks fans use most", () => {
    for (const c of ["eth", "base", "arb", "op", "pol", "bsc", "avax", "near", "sui", "ton", "tron", "btc", "sol"])
      expect(chainIcon(c), c).toBe(`/icons/chains/${c}.svg`);
  });
  it("understands the simulator's long chain names", () => {
    expect(chainIcon("ethereum")).toBe("/icons/chains/eth.svg");
    expect(chainIcon("arbitrum")).toBe("/icons/chains/arb.svg");
    expect(chainIcon("bitcoin")).toBe("/icons/chains/btc.svg");
  });
  it("finds coins by symbol, falling back to the chain logo for a chain's own coin", () => {
    expect(coinIcon("USDC")).toBe("/icons/coins/usdc.svg");
    expect(coinIcon("eth")).toBe("/icons/coins/eth.svg");
    expect(coinIcon("TON")).toBe("/icons/chains/ton.svg");
  });
  it("returns undefined for the unknown so the UI keeps its text glyph", () => {
    expect(chainIcon("nope-chain")).toBeUndefined();
    expect(coinIcon("SOMEMEME")).toBeUndefined();
  });
});
