"use client";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { useDashboard } from "./DashboardShell";
import { PageHead } from "./shared";

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5));

export function PassesView() {
  const { token, data, refresh } = useDashboard();
  const { pass, passes, creator } = data;
  const [enabled, setEnabled] = useState(pass.enabled);
  const [price, setPrice] = useState(String(pass.priceUsd));
  const [perk, setPerk] = useState(pass.perk);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const first = creator.displayName.split(" ")[0];
  const sorted = [...passes].sort((a, b) => (a.active === b.active ? a.expiresAt.localeCompare(b.expiresAt) : a.active ? -1 : 1));
  const activeCount = passes.filter((p) => p.active).length;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/dashboard/${token}/pass`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled, priceUsd: Number(price), perk }) });
      const j = await r.json();
      setMsg(r.ok ? { ok: true, text: enabled ? `Saved. Your pass is live at /@${creator.handle}/pass` : "Saved. The pass is off. Current members keep their pass until it ends." } : { ok: false, text: j.error ?? "Could not save." });
      if (r.ok) await refresh();
    } finally { setBusy(false); }
  }

  return (
    <section style={{ display: "grid", gap: "var(--tz-space-5)" }} aria-label="Passes">
      <PageHead title="Passes" actions={pass.enabled && <a className="tz-btn tz-btn--ghost" href={`/@${creator.handle}/pass`} target="_blank" rel="noopener noreferrer">See the pass page<Icon name="external" /></a>}>
        <p>A Membership Pass gives a fan 30 days in your crew for one payment. No auto-renew: it simply ends.</p>
      </PageHead>
      <div className="db-two">
        <form className="tz-card db-card db-form" onSubmit={save}>
          <div className="db-card-h"><h2>Pass settings</h2></div>
          <label className="db-switch"><input type="checkbox" role="switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /><span>Offer a 30-day pass on my page<small>Fans see it under your tip amounts.</small></span></label>
          <div className="db-fields">
            <div className="tz-field"><label className="tz-label" htmlFor="pp">Price</label>
              <div className="db-money"><input id="pp" className="tz-input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-describedby="pp-h" /></div></div>
            <div className="tz-field"><label className="tz-label" htmlFor="perk">What members get</label>
              <input id="perk" className="tz-input" maxLength={140} value={perk} onChange={(e) => setPerk(e.target.value)} placeholder="e.g. Early access to every new class" /></div>
          </div>
          <p className="tz-hint" id="pp-h" style={{ margin: 0 }}>Paid once, in dollars. You receive the full price in USDC; the fan&apos;s quote is sized to cover the fees.</p>
          <div className="db-form__end">
            <button className="tz-btn tz-btn--primary" disabled={busy}>{busy ? "Saving…" : "Save pass"}</button>
            {msg && <p className="db-status" role="status" data-tone={msg.ok ? undefined : "error"}><Icon name={msg.ok ? "check" : "x"} />{msg.text}</p>}
          </div>
        </form>
        <div className="db-preview" data-off={enabled ? undefined : ""}>
          <span className="tz-overline">How fans see it</span>
          <div className="tz-pass">
            <div><span className="tz-overline">Membership pass</span><p className="tz-pass__title">{first}&apos;s Crew</p><p className="tz-pass__meta" style={{ margin: 0 }}>{perk || "Your perk appears here"}</p></div>
            <div className="tz-pass__days">30<small>days</small></div>
            <div className="tz-pass__meter"><span style={{ ["--_p" as string]: "100%" }} /></div>
          </div>
          <p className="db-quiet">${price || "0"} · paid once · ends after 30 days</p>
        </div>
      </div>
      <div className="tz-card db-tips">
        <div className="db-card-h"><h2>Members</h2>{activeCount > 0 && <span className="db-card-h__end"><span className="db-onoff" data-on>{activeCount} active</span></span>}</div>
        {sorted.length === 0 ? <p className="db-quiet" style={{ padding: "0 var(--tz-space-3) var(--tz-space-3)" }}>No members yet. A member appears here once their payment is confirmed.</p> : (
          <table className="tz-table tz-table--stack db-table db-members">
            <caption className="tz-sr-only">Pass members, the one ending soonest first</caption>
            <thead><tr><th scope="col" data-col="fan">Member</th><th scope="col">Ends</th><th scope="col">Days left</th></tr></thead>
            <tbody>
              {sorted.map((p) => { const d = daysLeft(p.expiresAt); const name = p.fanName || "Someone kind"; return (
                <tr key={p.id}>
                  <td data-col="fan"><div className="db-fan"><span className="db-dot" data-c={name.charCodeAt(0) % 4} aria-hidden="true">{name[0].toUpperCase()}</span><div><b>{name} <span className="tz-badge">Pass</span></b></div></div></td>
                  <td data-col="ends" className="db-when">{new Date(p.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td data-col="left"><div className="db-left"><small>{p.active ? `${d} day${d === 1 ? "" : "s"} left` : "Ended"}</small>
                    <div className="db-meter" data-soon={p.active && d <= 3 ? "" : undefined}><span style={{ ["--_p" as string]: `${p.active ? Math.min(100, Math.round((d / 30) * 100)) : 0}%` }} /></div></div></td>
                </tr>
              ); })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
