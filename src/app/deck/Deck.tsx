"use client";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { SLIDES } from "./slides";

const W = 1280;
const H = 720;
const N = SLIDES.length;
const PAGE_CSS = "@page{size:1280px 720px;margin:0}";

const clamp = (n: number) => Math.max(0, Math.min(N - 1, n));
/** "#3" → 2. Anything else → null. */
function fromHash(hash: string): number | null {
  const m = /^#(\d+)$/.exec(hash);
  return m ? clamp(Number(m[1]) - 1) : null;
}

type Nav = { i: number; dir: "fwd" | "back" };
function nav(s: Nav, a: { to: number } | { by: number }): Nav {
  const next = clamp("to" in a ? a.to : s.i + a.by);
  return next === s.i ? s : { i: next, dir: next > s.i ? "fwd" : "back" };
}

const KEYS: [string, string][] = [
  ["→  Space  PgDn", "Next slide"],
  ["←  PgUp", "Previous slide"],
  ["Home / End", "First / last slide"],
  ["F", "Fullscreen"],
  ["N", "Speaker notes"],
  ["? / H", "This help"],
];

export default function Deck({ print }: { print: boolean }) {
  const [{ i, dir }, dispatch] = useReducer(nav, { i: 0, dir: "fwd" });
  const [notes, setNotes] = useState(false);
  const [help, setHelp] = useState(false);
  const [scale, setScale] = useState(0);
  const [idle, setIdle] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const started = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((n: number) => dispatch({ to: n }), []);
  const step = useCallback((d: number) => dispatch({ by: d }), []);

  // Theme: page.tsx's boot script sets it before paint; this keeps it set (Strict Mode re-runs effects) and gives
  // the app's own theme back when you leave the deck.
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.dkPrevTheme === undefined) root.dataset.dkPrevTheme = root.dataset.theme ?? "";
    root.dataset.theme = new URLSearchParams(window.location.search).get("theme") === "light" ? "light" : "dark";
    return () => {
      const prev = root.dataset.dkPrevTheme;
      if (prev) root.dataset.theme = prev; else delete root.dataset.theme;
      delete root.dataset.dkPrevTheme;
    };
  }, []);

  // Controls show while the mouse moves, then get out of the way (and so does the cursor).
  useEffect(() => {
    if (print) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 2200); };
    window.addEventListener("mousemove", wake);
    return () => { window.removeEventListener("mousemove", wake); clearTimeout(t); };
  }, [print]);

  // Deep link: #3 opens slide 3; back/forward or a typed hash also works.
  useEffect(() => {
    if (print) return;
    const h = fromHash(window.location.hash);
    if (h !== null) go(h);
    const onHash = () => { const n = fromHash(window.location.hash); if (n !== null) go(n); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go, print]);

  // Keep the hash in sync and move focus to the new slide so screen readers follow along.
  useEffect(() => {
    if (print) return;
    if (!started.current) { started.current = true; return; }
    const want = `#${i + 1}`;
    if (window.location.hash !== want) history.replaceState(null, "", want);
    slideRefs.current[i]?.focus({ preventScroll: true });
  }, [i, print]);

  // Fit the 1280×720 canvas into whatever space the stage has (letterboxed, centred).
  useLayoutEffect(() => {
    if (print) return;
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / W, el.clientHeight / H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [print, notes]);

  const toggleFullscreen = useCallback(() => {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen?.().catch(() => {});
    else d.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (print) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const onButton = t?.tagName === "BUTTON";
      switch (e.key) {
        case "ArrowRight": case "PageDown": step(1); break;
        case " ": if (onButton) return; step(1); break;
        case "ArrowLeft": case "PageUp": step(-1); break;
        case "Home": go(0); break;
        case "End": go(N - 1); break;
        case "f": case "F": toggleFullscreen(); break;
        case "n": case "N": setNotes((x) => !x); break;
        case "?": case "h": case "H": setHelp((x) => !x); break;
        case "Escape": if (!help) return; setHelp(false); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step, toggleFullscreen, help, print]);

  /* ---------- print / PDF: every slide, stacked, one per page ---------- */
  if (print) {
    return (
      <div className="dk-app dk-print">
        <style>{PAGE_CSS}</style>
        {SLIDES.map((s, k) => (
          <section key={s.id} className={`dk-slide dk-slide--${s.id}${s.tone === "weave" ? " dk-slide--weave" : ""}`} aria-label={`Slide ${k + 1} of ${N}: ${s.title}`}>
            <SlideChrome tone={s.tone} />
            {s.body}
          </section>
        ))}
      </div>
    );
  }

  const cur = SLIDES[i];
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    step(e.clientX - r.left < r.width * 0.3 ? -1 : 1);
  };

  return (
    <div className={`dk-app${notes ? " has-notes" : ""}${idle ? " is-idle" : ""}`}>
      <style>{PAGE_CSS}</style>
      <p className="dk-rotate" role="note">Turn your phone sideways for a bigger view. Swipe to change slides.</p>

      <div
        ref={stageRef}
        className="dk-stage"
        onClick={onStageClick}
        onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
        onTouchEnd={(e) => {
          const s = touch.current; touch.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x, dy = t.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); step(dx < 0 ? 1 : -1); }
        }}
      >
        <div className="dk-canvas" style={{ "--dk-scale": scale, visibility: scale ? "visible" : "hidden" } as CSSProperties}>
          {SLIDES.map((s, k) => (
            <section
              key={s.id}
              ref={(el) => { slideRefs.current[k] = el; }}
              className={`dk-slide dk-slide--${s.id}${s.tone === "weave" ? " dk-slide--weave" : ""}`}
              data-active={k === i ? "" : undefined}
              data-dir={dir}
              hidden={k !== i}
              tabIndex={-1}
              aria-roledescription="slide"
              aria-label={`Slide ${k + 1} of ${N}: ${s.title}`}
            >
              <SlideChrome tone={s.tone} />
              {s.body}
            </section>
          ))}
          <div className="dk-progress" aria-hidden="true">
            <span className="dk-progress__track"><span className="dk-progress__fill" style={{ width: `${((i + 1) / N) * 100}%` }} /></span>
            <span className="dk-progress__count">{i + 1} / {N}</span>
          </div>
        </div>
      </div>

      <div className="dk-tools" role="toolbar" aria-label="Deck controls">
        <button type="button" onClick={() => step(-1)} disabled={i === 0} aria-label="Previous slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="dk-tools__count">{i + 1} / {N}</span>
        <button type="button" onClick={() => step(1)} disabled={i === N - 1} aria-label="Next slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <button type="button" onClick={() => setNotes((x) => !x)} aria-pressed={notes} aria-label="Speaker notes (N)">N</button>
        <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen (F)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
        <button type="button" onClick={() => setHelp((x) => !x)} aria-pressed={help} aria-label="Keyboard help (?)">?</button>
      </div>

      {notes && (
        <aside className="dk-notes" aria-label="Speaker notes">
          <div className="dk-notes__head">
            <span className="dk-notes__n">{i + 1} / {N}</span>
            <b>{cur.title}</b>
            {i < N - 1 && <span className="dk-notes__next">Next: {SLIDES[i + 1].title}</span>}
          </div>
          <p className="dk-notes__text">{cur.notes}</p>
        </aside>
      )}

      {help && (
        <div className="dk-help" role="dialog" aria-modal="false" aria-labelledby="dk-help-h">
          <h2 id="dk-help-h">Keys</h2>
          <dl>
            {KEYS.map(([k, d]) => (<div key={k}><dt>{k}</dt><dd>{d}</dd></div>))}
          </dl>
          <p>Click or tap the right side for next, the left side for back. Swipe on touch. <code>?print=1</code> prints every slide.</p>
          <button type="button" className="tz-btn tz-btn--secondary" onClick={() => setHelp(false)}>Close</button>
        </div>
      )}

      <p className="tz-sr-only" aria-live="polite" aria-atomic="true">{`Slide ${i + 1} of ${N}: ${cur.title}`}</p>
    </div>
  );
}

function SlideChrome({ tone }: { tone?: "plain" | "weave" }) {
  return tone === "weave"
    ? <div className="tz-weave dk-selvedge dk-selvedge--full" aria-hidden="true" />
    : <div className="tz-weave tz-weave--slim dk-selvedge" aria-hidden="true" />;
}
