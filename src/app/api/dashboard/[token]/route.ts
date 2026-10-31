import { NextResponse } from "next/server";
import { getCreatorByToken, listTips, refreshTip } from "@/lib/tips";
import { dashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const creator = getCreatorByToken(token);
  if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Aurora is the source of truth: refresh anything still in flight before answering.
  const open = listTips(creator.id, 50).filter((t) => t.status === "pending" || t.status === "converting");
  await Promise.allSettled(open.slice(0, 10).map((t) => refreshTip(t)));
  return NextResponse.json(dashboardData(creator));
}
