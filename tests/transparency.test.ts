import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderStatus } from "@/lib/aurora/types";

// Controllable provider: 5 USDC in, $0.25 delivery cost (new wallet), 2 bps fee.
const stub = { status: "SUCCESS" as ProviderStatus, n: 0, delivery: "254900" };
vi.mock("@/lib/aurora", () => ({
  getAurora: () => ({
    mode: "simulated",
    listOriginAssets: async () => [{ assetId: "base:usdc", chain: "base", chainLabel: "Base", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 }],
    quote: async (r: { amountIn: string }) => ({
      depositAddress: `dep_${++stub.n}`, amountIn: r.amountIn, amountInUsd: "5.000000",
      amountOutUsdc: "4744000", minAmountOutUsdc: "4696000", appFeeBps: 2, withdrawFeeUsdc: stub.delivery,
      deadline: new Date(Date.now() + 3.6e6).toISOString(),
    }),
    status: async () => ({ status: stub.status, settlementTx: "tx", amountOutUsdc: "4744000" }),
  }),
}));

import { resetDbForTests } from "@/lib/db";
import { createCreator, createTip, refreshTip } from "@/lib/tips";
import { breakdownOf, dashboardData } from "@/lib/dashboard";
import { setUsdcProbeForTests, walletHasUsdcAccount } from "@/lib/solana";
import { tipView } from "@/lib/view";
import { POST as createCreatorRoute } from "@/app/api/creators/route";

const WALLET = "GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ";
beforeEach(() => { stub.status = "SUCCESS"; stub.n = 0; stub.delivery = "254900"; setUsdcProbeForTests(async () => false); });
afterEach(async () => { setUsdcProbeForTests(null); await resetDbForTests(); });

const received = async () => {
  const c = await createCreator({ handle: "arroz", displayName: "Arroz", wallet: WALLET });
  const t = await createTip(c, { originAssetId: "base:usdc", amountIn: "5000000", refundTo: "0xabc0000000" });
  return { c, tip: await refreshTip(t) };
};

describe("fans see what they pay, creators see where it went", () => {
  it("never puts fees or the creator's net amount in what fans receive", async () => {
    const { tip } = await received();
    const json = JSON.stringify(tipView(tip));
    for (const k of ["amountOutUsdc", "appFeeBps", "gross", "delivery", "final_out", "4.744", "254900"]) expect(json, k).not.toContain(k);
    expect(tipView(tip).status).toBe("received");
  });
  it("shows the creator a breakdown that adds up: sent = delivery + fees + received", async () => {
    const { tip } = await received();
    const b = breakdownOf(tip);
    expect(b.gross).toBeCloseTo(5, 6);
    expect(b.delivery).toBeCloseTo(0.2549, 4);
    expect(b.gross! - b.delivery! - b.fees!).toBeCloseTo(4.744, 4);
  });
  it("has no breakdown for tips that are not received yet or predate the data", async () => {
    stub.status = "PENDING_DEPOSIT";
    const { tip } = await received();
    expect(breakdownOf(tip)).toEqual({ gross: null, delivery: null, fees: null });
    expect(breakdownOf({ ...tip, status: "received", gross_usd: null })).toEqual({ gross: null, delivery: null, fees: null });
  });
  it("puts the breakdown on the dashboard rows", async () => {
    const { c } = await received();
    const d = await dashboardData(c);
    expect(d.tips[0]).toMatchObject({ usdc: 4.744 });
    expect(d.tips[0].delivery).toBeCloseTo(0.2549, 4);
  });
});

describe("new-wallet notice", () => {
  it("dashboard flags a wallet with no USDC account", async () => {
    const { c } = await received();
    expect((await dashboardData(c)).walletHasUsdc).toBe(false);
  });
  it("dashboard says nothing special when the wallet already has one", async () => {
    setUsdcProbeForTests(async () => true);
    const { c } = await received();
    expect((await dashboardData(c)).walletHasUsdc).toBe(true);
  });
  it("treats a failed network check as unknown, never as 'no account'", async () => {
    setUsdcProbeForTests(async () => { throw new Error("rpc down"); });
    expect(await walletHasUsdcAccount(WALLET)).toBeNull();
  });
  it("onboarding reports it right after saving the wallet", async () => {
    const r = await createCreatorRoute(new Request("http://x", { method: "POST", body: JSON.stringify({ handle: "vale", displayName: "Vale", wallet: WALLET }) }));
    expect((await r.json()).walletHasUsdc).toBe(false);
  });
  it("re-checks a missing account soon (the first tip creates it) but remembers a present one", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    let has = false; const probe = vi.fn(async () => has);
    setUsdcProbeForTests(probe);
    expect(await walletHasUsdcAccount(WALLET)).toBe(false);
    expect(await walletHasUsdcAccount(WALLET)).toBe(false); expect(probe).toHaveBeenCalledTimes(1); // cached
    has = true; vi.advanceTimersByTime(61_000);
    expect(await walletHasUsdcAccount(WALLET)).toBe(true); expect(probe).toHaveBeenCalledTimes(2);
    has = false; vi.advanceTimersByTime(10 * 60_000);
    expect(await walletHasUsdcAccount(WALLET)).toBe(true); expect(probe).toHaveBeenCalledTimes(2); // still trusted
    vi.useRealTimers();
  });
});
