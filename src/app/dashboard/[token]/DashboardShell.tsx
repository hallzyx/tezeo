"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, ThemeToggle } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

type Ctx = { token: string; data: DashboardData; fresh: Set<string>; refresh: () => Promise<void>; share: () => Promise<void>; shared: boolean };
const DashCtx = createContext<Ctx | null>(null);
export const useDashboard = () => { const c = useContext(DashCtx); if (!c) throw new Error("useDashboard outside the shell"); return c; };

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NAV = [
  { key: "", label: "Home", icon: "home" },
  { key: "tips", label: "Tips", icon: "list" },
  { key: "passes", label: "Passes", icon: "pass" },
  { key: "stream", label: "Stream", icon: "stream" },
  { key: "my-page", label: "My page", icon: "brush" },
];

export function DashboardShell({ token, initial, accent, children }: { token: string; initial: DashboardData; accent: string; children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [toasts, setToasts] = useState<{ id: string; text: string; sub?: string }[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [shared, setShared] = useState(false);
  const seen = useRef(new Set(initial.tips.map((t) => t.id)));
  const known = useRef(new Map(initial.tips.map((t) => [t.id, t.status])));
  const pathname = usePathname();
  const router = useRouter();
  const base = `/dashboard/${token}`;
  const here = pathname === base || pathname === base + "/" ? "" : pathname.slice(base.length + 1).split("/")[0];

  const refresh = useCallback(async () => {
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
            const who = t.fanName || "someone kind";
            const toast = t.status === "received"
              ? { id: t.id + t.status, text: `New tip from ${who} · ${money(t.usdc ?? 0)} USDC` }
              : { id: t.id + t.status, text: `A tip from ${who} is on its way`, sub: "It'll show as received in about a minute." };
            setToasts((x) => [...x, toast]);
            setTimeout(() => setToasts((x) => x.filter((y) => y.id !== toast.id)), 6000);
          }
        }
        seen.current.add(t.id); known.current.set(t.id, t.status);
      }
      if (newly.length) { setFresh(new Set(newly)); setTimeout(() => setFresh(new Set()), 1800); }
      setData(next);
    } catch { /* keep the last data */ }
  }, [token]);

  // One poller for every page; paused while the tab is hidden, and it ticks the moment you come back.
  useEffect(() => {
    let i: ReturnType<typeof setInterval> | undefined;
    const start = () => { if (!i) i = setInterval(refresh, 7000); };
    const stop = () => { if (i) { clearInterval(i); i = undefined; } };
    const vis = () => { if (document.visibilityState === "visible") { void refresh(); start(); } else stop(); };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); document.removeEventListener("visibilitychange", vis); };
  }, [refresh]);

  // Old bookmarks used #tips / #passes / #stream on the Home URL. Only on first load (the shell mounts once),
  // so a Home click never gets bounced by a leftover hash.
  useEffect(() => {
    const h = location.hash.replace("#", "");
    if (location.pathname.replace(/\/$/, "") === base && ["tips", "passes", "stream"].includes(h)) router.replace(`${base}/${h}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a client navigation, focus moves to the page heading (not on first load).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    (document.querySelector("main h1") as HTMLElement | null)?.focus({ preventScroll: true });
  }, [pathname]);

  const share = async () => {
    const url = `${location.origin}/@${data.creator.handle}`;
    try { if (navigator.share) return await navigator.share({ url, title: data.creator.displayName }); } catch { return; }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setShared(true); setTimeout(() => setShared(false), 2000);
  };

  const inFlight = data.stats.inFlight;
  const first1 = data.creator.displayName.split(" ")[0];
  const href = (k: string) => (k ? `${base}/${k}` : base);

  return (
    <DashCtx.Provider value={{ token, data, fresh, refresh, share, shared }}>
      <div className="db-app tz-creator" style={{ ["--creator-accent" as string]: accent }}>
        <a className="db-skip" href="#main">Skip to content</a>
        <aside className="db-side" aria-label="Dashboard">
          <div className="tz-weave tz-weave--slim" aria-hidden="true" />
          <a className="db-logo" href="/" aria-label="Tezeo home"><svg viewBox="0 0 240 64" aria-hidden="true"><use href="#tz-mark" width="64" height="64" /><use href="#tz-letters" x="82" y="4" width="154" height="56" /></svg></a>
          <nav className="db-nav" aria-label="Dashboard pages">
            {NAV.map((n) => (
              <Link key={n.key} href={href(n.key)} aria-current={here === n.key ? "page" : undefined}>
                <Icon name={n.icon} />{n.label}
                {n.key === "tips" && inFlight > 0 && <span className="db-nav__count" aria-label={`${inFlight} on its way`}>{inFlight}</span>}
              </Link>
            ))}
          </nav>
          <div className="db-key">
            <b><Icon name="shield" />This link is your key</b>
            Anyone with it can see your tips and change your settings. Keep it private.
            <Link href={`${base}/my-page#key`}>How to keep it safe</Link>
          </div>
        </aside>

        <div className="db-col">
          <header className="db-top">
            <span className="db-top__mark" aria-hidden="true"><svg><use href="#tz-mark" /></svg></span>
            <Link className="db-who" href={`${base}/my-page`} aria-label={`My page: ${data.creator.displayName}, @${data.creator.handle}`}>
              <span className="tz-avatar" aria-hidden="true"><span>{(data.creator.displayName[0] ?? "?").toUpperCase()}</span></span>
              <div><b>{data.creator.displayName}</b><small>@{data.creator.handle}</small></div>
            </Link>
            <div className="db-top__end">
              {inFlight > 0 && <Link className="tz-pill db-live" data-status="converting" href={`${base}/tips`}><span>{inFlight}</span><span className="db-live__words">on its way</span></Link>}
              <ThemeToggle />
              <button className="tz-btn tz-btn--secondary db-sharebtn" type="button" onClick={share}><Icon name="share" /><span className="db-share-label">{shared ? "Link copied" : "Share my page"}</span></button>
            </div>
          </header>
          <main className="db-main" id="main" tabIndex={-1} aria-label={`${first1}'s dashboard`}>
            {children}
            <div className="db-foot"><svg aria-hidden="true"><use href="#tz-mark" /></svg>woven by tezeo · keep this link private</div>
          </main>
        </div>

        <nav className="db-tabbar" aria-label="Dashboard pages">
          {NAV.map((n) => (
            <Link key={n.key} href={href(n.key)} aria-current={here === n.key ? "page" : undefined}>
              <Icon name={n.icon} /><span>{n.label}</span>
              {n.key === "tips" && inFlight > 0 && <b className="db-tabbar__dot" aria-label={`${inFlight} on its way`}>{inFlight}</b>}
            </Link>
          ))}
        </nav>

        <div className="db-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="tz-toast" data-status="converting"><span className="tz-toast__body"><strong>{t.text}</strong>{t.sub}</span><Link className="db-toast__link" href={`${base}/tips`}>See it</Link></div>
          ))}
        </div>
      </div>
    </DashCtx.Provider>
  );
}
