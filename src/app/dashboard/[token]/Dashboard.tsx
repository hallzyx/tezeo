"use client";
import { useEffect, useRef, useState } from "react";
import { Icon, Logo, Mark, ThemeToggle } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

const STATUS_LABEL: Record<string, string> = { converting: "Converting", received: "Received", failed: "Didn't go through", refunded: "Refunded" };
const COLORS = ["#D1245A", "#5B4FE0", "#1A9E8F", "#F2A900", "#7C3AED"];

const fmtDate = (iso: string) => {
  const d = new Date(iso), today = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Dashboard({ token, initial, accent }: { token: string; initial: DashboardData; accent: string }) {
  const [data, setData] = useState(initial);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const seen = useRef(new Set(initial.tips.map((t) => t.id)));
  const known = useRef(new Map(initial.tips.map((t) => [t.id, t.status])));
  const name = data.creator.displayName.split(" ")[0];

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch(`/api/dashboard/${token}`, { cache: "no-store" });
        if (!r.ok) return;
        const next: DashboardData = await r.json();
        const newly: string[] = [];
        for (const t of next.tips) {
          const prev = known.current.get(t.id);
          if (!seen.current.has(t.id) || (prev !== "received" && t.status === "received")) {
            newly.push(t.id);
            if (t.status === "received" || !seen.current.has(t.id)) {
              const text = t.status === "received" ? `New tip from ${t.fanName || "someone kind"} · ${money(t.usdc ?? 0)} USDC` : `A tip from ${t.fanName || "someone kind"} is on its way`;
              setToasts((x) => [...x, { id: t.id + t.status, text }]);
              setTimeout(() => setToasts((x) => x.filter((y) => y.id !== t.id + t.status)), 6000);
            }
          }
          seen.current.add(t.id); known.current.set(t.id, t.status);
        }
        if (newly.length) { setFresh(new Set(newly)); setTimeout(() => setFresh(new Set()), 1500); }
        setData(next);
      } catch { /* keep last data */ }
    };
    const i = setInterval(tick, 7000);
    return () => clearInterval(i);
  }, [token]);

  const share = async () => {
    const url = `${location.origin}/@${data.creator.handle}`;
    try { if (navigator.share) return await navigator.share({ url, title: data.creator.displayName }); } catch { return; }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const s = data.stats;
  return (
    <div className="tzs-dash tz-creator" style={{ ["--creator-accent" as string]: accent }}>
      <aside aria-label="Dashboard navigation">
        <a href="/" aria-label="Tezeo home" style={{ padding: 0, minHeight: 0, margin: "4px 8px 20px" }}><Logo height={28} /></a>
        <a className="on" href="#home" aria-current="page"><Icon name="home" />Home</a>
        <a href="#tips"><Icon name="list" />Tips</a>
        <a href={`/@${data.creator.handle}`}><Icon name="brush" />My page</a>
      </aside>
      <main id="home">
        <div className="tz-row" style={{ flexWrap: "wrap" }}>
          <div><span className="tz-overline">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span><h1 className="tz-h1" style={{ marginTop: 6 }}>{greeting}, {name}</h1></div>
          <span className="tz-spacer" />
          <ThemeToggle />
          <button className="tz-btn tz-btn--secondary" onClick={share}><Icon name="share" />{copied ? "Link copied" : "Share my page"}</button>
        </div>

        <div className="tzs-stats">
          <div className="tz-card tz-stat" style={{ background: "var(--tz-surface-inverse)", color: "var(--tz-text-inverse)", border: 0 }}>
            <span className="tz-overline" style={{ color: "inherit", opacity: 0.7 }}>Received this month</span>
            <span className="tz-stat__value" data-testid="month-total">{money(s.receivedThisMonthUsdc)}<span className="tz-amount__unit" style={{ color: "inherit", opacity: 0.7 }}>USDC</span></span>
          </div>
          <div className="tz-card tz-stat"><span className="tz-overline">Tips this month</span><span className="tz-stat__value">{s.tipsThisMonth}</span></div>
          <div className="tz-card tz-stat"><span className="tz-overline">Active passes</span><span className="tz-stat__value">{s.activePasses}</span></div>
        </div>

        <div className="tz-card" id="tips" style={{ padding: "var(--tz-space-5) var(--tz-space-3) var(--tz-space-3)" }}>
          <div className="tz-row" style={{ padding: "0 var(--tz-space-3) var(--tz-space-4)" }}>
            <h2 className="tz-h2" style={{ fontSize: "var(--tz-text-lg)" }}>Latest tips</h2><span className="tz-spacer" />
            {s.inFlight > 0 && <span className="tz-pill" data-status="converting">{s.inFlight} on its way</span>}
          </div>
          {data.tips.length === 0 ? (
            <div className="tz-empty">
              <p className="tz-empty__title">Your first thread is on its way</p>
              <p className="tz-muted tz-small" style={{ margin: 0 }}>Share your page and the first tip will show up here, live.</p>
              <button className="tz-btn tz-btn--primary" onClick={share}>Copy my link</button>
            </div>
          ) : (
            <table className="tz-table tz-table--stack">
              <thead><tr><th>Fan</th><th>Date</th><th>Paid with</th><th className="num">You got</th><th>Status</th></tr></thead>
              <tbody>
                {data.tips.map((t) => (
                  <tr key={t.id} className={fresh.has(t.id) ? "tzs-newrow" : undefined}>
                    <td><div className="tzs-fan"><span className="tzs-dot" style={{ background: COLORS[(t.fanName.charCodeAt(0) || 0) % COLORS.length] }} aria-hidden="true">{(t.fanName[0] ?? "?").toUpperCase()}</span>
                      <div><b>{t.fanName || "Someone kind"} {t.isPass && <span className="tz-badge">Pass</span>}</b><small>{t.fanMessage ? `“${t.fanMessage.slice(0, 48)}${t.fanMessage.length > 48 ? "…" : ""}”` : "No message"}</small></div></div></td>
                    <td data-col="date" className="tz-muted">{fmtDate(t.createdAt)}</td>
                    <td data-col="chain">{t.originSymbol} · {t.originChain.toUpperCase()}</td>
                    <td data-col="amount" className="num">{t.usdc !== null ? <b>{money(t.usdc)} USDC</b> : "—"}</td>
                    <td data-col="status"><span className="tz-pill" data-status={t.status}>{STATUS_LABEL[t.status] ?? t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="tzs-foot"><Mark />woven by tezeo · keep this link private</div>
      </main>
      <nav className="tzs-tabbar" aria-label="Dashboard">
        <a className="on" href="#home"><Icon name="home" />Home</a><a href="#tips"><Icon name="list" />Tips</a><a href={`/@${data.creator.handle}`}><Icon name="brush" />My page</a>
      </nav>
      <div className="tzs-toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className="tz-toast"><span className="tz-toast__body">{t.text}</span></div>)}</div>
    </div>
  );
}
