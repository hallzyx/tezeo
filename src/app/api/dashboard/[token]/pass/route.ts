import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCreatorPass } from "@/lib/tips";

const Body = z.object({ enabled: z.boolean(), priceUsd: z.number().finite(), perk: z.string().max(140) });

/** Creator configures the 30-day pass. The private dashboard token is the credential. */
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Check the pass price and perk." }, { status: 400 });
  try {
    const c = await updateCreatorPass(token, body.data);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ enabled: !!c.pass_enabled, priceUsd: c.pass_price_usd, perk: c.pass_perk });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 422 });
  }
}
