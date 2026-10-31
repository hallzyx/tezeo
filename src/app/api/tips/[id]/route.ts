import { NextResponse } from "next/server";
import { getTip, refreshTip } from "@/lib/tips";
import { tipView } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tip = getTip(id);
  if (!tip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return NextResponse.json(tipView(await refreshTip(tip)));
  } catch {
    // Aurora hiccup: return last known state so the UI keeps polling instead of showing a false failure.
    return NextResponse.json({ ...tipView(tip), stale: true });
  }
}
