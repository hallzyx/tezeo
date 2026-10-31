import { NextResponse } from "next/server";
import { z } from "zod";
import { getAurora } from "@/lib/aurora";
import { meetsMinTip, toUnits } from "@/lib/domain";
import { passAmountUnits } from "@/lib/tips";
import { createTip, getCreatorByHandle } from "@/lib/tips";
import { tipView } from "@/lib/view";

const Body = z.object({
  handle: z.string(),
  originAssetId: z.string(),
  amount: z.string().optional(), // decimal in origin asset units, e.g. "0.01"; ignored for passes (server sizes it)
  refundTo: z.string().trim().min(10).max(120),
  fanName: z.string().trim().max(40).optional(),
  fanMessage: z.string().trim().max(280).optional(),
  pass: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });
  const b = parsed.data;
  const creator = await getCreatorByHandle(b.handle.replace(/^@/, ""));
  if (!creator) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

  const assets = await getAurora().listOriginAssets();
  const asset = assets.find((a) => a.assetId === b.originAssetId);
  if (!asset) return NextResponse.json({ error: "That asset isn't supported." }, { status: 400 });
  if (b.pass && !creator.pass_enabled) return NextResponse.json({ error: "Pass is not available for this creator." }, { status: 422 });
  const units = b.pass ? passAmountUnits(creator.pass_price_usd, asset) : b.amount ? toUnits(b.amount, asset.decimals) : null;
  if (!units) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });

  if (!b.pass && (asset.stable || asset.usdPrice) && !meetsMinTip(units, asset))
    return NextResponse.json({ error: "The smallest tip is $1. Network fees would eat the rest." }, { status: 422 });

  try {
    const tip = await createTip(creator, {
      originAssetId: asset.assetId, amountIn: units, refundTo: b.refundTo,
      fanName: b.fanName, fanMessage: b.fanMessage, isPass: b.pass,
    });
    return NextResponse.json(tipView(tip), { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create the quote.";
    if (msg.startsWith("Pass")) return NextResponse.json({ error: msg }, { status: 422 });
    // Aurora rejects bad refund addresses with a clear message; anything else is ours to hide.
    const refund = /refundTo/i.test(msg);
    return NextResponse.json({ error: refund ? "refundTo is not valid" : "We couldn't get a quote right now. Try again in a moment." }, { status: refund ? 422 : 502 });
  }
}
