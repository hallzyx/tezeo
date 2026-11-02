"use client";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard";
import { Fragment, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/ui";

export type Tip = DashboardData["tips"][number];
export const STATUS_LABEL: Record<string, string> = { converting: "Converting", received: "Received", failed: "Didn't go through", refunded: "Refunded" };
export const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usdFmt = (n: number) => "$" + money(n);
export const chainName = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

export const fmtDate = (iso: string) => {
  const d = new Date(iso), today = new Date(), y = new Date(Date.now() - 864e5);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function PageHead({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="db-head">
      <div><h1 className="tz-h1" tabIndex={-1}>{title}</h1>{children}</div>
      {actions && <div className="db-head__actions">{actions}</div>}
    </div>
  );
}

export function FanCell({ t }: { t: Tip }) {
  const name = t.fanName || "Someone kind";
  return (
    <div className="db-fan">
      {t.fanName
        ? <span className="db-dot" data-c={t.fanName.charCodeAt(0) % 4} aria-hidden="true">{t.fanName[0].toUpperCase()}</span>
        : <span className="db-dot" data-c="kind" aria-hidden="true"><Icon name="heart" className="" /></span>}
      <div>
        <b>{name} {t.isPass && <span className="tz-badge">Pass</span>} <span className="db-new">New</span></b>
        {t.fanMessage ? <small>“{t.fanMessage}”</small> : <small className="is-none">No message</small>}
      </div>
    </div>
  );
}

export function TipRows({ tips, fresh, openId, onToggle }: { tips: Tip[]; fresh: Set<string>; openId?: string | null; onToggle?: (id: string) => void }) {
  const withMore = !!onToggle;
  return (
    <>
      {tips.map((t) => {
        const name = t.fanName || "Someone kind";
        const open = openId === t.id;
        const via = `${t.originSymbol} on ${chainName(t.originChain)}`;
        return (
          <TipRowPair key={t.id}>
            <tr className={(fresh.has(t.id) ? "db-newrow" : "") + (open ? " is-open" : "")}>
              <td data-col="fan"><FanCell t={t} /></td>
              <td data-col="date" className="db-when"><time dateTime={t.createdAt}>{fmtDate(t.createdAt)}</time><span className="db-via">{via}</span></td>
              <td data-col="chain"><span className="db-coin"><b>{t.originSymbol}</b><span>on {chainName(t.originChain)}</span></span></td>
              <td data-col="amount" className="num db-amt">{t.usdc !== null ? <b>{money(t.usdc)} USDC</b> : <span className="db-none">{t.status === "converting" ? "on its way" : "returned to fan"}</span>}</td>
              <td data-col="status"><span className="tz-pill" data-status={t.status}>{STATUS_LABEL[t.status] ?? t.status}</span></td>
              {withMore && (
                <td data-col="more">
                  {t.status !== "converting" && (
                    <button className="db-more" type="button" aria-expanded={open} aria-controls={`d-${t.id}`} onClick={() => onToggle!(t.id)}>
                      <span className="db-more__label">Details<span className="tz-sr-only"> for {name}’s tip</span></span><Icon name="down" />
                    </button>
                  )}
                </td>
              )}
            </tr>
            {withMore && t.status !== "converting" && (
              <tr data-detail id={`d-${t.id}`} hidden={!open}><td colSpan={6} data-col="detail"><TipDetail t={t} /></td></tr>
            )}
          </TipRowPair>
        );
      })}
    </>
  );
}
const TipRowPair = Fragment; // keeps a row and its details row together, keyed

/** Where one tip's money went. The fan only ever sees what they paid; this is the creator's transparency view. */
function TipDetail({ t }: { t: Tip }) {
  const name = t.fanName || "Someone kind";
  const noteHtml = t.fanMessage
    ? <div><span className="tz-overline">{name.split(" ")[0]}’s note</span><p className="db-note" style={{ marginTop: 8 }}>{t.fanMessage}</p></div>
    : <p className="db-note is-none">{name} didn’t leave a note.</p>;
  if (t.status !== "received") {
    return (
      <div className="db-detail">{noteHtml}
        <p className="db-why"><b>{t.status === "failed" ? "This one didn’t go through." : "This one was refunded."}</b> {t.fanName || "The fan"}’s money went back to the wallet it came from, automatically. Nothing reached you and nothing was taken from you.</p>
      </div>
    );
  }
  const delivery = t.delivery ?? 0, fees = t.fees ?? 0;
  return (
    <div className="db-detail" data-testid="tip-breakdown">
      {noteHtml}
      <div>
        {t.gross !== null ? (
          <dl className="tz-quote">
            <div className="tz-quote__row"><dt>Your fan sent</dt><span className="tz-quote__lead" /><dd>{usdFmt(t.gross)}</dd></div>
            <div className="tz-quote__row"><dt>Delivery to your wallet</dt><span className="tz-quote__lead" /><dd>−{usdFmt(delivery)}</dd></div>
            <div className="tz-quote__row"><dt>Fees &amp; price spread</dt><span className="tz-quote__lead" /><dd>−{usdFmt(fees)}</dd></div>
            <div className="tz-quote__row tz-quote__row--total"><dt>You received</dt><span className="tz-spacer" /><dd>{money(t.usdc ?? 0)} USDC</dd></div>
          </dl>
        ) : <p className="db-quiet">You received {money(t.usdc ?? 0)} USDC.</p>}
        <small>Your fan only saw what they paid. These costs are for you.</small>
        {delivery >= 0.1 && <small style={{ display: "block", marginTop: 6 }}>Delivery costs more the first time: Solana needs a USDC account for your wallet, and it is set up with this first tip. Later tips cost about $0.01.</small>}
      </div>
    </div>
  );
}

export function TipsTable({ tips, fresh, caption, onToggle, openId }: { tips: Tip[]; fresh: Set<string>; caption: string; onToggle?: (id: string) => void; openId?: string | null }) {
  return (
    <table className="tz-table tz-table--stack db-table">
      <caption className="tz-sr-only">{caption}</caption>
      <thead><tr>
        <th scope="col" data-col="fan">Fan</th><th scope="col">Date</th><th scope="col" data-col="chain">Paid with</th><th scope="col" className="num">You got</th><th scope="col">Status</th>
        {onToggle && <th scope="col"><span className="tz-sr-only">Details</span></th>}
      </tr></thead>
      <tbody><TipRows tips={tips} fresh={fresh} onToggle={onToggle} openId={openId} /></tbody>
    </table>
  );
}

export function EmptyThread({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="db-empty">
      <svg className="db-empty__art" viewBox="0 0 120 48" aria-hidden="true"><path d="M4 30c18 0 22-18 40-18s20 24 38 24 20-14 34-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 6" /><path d="M110 18l6 4-6 4-6-4z" fill="var(--tz-gold)" /></svg>
      <p className="db-empty__title">{title}</p>
      <p>{children}</p>
      {actions && <div className="db-btnrow">{actions}</div>}
    </div>
  );
}

export function useCopy() {
  return async (text: string) => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };
}
export { Link };

export function QrCanvas({ value, size, label }: { value: string; size: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (value && ref.current) QRCode.toCanvas(ref.current, value, { width: size * 2, margin: 0, color: { dark: "#1C1424", light: "#FFFFFF" } }).then(() => { if (ref.current) { ref.current.style.width = `${size}px`; ref.current.style.height = `${size}px`; } }).catch(() => {});
  }, [value, size]);
  return <canvas ref={ref} className="db-qr" style={{ width: size, height: size }} role="img" aria-label={label} />;
}
/** The page origin, known only in the browser: set after mount so server and client HTML match. */
export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  return origin;
}
