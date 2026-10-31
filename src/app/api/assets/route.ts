import { NextResponse } from "next/server";
import { getAurora } from "@/lib/aurora";

export const dynamic = "force-dynamic";

// RF-3: only offer what the Aurora integration supports.
export async function GET() {
  const aurora = getAurora();
  const assets = await aurora.listOriginAssets();
  return NextResponse.json({ mode: aurora.mode, assets });
}
