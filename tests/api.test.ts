import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { setUsdcProbeForTests } from "@/lib/solana";
import { POST as createCreatorRoute } from "@/app/api/creators/route";
import { POST as createTipRoute } from "@/app/api/tips/route";
import { PATCH as patchTip } from "@/app/api/tips/[id]/route";

const WALLET = "GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ";
const json = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { setUsdcProbeForTests(async () => true); return resetDbForTests(); });
afterEach(() => resetDbForTests());

describe("creator onboarding API (RF-1/RF-2)", () => {
  it("saves a valid creator and returns a private dashboard token", async () => {
    const r = await createCreatorRoute(json({ handle: "@Vale", displayName: "Vale", wallet: WALLET, accent: "#7C3AED" }));
    expect(r.status).toBe(201);
    const j = await r.json();
    expect(j.handle).toBe("vale");
    expect(j.dashboardToken.length).toBeGreaterThan(20);
  });
  it("refuses an invalid wallet before saving", async () => {
    const r = await createCreatorRoute(json({ handle: "vale", displayName: "Vale", wallet: "not-a-wallet" }));
    expect(r.status).toBe(400);
  });
  it("refuses an accent that mimics a status colour", async () => {
    const r = await createCreatorRoute(json({ handle: "vale", displayName: "Vale", wallet: WALLET, accent: "#D9481F" }));
    expect(r.status).toBe(422);
    expect((await r.json()).suggestion).toBeTruthy();
  });
  it("rejects duplicate handles", async () => {
    await createCreatorRoute(json({ handle: "vale", displayName: "Vale", wallet: WALLET }));
    expect((await createCreatorRoute(json({ handle: "VALE", displayName: "V2", wallet: WALLET }))).status).toBe(409);
  });
  it("rejects javascript: avatars", async () => {
    const r = await createCreatorRoute(json({ handle: "vale", displayName: "Vale", wallet: WALLET, avatarUrl: "javascript:alert(1)" }));
    expect(r.status).toBe(400);
  });
});

describe("tip API", () => {
  it("enforces the $1 minimum and stores the fan's note", async () => {
    await createCreatorRoute(json({ handle: "vale", displayName: "Vale", wallet: WALLET }));
    const tiny = await createTipRoute(json({ handle: "vale", originAssetId: "base:usdc", amount: "0.5", refundTo: "0xabc0000000" }));
    expect(tiny.status).toBe(422);
    const ok = await createTipRoute(json({ handle: "vale", originAssetId: "base:usdc", amount: "5", refundTo: "0xabc0000000" }));
    expect(ok.status).toBe(201);
    const tip = await ok.json();
    const p = await patchTip(new Request("http://x", { method: "PATCH", body: JSON.stringify({ fanName: "Ana", fanMessage: "¡Gracias!" }) }), { params: Promise.resolve({ id: tip.id }) });
    expect((await p.json()).fanMessage).toBe("¡Gracias!");
  });
});
