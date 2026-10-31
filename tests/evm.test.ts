import { describe, expect, it } from "vitest";
import { encodeErc20Transfer, walletTx } from "@/lib/evm";

const DEP = "0xCF4D6a42E0c3E8C64CEda35A5805FE35e20053dc";
const USDC_BASE = { chain: "base", symbol: "USDC", contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" };

describe("wallet payment transaction", () => {
  it("encodes an ERC-20 transfer to the deposit address", () => {
    const data = encodeErc20Transfer(DEP, 5_000_000n);
    expect(data.startsWith("0xa9059cbb")).toBe(true);
    expect(data).toHaveLength(2 + 8 + 64 + 64);
    expect(data.slice(10, 74)).toBe("000000000000000000000000cf4d6a42e0c3e8c64ceda35a5805fe35e20053dc");
    expect(BigInt("0x" + data.slice(74))).toBe(5_000_000n);
  });
  it("USDC on Base: calls the token contract on chain 8453, no native value", () => {
    const tx = walletTx(USDC_BASE, DEP, "5000000")!;
    expect(tx).toMatchObject({ chainId: 8453, to: USDC_BASE.contractAddress, value: "0x0" });
    expect(tx.data.startsWith("0xa9059cbb")).toBe(true);
  });
  it("native coin: plain transfer of the exact amount to the deposit address", () => {
    const tx = walletTx({ chain: "base", symbol: "ETH" }, DEP, "2130000000000000")!;
    expect(tx).toMatchObject({ chainId: 8453, to: DEP, data: "0x", value: "0x" + (2130000000000000n).toString(16) });
  });
  it("refuses what a browser wallet can't do (manual flow instead)", () => {
    expect(walletTx({ chain: "btc", symbol: "BTC" }, DEP, "1000")).toBeNull();                         // not EVM
    expect(walletTx({ chain: "sol", symbol: "SOL" }, "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", "1000")).toBeNull();
    expect(walletTx({ chain: "base", symbol: "WEIRD" }, DEP, "1000")).toBeNull();                       // contract-less non-native
    expect(walletTx(USDC_BASE, "not-an-address", "1000")).toBeNull();                                   // e.g. simulator addresses
    expect(walletTx(USDC_BASE, DEP, "0")).toBeNull();
    expect(walletTx(USDC_BASE, DEP, "1.5")).toBeNull();
  });
  it("rejects bad input at the encoder", () => {
    expect(() => encodeErc20Transfer("0x123", 1n)).toThrow();
    expect(() => encodeErc20Transfer(DEP, 0n)).toThrow();
  });
});
