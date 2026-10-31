import { NextResponse } from "next/server";
import { z } from "zod";
import { getTip, refreshTip, setTipNote } from "@/lib/tips";
import { tipView } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tip = await getTip(id);
  if (!tip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return NextResponse.json(tipView(await refreshTip(tip)));
  } catch {
    // Aurora hiccup: return last known state so the UI keeps polling instead of showing a false failure.
    return NextResponse.json({ ...tipView(tip), stale: true });
  }
}

const Note = z.object({ fanName: z.string().trim().max(40).optional(), fanMessage: z.string().trim().max(280).optional() });

/** Fan adds a short note while waiting (DESIGN.md §7.D) or with a pass (§7.H). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tip = await getTip(id);
  if (!tip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Note.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "That note is too long." }, { status: 400 });
  const next = await setTipNote(id, body.data.fanName ?? tip.fan_name, body.data.fanMessage ?? tip.fan_message);
  return NextResponse.json(tipView(next ?? tip));
}
