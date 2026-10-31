import { NextResponse } from "next/server";
import { z } from "zod";
import { getAurora } from "@/lib/aurora";
import { getTip } from "@/lib/tips";

const Body = z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) });

/**
 * The fan's wallet just broadcast the deposit. Tell Aurora which transaction it was so it can pick the
 * payment up sooner. Best-effort: Aurora detects deposits on its own, so a failure here never blocks the flow.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tip = await getTip(id);
  if (!tip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid transaction hash." }, { status: 400 });
  if (tip.status !== "pending") return NextResponse.json({ ok: true, skipped: true });
  const aurora = getAurora();
  try { await aurora.submitDeposit?.(tip.deposit_address, body.data.txHash, tip.deposit_memo ?? undefined); }
  catch { return NextResponse.json({ ok: true, notified: false }); }
  return NextResponse.json({ ok: true, notified: !!aurora.submitDeposit });
}
