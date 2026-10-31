import { notFound } from "next/navigation";
import QRCode from "qrcode";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { getCreatorByHandle } from "@/lib/tips";
import { TipFlow, type PublicCreator } from "./TipFlow";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = getCreatorByHandle((await params).handle);
  return c ? { title: `Tip ${c.display_name}`, description: c.message || `Send ${c.display_name} a tip from any chain.` } : {};
}

export default async function CreatorPage({ params }: P) {
  const c = getCreatorByHandle((await params).handle.replace(/^@/, ""));
  if (!c) notFound();
  const url = `${env.baseUrl}/@${c.handle}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1C1424", light: "#FFFFFF" } });
  const creator: PublicCreator = {
    handle: c.handle, displayName: c.display_name, message: c.message, avatarUrl: c.avatar_url,
    accent: c.accent || DEFAULT_ACCENT,
    pass: c.pass_enabled ? { priceUsd: c.pass_price_usd, perk: c.pass_perk } : null,
  };
  return <TipFlow creator={creator} qrSvg={qrSvg} pageUrl={url} />;
}
