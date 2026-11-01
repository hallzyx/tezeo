"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Icon, ThemeToggle, Weave } from "@/components/ui";

export type DoneState = { handle: string; dashboardToken: string; walletHasUsdc: boolean | null; name: string; accent: string; avatarUrl: string; wallet: string };

function download(name: string, href: string) {
  const a = document.createElement("a");
  a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

/** "You're live": celebrate, then make sure the private dashboard link is saved somewhere. */
export function Live({ d, onLeave }: { d: DoneState; onLeave: () => void }) {
  const [origin, setOrigin] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [ticked, setTicked] = useState(false);
  const [msg, setMsg] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copiedPage, setCopiedPage] = useState(false);
  const keepRef = useRef<HTMLHeadingElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const first = d.name.split(" ")[0];

  useEffect(() => {
    setOrigin(location.origin);
    setCanShare(typeof navigator.share === "function");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => { try { navigator.vibrate?.(12); } catch { /* ignore */ } keepRef.current?.focus(); }, reduced ? 0 : 1200);
    return () => clearTimeout(t);
  }, []);
  // Until the creator says it's saved, the browser asks before leaving.
  useEffect(() => {
    if (ticked) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    addEventListener("beforeunload", h);
    return () => removeEventListener("beforeunload", h);
  }, [ticked]);

  const pageUrl = `${origin}/@${d.handle}`;
  const dashUrl = `${origin}/dashboard/${d.dashboardToken}`;
  useEffect(() => {
    if (origin && qrRef.current) QRCode.toCanvas(qrRef.current, pageUrl, { width: 208, margin: 0, color: { dark: "#1C1424", light: "#FFFFFF" } }).catch(() => {});
  }, [origin, pageUrl]);

  const done = (k: string) => { setSaved((s) => ({ ...s, [k]: true })); setMsg("Nice. Tick the box below once it's somewhere you'll find it again."); };
  const backup = () => {
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const text = `Tezeo backup for ${d.name} (@${d.handle}), created ${date}\n\nPRIVATE: your dashboard. Anyone with this link can see your tips. Don't share it.\n${dashUrl}\n\nPUBLIC: your page. Share this one.\n${pageUrl}\n\nYour wallet (where tips land): ${d.wallet}\n\nKeep this file somewhere safe, like your notes app or a password manager.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    download(`tezeo-${d.handle}.txt`, url);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    done("backup");
  };
  const copy = async () => { try { await navigator.clipboard.writeText(dashUrl); done("copy"); } catch { setMsg("Your browser blocked copying. Select the link above and copy it by hand."); } };
  const send = async () => {
    try { await navigator.share({ title: "My Tezeo dashboard (private)", text: "My private Tezeo dashboard link. Keep it to yourself.", url: dashUrl }); done("send"); } catch { /* cancelled */ }
  };
  const copyPage = async () => { try { await navigator.clipboard.writeText(pageUrl); setCopiedPage(true); setTimeout(() => setCopiedPage(false), 1800); } catch { /* ignore */ } };
  const sharePage = async () => { try { await navigator.share({ title: d.name, url: pageUrl }); } catch { /* cancelled */ } };
  const qrPng = async () => download(`tezeo-${d.handle}-qr.png`, await QRCode.toDataURL(pageUrl, { width: 1024, margin: 2, color: { dark: "#1C1424", light: "#FFFFFF" } }));

  const act = (k: string, label: string, icon: string, fn: () => void) => (
    <button type="button" className="tz-btn tz-btn--secondary" data-done={saved[k] ? "true" : undefined} onClick={fn}>
      <Icon name={icon} />{label}<small>{saved[k] ? "Done ✓" : ""}</small>
    </button>
  );

  return (
    <div className="ob-page tz-creator" style={{ ["--creator-accent" as string]: d.accent }}>
      <Weave slim />
      <header className="ob-top">
        <a className="ob-logo" href="/" aria-label="Tezeo home"><svg viewBox="0 0 240 64" aria-hidden="true" style={{ ["--pv-t" as string]: "var(--tz-brand)" }}><use href="#tz-mark" width="64" height="64" /><g className="ob-letters"><use href="#tz-letters" x="82" y="4" width="154" height="56" /></g></svg></a>
        <span className="tz-spacer" style={{ flex: 1 }} />
        <ThemeToggle />
      </header>
      <main className="ob-live">
        <div className="ob-moment">
          <div className="tz-knot is-playing">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <rect className="tz-knot__tile" width="64" height="64" rx="16" fill="#D1245A" />
              <path className="tz-knot__thread tz-knot__thread--a" pathLength="80" d="M9.5 19H22c9 0 15.5 6 15.5 14v19.5" fill="none" stroke="#FFC23D" strokeWidth="7.5" strokeLinecap="round" />
              <path className="tz-knot__gap" d="M42 19c-9 0-15.5 6-15.5 14" fill="none" stroke="#D1245A" strokeWidth="13.5" />
              <path className="tz-knot__thread tz-knot__thread--b" pathLength="80" d="M54.5 19H42c-9 0-15.5 6-15.5 14v19.5" fill="none" stroke="#FFF7EC" strokeWidth="7.5" strokeLinecap="round" />
            </svg>
            <div className="tz-burst" aria-hidden="true">
              <i style={{ ["--x" as string]: "-70px", ["--y" as string]: "-50px", ["--r" as string]: "200deg" }} /><i style={{ ["--x" as string]: "70px", ["--y" as string]: "-56px", ["--r" as string]: "-160deg", ["--d" as string]: "40ms" }} />
              <i style={{ ["--x" as string]: "-86px", ["--y" as string]: "10px", ["--r" as string]: "120deg", ["--d" as string]: "80ms" }} /><i style={{ ["--x" as string]: "88px", ["--y" as string]: "6px", ["--r" as string]: "-220deg" }} />
            </div>
          </div>
          <h1 className="tz-display">You're live, {first}!</h1>
          <p>Your page is up at <a href={`/@${d.handle}`}>tezeo.app/@{d.handle}</a>. Share it, and the first tip will show up in your dashboard, live.</p>
        </div>

        <section className="ob-keep" aria-labelledby="keep-h">
          <span className="ob-keep__tag"><Icon name="key" />Shown only once</span>
          <h2 id="keep-h" ref={keepRef} tabIndex={-1}>Save your private dashboard link</h2>
          <p><b>It's your only way back to your tips.</b> There's no password and no email, so if you lose it we can't send it again. Anyone who has it can see your tips, so keep it to yourself.</p>
          <div className="tz-copy"><span className="tz-mono" data-testid="dash-link">{dashUrl}</span></div>
          <div className="ob-keep__actions">
            {act("backup", "Download a backup file", "download", backup)}
            {act("copy", "Copy link", "copy", copy)}
            {canShare && act("send", "Send to myself", "send", send)}
          </div>
          <p className="ob-status" role="status" data-state={msg.startsWith("Nice") ? "ok" : "warn"} style={{ margin: 0 }}>{msg && msg.startsWith("Nice") && <Icon name="check" />}{msg}</p>
          <div className="ob-keep__gate">
            <label className="fl-check"><input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} data-testid="saved-tick" />I've saved it somewhere safe</label>
            <a className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" href={`/dashboard/${d.dashboardToken}`} aria-disabled={!ticked} aria-describedby="keep-why" data-testid="go-dashboard"
              onClick={(e) => { if (!ticked) e.preventDefault(); else onLeave(); }}>Go to my dashboard</a>
            {!ticked && <p className="fl-why-disabled" id="keep-why">Save your link first. It's the only way back in.</p>}
          </div>
        </section>

        <section className="ob-share" aria-labelledby="share-h">
          <div className="ob-share__top">
            <div className="tz-qr"><canvas ref={qrRef} role="img" aria-label={`QR code for tezeo.app/@${d.handle}`} /></div>
            <div className="ob-share__link"><span className="tz-overline" id="share-h">Your public page</span><b>tezeo.app/@{d.handle}</b><span>Put it in your bio, on stream, on your class slides.</span></div>
          </div>
          <div className="fl-btnrow">
            <button type="button" className="tz-btn tz-btn--secondary" onClick={copyPage}><Icon name={copiedPage ? "check" : "copy"} />{copiedPage ? "Copied" : "Copy link"}</button>
            {canShare && <button type="button" className="tz-btn tz-btn--secondary" onClick={sharePage}><Icon name="share" />Share</button>}
            <button type="button" className="tz-btn tz-btn--secondary" onClick={qrPng}><Icon name="download" />QR code</button>
            <a className="tz-btn tz-btn--ghost" href={`/@${d.handle}`}>Open my page</a>
          </div>
        </section>

        {d.walletHasUsdc === false && (
          <div className="ob-note" role="note" data-testid="new-wallet-note">
            <span className="tz-rombo" aria-hidden="true" />
            <b>Good to know: your wallet is new to USDC.</b>
            <p>Solana opens a USDC account for it with your first tip. That costs about $0.25, once, and comes out of that tip. After that, delivery is about $0.01 per tip. Nothing for you to do.</p>
          </div>
        )}
      </main>
    </div>
  );
}
