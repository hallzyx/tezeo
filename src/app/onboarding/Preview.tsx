"use client";
import { useState } from "react";
import { Avatar, Icon } from "@/components/ui";

export type Profile = { name: string; handle: string; message: string; avatarUrl: string; accent: string };

/** The real tip page in miniature, rendered in its own theme regardless of the page theme. */
function Phone({ p, theme }: { p: Profile; theme: "light" | "dark" }) {
  const first = p.name.trim().split(/\s+/)[0] || "your";
  return (
    <div className={`fl-phone ob-${theme}`}>
      <div className="fl-phone__url">tezeo.app/<b>@{p.handle || "yourlink"}</b></div>
      <div className="tz-weave" />
      <div className="fl-phone__body">
        <div className="fl-id">
          <Avatar name={p.name || "?"} src={p.avatarUrl} />
          <h1>{p.name || "Your name"}</h1>
          <span className="fl-handle">@{p.handle || "yourlink"}</span>
        </div>
        {p.message && <p className="fl-bubble">“{p.message}”</p>}
        <span className="tz-overline">Send {first === "your" ? "them" : first} a tip</span>
        <div className="tz-amounts">
          <span className="tz-amount-opt"><span className="tz-amount">$3</span><small>a cafecito</small></span>
          <span className="tz-amount-opt" aria-pressed="true"><span className="tz-amount">$5</span><small>lunch</small></span>
          <span className="tz-amount-opt"><span className="tz-amount">$15</span><small>big hug</small></span>
        </div>
        <span className="tz-btn tz-btn--primary tz-btn--block">Send $5{first === "your" ? "" : ` to ${first}`}</span>
        <p className="fl-trust"><Icon name="shield" />Pay from any wallet, any chain. {first === "your" ? "They get" : `${first} gets`} dollars.</p>
      </div>
    </div>
  );
}

export function Preview({ p, accent }: { p: Profile; accent: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <aside className="ob-pv ob-pv--hide-mobile" aria-label="Live preview of your page" style={{ ["--creator-accent" as string]: accent }}>
      <div className="fl-preview__head">
        <span className="tz-overline">How fans see it</span>
        <div className="fl-seg" role="group" aria-label="Preview theme">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t === "light" ? "Light" : "Dark"}</button>
          ))}
        </div>
      </div>
      <div className="tz-creator"><Phone p={p} theme={theme} /></div>
      <p className="ob-pv__foot"><span className="tz-rombo" aria-hidden="true" />Live preview. It changes as you type.</p>
    </aside>
  );
}

/** Phones, step 1: a compact peek instead of the full phone. */
export function Peek({ p }: { p: Profile }) {
  return (
    <div className="ob-peek" aria-hidden="true">
      <div className="tz-weave" />
      <Avatar name={p.name || "?"} src={p.avatarUrl} />
      <b>{p.name || "Your name"}</b>
      <span className="ob-peek__link">tezeo.app/@{p.handle || "yourlink"}</span>
      <span className="ob-peek__label">Your page so far. You'll see all of it on the next steps.</span>
    </div>
  );
}

/** Light and dark side by side, each in its own theme. */
export function Duo({ p }: { p: Profile }) {
  return (
    <div className="ob-duo">
      {(["light", "dark"] as const).map((t) => (
        <div key={t} className={`ob-${t}`}>
          <div className="tz-weave" />
          <div className="ob-duo__body">
            <Avatar name={p.name || "?"} src={p.avatarUrl} />
            <span className="tz-overline">{t === "light" ? "Light" : "Dark"}</span>
            <span className="ob-duo__handle">@{p.handle || "yourlink"}</span>
            <span className="ob-duo__tile">$5</span>
          </div>
        </div>
      ))}
    </div>
  );
}
