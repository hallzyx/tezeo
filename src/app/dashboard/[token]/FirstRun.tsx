"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";

type Flags = { saved?: boolean; shared?: boolean; obs?: boolean; hidden?: boolean };
const key = (h: string, k: string) => `tz-${k}-${h}`;
const read = (h: string): Flags => {
  const f: Flags = {};
  try {
    for (const k of ["saved", "shared", "obs", "hidden"] as const) if (localStorage.getItem(key(h, k))) f[k] = true;
  } catch { /* storage blocked */ }
  return f;
};

/** The "Get your first tip" checklist. Every tick comes from real data or from a flag on this device. */
export function FirstRun({ handle, hasGoal, hasTip, base }: { handle: string; hasGoal: boolean; hasTip: boolean; base: string }) {
  const router = useRouter();
  const [flags, setFlags] = useState<Flags>({});
  const [loaded, setLoaded] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const qr = useRef<HTMLCanvasElement>(null);
  useEffect(() => { setFlags(read(handle)); setOrigin(location.origin); setLoaded(true); }, [handle]);
  const url = `${origin}/@${handle}`;
  useEffect(() => { if (origin && qr.current) QRCode.toCanvas(qr.current, url, { width: 176, margin: 0, color: { dark: "#1C1424", light: "#FFFFFF" } }).catch(() => {}); }, [origin, url, loaded]);
  const set = (k: keyof Flags) => { try { localStorage.setItem(key(handle, k), "1"); } catch { /* ignore */ } setFlags((f) => ({ ...f, [k]: true })); };

  if (!loaded || flags.hidden) return null;
  const tasks = [
    { id: "saved", title: "Save your dashboard link", done: !!flags.saved, text: "It's your only way back in. Download a backup file from the \"You're live\" screen, or bookmark this page.", tag: "" },
    { id: "share", title: "Share your page", done: hasTip || !!flags.shared, text: "Put your link where your fans already are: your bio, your stream, your class slides, your WhatsApp status.", tag: "" },
    { id: "test", title: "Send yourself a $1 test tip", done: hasTip, text: "See exactly what your fans see, and watch it land here.", tag: "Optional" },
    { id: "goal", title: "Set a funding goal", done: hasGoal, text: "Give fans a reason: “New microphone, $300”. It shows on your page with a progress bar.", tag: "" },
    { id: "obs", title: "Add tip alerts to OBS", done: !!flags.obs, text: "A card pops up on your stream for every tip.", tag: "For streamers" },
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const next = tasks.findIndex((t) => !t.done);
  const goTo = (page: string) => router.push(`${base}/${page}`);
  const copy = async () => { try { await navigator.clipboard.writeText(url); } catch { /* visible anyway */ } setCopied(true); set("shared"); setTimeout(() => setCopied(false), 1800); };
  const qrPng = async () => { const a = document.createElement("a"); a.href = await QRCode.toDataURL(url, { width: 1024, margin: 2 }); a.download = `tezeo-${handle}-qr.png`; a.click(); set("shared"); };

  const btns = (id: string) => {
    if (id === "saved" && !tasks[0].done) return <div className="fl-btnrow"><button type="button" className="tz-btn tz-btn--secondary" onClick={() => set("saved")}>I've saved it</button></div>;
    if (id === "test") return <div className="fl-btnrow"><a className="tz-btn tz-btn--secondary" href={`/@${handle}`}>Open my page</a></div>;
    if (id === "goal") return <div className="fl-btnrow"><button type="button" className="tz-btn tz-btn--secondary" onClick={() => goTo("stream")}>Add a goal</button></div>;
    if (id === "obs") return <div className="fl-btnrow"><button type="button" className="tz-btn tz-btn--secondary" onClick={() => goTo("stream")}>Set up alerts</button><button type="button" className="tz-btn tz-btn--ghost" onClick={() => set("obs")}>Mark as done</button></div>;
    return null;
  };

  return (
    <section className="tz-card ob-start" aria-labelledby="ob-start-h" data-testid="first-run">
      <div className="ob-start__head">
        <div className="fl-card-h"><h2 id="ob-start-h">{doneCount === 5 ? "Your page is all set." : "Get your first tip"}</h2><span className="ob-start__count">{doneCount} of 5 done</span></div>
        <div className="ob-thread" aria-hidden="true">{tasks.map((t) => <span key={t.id} className={t.done ? "on" : ""} />)}</div>
      </div>
      <ol className="ob-tasks">
        {tasks.map((t, i) => (
          <li key={t.id} className="ob-task" data-state={t.done ? "done" : i === next ? "next" : "todo"} aria-current={i === next ? "step" : undefined}>
            <span className="ob-task__knot" aria-hidden="true">{t.done && <Icon name="check" className="" />}</span>
            <h3>{t.title}{t.done ? <span className="ob-tag ob-tag--done">Done</span> : t.tag && <span className="ob-tag">{t.tag}</span>}</h3>
            <p>{t.text}</p>
            {t.id === "share" && !t.done && (
              <div className="ob-task__share">
                <div className="tz-qr"><canvas ref={qr} role="img" aria-label={`QR code for tezeo.app/@${handle}`} /></div>
                <div className="ob-task__link"><b>tezeo.app/@{handle}</b><span>Print it, pin it on stream.</span></div>
                <div className="fl-btnrow ob-task__btns">
                  <button type="button" className="tz-btn tz-btn--secondary" onClick={copy}><Icon name={copied ? "check" : "copy"} />{copied ? "Copied" : "Copy link"}</button>
                  <button type="button" className="tz-btn tz-btn--secondary" onClick={qrPng}><Icon name="download" />Download QR</button>
                </div>
              </div>
            )}
            {!t.done && t.id !== "share" && btns(t.id)}
          </li>
        ))}
      </ol>
      <div className="ob-start__foot">
        <button type="button" className="tz-btn tz-btn--ghost" onClick={() => goTo("passes")}>Also: offer a 30-day pass</button>
        <button type="button" className="tz-btn tz-btn--ghost" onClick={() => set("hidden")}>Hide this list</button>
      </div>
    </section>
  );
}

export function BookmarkStrip() {
  const [show, setShow] = useState(false);
  const [mac, setMac] = useState(false);
  useEffect(() => {
    try { setShow(!localStorage.getItem("tz-bookmark-done")); } catch { setShow(true); }
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);
  if (!show) return null;
  return (
    <div className="ob-bookmark" role="note">
      <Icon name="bookmark" />
      <span>Bookmark this page. It's your way back in. <span className="ob-kbd"><kbd>{mac ? "⌘" : "Ctrl"}</kbd> + <kbd>D</kbd></span></span>
      <button type="button" className="tz-btn tz-btn--ghost" onClick={() => { try { localStorage.setItem("tz-bookmark-done", "1"); } catch { /* ignore */ } setShow(false); }}>Got it</button>
    </div>
  );
}
