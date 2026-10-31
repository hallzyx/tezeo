import { NextResponse } from "next/server";
import { z } from "zod";
import { setGoal } from "@/lib/extras";

const Body = z.object({ title: z.string().max(80), targetUsd: z.number().finite() });

export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Check the goal name and amount." }, { status: 400 });
  try {
    const x = setGoal(token, body.data);
    if (!x) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ title: x.goal_title, targetUsd: x.goal_target_usd });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 422 });
  }
}
