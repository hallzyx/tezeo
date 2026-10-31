import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderStatus } from "@/lib/aurora/types";

const stub = { status: "SUCCESS" as ProviderStatus, n: 0 };
vi.mock("@/lib/aurora", () => ({
  getAurora: () => ({
    mode: "simulated",
    listOriginAssets: async () => [{ assetId: "base:usdc", chain: "base", chainLabel: "Base", symbol: "USDC", decimals: 6, stable: true, usdPrice: 1 }],
    quote: async (r: { amountIn: string }) => ({ depositAddress: `dep_${++stub.n}`, amountIn: r.amountIn, amountOutUsdc: String(Number(r.amountIn) - 250000), minAmountOutUsdc: String(Number(r.amountIn) - 300000), appFeeBps: 2, deadline: new Date(Date.now() + 3.6e6).toISOString() }),
    status: async () => ({ status: stub.status, settlementTx: "tx", amountOutUsdc: undefined }),
  }),
}));

import { resetDbForTests } from "@/lib/db";
import { createCreator, createTip, refreshTip, setTipNote } from "@/lib/tips";
import { alertsSince, getCreatorByAlertToken, getExtras, goalProgress, setGoal, supporterWall } from "@/lib/extras";
import { GET as alertsRoute } from "@/app/api/alerts/[token]/route";

const WALLET = "GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ";
beforeEach(() => { stub.status = "SUCCESS"; stub.n = 0; });
afterEach(() => resetDbForTests());

const setup = () => createCreator({ handle: "vale", displayName: "Vale", wallet: WALLET });
const tip = async (c: ReturnType<typeof setup>, usd: number, note?: [string, string]) => {
  const t = await createTip(c, { originAssetId: "base:usdc", amountIn: String(usd * 1e6), refundTo: "0xabc0000000" });
  if (note) setTipNote(t.id, note[0], note[1]);
  return t;
};

describe("alert token", () => {
  it("is separate from the dashboard token and resolves the creator", () => {
    const c = setup();
    const x = getExtras(c.id);
    expect(x.alert_token).not.toBe(c.dashboard_token);
    expect(getExtras(c.id).alert_token).toBe(x.alert_token); // stable
    expect(getCreatorByAlertToken(x.alert_token)?.id).toBe(c.id);
    expect(getCreatorByAlertToken(c.dashboard_token)).toBeUndefined();
  });
});

describe("goal", () => {
  it("counts only confirmed tips received after the goal was set", async () => {
    const c = setup();
    const before = await tip(c, 10); await refreshTip(before);
    setGoal(c.dashboard_token, { title: "New mic", targetUsd: 100 });
    stub.status = "SUCCESS";
    const t = await tip(c, 20); await refreshTip(t);
    stub.status = "REFUNDED"; const r = await tip(c, 50); await refreshTip(r);
    const g = goalProgress(c)!;
    expect(g.raisedUsd).toBeCloseTo(19.75, 2);
    expect(g.pct).toBe(20);
  });
  it("validates and can be cleared", () => {
    const c = setup();
    expect(() => setGoal(c.dashboard_token, { title: "", targetUsd: 50 })).toThrow(/name/);
    expect(() => setGoal(c.dashboard_token, { title: "x", targetUsd: -1 })).toThrow();
    setGoal(c.dashboard_token, { title: "Mic", targetUsd: 50 });
    setGoal(c.dashboard_token, { title: "", targetUsd: 0 });
    expect(goalProgress(c)).toBeNull();
    expect(setGoal("nope", { title: "x", targetUsd: 5 })).toBeUndefined();
  });
});

describe("supporter wall", () => {
  it("lists only confirmed tips with a name or note, without amounts", async () => {
    const c = setup();
    const a = await tip(c, 5, ["Ana", "¡Gracias!"]); await refreshTip(a);
    const anon = await tip(c, 5); await refreshTip(anon); // no name, no note: not listed
    stub.status = "FAILED"; const f = await tip(c, 5, ["Fail", "nope"]); await refreshTip(f);
    stub.status = "PENDING_DEPOSIT"; const p = await tip(c, 5, ["Pending", "soon"]); await refreshTip(p);
    const wall = supporterWall(c);
    expect(wall.map((w) => w.name)).toEqual(["Ana"]);
    expect(JSON.stringify(wall)).not.toMatch(/usdc|amount|0xabc/i);
  });
});

describe("stream alerts", () => {
  it("emits each confirmed tip once, only after `since`", async () => {
    const c = setup();
    const t0 = new Date().toISOString();
    const a = await tip(c, 5, ["Ana", "hola"]);
    const first = await alertsSince(c, t0);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ id: a.id, name: "Ana", message: "hola" });
    expect(first[0].usdc).toBeCloseTo(4.75, 2);
    expect(await alertsSince(c, first[0].at)).toHaveLength(0);
  });
  it("is served by the API only for a valid alert token", async () => {
    const c = setup();
    const ok = await alertsRoute(new Request("http://x?since=2000-01-01T00:00:00Z"), { params: Promise.resolve({ token: getExtras(c.id).alert_token }) });
    expect(ok.status).toBe(200);
    const bad = await alertsRoute(new Request("http://x"), { params: Promise.resolve({ token: c.dashboard_token }) });
    expect(bad.status).toBe(404);
  });
});
