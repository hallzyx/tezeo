import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { q1 } from "@/lib/db";
import { getTipByPassToken, type CreatorRow } from "@/lib/tips";
import { Mark, TopBar } from "@/components/ui";
import { PassCard, passState } from "@/components/PassCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your pass", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PassView({ params }: { params: Promise<{ token: string }> }) {
  const tip = await getTipByPassToken((await params).token);
  // A pass link exists only after the payment was confirmed (see refreshTip).
  if (!tip || tip.status !== "received" || !tip.pass_expires_at) notFound();
  const c = (await q1<CreatorRow>("SELECT * FROM creators WHERE id = $1", [tip.creator_id]))!;
  const name = c.display_name.split(" ")[0];
  const { state, days } = passState(tip.pass_expires_at);
  return (
    <div className="tzs-page tz-creator" style={{ ["--creator-accent" as string]: c.accent || DEFAULT_ACCENT }}>
      <TopBar />
      <main className="tzs-main">
        <div className="tzs-mini" style={{ cursor: "default" }}><div><b>{name}'s Pass</b><span>{state === "expired" ? "This pass has ended" : `${days} day${days === 1 ? "" : "s"} left`}</span></div></div>
        <PassCard creatorName={name} holder={tip.fan_name} expiresAt={tip.pass_expires_at} />
        <ul className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px", listStyle: "none", margin: 0, padding: 0 }}>
          {c.pass_perk && <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />{c.pass_perk}</li>}
          <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />A Pass badge next to your name in {name}'s tip list</li>
          <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />No auto-renew. It simply ends on {new Date(tip.pass_expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.</li>
        </ul>
        {tip.fan_message && <div className="tzs-note"><span className="tz-overline">Your message</span><p>“{tip.fan_message}”</p></div>}
        {state !== "active" && <a className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" href={`/@${c.handle}/pass`}>Renew your pass</a>}
        <p className="tz-small tz-muted" style={{ margin: 0 }}>Keep this link private: it's your proof of membership.</p>
        <div className="tzs-foot"><Mark />woven by tezeo</div>
      </main>
    </div>
  );
}
