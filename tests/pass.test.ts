import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderStatus, QuoteRequest } from "@/lib/aurora/types";

// A stub provider we fully control: what the quote delivers and what status Aurora reports.
const stub = { minOut: "20000000", out: "20100000", status: "PENDING_DEPOSIT" as ProviderStatus, n: 0, lastAmountIn: "" };
vi.mock("@/lib/aurora", () => ({
  getAurora: () => ({
    mode: "simulated",
    listOriginAssets: async () => [{ assetId: "base:usdc", chain: "base", chainLabel: "Base", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 }],
    quote: async (r: QuoteRequest) => {
      stub.lastAmountIn = r.amountIn;
      return { depositAddress: `dep_${++stub.n}`, amountIn: r.amountIn, amountOutUsdc: stub.out, minAmountOutUsdc: stub.minOut, appFeeBps: 2, deadline: new Date(Date.now() + 3_600_000).toISOString() };
    },
    status: async () => ({ status: stub.status, settlementTx: stub.status === "SUCCESS" ? "tx123" : undefined, amountOutUsdc: stub.out }),
  }),
}));

import { resetDbForTests } from "@/lib/db";
import { createCreator, createTip, getTip, getTipByPassToken, refreshTip, updateCreatorPass, passAmountUnits } from "@/lib/tips";

const WALLET = "GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ";
beforeEach(() => { Object.assign(stub, { minOut: "20000000", out: "20100000", status: "PENDING_DEPOSIT", n: 0 }); });
afterEach(() => resetDbForTests());

const creatorWithPass = async (price = 12) => {
  const c = await createCreator({ handle: "ana", displayName: "Ana", wallet: WALLET });
  await updateCreatorPass(c.dashboard_token, { enabled: true, priceUsd: price, perk: "Early access" });
  return { c: { ...c, pass_enabled: 1, pass_price_usd: price }, token: c.dashboard_token };
};

describe("pass settings", () => {
  it("lets the creator enable the pass with a price and perk", async () => {
    const { token } = await creatorWithPass(12);
    const c = (await updateCreatorPass(token, { enabled: true, priceUsd: 15, perk: "  Q&A  " }))!;
    expect([c.pass_enabled, c.pass_price_usd, c.pass_perk]).toEqual([1, 15, "Q&A"]);
  });
  it("rejects silly prices", async () => {
    const { token } = await creatorWithPass();
    await expect(updateCreatorPass(token, { enabled: true, priceUsd: 0, perk: "" })).rejects.toThrow(/between/);
    await expect(updateCreatorPass(token, { enabled: true, priceUsd: 5000, perk: "" })).rejects.toThrow(/between/);
  });
  it("unknown token changes nothing", async () => {
    await creatorWithPass();
    expect(await updateCreatorPass("nope", { enabled: true, priceUsd: 5, perk: "" })).toBeUndefined();
  });
});

describe("buying a pass", () => {
  it("refuses a pass when the creator has not enabled one", async () => {
    const c = await createCreator({ handle: "bo", displayName: "Bo", wallet: WALLET });
    await expect(createTip(c, { originAssetId: "base:usdc", amountIn: "12000000", refundTo: "0xabc0000000", isPass: true })).rejects.toThrow(/Pass is not available/);
  });

  it("enforces that the quote still covers the pass price after fees", async () => {
    const { c } = await creatorWithPass(12);
    stub.minOut = "9000000"; // the quote can only guarantee 9 USDC for a 12 USDC pass, even after a retry
    await expect(createTip(c, { originAssetId: "base:usdc", amountIn: "12500000", refundTo: "0xabc0000000", isPass: true }))
      .rejects.toThrow(/^Pass price not covered/);
  });

  it("accepts a quote whose guaranteed minimum covers the price", async () => {
    const { c } = await creatorWithPass(12);
    stub.minOut = "12000000";
    const t = await createTip(c, { originAssetId: "base:usdc", amountIn: "12500000", refundTo: "0xabc0000000", isPass: true, fanMessage: "Saludos desde Medellín!", fanName: "Ana" });
    expect(t.is_pass).toBe(1);
    expect(t.fan_message).toBe("Saludos desde Medellín!");
    expect(t.pass_token).toBeNull(); // nothing is issued at quote time
  });

  it("sizes the quote above the price so fees do not eat into it", () => {
    const units = BigInt(passAmountUnits(12, { decimals: 6, usdPrice: 1, stable: true }));
    expect(units).toBeGreaterThan(12_000_000n);
  });

  it("issues the pass only after a confirmed payment, valid for 30 days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
    const { c } = await creatorWithPass(12);
    stub.minOut = "12000000";
    const t = await createTip(c, { originAssetId: "base:usdc", amountIn: "12500000", refundTo: "0xabc0000000", isPass: true });

    stub.status = "PENDING_DEPOSIT";
    expect((await refreshTip(t)).pass_token).toBeNull();
    stub.status = "PROCESSING";
    expect((await refreshTip((await getTip(t.id))!)).pass_token).toBeNull();

    stub.status = "SUCCESS";
    const done = await refreshTip((await getTip(t.id))!);
    expect(done.status).toBe("received");
    expect(done.pass_token).toBeTruthy();
    expect(new Date(done.pass_expires_at!).toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect((await getTipByPassToken(done.pass_token!))?.id).toBe(t.id);

    // Polling again never re-issues or extends it.
    const again = await refreshTip((await getTip(t.id))!);
    expect(again.pass_token).toBe(done.pass_token);
    vi.useRealTimers();
  });

  it("never issues a pass for a refunded or failed payment", async () => {
    const { c } = await creatorWithPass(12);
    stub.minOut = "12000000";
    for (const status of ["REFUNDED", "FAILED", "INCOMPLETE_DEPOSIT"] as const) {
      const t = await createTip(c, { originAssetId: "base:usdc", amountIn: "12500000", refundTo: "0xabc0000000", isPass: true });
      stub.status = status;
      const r = await refreshTip(t);
      expect(r.pass_token, status).toBeNull();
      expect(await getTipByPassToken("")).toBeUndefined();
    }
  });
});
