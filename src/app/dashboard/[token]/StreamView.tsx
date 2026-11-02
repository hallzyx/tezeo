"use client";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { useDashboard } from "./DashboardShell";
import { PageHead, useCopy, useOrigin } from "./shared";

export function StreamView() {
  const { token, data, refresh } = useDashboard();
  const { goal, alertToken, creator } = data;
  const [title, setTitle] = useState(goal.title);
  const [target, setTarget] = useState(goal.targetUsd ? String(goal.targetUsd) : "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const copy = useCopy();
  const origin = useOrigin();
  const url = `${origin}/alerts/${alertToken}`;
  const first = creator.displayName.split(" ")[0];

  async function save(t: string, targetUsd: number) {
    setMsg(null);
    const r = await fetch(`/api/dashboard/${token}/goal`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: t, targetUsd }) });
    const j = await r.json();
    setMsg(r.ok ? { ok: true, text: targetUsd ? "Goal saved. It shows on your page and counts tips from now on." : "Goal removed." } : { ok: false, text: j.error ?? "Could not save." });
    if (r.ok) await refresh();
    return r.ok;
  }
  const g = goal.progress;

  return (
    <section style={{ display: "grid", gap: "var(--tz-space-5)" }} aria-label="Stream">
      <PageHead title="Stream"><p>Show a card on your stream for every tip, and a goal your fans can push together.</p></PageHead>
      <div className="db-two">
        <div className="tz-card db-card">
          <div className="db-card-h"><Icon name="stream" /><h2>Tip alerts for OBS</h2></div>
          <ol className="fl-howto db-steps">
            <li><b>Copy your alert link.</b> It&apos;s separate from this dashboard link, but keep it private too.
              <div className="tz-copy"><span className="tz-mono" data-testid="alert-url">{url}</span>
                <button className="tz-btn tz-btn--secondary db-copybtn" type="button" aria-label="Copy alert link" onClick={async () => { await copy(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><Icon name={copied ? "check" : "copy"} /></button></div></li>
            <li><b>In OBS, add a Browser Source</b> and paste the link. The background is transparent and the card sits at the bottom centre.</li>
            <li><b>That&apos;s it.</b> A card pops up for every confirmed tip, even when this dashboard is closed.</li>
          </ol>
          <div className="db-stage" role="img" aria-label={`Example of a tip alert on your stream: New tip for ${first}, Ana, 4.72 USDC, with her note.`}>
            <span className="db-stage__tag">Your stream</span>
            <div className="tz-card tz-card--raised" aria-hidden="true">
              <div className="tz-row"><svg width="28" height="28"><use href="#tz-mark" /></svg><span className="tz-overline">New tip for {first}</span></div>
              <p className="tz-display">Ana · 4.72 USDC</p>
              <p>“Your Solana course got me my first dev job. ¡Gracias!”</p>
            </div>
          </div>
          <div className="db-btnrow">
            <a className="tz-btn tz-btn--secondary" href={`/alerts/${alertToken}?preview=1`} target="_blank" rel="noopener noreferrer"><Icon name="external" />Preview the alert</a>
            <span className="db-hint">Opens the alert page with a sample tip every few seconds.</span>
          </div>
        </div>

        <form className="tz-card db-card db-form" onSubmit={async (e) => { e.preventDefault(); await save(title, Number(target || 0)); }}>
          <div className="db-card-h"><Icon name="target" /><h2>Funding goal</h2></div>
          {g && (
            <div className="fl-goal" style={{ padding: 0, border: 0 }}>
              <div className="fl-goal__top"><b>{goal.title}</b><span>{g.pct}%</span></div>
              <div className="fl-goal__bar" role="progressbar" aria-label="Goal progress" aria-valuenow={g.pct} aria-valuemin={0} aria-valuemax={100}><span style={{ ["--_p" as string]: `${g.pct}%` }} /></div>
              <small>${g.raisedUsd} of ${g.targetUsd} raised since you set it</small>
            </div>
          )}
          <div className="db-fields db-fields--goal">
            <div className="tz-field"><label className="tz-label" htmlFor="gt">Goal name</label><input id="gt" className="tz-input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New microphone" /></div>
            <div className="tz-field"><label className="tz-label" htmlFor="ga">Target</label><div className="db-money"><input id="ga" className="tz-input" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, "").slice(0, 6))} aria-describedby="ga-h" /></div></div>
          </div>
          <p className="tz-hint" id="ga-h" style={{ margin: 0 }}>It shows on your page. Only tips received after you save count.</p>
          <div className="db-form__end">
            <button className="tz-btn tz-btn--primary">Save goal</button>
            {goal.targetUsd > 0 && <button type="button" className="tz-btn tz-btn--ghost" onClick={async () => { if (await save("", 0)) { setTitle(""); setTarget(""); } }}>Remove goal</button>}
          </div>
          {msg && <p className="db-status" role="status" data-tone={msg.ok ? undefined : "error"}><Icon name={msg.ok ? "check" : "x"} />{msg.text}</p>}
        </form>
      </div>
    </section>
  );
}
