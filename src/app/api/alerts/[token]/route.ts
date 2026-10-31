import { NextResponse } from "next/server";
import { alertsSince, getCreatorByAlertToken } from "@/lib/extras";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const creator = getCreatorByAlertToken(token);
  if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const since = new URL(req.url).searchParams.get("since") ?? new Date().toISOString();
  return NextResponse.json({ now: new Date().toISOString(), alerts: await alertsSince(creator, since) });
}
