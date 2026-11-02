"use client";
import { useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/ui";
import { useDashboard } from "./DashboardShell";
import { PageHead, QrCanvas, useCopy, useOrigin } from "./shared";

export function MyPageView() {
  const { token, data, share, shared } = useDashboard();
  const { creator } = data;
  const origin = useOrigin();
  const copy = useCopy();
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const url = `${origin}/@${creator.handle}`;
  const first = creator.displayName.split(" ")[0];
  const flash = (set: (v: boolean) => void) => { set(true); setTimeout(() => set(false), 1800); };
  const downloadQr = async () => {
    const svg = await QRCode.toString(url, { type: "svg", margin: 2, color: { dark: "#1C1424", light: "#FFFFFF" } });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = `tezeo-${creator.handle}-qr.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <section style={{ display: "grid", gap: "var(--tz-space-5)" }} aria-label="My page">
      <PageHead title="My page"><p>This is where fans tip you. Put the link in your bio and the QR on your stream or your classroom wall.</p></PageHead>
      <div className="db-two">
        <div className="tz-card db-pagecard">
          <div className="tz-weave" aria-hidden="true" />
          <div className="db-pagecard__body">
            <span className="tz-avatar" aria-hidden="true"><span>{(creator.displayName[0] ?? "?").toUpperCase()}</span></span>
            <h2>{creator.displayName}</h2>
            <span className="db-handle">@{creator.handle}</span>
            <div className="db-pagecard__url"><div className="tz-copy"><span className="tz-mono">tezeo.app/@{creator.handle}</span>
              <button className="tz-btn tz-btn--secondary db-copybtn" type="button" aria-label="Copy my page link" onClick={async () => { await copy(url); flash(setC1); }}><Icon name={c1 ? "check" : "copy"} /></button></div></div>
            <div className="db-btnrow" style={{ justifyContent: "center", marginTop: 8 }}>
              <a className="tz-btn tz-btn--secondary" href={`/@${creator.handle}`} target="_blank" rel="noopener noreferrer"><Icon name="external" />Open my page</a>
              <button className="tz-btn tz-btn--primary" type="button" onClick={share}><Icon name="share" />{shared ? "Link copied" : "Share my page"}</button>
            </div>
          </div>
        </div>
        <div className="tz-card db-card db-qrbig">
          <span className="tz-overline">Scan to tip</span>
          <div className="tz-qr"><QrCanvas value={url} size={176} label={`QR code for tezeo.app/@${creator.handle}`} /></div>
          <b style={{ font: "700 var(--tz-text-lg)/1.2 var(--tz-font-display)" }}>Scan to tip {first}</b>
          <p className="db-hint">Print it, pin it on your stream, put it on a slide.</p>
          <button className="tz-btn tz-btn--secondary" type="button" onClick={downloadQr}><Icon name="qr" />Download QR</button>
        </div>
      </div>
      <div className="tz-card db-card db-keycard" id="key">
        <div className="db-card-h"><Icon name="shield" /><h2>Your private dashboard link</h2></div>
        <p className="db-hint">There&apos;s no password: this link is your key. Anyone who has it can see your tips and change your goal and pass.</p>
        <ul>
          <li>Bookmark it, or save it in your notes or password manager.</li>
          <li>Don&apos;t share screenshots that show the address bar.</li>
          <li>Your public page is safe to share anywhere. Your OBS alert link is separate: if it leaks, it can only show alerts, never this dashboard.</li>
        </ul>
        <div className="db-btnrow">
          <button className="tz-btn tz-btn--secondary" type="button" onClick={async () => { await copy(`${origin}/dashboard/${token}`); flash(setC2); }}><Icon name={c2 ? "check" : "copy"} />{c2 ? "Copied" : "Copy my private link"}</button>
          <span className="db-hint">To save it somewhere safe. Never paste it in public.</span>
        </div>
      </div>
    </section>
  );
}
