"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useDashboard } from "./DashboardShell";
import { BookmarkStrip, FirstRun } from "./FirstRun";
import { QrCanvas, TipsTable, money, useCopy, useOrigin } from "./shared";

export function OverviewView() {
  const { token, data, fresh, share, shared } = useDashboard();
  const copy = useCopy();
  const origin = useOrigin();
  const base = `/dashboard/${token}`;

  const s = data.stats, first = data.creator.displayName.split(" ")[0];
  const firstRun = data.tips.length === 0 && s.receivedThisMonthUsdc === 0;
  const hour = new Date().getHours();
  const greeting = firstRun ? "Welcome" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const url = `${origin}/@${data.creator.handle}`;
  const g = data.goal.progress;
  const activeEnds = data.passes.filter((p) => p.active).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  const endsFirst = activeEnds[0];

  return (
    <section style={{ display: "grid", gap: "var(--tz-space-5)" }} aria-label="Home">
      <div className="db-head">
        <div>
          <span className="tz-overline">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          <h1 className="tz-h1" tabIndex={-1}>{greeting}, {first}</h1>
        </div>
      </div>

      {firstRun && <BookmarkStrip />}

      {!firstRun && (
        <div className="db-stats">
          <Link className="tz-card tz-stat db-stat db-stat--hero" href={`${base}/tips`}>
            <span className="tz-overline">Received this month</span>
            <span className="tz-stat__value" data-testid="month-total">{money(s.receivedThisMonthUsdc)}<span className="tz-amount__unit">USDC</span></span>
            <small>{money(s.totalUsdc)} USDC all time · already in your wallet</small>
            <div className="tz-weave tz-weave--slim" aria-hidden="true" />
          </Link>
          <Link className="tz-card tz-stat db-stat" href={`${base}/tips`}><Icon name="arrow" className="db-stat__go" />
            <span className="tz-overline">Tips this month</span><span className="tz-stat__value">{s.tipsThisMonth}</span><small>See every tip</small></Link>
          <Link className="tz-card tz-stat db-stat" href={`${base}/passes`}><Icon name="arrow" className="db-stat__go" />
            <span className="tz-overline">Active passes</span><span className="tz-stat__value">{s.activePasses}</span>
            <small>{data.pass.enabled ? `$${data.pass.priceUsd} · 30 days` : "Your pass is off"}</small></Link>
        </div>
      )}

      {firstRun && <FirstRun handle={data.creator.handle} hasGoal={data.goal.targetUsd > 0} hasTip={data.tips.length > 0} base={base} />}

      <div className="db-cols">
        <div style={{ display: "grid", gap: "var(--tz-space-4)", alignContent: "start", minWidth: 0 }}>
          <div className="tz-card db-tips">
            <div className="db-card-h"><h2>Latest tips</h2>
              <span className="db-card-h__end">{s.inFlight > 0 && <Link className="tz-pill db-live" data-status="converting" href={`${base}/tips`}>{s.inFlight} on its way</Link>}</span></div>
            {data.tips.length === 0 ? (
              <div className="ob-empty">
                <svg className="ob-loose" viewBox="0 0 140 56" aria-hidden="true" fill="none" strokeWidth="5" strokeLinecap="round">
                  <path d="M6 40c26 0 30-26 56-26s24 22 44 22" stroke="currentColor" /><path d="M110 36c10 0 18-2 26-8" stroke="var(--tz-gold)" />
                </svg>
                <p className="ob-empty__title">Your first thread is on its way</p>
                <p>Share your page and the first tip will show up here, live. No need to refresh.</p>
                <span className="ob-listen"><span className="tz-rombo" aria-hidden="true" />Listening for tips</span>
              </div>
            ) : (
              <>
                <TipsTable tips={data.tips.slice(0, 5)} fresh={fresh} caption="Your 5 latest tips" />
                <div className="db-tablefoot"><span>Your {Math.min(5, data.tips.length)} latest tips</span>
                  <Link className="db-link" href={`${base}/tips`}><span>See all {data.tips.length} tips</span><Icon name="arrow" /></Link></div>
              </>
            )}
          </div>
          {data.walletHasUsdc === false && (
            <div className="ob-dash-note" role="note" data-testid="new-wallet-note">
              <span className="tz-rombo" aria-hidden="true" />
              <span><b>New wallet.</b> Your first tip pays a one-time set-up of about $0.25.</span>
              <details><summary>Why?</summary><p>Solana needs a USDC account for your wallet before dollars can land, and opening it costs about $0.25. It comes out of your first tip, once. After that, delivery is about $0.01 per tip.</p></details>
            </div>
          )}
        </div>

        <aside className="db-rail" aria-label="Your other pages">
          <div className="tz-card db-door">
            <div className="db-card-h"><Icon name="target" /><h2>Funding goal</h2></div>
            {g ? (
              <div className="fl-goal">
                <div className="fl-goal__top"><b>{data.goal.title}</b><span>{g.pct}%</span></div>
                <div className="fl-goal__bar" role="progressbar" aria-label="Goal progress" aria-valuenow={g.pct} aria-valuemin={0} aria-valuemax={100}><span style={{ ["--_p" as string]: `${g.pct}%` }} /></div>
                <small>${g.raisedUsd} of ${g.targetUsd} raised</small>
              </div>
            ) : <p className="db-quiet">No goal yet. A goal adds a progress bar to your page, and fans love to push it.</p>}
            <Link className="db-link" href={`${base}/stream`}><span>{g ? "Edit goal" : "Set a goal"}</span><Icon name="arrow" /></Link>
          </div>
          <div className="tz-card db-door">
            <div className="db-card-h"><Icon name="pass" /><h2>Membership pass</h2><span className="db-card-h__end"><span className="db-onoff" data-on={data.pass.enabled ? "" : undefined}>{data.pass.enabled ? "On" : "Off"}</span></span></div>
            {data.pass.enabled ? (
              <>
                <div className="db-door__fact"><b>{s.activePasses}</b><span>{s.activePasses === 1 ? "member" : "members"} · ${data.pass.priceUsd} for 30 days</span></div>
                {endsFirst && <p className="db-quiet">{endsFirst.fanName || "Someone kind"}&apos;s pass ends first, on {new Date(endsFirst.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</p>}
              </>
            ) : <p className="db-quiet">Offer fans 30 days in your crew for a one-time price.</p>}
            <Link className="db-link" href={`${base}/passes`}><span>{data.pass.enabled ? "Manage passes" : "Turn on a pass"}</span><Icon name="arrow" /></Link>
          </div>
          <div className="tz-card db-door">
            <div className="db-card-h"><Icon name="brush" /><h2>Your page</h2></div>
            <div className="db-sharecard">
              <div className="tz-qr"><QrCanvas value={url} size={84} label={`QR code for tezeo.app/@${data.creator.handle}`} /></div>
              <div><b>Scan to tip {first}</b><span className="tz-mono">tezeo.app/@{data.creator.handle}</span></div>
            </div>
            <div className="db-btnrow">
              <button type="button" className="tz-btn tz-btn--secondary" onClick={() => copy(url)}><Icon name="copy" />Copy link</button>
              <button type="button" className="tz-btn tz-btn--ghost" onClick={share}>{shared ? "Copied" : "Share"}</button>
            </div>
            <Link className="db-link" href={`${base}/my-page`}>Share, copy or print it<Icon name="arrow" /></Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
