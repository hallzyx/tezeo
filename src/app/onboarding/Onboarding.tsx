"use client";
import { useRef, useState } from "react";
import { ACCENT_PRESETS, DEFAULT_ACCENT } from "@/lib/accent";
import { Avatar, CopyBox, ErrorNote, Icon } from "@/components/ui";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function toAvatarData(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const size = 192, c = document.createElement("canvas");
  c.width = c.height = size;
  const s = Math.min(bmp.width, bmp.height);
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}

export function Onboarding() {
  const [f, setF] = useState({ handle: "", displayName: "", message: "", wallet: "", accent: DEFAULT_ACCENT, avatarUrl: "" });
  const [err, setErr] = useState<{ field?: string; msg: string; suggestion?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ handle: string; dashboardToken: string; walletHasUsdc?: boolean | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const walletOk = f.wallet === "" || B58.test(f.wallet.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!walletOk || !f.wallet) return setErr({ field: "wallet", msg: "That doesn't look like a Solana address. It's 32–44 letters and numbers." });
    setBusy(true);
    try {
      const r = await fetch("/api/creators", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json();
      if (!r.ok) return setErr({ field: r.status === 409 ? "handle" : j.suggestion ? "accent" : undefined, msg: j.error ?? "Something went wrong.", suggestion: j.suggestion });
      setDone(j);
    } finally { setBusy(false); }
  }

  if (done) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return (
      <div className="tz-stack tz-creator" style={{ ["--creator-accent" as string]: f.accent }}>
        <div className="tzs-moment">
          <Avatar name={f.displayName} src={f.avatarUrl} />
          <h1 className="tz-h1">You're live, {f.displayName.split(" ")[0]}.</h1>
          <p className="tz-muted" style={{ margin: 0 }}>Share your page. Tips will show up in your dashboard as they arrive.</p>
        </div>
        <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "8px" }}>
          <span className="tz-overline">Your public page</span>
          <CopyBox value={`${origin}/@${done.handle}`} label="Copy page link" toast="Link copied" />
          <a className="tz-btn tz-btn--secondary" href={`/@${done.handle}`}>Open my page</a>
        </div>
        {done.walletHasUsdc === false && (
          <div className="tz-card tz-card--sunken tz-stack" style={{ ["--tz-stack-gap" as string]: "6px" }} role="note" data-testid="new-wallet-note">
              <span className="tz-overline">Heads up about your wallet</span>
              <p className="tz-small" style={{ margin: 0 }}>A Solana wallet needs a USDC account before it can receive USDC, and yours doesn't have one yet. Your <b>first tip carries a one-time set-up cost of about $0.25</b>. After that, delivery costs about $0.01 per tip. You'll see the exact amounts on each tip in your dashboard.</p>
            </div>
        )}
        <div className="tz-card tz-card--sunken tz-stack" style={{ ["--tz-stack-gap" as string]: "8px" }}>
          <span className="tz-overline">Your private dashboard link</span>
          <p className="tz-small tz-muted" style={{ margin: 0 }}><b>Save this now.</b> It's the only way into your dashboard, and we can't send it again. Anyone with the link can see your tips, so keep it private.</p>
          <CopyBox value={`${origin}/dashboard/${done.dashboardToken}`} label="Copy dashboard link" toast="Link copied" />
        </div>
        <a className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" href={`/dashboard/${done.dashboardToken}`}>Go to my dashboard</a>
      </div>
    );
  }

  const first = f.displayName.split(" ")[0] || "you";
  return (
    <form className="tz-stack tz-creator" style={{ ["--creator-accent" as string]: f.accent, ["--tz-stack-gap" as string]: "20px" }} onSubmit={submit} noValidate>
      <div><span className="tz-overline">Create your page</span><h1 className="tz-h1" style={{ marginTop: 6 }}>Let's weave your page</h1></div>

      <div className="tz-field">
        <label className="tz-label" htmlFor="displayName">Your name</label>
        <input id="displayName" className="tz-input" value={f.displayName} maxLength={60} required autoComplete="name" onChange={(e) => set("displayName")(e.target.value)} />
      </div>
      <div className="tz-field">
        <label className="tz-label" htmlFor="handle">Handle</label>
        <input id="handle" className="tz-input" value={f.handle} maxLength={25} required autoCapitalize="none" spellCheck={false} aria-invalid={err?.field === "handle"} aria-describedby="handle-h"
          placeholder="valecodes" onChange={(e) => set("handle")(e.target.value.replace(/^@/, "").toLowerCase())} />
        <span id="handle-h" className={err?.field === "handle" ? "tz-field__error" : "tz-hint"}>{err?.field === "handle" ? err.msg : `Your link: tezeo.app/@${f.handle || "handle"} · 3–24 letters, numbers or _`}</span>
      </div>
      <div className="tz-field">
        <label className="tz-label" htmlFor="message">A short message for your fans</label>
        <textarea id="message" className="tz-textarea" value={f.message} maxLength={160} onChange={(e) => set("message")(e.target.value)} />
        <span className="tz-counter">{f.message.length} / 160</span>
      </div>

      <div className="tz-field">
        <span className="tz-label" id="av-l">Photo</span>
        <div className="tz-row">
          <Avatar name={f.displayName || "T"} src={f.avatarUrl} small />
          <input ref={fileRef} type="file" accept="image/*" hidden aria-labelledby="av-l"
            onChange={async (e) => { const file = e.target.files?.[0]; if (file) try { set("avatarUrl")(await toAvatarData(file)); } catch { setErr({ msg: "We couldn't read that image. Try a JPG or PNG." }); } }} />
          <button type="button" className="tz-btn tz-btn--secondary" onClick={() => fileRef.current?.click()}>{f.avatarUrl ? "Change photo" : "Upload a photo"}</button>
          {f.avatarUrl && <button type="button" className="tz-btn tz-btn--ghost" onClick={() => set("avatarUrl")("")}>Remove</button>}
        </div>
      </div>

      <div className="tz-field">
        <span className="tz-label" id="ac-l">Your colour</span>
        <div className="tzs-swatches" role="group" aria-labelledby="ac-l">
          {ACCENT_PRESETS.map((c) => (
            <button key={c} type="button" className="tzs-swatch" style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={f.accent.toLowerCase() === c.toLowerCase()} onClick={() => set("accent")(c)} />
          ))}
          <input type="color" aria-label="Custom colour" value={f.accent} onChange={(e) => set("accent")(e.target.value.toUpperCase())} style={{ width: 44, height: 44, border: 0, background: "none" }} />
        </div>
        {err?.field === "accent" && (
          <span className="tz-field__error">{err.msg} {err.suggestion && <button type="button" className="tz-btn tz-btn--ghost" onClick={() => { set("accent")(err.suggestion!); setErr(null); }}>Use {err.suggestion}</button>}</span>
        )}
        <div className="tzs-preview" aria-label="Preview in light and dark">
          {(["light", "dark"] as const).map((t) => (
            <div key={t} data-theme={t} className="tz-creator" style={{ ["--creator-accent" as string]: f.accent }}>
              <span className="tz-overline">{t}</span>
              <span className="tzs-handle">@{f.handle || "handle"}</span>
              <span className="tz-btn tz-btn--creator" aria-hidden="true">$5</span>
            </div>
          ))}
        </div>
        <span className="tz-hint">The call-to-action and status colours stay Tezeo's, so everyone recognises a real payment page.</span>
      </div>

      <div className="tz-field">
        <label className="tz-label" htmlFor="wallet">Your Solana wallet (where USDC arrives)</label>
        <input id="wallet" className="tz-input tz-mono" value={f.wallet} required autoCapitalize="none" spellCheck={false} aria-invalid={!walletOk || err?.field === "wallet"} aria-describedby="wallet-h"
          placeholder="e.g. 7xKX…gAsU" onChange={(e) => set("wallet")(e.target.value.trim())} />
        <span id="wallet-h" className={!walletOk || err?.field === "wallet" ? "tz-field__error" : "tz-hint"}>
          {!walletOk ? "That doesn't look like a Solana address." : err?.field === "wallet" ? err.msg : "Double-check it: tips are paid straight to this address and can't be reversed."}
        </span>
      </div>

      {err && !err.field && <ErrorNote>{err.msg}</ErrorNote>}
      <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" disabled={busy || !f.displayName || !f.handle || !f.wallet}>{busy ? "Creating…" : `Create ${first}'s page`}</button>
      <p className="tzs-trust"><Icon name="shield" />We check your wallet address before saving it.</p>
    </form>
  );
}
