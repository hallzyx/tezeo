"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACCENT_PRESETS, DEFAULT_ACCENT, PRESET_NAMES, nearestPreset, parseHex, validateAccent } from "@/lib/accent";
import { cleanHandle, slugFromName, walletProblem, type WalletProblem } from "@/lib/domain";
import { Avatar, Icon, ThemeToggle } from "@/components/ui";
import { Duo, Peek, Preview, type Profile } from "./Preview";
import { Live, type DoneState } from "./Live";

const DRAFT = "tz-onb-draft";
const DONE = "tz-onb-done";
const STEPS = ["You", "Your colour", "Where tips land"] as const;

type Form = { name: string; handle: string; handleTouched: boolean; message: string; avatarUrl: string; accent: string; wallet: string };
const EMPTY: Form = { name: "", handle: "", handleTouched: false, message: "", avatarUrl: "", accent: DEFAULT_ACCENT, wallet: "" };

type HandleCheck = { state: "idle" | "checking" | "ok" | "taken" | "offline"; suggestions: string[] };

const WALLET_MSG: Record<WalletProblem, string> = {
  eth: "That's an Ethereum address (it starts with 0x). Tips land on Solana, so we need your Solana address. In Phantom it's the one next to Solana.",
  token: "That's the address of the USDC coin itself, not a wallet. Paste the address from your own wallet app.",
  phrase: "",
  format: "That doesn't look like a Solana address. It's 32 to 44 letters and numbers, with no spaces or symbols.",
};

async function toAvatarData(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const size = 192, c = document.createElement("canvas");
  c.width = c.height = size;
  const s = Math.min(bmp.width, bmp.height);
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}

const looksLikePhrase = (t: string) => t.trim().split(/\s+/).length >= 12 && /^[a-z\s]+$/i.test(t.trim());

function hueName(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "shade";
  const [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return "shade";
  const h = (mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  const hue = (h + 360) % 360;
  return hue >= 25 && hue < 55 ? "ochre" : hue >= 55 && hue < 95 ? "olive" : "shade";
}

export function Onboarding() {
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<DoneState | null>(null);
  const [ready, setReady] = useState(false);
  const [hc, setHc] = useState<HandleCheck>({ state: "idle", suggestions: [] });
  const [handleNote, setHandleNote] = useState("");
  const [handleBlur, setHandleBlur] = useState(false);
  const [bad, setBad] = useState<{ hex: string; reason: string; near?: "failed" | "received"; suggestion?: string } | null>(null);
  const [walletTouched, setWalletTouched] = useState(false);
  const [walletNote, setWalletNote] = useState("");
  const [stopped, setStopped] = useState(false);
  const [mine, setMine] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [tab, setTab] = useState(0);
  const [photoErr, setPhotoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");
  const [formErr, setFormErr] = useState("");
  const [walletSrvErr, setWalletSrvErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const handleRef = useRef<HTMLInputElement>(null);
  const walletRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);
  const upd = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));

  // Restore a finished result or an unfinished draft (a refresh must never lose either).
  useEffect(() => {
    try {
      const d = sessionStorage.getItem(DONE);
      if (d) setDone(JSON.parse(d));
      const raw = sessionStorage.getItem(DRAFT);
      if (raw) {
        const saved = { ...EMPTY, ...JSON.parse(raw) } as Form;
        setF(saved);
        if (saved.wallet) setHelpOpen(false);
      }
      const want = Number(new URLSearchParams(location.search).get("step"));
      if (want >= 2 && want <= 3) setStep(want);
    } catch { /* storage blocked: start fresh */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(DRAFT, JSON.stringify(f)); } catch { /* ignore */ }
  }, [f, ready]);
  useEffect(() => {
    const onPop = () => { const s = Number(new URLSearchParams(location.search).get("step")); setStep(s >= 2 && s <= 3 ? s : 1); };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  // Focus the step heading when the step changes (never on first paint).
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const go = (n: number) => {
    setStep(n);
    try { history.pushState(null, "", n === 1 ? "/onboarding" : `/onboarding?step=${n}`); } catch { /* ignore */ }
  };

  // Live "is this link free?" check.
  const checkHandle = useCallback(async (h: string, signal?: AbortSignal) => {
    setHc({ state: "checking", suggestions: [] });
    try {
      const r = await fetch(`/api/creators/handle?h=${encodeURIComponent(h)}`, { signal });
      if (!r.ok) return setHc({ state: "offline", suggestions: [] });
      const j = await r.json();
      setHc(j.available ? { state: "ok", suggestions: [] } : j.valid ? { state: "taken", suggestions: j.suggestions ?? [] } : { state: "idle", suggestions: [] });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setHc({ state: "offline", suggestions: [] });
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (f.handle.length < 3) { setHc({ state: "idle", suggestions: [] }); return; }
    const ac = new AbortController();
    setHc({ state: "checking", suggestions: [] });
    const t = setTimeout(() => checkHandle(f.handle, ac.signal), 350);
    return () => { clearTimeout(t); ac.abort(); };
  }, [f.handle, ready, checkHandle]);

  const profile: Profile = { name: f.name, handle: f.handle, message: f.message, avatarUrl: f.avatarUrl, accent: f.accent };
  const style = { ["--creator-accent" as string]: f.accent };

  function onName(v: string) {
    upd(f.handleTouched ? { name: v } : { name: v, handle: slugFromName(v) });
  }
  function onHandle(raw: string) {
    const cleaned = cleanHandle(raw);
    const expected = raw.replace(/^@/, "").toLowerCase();
    setHandleNote(cleaned !== expected && raw.trim() ? `Links can't have spaces, accents or dots, so we made it ${cleaned || "…"}.` : "");
    setBanner("");
    upd({ handle: cleaned, handleTouched: true });
  }

  function pickAccent(hex: string) {
    const r = validateAccent(hex);
    if (r.ok) { upd({ accent: hex.toUpperCase() }); setBad(null); }
    else setBad({ hex, reason: r.reason, near: r.near, suggestion: r.suggestion });
  }

  function setWallet(raw: string, validateNow: boolean) {
    if (looksLikePhrase(raw)) {
      // Never keep these words anywhere: clear the field and do not store, draft or send them.
      upd({ wallet: "" }); setStopped(true); setWalletNote(""); setWalletTouched(false); setMine(false);
      if (walletRef.current) walletRef.current.value = "";
      return;
    }
    const cleaned = raw.replace(/\s+/g, "");
    setStopped(false);
    setWalletNote(cleaned !== raw.trim() || (raw !== raw.trim() && cleaned) ? "We removed a space that came with the paste." : "");
    if (cleaned !== f.wallet) setMine(false);
    upd({ wallet: cleaned });
    setWalletSrvErr("");
    if (validateNow) setWalletTouched(true);
  }
  async function pasteWallet() {
    try { setWallet(await navigator.clipboard.readText(), true); } catch { walletRef.current?.focus(); }
  }

  const wProblem = f.wallet ? walletProblem(f.wallet) : null;
  const walletOk = !!f.wallet && !wProblem;
  useEffect(() => { if (walletOk) setHelpOpen(false); }, [walletOk]);

  // Per-step gates, each with its reason.
  const handleBad = f.handle.length < 3 || hc.state === "taken";
  const why1 = !f.name.trim() ? "Add your name to continue." : f.handle.length < 3 ? "Pick a link of at least 3 characters." : hc.state === "taken" ? `@${f.handle} is taken. Pick another to continue.` : "";
  const why2 = bad ? "Pick one of the colours above to continue." : "";
  const why3 = !walletOk ? "Paste your wallet address to continue." : !mine ? "Tick the box to confirm it's your wallet." : "";

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { if (why1) { setHandleBlur(true); (f.name.trim() ? handleRef.current : null)?.focus(); return; } go(2); }
    else if (step === 2) { if (!why2) go(3); }
    else void create();
  }

  async function create() {
    if (why3 || busy) return;
    if (why1) { go(1); setHandleBlur(true); return; }
    if (why2) { go(2); return; }
    setBusy(true); setFormErr(""); setBanner("");
    try {
      const r = await fetch("/api/creators", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: f.handle, displayName: f.name.trim(), message: f.message, avatarUrl: f.avatarUrl, accent: f.accent, wallet: f.wallet }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const d: DoneState = { handle: j.handle, dashboardToken: j.dashboardToken, walletHasUsdc: j.walletHasUsdc ?? null, name: f.name.trim(), accent: f.accent, avatarUrl: f.avatarUrl, wallet: f.wallet };
        try { sessionStorage.setItem(DONE, JSON.stringify(d)); sessionStorage.removeItem(DRAFT); } catch { /* ignore */ }
        setDone(d);
        return;
      }
      if (r.status === 409) {
        go(1); setHandleBlur(true);
        setBanner(`Someone just took @${f.handle}. We took you back to step 1: pick another link and everything else stays as you left it.`);
        void checkHandle(f.handle);
        setTimeout(() => handleRef.current?.focus(), 50);
      } else if (j.field === "handle") { go(1); setHandleBlur(true); setTimeout(() => handleRef.current?.focus(), 50); }
      else if (j.field === "wallet") { setWalletSrvErr(WALLET_MSG[(j.code as WalletProblem)] || WALLET_MSG.format); setWalletTouched(true); setTimeout(() => walletRef.current?.focus(), 50); }
      else if (j.field === "accent") { go(2); setBad({ hex: f.accent, reason: j.error, near: j.code === "received" ? "received" : "failed", suggestion: j.suggestion }); }
      else setFormErr("Something on our side didn't work, so nothing was saved. Try again in a moment.");
    } catch {
      setFormErr("We couldn't reach Tezeo, so nothing was saved. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  if (!ready) return <div className="ob-page" />;
  if (done) return <Live d={done} onLeave={() => { try { sessionStorage.removeItem(DONE); } catch { /* ignore */ } }} />;

  const isCustom = !ACCENT_PRESETS.some((c) => c.toLowerCase() === f.accent.toLowerCase());
  const customHex = bad ? bad.hex.toUpperCase() : isCustom ? f.accent : null;
  const hs: { state: string; text: React.ReactNode } =
    hc.state === "taken" ? { state: "error", text: <>@{f.handle} is taken.{hc.suggestions.length > 0 && " These are free:"}</> }
    : hc.state === "ok" ? { state: "ok", text: <><b>@{f.handle} is free.</b></> }
    : hc.state === "checking" ? { state: "checking", text: <>Checking @{f.handle}…</> }
    : f.handle.length > 0 && f.handle.length < 3 && handleBlur ? { state: "error", text: "At least 3 characters." }
    : { state: "hint", text: "3 to 24 letters, numbers or _. This is the link you'll share." };
  const wState = stopped ? "stop" : walletSrvErr || (walletTouched && wProblem) ? "error" : walletTouched && walletOk ? "ok" : "hint";
  const wMsg = walletSrvErr || (walletTouched && wProblem ? WALLET_MSG[wProblem] : "");
  const chunks = f.wallet.match(/.{1,4}/g) ?? [];

  return (
    <div className="ob-page tz-creator" style={style}>
      <header className="ob-top">
        <a className="ob-logo" href="/" aria-label="Tezeo home"><svg viewBox="0 0 240 64" aria-hidden="true" style={{ ["--pv-t" as string]: "var(--tz-brand)" }}><use href="#tz-mark" width="64" height="64" /><g className="ob-letters"><use href="#tz-letters" x="82" y="4" width="154" height="56" /></g></svg></a>
        <div className="fl-progress">
          <span className="fl-progress__label"><b>Step {step} of 3</b> · {STEPS[step - 1]}</span>
          <div className="fl-progress__track" aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} className={n < step ? "on" : n === step ? "now" : ""} />)}</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="ob-shell">
        <form className="ob-step" key={step} data-enter onSubmit={next} noValidate aria-labelledby="ob-h">
          {step === 1 && (<>
            <div className="ob-head">
              <div className="ob-eyebrow"><span className="tz-overline">Create your page</span><span className="ob-time"><Icon name="clock" />About 2 minutes</span></div>
              <h1 id="ob-h" ref={headRef} tabIndex={-1}>Let's weave your page</h1>
              <p>Three short steps: you, your colour, and where tips land. Your page goes live the moment you finish.</p>
            </div>
            <ul className="ob-need" aria-label="You'll need">
              <li><span>Your name and a short hello for fans</span></li>
              <li><span>A photo, if you like</span></li>
              <li><span>Your Solana wallet address, for the last step. <a href="#ob-wallet-help" onClick={(e) => { e.preventDefault(); setHelpOpen(true); go(3); }}>Where do I find it?</a></span></li>
            </ul>
            {banner && <p className="tzs-error" role="alert"><Icon name="alert" />{banner}</p>}
            <div className="ob-fields">
              <div className="tz-field">
                <label className="tz-label" htmlFor="ob-name">Your name</label>
                <input id="ob-name" className="tz-input" value={f.name} maxLength={60} autoComplete="name" aria-describedby="ob-name-h" onChange={(e) => onName(e.target.value)} />
                <p id="ob-name-h" className="ob-status">Real name or stage name, as your fans know you.</p>
              </div>
              <div className="tz-field">
                <label className="tz-label" htmlFor="ob-handle">Your link</label>
                <div className="ob-affix" data-state={hs.state === "error" ? "error" : hs.state === "ok" ? "ok" : undefined}>
                  <span className="ob-affix__pre" aria-hidden="true">tezeo.app/@</span>
                  <input id="ob-handle" ref={handleRef} value={f.handle} maxLength={24} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="yourlink"
                    aria-invalid={hs.state === "error"} aria-describedby="ob-handle-s" onChange={(e) => onHandle(e.target.value)} onBlur={() => setHandleBlur(true)} />
                  <span className="ob-affix__state" style={{ color: hs.state === "ok" ? "var(--tz-received-fg)" : "var(--tz-failed-fg)" }}>
                    {hs.state === "ok" && <Icon name="check" />}{hs.state === "error" && hc.state === "taken" && <Icon name="x" />}
                  </span>
                </div>
                <p id="ob-handle-s" className="ob-status" data-state={hs.state} aria-live="polite">
                  {hs.state === "checking" && <span className="tz-rombo" aria-hidden="true" />}{hs.text}
                </p>
                {hc.state === "taken" && hc.suggestions.length > 0 && (
                  <div className="ob-suggest">{hc.suggestions.map((s) => <button key={s} type="button" onClick={() => { upd({ handle: s, handleTouched: true }); setBanner(""); }}>@{s}</button>)}</div>
                )}
                {handleNote && <p className="ob-status" data-state="warn" aria-live="polite">{handleNote}</p>}
                {hs.state === "hint" && !handleNote ? null : <p className="ob-status" style={{ marginTop: -4 }}>3 to 24 letters, numbers or _. This is the link you'll share.</p>}
              </div>
              <div className="tz-field">
                <div className="ob-label-row"><label className="tz-label" htmlFor="ob-msg">A hello for your fans</label><span className="ob-opt">Optional</span></div>
                <textarea id="ob-msg" className="tz-textarea" value={f.message} maxLength={160} style={{ minHeight: "5rem" }} aria-describedby="ob-msg-c" onChange={(e) => upd({ message: e.target.value })} />
                <span id="ob-msg-c" className="tz-counter">{f.message.length} / 160</span>
              </div>
              <div className="tz-field">
                <div className="ob-label-row"><span className="tz-label" id="ob-ph">Photo</span><span className="ob-opt">Optional</span></div>
                <div className="ob-photo" data-state={photoErr ? "error" : undefined}>
                  <button className="ob-photo__btn" type="button" aria-labelledby="ob-ph ob-ph-b" onClick={() => fileRef.current?.click()}>
                    <Avatar name={f.name || "?"} src={f.avatarUrl} /><span className="ob-photo__cam"><Icon name="camera" /></span>
                  </button>
                  <div className="ob-photo__txt">
                    <b id="ob-ph-b">{f.avatarUrl ? "Looking good" : "Add a photo"}</b>
                    <span>Square works best. We'll crop it to a circle. JPG or PNG.</span>
                    <div className="ob-photo__actions">
                      <button type="button" className="tz-btn tz-btn--secondary" onClick={() => fileRef.current?.click()}>{f.avatarUrl ? "Change" : "Choose a photo"}</button>
                      {f.avatarUrl && <button type="button" className="tz-btn tz-btn--ghost" onClick={() => upd({ avatarUrl: "" })}>Remove</button>}
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden aria-labelledby="ob-ph"
                    onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setPhotoErr(""); try { upd({ avatarUrl: await toAvatarData(file) }); } catch { setPhotoErr("We couldn't read that image. Try a JPG or PNG."); } e.target.value = ""; }} />
                </div>
                {photoErr && <p className="ob-status" data-state="error" role="alert"><Icon name="x" />{photoErr}</p>}
              </div>
            </div>
            <Peek p={profile} />
            <div className="fl-dock ob-dock">
              <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" type="submit" aria-disabled={!!why1 || handleBad} aria-describedby={why1 ? "ob-why" : undefined}>Next: your colour<Icon name="arrow" /></button>
              {why1 && <p className="fl-why-disabled" id="ob-why">{why1}</p>}
            </div>
          </>)}

          {step === 2 && (<>
            <div className="ob-head">
              <h1 id="ob-h" ref={headRef} tabIndex={-1}>Pick your colour</h1>
              <p>It dyes your stripe in the weave, your photo ring and your tip buttons. The pay button stays Tezeo pink, so fans always know it's a real payment page.</p>
            </div>
            <div className="tz-field">
              <span className="tz-label" id="ob-col">Your colour</span>
              <div className="ob-swatches" role="group" aria-labelledby="ob-col">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} type="button" className="ob-swatch" style={{ ["--_c" as string]: c }} aria-pressed={!bad && f.accent.toLowerCase() === c.toLowerCase()} onClick={() => pickAccent(c)}><i />{PRESET_NAMES[c]}</button>
                ))}
                <button type="button" className="ob-swatch ob-swatch--custom" style={{ ["--_c" as string]: customHex ?? f.accent }} aria-pressed={!!customHex}
                  aria-label={customHex ? `Pick any colour, ${customHex} chosen` : "Pick any colour"} aria-describedby={bad ? "ob-guard" : undefined} onClick={() => colorRef.current?.click()}>
                  <i>{!customHex && <b aria-hidden="true">+</b>}</i>{customHex ?? "Any"}
                </button>
                <input ref={colorRef} type="color" tabIndex={-1} aria-hidden="true" value={f.accent} onChange={(e) => pickAccent(e.target.value)} style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
              </div>
            </div>
            {bad && (
              <div className="ob-guard" id="ob-guard" role="status">
                <div className="ob-guard__row">
                  <span className="ob-guard__sw ob-guard__sw--no" style={{ ["--_c" as string]: bad.hex }} aria-hidden="true" />
                  <p><b>{bad.near === "received" ? "That green looks like our “received” colour." : "That red-orange looks like our “didn't go through” colour."}</b> Fans could mistake your page for a payment {bad.near === "received" ? "confirmation" : "error"}, so pick a nearby one:</p>
                </div>
                <div className="fl-btnrow">
                  {bad.suggestion && <button type="button" className="tz-btn tz-btn--secondary" onClick={() => pickAccent(bad.suggestion!)}><span className="ob-guard__sw" style={{ ["--_c" as string]: bad.suggestion, width: 24, height: 24 }} aria-hidden="true" />Use {hueName(bad.suggestion)} <span className="ob-mono">{bad.suggestion}</span></button>}
                  <button type="button" className="tz-btn tz-btn--secondary" onClick={() => { const p = nearestPreset(bad.hex); pickAccent(p); }}><span className="ob-guard__sw" style={{ ["--_c" as string]: nearestPreset(bad.hex), width: 24, height: 24 }} aria-hidden="true" />Use {PRESET_NAMES[nearestPreset(bad.hex)]}</button>
                </div>
              </div>
            )}
            <div className="tz-field">
              <span className="tz-label">In light and dark{bad && <span className="tz-muted" style={{ fontWeight: 500 }}> (your last good colour)</span>}</span>
              <Duo p={profile} />
              {!bad && <p className="ob-status" data-state="ok"><Icon name="check" />Easy to read in both. We adjust the shade for dark screens automatically.</p>}
            </div>
            <div className="fl-dock ob-dock">
              <div className="ob-dock__row">
                <button className="tz-btn tz-btn--secondary" type="button" aria-label="Back to step 1" onClick={() => go(1)}><Icon name="arrow" className="tzs-icon ob-flip" />Back</button>
                <button className="tz-btn tz-btn--primary tz-btn--lg" type="submit" aria-disabled={!!why2} aria-describedby={why2 ? "ob-why" : undefined}>Next: where tips land</button>
              </div>
              {why2 && <p className="fl-why-disabled" id="ob-why">{why2}</p>}
            </div>
          </>)}

          {step === 3 && (<>
            <div className="ob-head">
              <h1 id="ob-h" ref={headRef} tabIndex={-1}>Where should your tips land?</h1>
              <p>Paste your Solana wallet address. Tips arrive there as USDC, digital dollars, straight from your fans. Tezeo never holds your money.</p>
            </div>
            <div className="tz-field">
              <div className="ob-label-row">
                <label className="tz-label" htmlFor="ob-wallet">Your Solana wallet address</label>
                {typeof navigator !== "undefined" && !!navigator.clipboard?.readText && <button className="tz-btn tz-btn--secondary ob-paste" type="button" onClick={pasteWallet}><Icon name="paste" />Paste</button>}
              </div>
              <div className="ob-wallet" data-state={wState}>
                <textarea id="ob-wallet" ref={walletRef} rows={2} value={f.wallet} autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false}
                  placeholder="Paste it here. It's 32 to 44 letters and numbers." aria-invalid={wState === "error"} aria-describedby="ob-wallet-s"
                  onChange={(e) => setWallet(e.target.value, false)} onPaste={(e) => { e.preventDefault(); setWallet(e.clipboardData.getData("text"), true); }} onBlur={() => f.wallet && setWalletTouched(true)} />
              </div>
              {stopped ? (
                <div className="ob-stop" role="alert">
                  <Icon name="alert" /><b>Stop: that looks like your secret recovery phrase.</b>
                  <p>We cleared it and didn't save or send it. Never share those words with anyone, including us. We only need your address.</p>
                  <button type="button" className="tz-btn tz-btn--secondary" onClick={() => { setHelpOpen(true); setStopped(false); }}>Show me where my address is</button>
                </div>
              ) : (
                <p id="ob-wallet-s" className="ob-status" data-state={wState === "stop" ? "hint" : wState} aria-live="polite">
                  {wState === "ok" ? <><Icon name="check" />That's a valid Solana address.{walletNote && ` ${walletNote}`}</>
                    : wState === "error" ? <><Icon name="x" />{wMsg}</>
                    : f.wallet && f.wallet.length < 32 ? "Keep going. Solana addresses are 32 to 44 letters and numbers."
                    : "Copy it from your wallet app and paste it. Typing it by hand is how mistakes happen."}
                </p>
              )}
            </div>

            {walletOk && walletTouched && (
              <div className="ob-readback" role="group" aria-labelledby="ob-rb">
                <p className="ob-readback__title" id="ob-rb"><Icon name="shield" />Check it against your wallet app</p>
                <ul className="ob-chunks" aria-label="Your address in groups of four">{chunks.map((c, i) => <li key={i} className={i === 0 || i === chunks.length - 1 ? "is-key" : undefined}>{c}</li>)}</ul>
                <p>Look at the first and last four: <b>{chunks[0]}</b> … <b>{chunks[chunks.length - 1]}</b>. If they match what your wallet shows, you're set.</p>
                <label className="fl-check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />This is my own wallet, and I copied it from my wallet app.</label>
              </div>
            )}

            <details className="ob-help" id="ob-wallet-help" open={helpOpen} onToggle={(e) => setHelpOpen((e.target as HTMLDetailsElement).open)}>
              <summary><Icon name="help" />Where do I find my Solana address?</summary>
              <div className="ob-help__body">
                <div className="ob-tabs" role="tablist" aria-label="Where your wallet is" onKeyDown={(e) => {
                  const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                  const n = e.key === "Home" ? 0 : e.key === "End" ? 2 : d ? (tab + d + 3) % 3 : -1;
                  if (n >= 0) { e.preventDefault(); setTab(n); (e.currentTarget.children[n] as HTMLElement).focus(); }
                }}>
                  {["Phantom", "Solflare", "An exchange"].map((t, i) => (
                    <button key={t} type="button" role="tab" id={`ob-t${i}`} aria-selected={tab === i} aria-controls={`ob-p${i}`} tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)}>{t}</button>
                  ))}
                </div>
                <div className="ob-panel" role="tabpanel" id="ob-p0" aria-labelledby="ob-t0" hidden={tab !== 0}>
                  <ol className="fl-howto"><li>Open the Phantom app.</li><li>Tap <b>Receive</b>.</li><li>Find <b>Solana</b> in the list and tap <b>Copy</b>.</li><li>Come back here and tap <b>Paste</b>.</li></ol>
                  <p>Phantom also shows Ethereum and other addresses. Use the one next to Solana.</p>
                </div>
                <div className="ob-panel" role="tabpanel" id="ob-p1" aria-labelledby="ob-t1" hidden={tab !== 1}>
                  <ol className="fl-howto"><li>Open the Solflare app.</li><li>Tap <b>Receive</b>.</li><li>Tap <b>Copy</b> under your address.</li><li>Come back here and tap <b>Paste</b>.</li></ol>
                </div>
                <div className="ob-panel" role="tabpanel" id="ob-p2" aria-labelledby="ob-t2" hidden={tab !== 2}>
                  <ol className="fl-howto"><li>Go to <b>Deposit</b> and choose <b>USDC</b>.</li><li>Pick the <b>Solana</b> network.</li><li>Copy the address and paste it here.</li></ol>
                  <p className="fl-howto__warn">If the exchange also shows a memo or tag, use a personal wallet instead. Tezeo can't add a memo, so tips might not reach your account.</p>
                </div>
                <p className="tz-small tz-muted" style={{ margin: 0 }}>No wallet yet? Phantom and Solflare are free apps, and setting one up takes a few minutes. Write down the recovery phrase it gives you and keep it to yourself.</p>
              </div>
            </details>

            {!walletOk && (
              <ul className="ob-never" aria-labelledby="ob-never">
                <li style={{ display: "block" }}><span className="ob-never__title" id="ob-never">Never paste these</span></li>
                <li><Icon name="hand" /><span><b>Your secret recovery phrase</b> (12 or 24 words). No one at Tezeo will ever ask for it.</span></li>
                <li><Icon name="hand" /><span><b>An Ethereum address</b>, the kind that starts with 0x.</span></li>
                <li><Icon name="hand" /><span><b>A coin's address</b>, like USDC's own. It has to be your wallet.</span></li>
              </ul>
            )}
            {walletOk && <p className="ob-status"><Icon name="shield" /><span>Want to be extra sure? Once you're live, send yourself a $1 tip from your own page and watch it land.</span></p>}
            {formErr && <p className="tzs-error" role="alert"><Icon name="x" />{formErr}</p>}

            <div className="fl-dock ob-dock">
              <div className="ob-dock__row">
                <button className="tz-btn tz-btn--secondary" type="button" aria-label="Back to step 2" onClick={() => go(2)}><Icon name="arrow" className="tzs-icon ob-flip" />Back</button>
                <button className="tz-btn tz-btn--primary tz-btn--lg" type="submit" aria-disabled={!!why3 || busy} aria-describedby={why3 ? "ob-why" : "ob-fine"}>
                  {busy ? "Weaving your page…" : formErr.startsWith("We couldn't reach") ? "Try again" : "Create my page"}
                </button>
              </div>
              {why3 ? <p className="fl-why-disabled" id="ob-why">{why3}</p> : <p className="ob-fine" id="ob-fine">{busy ? "This takes a second or two." : "For now your link and wallet can't be changed after this, so take a second."}</p>}
            </div>
          </>)}
        </form>
        <Preview p={profile} accent={f.accent} />
      </div>
    </div>
  );
}
