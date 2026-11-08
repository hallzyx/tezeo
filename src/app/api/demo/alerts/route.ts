import { NextResponse } from "next/server";
import { demoHandle } from "@/lib/demo";
import { alertsSince } from "@/lib/extras";
import { getCreatorByHandle } from "@/lib/tips";

export const dynamic = "force-dynamic";

/** Alerts feed for the demo stage only. Resolves the creator server-side from DEMO_STAGE_HANDLE, so no alert token reaches the browser. */
export async function GET(req: Request) {
  const handle = demoHandle();
  if (!handle) return NextResponse.json({ error: "Demo stage is off: DEMO_STAGE_HANDLE is not set in this container." }, { status: 404 });
  const creator = await getCreatorByHandle(handle);
  if (!creator) return NextResponse.json({ error: "Demo stage is on, but no creator has the handle set in DEMO_STAGE_HANDLE." }, { status: 404 });
  const since = new URL(req.url).searchParams.get("since") ?? new Date().toISOString();
  return NextResponse.json({ now: new Date().toISOString(), alerts: await alertsSince(creator, since) });
}
