import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { getCreatorByHandle } from "@/lib/tips";
import { TipFlow, type PublicCreator } from "../TipFlow";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ handle: string }> };
export const metadata: Metadata = { title: "Membership pass" };

export default async function PassPage({ params }: P) {
  const c = await getCreatorByHandle((await params).handle.replace(/^@/, ""));
  if (!c || !c.pass_enabled) notFound();
  const creator: PublicCreator = {
    handle: c.handle, displayName: c.display_name, message: c.message, avatarUrl: c.avatar_url,
    accent: c.accent || DEFAULT_ACCENT, pass: { priceUsd: c.pass_price_usd, perk: c.pass_perk },
  };
  return <TipFlow creator={creator} qrSvg="" pageUrl={`${env.baseUrl}/@${c.handle}`} passMode />;
}
