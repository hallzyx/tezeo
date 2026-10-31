import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { getCreatorByAlertToken } from "@/lib/extras";
import { Alerts } from "./Alerts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stream alerts", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = getCreatorByAlertToken(token);
  if (!c) notFound();
  return <Alerts token={token} name={c.display_name.split(" ")[0]} accent={c.accent || DEFAULT_ACCENT} />;
}
