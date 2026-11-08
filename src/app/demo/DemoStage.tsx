"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

interface Alert { id: string; name: string; message: string; isPass: boolean; usdc: number; sample?: boolean }
type Row = { id: string; kind: "msg"; user: string; color: string; text: string; bot?: boolean }
  | { id: string; kind: "tip"; name: string; usdc: number; note: string; sample?: boolean };

const SHOW_MS = 7000;
const SAMPLE: Alert = { id: "sample", name: "Ana", message: "Your Solana course got me my first dev job. ¡Gracias!", isPass: false, usdc: 4.72, sample: true };
const SEED: Row[] = [
  { id: "s1", kind: "msg", user: "pixel_moth", color: "#F2B880", text: "day 12 already?" },
  { id: "s2", kind: "msg", user: "lucho.dev", color: "#A9C1FF", text: "which RPC are you on" },
  { id: "s3", kind: "msg", user: "nina_k", color: "#E6A3C8", text: "the tip jar looks so clean" },
  { id: "s4", kind: "msg", user: "sol_sprout", color: "#B7E07A", text: "!tip" },
  { id: "s5", kind: "msg", user: "stagebot", color: "#ECEDEF", text: "Tip Vale in any coin: tap Send a tip in the pinned card.", bot: true },
];
const REACT: [string, string, (n: string) => string][] = [
  ["nina_k", "#E6A3C8", () => "that was fast"], ["lucho.dev", "#A9C1FF", () => "ok I need this for my stream"], ["pixel_moth", "#F2B880", (n) => `GG ${n}`],
];
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function DemoStage({ handle, name, accent, mode, goal, qrSvg }: {
  handle: string; name: string; accent: string; mode: "live" | "simulated";
  goal: { title: string; target: number; raised: number }; qrSvg: string;
}) {
  const first = name.split(" ")[0];
  const [rehearse, setRehearse] = useState(false);
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [hint, setHint] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [away, setAway] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [raised, setRaised] = useState(goal.raised);
  const [announce, setAnnounce] = useState("");
  const [done, setDone] = useState(false);
  const [nudge, setNudge] = useState(true);
  const player = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLOListElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const queue = useRef<Alert[]>([]);
  const seen = useRef(new Set<string>());
  const since = useRef(new Date().toISOString());
  const showing = useRef(false);
  const openRef = useRef(false);
  const pageUrl = `/@${handle}`;

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setRehearse(q.has("rehearse"));
    // The embedded tip page shares this origin, so it picks up the stage's dark theme.
    try { localStorage.setItem("tz-theme", q.get("theme") === "light" ? "light" : "dark"); } catch { /* storage blocked */ }
  }, []);
  useEffect(() => { const t = setTimeout(() => setNudge(false), 7000); return () => clearTimeout(t); }, []);

  // OBS-style canvas: everything on the video is laid out at 640x360 and scaled to the player width.
  useEffect(() => {
    const el = player.current; if (!el) return;
    const fit = () => el.style.setProperty("--ds-k", String(el.clientWidth / 640));
    const ro = new ResizeObserver(fit); ro.observe(el); fit();
    return () => ro.disconnect();
  }, []);

  const pushRows = useCallback((a: Alert) => {
    setRows((r) => [...r, { id: `t-${a.id}-${Date.now()}`, kind: "tip", name: a.name, usdc: a.usdc, note: a.message, sample: a.sample }]);
    REACT.forEach(([u, c, f], i) => setTimeout(() => setRows((r) => [...r, { id: `r-${a.id}-${i}-${Date.now()}`, kind: "msg", user: u, color: c, text: f(a.name) }]), 1200 * (i + 1)));
  }, []);
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" }); }, [rows]);

  // The payoff: one feed drives the alert on the video, the chat row, the goal bar and the sheet header.
  const next = useCallback(() => {
    const a = queue.current.shift();
    if (!a) { showing.current = false; setAlert(null); return; }
    if (document.hidden) { queue.current.unshift(a); showing.current = false; return; } // play it when the viewer comes back
    showing.current = true; setAlert(a); setAway(false);
    pushRows(a); if (!a.sample) setRaised((v) => Math.round((v + a.usdc) * 100) / 100);
    setAnnounce(`${a.name}'s tip of ${money(a.usdc)} USDC is on stream now.`);
    if (openRef.current) setDone(true);
    setTimeout(() => { setAlert(null); setTimeout(next, 600); }, SHOW_MS);
  }, [pushRows]);
  const push = useCallback((a: Alert) => { queue.current.push(a); if (!showing.current) next(); }, [next]);
  useEffect(() => {
    const vis = () => { if (!document.hidden && !showing.current) next(); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [next]);

  useEffect(() => {
    if (rehearse) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/demo/alerts?since=${encodeURIComponent(since.current)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j: { alerts: (Alert & { at: string })[] } = await r.json();
        for (const a of j.alerts) { if (!seen.current.has(a.id)) { seen.current.add(a.id); push(a); } if (a.at > since.current) since.current = a.at; }
      } catch { /* keep polling */ }
    };
    const i = setInterval(poll, 3000);
    return () => clearInterval(i);
  }, [rehearse, push]);

  // Sheet: open, close, Esc, focus.
  const openSheet = () => {
    setOpen(true); setDone(false); setNudge(false); setBlocked(false); setHint(false);
    if (!src) { setSrc(pageUrl); setLoading(true); setSlow(false); }
    setTimeout(() => titleRef.current?.focus(), 50);
  };
  const closeSheet = useCallback(() => { setOpen(false); setTimeout(() => btnRef.current?.focus(), 0); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && openRef.current) closeSheet(); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [closeSheet]);

  // Loading, slow, blocked.
  useEffect(() => {
    if (!loading) return;
    const t1 = setTimeout(() => setSlow(true), 8000);
    const t2 = setTimeout(() => { setLoading(false); setBlocked(true); }, 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);
  const onFrameLoad = () => {
    setLoading(false);
    try {
      const w = frame.current?.contentWindow as (Window & { ethereum?: unknown }) | null;
      if (!w || !frame.current?.contentDocument || w.location.href === "about:blank") { setBlocked(true); return; }
      setTimeout(() => { if ((window as Window & { ethereum?: unknown }).ethereum && !w.ethereum) setHint(true); }, 1500);
    } catch { setBlocked(true); }
  };
  const goAway = () => { setOpen(false); setAway(true); setTimeout(() => setAway(false), 30 * 60_000); };

  const pct = goal.target ? Math.min(100, Math.round((raised / goal.target) * 100)) : 0;
  const strip = rehearse ? <><b>Rehearsal.</b> Not a real stream. The alert is a sample, no payment.</>
    : mode === "simulated" ? <><b>Demo stage.</b> Not a real stream. Payments are simulated, no real money moves.</>
    : <><b>Demo stage.</b> Not a real stream. Tips sent here are real.</>;

  return (
    <div className="ds-stage tz-creator" style={{ ["--creator-accent" as string]: accent, position: "relative" }}>
      <p className="ds-strip" role="note" data-mode={rehearse ? "rehearse" : mode === "simulated" ? "sim" : "live"}><Icon name="info" />{" "}<span>{strip}</span></p>

      <header className="ds-top">
        <span className="ds-top__brand"><span className="ds-top__glyph" aria-hidden="true"><Icon name="stage" /></span>Demo stage</span>
        <span className="ds-top__tag">Mock livestream · sample viewers and chat</span>
        <span className="tz-spacer" />
        <a className="ds-top__link" href={pageUrl} target="_blank" rel="noopener noreferrer">Open {first}&apos;s real tip page <Icon name="open" /></a>
      </header>

      <div className="ds-main">
        <section className="ds-watch" aria-label="Mock stream">
          <div className="ds-player" ref={player}>
            <div className="ds-canvas" aria-hidden="true">
              <div className="ds-scene" />
              <div className="ds-editor">
                <div className="ds-editor__bar"><i /><i /><i /><span>tip-jar/src/route.ts</span></div>
                <div className="ds-code">
                  <i className="k" style={{ ["--w" as string]: "22%" }} /><i style={{ ["--w" as string]: "58%", ["--x" as string]: "6%" }} /><i className="s" style={{ ["--w" as string]: "40%", ["--x" as string]: "6%" }} />
                  <i style={{ ["--w" as string]: "66%", ["--x" as string]: "12%" }} /><i className="n" style={{ ["--w" as string]: "30%", ["--x" as string]: "12%" }} /><i style={{ ["--w" as string]: "48%", ["--x" as string]: "12%" }} />
                  <i className="p" style={{ ["--w" as string]: "18%", ["--x" as string]: "6%" }} /><i style={{ ["--w" as string]: "0" }} /><i className="k" style={{ ["--w" as string]: "26%" }} />
                  <i style={{ ["--w" as string]: "72%", ["--x" as string]: "6%" }} /><i className="s" style={{ ["--w" as string]: "52%", ["--x" as string]: "12%" }} /><i style={{ ["--w" as string]: "38%", ["--x" as string]: "12%" }} />
                  <i className="n" style={{ ["--w" as string]: "44%", ["--x" as string]: "6%" }} /><i style={{ ["--w" as string]: "60%", ["--x" as string]: "6%" }} /><i className="p" style={{ ["--w" as string]: "14%" }} />
                </div>
              </div>
              <div className="ds-cam"><span>{name[0]?.toUpperCase()}</span><small>camera placeholder</small></div>

              {goal.target > 0 && (
                <div className="ds-ov-goal">
                  <div className="ds-ov-goal__row"><span>Goal · {goal.title || "funding goal"}</span><b>{pct}%</b></div>
                  <div className="ds-ov-goal__bar"><i style={{ ["--pct" as string]: `${pct}%` }} /></div>
                  <small>${money(raised)} of ${goal.target}</small>
                </div>
              )}
              <div className="ds-ov-tag">
                <span className="ds-qrmini" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <span><b>Tip me in any crypto</b><span>tezeo.app/@{handle}</span></span>
              </div>

              {alert && (
                <div className="ds-ov-alert" data-testid="stage-alert">
                  <div className="tz-card tz-card--raised tz-rise is-playing" style={{ ["--d" as string]: "0ms" }}>
                    <div className="tz-row"><svg width="28" height="28" aria-hidden="true"><use href="#tz-mark" /></svg><span className="tz-overline">New tip for {first}</span>
                      {alert.isPass && <span className="tz-badge">Pass</span>}{alert.sample && <span className="tz-badge">Sample</span>}</div>
                    <p className="tz-display" style={{ fontSize: "var(--tz-text-2xl)", margin: 0 }}>{alert.name} · {money(alert.usdc)} USDC</p>
                    {alert.message && <p style={{ margin: 0, fontSize: "var(--tz-text-lg)" }}>“{alert.message}”</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="ds-chrome" aria-hidden="true">
              <div className="ds-live"><b>LIVE</b><span>1.2K · sample</span></div>
              <div className="ds-controls"><Icon name="play" /><Icon name="vol" /><span className="tz-spacer" /><Icon name="full" /></div>
            </div>
          </div>

          <div className="ds-channel">
            <span className="ds-avatar" aria-hidden="true">{name[0]?.toUpperCase()}</span>
            <p className="ds-channel__name">{first}&apos;s Workshop <span>{name} · @{handle}</span></p>
            <p className="ds-channel__title">Building a tip jar on Solana, live · day 12</p>
            <p className="ds-channel__meta">Software &amp; dev · 1,204 watching (sample numbers)</p>
          </div>

          <div className="ds-panels">
            <div className="ds-panel"><h3>About this stage</h3><p>A mock stream made to show Tezeo. The video, viewers and chat are samples. The tip page and the alert are real.</p></div>
            <div className="ds-panel"><h3>What&apos;s on the video</h3><p>The goal bar, the &quot;Tip me&quot; tag and the tip alert are the overlays a streamer adds in OBS with Tezeo.</p></div>
            <div className="ds-panel"><h3>Tip from another device</h3><p>Scan the tag on the video. Your alert still pops here.</p></div>
          </div>
        </section>

        <aside className="ds-side" aria-label="Chat">
          <div className={`ds-pin${nudge ? " ds-nudge" : ""}`} inert={open}>
            <p className="ds-pin__label"><Icon name="pin" />Pinned by {first}</p>
            <div className="ds-pincard" data-state={away ? "away" : undefined}>
              <span className="tz-weave tz-weave--slim" aria-hidden="true" />
              <svg className="ds-pincard__mark" aria-hidden="true"><use href="#tz-mark" /></svg>
              <div><p className="ds-pincard__t">Tip {first} in any crypto</p><p className="ds-pincard__s">Any coin, any chain. {first} gets dollars.</p></div>
              {!away && <button type="button" ref={btnRef} className="tz-btn tz-btn--primary" data-testid="send-tip" aria-haspopup="dialog" aria-controls="sheet" onClick={openSheet}><Icon name="heart" />Send a tip</button>}
              {away && (
                <div className="ds-pincard__away"><span className="tz-pill" data-status="pending">Waiting for your tip</span>
                  <span className="tz-small tz-muted">Paying in another tab. Your alert pops here when it lands.</span></div>
              )}
            </div>
            {rehearse && <button type="button" className="tz-btn tz-btn--secondary" style={{ marginTop: 8 }} onClick={() => push({ ...SAMPLE, id: `sample-${Date.now()}` })}>Play a sample tip</button>}
          </div>

          <div className="ds-chat__head">Chat <span>Sample messages</span></div>
          <ol className="ds-chat" ref={chat} aria-label="Chat messages (sample)" inert={open}>
            {rows.map((r) => r.kind === "tip" ? (
              <li key={r.id} className="ds-tiprow">
                <span className="ds-tiprow__head"><svg aria-hidden="true"><use href="#tz-mark" /></svg><span><strong>{r.name}</strong> tipped <span className="ds-tiprow__amt">{money(r.usdc)} USDC</span> with Tezeo</span>{r.sample && <span className="tz-badge">Sample</span>}</span>
                {r.note && <q>{r.note}</q>}
              </li>
            ) : (
              <li key={r.id} className="ds-msg">{r.bot && <span className="ds-bot">Bot</span>}<b style={{ ["--ds-u" as string]: r.color }}>{r.user}</b> {r.text}</li>
            ))}
          </ol>
          <div className="ds-chatbar"><label className="tz-sr-only" htmlFor="chat-in">Chat (sample, disabled)</label><input id="chat-in" disabled placeholder="Chat is a sample on this demo stage" /></div>

          <div className="ds-sheet" id="sheet" role="dialog" aria-modal="false" aria-labelledby="sheet-title" hidden={!open}>
            <div className="ds-sheet__head">
              <svg className="ds-mk" aria-hidden="true"><use href="#tz-mark" /></svg>
              <div>
                <h2 className="ds-sheet__title" id="sheet-title" tabIndex={-1} ref={titleRef}>Tip {first}</h2>
                <p className="ds-sheet__sub"><Icon name="shield" /><span>Tezeo&apos;s real tip page · tezeo.app/@{handle}</span></p>
              </div>
              <a className="ds-iconbtn" href={pageUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the tip page full screen, in a new tab" title="Open full screen" onClick={goAway}><Icon name="open" /></a>
              <button type="button" className="ds-iconbtn" aria-label="Close and go back to the stream" title="Back to the stream" onClick={closeSheet}><Icon name="close" /></button>
              {done && (
                <div className="ds-sheet__done"><span className="tz-pill" data-status="received">Delivered · it&apos;s on stream</span>
                  <button type="button" className="tz-btn tz-btn--secondary" onClick={closeSheet}>Back to the stream</button></div>
              )}
            </div>
            {hint && <p className="ds-hint"><Icon name="wallet" /><span>Your wallet can&apos;t reach this panel. <a href={pageUrl} target="_blank" rel="noopener noreferrer" onClick={goAway}>Open full screen</a> or pay by hand below.</span></p>}
            <div className="ds-sheet__body">
              {src && <iframe ref={frame} className="ds-frame" src={src} title={`Tip ${first} with Tezeo`} allow="clipboard-write; web-share" onLoad={onFrameLoad} />}
              {loading && (
                <div className="ds-loading">
                  <div className="ds-loading__dots" aria-hidden="true"><i className="tz-rombo" /><i className="tz-rombo" /><i className="tz-rombo" /></div>
                  <p role="status">Opening {first}&apos;s tip page…</p>
                  {slow && <p>Slow connection? <a href={pageUrl} target="_blank" rel="noopener noreferrer" onClick={goAway}>Open it full screen</a></p>}
                </div>
              )}
              {blocked && (
                <div className="ds-fallback">
                  <div className="tz-card">
                    <span className="ds-fallback__icon" aria-hidden="true"><Icon name="wallet" /></span>
                    <h3 className="tz-h2">Your wallet works best full screen</h3>
                    <p>Some wallets can&apos;t reach a page inside a panel. Open {first}&apos;s tip page on its own, pay there, then come back. The alert will still pop on this stream.</p>
                    <ol><li>Open the tip page and pay as usual.</li><li>Come back to this tab when you see &quot;You just made {first}&apos;s day.&quot;</li><li>Watch your tip land on stream.</li></ol>
                    <a className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" href={pageUrl} target="_blank" rel="noopener noreferrer" onClick={goAway}><Icon name="open" />Open the tip page</a>
                    <button type="button" className="tz-btn tz-btn--ghost tz-btn--block" onClick={() => setBlocked(false)}>Stay here and pay by hand (QR)</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      <p className="ds-announcer" aria-live="polite">{announce}</p>
    </div>
  );
}
