"use client";
import { useEffect, useState, type ReactNode } from "react";
import { SPRITE_INNER } from "./sprite";

export function Sprite() {
  return <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE_INNER }} />;
}

export function Icon({ name, className = "tzs-icon", size }: { name: string; className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} aria-hidden="true"><use href={`#i-${name}`} /></svg>
  );
}

export function Logo({ height = 30 }: { height?: number }) {
  return (
    <svg className="tzs-logo" viewBox="0 0 240 64" style={{ height, width: "auto" }} role="img" aria-label="Tezeo">
      <use href="#tz-mark" width="64" height="64" /><use href="#tz-letters" x="82" y="4" width="154" height="56" />
    </svg>
  );
}

export function Mark({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} aria-hidden="true"><use href="#tz-mark" /></svg>;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("tz-theme", next); } catch { /* private mode */ }
    setTheme(next);
  };
  return (
    <button type="button" className="tz-btn tz-btn--secondary tz-btn--icon tzs-theme" onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={theme === "dark"}>
      <svg className="tzs-icon" viewBox="0 0 24 24" aria-hidden="true">
        {theme === "dark"
          ? <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          : <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
      </svg>
    </button>
  );
}

export function Avatar({ name, src, small }: { name: string; src?: string; small?: boolean }) {
  return (
    <div className={`tz-avatar${small ? " tz-avatar--sm" : ""}`}>
      {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" /> : <span>{(name[0] ?? "?").toUpperCase()}</span>}
    </div>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="tzs-topbar">
      <a href="/" aria-label="Tezeo home"><Logo /></a>
      <span className="tz-spacer" />
      {children}
      <ThemeToggle />
    </header>
  );
}

export function CopyBox({ value, label = "Copy address", toast = "Address copied" }: { value: string; label?: string; toast?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="tz-copy">
      <span className="tz-mono" style={{ overflowWrap: "anywhere" }} data-testid="copy-value">{value}</span>
      <button type="button" className="tz-btn tz-btn--secondary tz-btn--icon" style={{ minHeight: 40, width: 40 }} aria-label={label}
        onClick={async () => {
          try { await navigator.clipboard.writeText(value); } catch { /* clipboard blocked: the full value stays visible */ }
          setDone(true); setTimeout(() => setDone(false), 1800);
        }}>
        <Icon name={done ? "check" : "copy"} />
      </button>
      <span className="tz-sr-only" role="status">{done ? toast : ""}</span>
    </div>
  );
}

export function Weave({ slim, height }: { slim?: boolean; height?: number }) {
  return <div className={`tz-weave${slim ? " tz-weave--slim" : ""}`} style={height ? ({ "--_h": `${height}px` } as React.CSSProperties) : undefined} aria-hidden="true" />;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="tzs-error" role="alert"><Icon name="x" />{children}</p>;
}
