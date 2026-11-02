import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCreatorByToken } from "@/lib/tips";
import { dashboardData } from "@/lib/dashboard";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { DashboardShell } from "./DashboardShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { template: "%s · Tezeo", default: "Dashboard" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** One layout for every dashboard page: it never remounts on navigation, so the poller, toasts and data persist. */
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await getCreatorByToken(token);
  if (!c) notFound();
  return <DashboardShell token={token} initial={await dashboardData(c)} accent={c.accent || DEFAULT_ACCENT}>{children}</DashboardShell>;
}
