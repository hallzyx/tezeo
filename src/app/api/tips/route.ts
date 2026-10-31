import { NextResponse } from "next/server";
import { z } from "zod";
import { getAurora } from "@/lib/aurora";
import { toUnits } from "@/lib/domain";
import { createTip, getCreatorByHandle } from "@/lib/tips";
import { tipView } from "@/lib/view";

const Body = z.object({
  handle: z.string(),
  originAssetId: z.string(),
  amount: z.string(), // decimal in origin asset units, e.g. "0.01"
  refundTo: z.string().trim().min(10).max(120),
  fanName: z.string().trim().max(40).optional(),
  fanMessage: z.string().trim().max(280).optional(),
  pass: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });
  const b = parsed.data;
  const creator = getCreatorByHandle(b.handle.replace(/^@/, ""));
  if (!creator) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

  const assets = await getAurora().listOriginAssets();
  const asset = assets.find((a) => a.assetId === b.originAssetId);
  if (!asset) return NextResponse.json({ error: "That asset isn't supported." }, { status: 400 });
  const units = toUnits(b.amount, asset.decimals);
  if (!units) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });

  const usdValue = (Number(units) / 10 ** asset.decimals) * (asset.usdPrice ?? 0);
  if (asset.usdPrice && usdValue < 1)
    return NextResponse.json({ error: "The smallest tip is $1. Network fees would eat the rest." }, { status: 422 });

  try {
    const tip = await createTip(creator, {
      originAssetId: asset.assetId, amountIn: units, refundTo: b.refundTo,
      fanName: b.fanName, fanMessage: b.fanMessage, isPass: b.pass,
    });
    return NextResponse.json(tipView(tip), { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create the quote.";
    return NextResponse.json({ error: msg }, { status: msg.startsWith("Pass") ? 422 : 502 });
  }
}
