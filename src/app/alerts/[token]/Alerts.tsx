"use client";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/ui";

interface Alert { id: string; name: string; message: string; isPass: boolean; usdc: number; at: string }
const SAMPLE: Alert = { id: "sample", name: "Ana", message: "Your Solana course got me my first dev job. ¡Gracias!", isPass: false, usdc: 4.72, at: "" };
const SHOW_MS = 7000;

/** OBS Browser Source: transparent page that pops an alert for every confirmed tip. Add ?preview=1 to test the look. */
export function Alerts({ token, name, accent }: { token: string; name: string; accent: string }) {
  const [current, setCurrent] = useState<Alert | null>(null);
  const queue = useRef<Alert[]>([]);
  const seen = useRef(new Set<string>());
  const since = useRef(new Date().toISOString());
  const showing = useRef(false);

  useEffect(() => {
    const preview = new URLSearchParams(location.search).has("preview");
    const next = () => {
      const a = queue.current.shift();
      if (!a) { showing.current = false; setCurrent(null); return; }
      showing.current = true; setCurrent(a);
      setTimeout(() => { setCurrent(null); setTimeout(next, 600); }, SHOW_MS);
    };
    const push = (a: Alert) => { queue.current.push(a); if (!showing.current) next(); };
    if (preview) { const i = setInterval(() => push({ ...SAMPLE, id: String(Math.random()) }), SHOW_MS + 2500); push(SAMPLE); return () => clearInterval(i); }
    const poll = async () => {
      try {
        const r = await fetch(`/api/alerts/${token}?since=${encodeURIComponent(since.current)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j: { now: string; alerts: Alert[] } = await r.json();
        for (const a of j.alerts) { if (!seen.current.has(a.id)) { seen.current.add(a.id); push(a); } since.current = a.at > since.current ? a.at : since.current; }
      } catch { /* keep polling */ }
    };
    const i = setInterval(poll, 4000);
    return () => clearInterval(i);
  }, [token]);

  return (
    <div className="tz-creator" style={{ ["--creator-accent" as string]: accent, minHeight: "100dvh", display: "grid", placeItems: "end center", padding: 24 }}>
      <style>{`html,body{background:transparent !important}`}</style>
      {current && (
        <div className="tz-card tz-card--raised tz-rise is-playing" role="status" aria-live="polite" data-testid="alert"
          style={{ ["--d" as string]: "0ms", maxWidth: 520, width: "100%", display: "grid", gap: 8, borderColor: "var(--creator-accent-fill)", background: "var(--tz-surface)" }}>
          <div className="tz-row"><Mark size={28} /><span className="tz-overline">New tip for {name}</span>{current.isPass && <span className="tz-badge">Pass</span>}</div>
          <p className="tz-display" style={{ fontSize: "var(--tz-text-2xl)", margin: 0 }}>{current.name} · {current.usdc.toFixed(2)} USDC</p>
          {current.message && <p style={{ margin: 0, fontSize: "var(--tz-text-lg)" }}>“{current.message}”</p>}
        </div>
      )}
    </div>
  );
}
