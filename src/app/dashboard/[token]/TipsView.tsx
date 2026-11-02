"use client";
import { useState } from "react";
import Link from "next/link";
import { useDashboard } from "./DashboardShell";
import { EmptyThread, PageHead, TipsTable, money, useCopy } from "./shared";
import { Icon } from "@/components/ui";

export function TipsView() {
  const { token, data, fresh } = useDashboard();
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copy = useCopy();
  const s = data.stats, n = data.tips.length;
  return (
    <section style={{ display: "grid", gap: "var(--tz-space-5)" }} aria-label="Tips">
      <PageHead title="Tips" actions={s.inFlight > 0 && <span className="tz-pill" data-status="converting">{s.inFlight} on its way</span>}>
        {n > 0 ? <p>{n} tips so far · {money(s.totalUsdc)} USDC received in total, straight to your wallet.</p> : <p>Every tip shows up here as it arrives, with exactly what it cost.</p>}
      </PageHead>
      <div className="tz-card db-tips" id="tips-table">
        {n === 0 ? (
          <EmptyThread title="No tips yet" actions={
            <button type="button" className="tz-btn tz-btn--primary" onClick={async () => { await copy(`${location.origin}/@${data.creator.handle}`); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><Icon name={copied ? "check" : "copy"} />{copied ? "Link copied" : "Copy my link"}</button>
          }>When a fan pays, the tip appears here within seconds: who sent it, their note and what you received.</EmptyThread>
        ) : (
          <>
            <TipsTable tips={data.tips} fresh={fresh} caption="All your tips, newest first" openId={openId} onToggle={(id) => setOpenId(openId === id ? null : id)} />
            <div className="db-tablefoot"><span>Showing all {n} tips. The dashboard keeps your latest 100.</span></div>
          </>
        )}
      </div>
      <Link href={`/dashboard/${token}`} className="db-link" style={{ justifySelf: "start" }}>Back to Home</Link>
    </section>
  );
}
