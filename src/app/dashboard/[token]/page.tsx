import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCreatorByToken } from "@/lib/tips";
import { dashboardData } from "@/lib/dashboard";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await getCreatorByToken(token);
  if (!c) notFound();
  return <Dashboard token={token} initial={await dashboardData(c)} accent={c.accent || DEFAULT_ACCENT} />;
}
