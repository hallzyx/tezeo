"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Avatar, CopyBox, ErrorNote, Icon, Mark, ThemeToggle, TopBar, Weave } from "@/components/ui";
import { breakdown, clock, coin, shortAddr, usd, usdc } from "@/lib/money";
import { PassCard } from "@/components/PassCard";
import { walletTx } from "@/lib/evm";
import { WalletPay, type WalletState } from "./WalletPay";

export interface PublicCreator {
  handle: string; displayName: string; message: string; avatarUrl: string; accent: string;
  pass: { priceUsd: number; perk: string } | null;
}
interface Asset { assetId: string; chain: string; chainLabel: string; symbol: string; decimals: number; stable: boolean; usdPrice?: number; contractAddress?: string }
interface Tip {
  id: string; status: "pending" | "converting" | "received" | "failed" | "refunded" | "expired";
  originAssetId: string; originSymbol: string; originChain: string; amountIn: string; amountOutUsdc: string; appFeeBps: number;
  depositAddress: string; depositMemo: string | null; refundTo: string; createdAt: string; settlementTx: string | null;
  fanMessage: string; fanName: string; failReason: "underpaid" | "other" | null; refundDetail: string | null;
  isPass: boolean; passToken: string | null; passExpiresAt: string | null;
}
type Step = "amount" | "pay" | "quote" | "track";

const AMOUNTS = [{ usd: 3, label: "a cafecito" }, { usd: 5, label: "lunch" }, { usd: 15, label: "big hug" }];
const POPULAR = ["eth", "base", "arb", "op", "pol", "bsc", "avax", "near", "sui", "ton"];
const COIN_PRIORITY = ["USDC", "USDT", "ETH", "BTC", "SOL", "NEAR"];
const CHAIN_COLOR: Record<string, string> = { eth: "#627EEA", base: "#0052FF", arb: "#28A0F0", op: "#FF0420", pol: "#8247E5", bsc: "#C99400", avax: "#E84142", near: "#00A08A", sui: "#4DA2FF", ton: "#0098EA", btc: "#F7931A" };
const QUOTE_HOLD_MS = 5 * 60_000;
const first = (n: string) => n.split(" ")[0];

let assetCache: { mode: string; assets: Asset[] } | null = null;

export interface PublicGoal { title: string; targetUsd: number; raisedUsd: number; pct: number }
export interface WallEntry { id: string; name: string; message: string; isPass: boolean }

export function TipFlow({ creator, qrSvg, pageUrl, passMode = false, goal = null, wall = [] }: { creator: PublicCreator; qrSvg: string; pageUrl: string; passMode?: boolean; goal?: PublicGoal | null; wall?: WallEntry[] }) {
  const name = first(creator.displayName);
  const [step, setStep] = useState<Step>("amount");
  const [amountUsd, setAmountUsd] = useState(passMode ? creator.pass?.priceUsd ?? 5 : 5);
  const [passNote, setPassNote] = useState("");
  const [custom, setCustom] = useState("");
  const [data, setData] = useState<{ mode: string; assets: Asset[] } | null>(assetCache);
  const [chain, setChain] = useState("");
  const [assetId, setAssetId] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [tip, setTip] = useState<Tip | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<null | "chain" | "coin" | "share">(null);
  const [now, setNow] = useState(() => Date.now());

  const asset = useMemo(() => data?.assets.find((a) => a.assetId === (tip?.originAssetId ?? assetId)), [data, assetId, tip]);

  const loadAssets = useCallback(async () => {
    if (assetCache) return setData(assetCache);
    const r = await fetch("/api/assets");
    if (!r.ok) throw new Error("assets");
    assetCache = await r.json();
    setData(assetCache);
  }, []);

  // Resume an in-flight tip from ?tip= (the fan can close the tab and come back).
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("tip");
    if (!id) return;
    (async () => {
      await loadAssets();
      const r = await fetch(`/api/tips/${id}`);
      if (!r.ok) return;
      const t: Tip = await r.json();
      setTip(t); setStep(t.status === "pending" ? "quote" : "track");
    })().catch(() => {});
  }, [loadAssets]);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { loadAssets().catch(() => {}); }, [loadAssets]);

  // Poll the tip (RF-6). Aurora is the source of truth; the server refreshes on each GET.
  useEffect(() => {
    if (!tip || (step !== "quote" && step !== "track")) return;
    if (["received", "failed", "refunded", "expired"].includes(tip.status)) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/tips/${tip.id}`, { cache: "no-store" });
        if (!r.ok) return;
        const t: Tip = await r.json();
        setTip(t);
        if (t.status !== "pending" && step === "quote") setStep("track");
      } catch { /* offline blip: keep last state, try again */ }
    };
    const i = setInterval(poll, step === "track" ? 5000 : 8000);
    return () => clearInterval(i);
  }, [tip, step]);

  const amountNow = passMode ? creator.pass?.priceUsd ?? amountUsd : custom ? Number(custom) : amountUsd;
  const amountOk = Number.isFinite(amountNow) && amountNow >= 1 && amountNow <= 10_000;

  // ---------- derived: chains & coins ----------
  const chains = useMemo(() => {
    const m = new Map<string, string>();
    data?.assets.forEach((a) => m.set(a.chain, a.chainLabel));
    const all = [...m.entries()].map(([id, label]) => ({ id, label }));
    const rank = (id: string) => { const i = POPULAR.indexOf(id); return i < 0 ? 99 : i; };
    return all.sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label));
  }, [data]);
  const coins = useMemo(() => {
    const rank = (s: string) => { const i = COIN_PRIORITY.indexOf(s.toUpperCase()); return i < 0 ? 99 : i; };
    return (data?.assets.filter((a) => a.chain === chain) ?? []).sort((a, b) => rank(a.symbol) - rank(b.symbol) || a.symbol.localeCompare(b.symbol));
  }, [data, chain]);

  async function goPay() {
    setErr("");
    if (!amountOk) return setErr("The smallest tip is $1. Network fees would eat the rest.");
    try { await loadAssets(); setStep("pay"); } catch { setErr("We couldn't load the list of coins. Check your connection and try again."); }
  }
  useEffect(() => {
    if (data && !chain) {
      const c = chains.find((x) => x.id === "base") ?? chains[0];
      if (c) pickChain(c.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  function pickChain(id: string) {
    setChain(id);
    const list = (data?.assets ?? assetCache?.assets ?? []).filter((a) => a.chain === id);
    const rank = (s: string) => { const i = COIN_PRIORITY.indexOf(s.toUpperCase()); return i < 0 ? 99 : i; };
    setAssetId(list.sort((a, b) => rank(a.symbol) - rank(b.symbol))[0]?.assetId ?? "");
  }

  const cryptoAmount = useMemo(() => {
    if (passMode) return "pass"; // the server sizes a pass quote so the creator receives the full price
    const a = data?.assets.find((x) => x.assetId === assetId);
    if (!a?.usdPrice) return null;
    if (a.stable) return amountNow.toFixed(2); // dollar coins: ask for the exact dollar amount, not a price-drift fraction
    const dp = Math.min(a.decimals, 8);
    const m = 10 ** dp;
    return (Math.ceil((amountNow / a.usdPrice) * m) / m).toFixed(dp);
  }, [data, assetId, amountNow, passMode]);

  async function requestQuote() {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/tips", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(passMode
          ? { handle: creator.handle, originAssetId: assetId, pass: true, fanMessage: passNote, refundTo: refundTo.trim() }
          : { handle: creator.handle, originAssetId: assetId, amount: cryptoAmount, refundTo: refundTo.trim() }),
      });
      const j = await r.json();
      if (!r.ok) return setErr(friendly(j.error));
      setTip(j); setStep("quote");
      history.replaceState(null, "", `?tip=${j.id}`);
    } catch { setErr("We couldn't reach the server. Try again in a moment."); }
    finally { setBusy(false); }
  }

  const reset = () => { setTip(null); setStep("amount"); setErr(""); history.replaceState(null, "", location.pathname); };
  const retryFresh = async () => {
    if (!tip) return reset();
    setAssetId(tip.originAssetId); setRefundTo(tip.refundTo); setChain(tip.originChain);
    setTip(null); setStep("pay"); history.replaceState(null, "", location.pathname);
  };

  // ---------- render ----------
  const bar = (n: number) => (
    <div className="tzs-topnav">
      <button type="button" className="tzs-back" aria-label="Back" onClick={() => (step === "pay" ? setStep("amount") : step === "quote" ? (setStep("pay"), setTip(null)) : reset())}><Icon name="back" /></button>
      <div className="tzs-progress" aria-label={`Step ${n} of 4`} role="img">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= n ? "on" : ""} />)}</div>
      <ThemeToggle />
    </div>
  );
  const mini = (
    <button type="button" className="tzs-mini" onClick={() => { setTip(null); setStep("amount"); }} disabled={step === "track" || passMode}>
      <Avatar name={creator.displayName} src={creator.avatarUrl} small />
      <div><b>{passMode ? `${name}'s Pass · ${usd(amountNow).replace(/\.00$/, "")}` : `${usd(amountNow).replace(/\.00$/, "")} for ${name}`}</b><span>{passMode ? "30 days of being part of the crew" : "Change amount"}</span></div>
    </button>
  );

  const demo = data?.mode === "simulated" && (
    <p className="tzs-error" style={{ background: "var(--tz-pending-bg)", color: "var(--tz-pending-fg)" }} data-testid="demo-banner">
      <Icon name="clock" />Demo mode: payments here are simulated and no real money moves.
    </p>
  );

  let body: React.ReactNode;
  if (step === "amount" && passMode) {
    const price = usd(amountNow).replace(/\.00$/, "");
    body = (
      <>
        <div className="tzs-topnav"><a className="tzs-back" href={`/@${creator.handle}`} aria-label={`Back to ${name}'s page`}><Icon name="back" /></a><span className="tz-spacer" /><ThemeToggle /></div>
        <div className="tzs-mini" style={{ cursor: "default" }}><Avatar name={creator.displayName} src={creator.avatarUrl} small /><div><b>{name}'s Pass</b><span>30 days of being part of the crew</span></div></div>
        <PassCard creatorName={name} holder="" preview />
        <ul className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px", listStyle: "none", margin: 0, padding: 0 }}>
          {creator.pass?.perk && <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />{creator.pass.perk}</li>}
          <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />A Pass badge next to your name in {name}'s tip list</li>
          <li className="tz-row"><span className="tz-rombo" style={{ ["--_c" as string]: "var(--creator-accent-fill)", ["--_s" as string]: "8px" }} />No auto-renew. It ends after 30 days, and you pay once.</li>
        </ul>
        <div className="tz-field"><label className="tz-label" htmlFor="passnote">Message with your pass</label><input id="passnote" className="tz-input" maxLength={140} value={passNote} onChange={(e) => setPassNote(e.target.value)} placeholder={`Say hi to ${name}`} /></div>
        {err && <ErrorNote>{err}</ErrorNote>}
        {demo}
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={goPay}>Get the pass · {price}</button>
        <p className="tzs-trust"><Icon name="shield" />Pay from any wallet, any chain. {name} gets dollars.</p>
      </>
    );
  } else if (step === "amount") {
    body = (
      <>
        <div className="tzs-id">
          <Avatar name={creator.displayName} src={creator.avatarUrl} />
          <h1>{creator.displayName}</h1>
          <span className="tzs-handle">@{creator.handle}</span>
        </div>
        {creator.message && <p className="tzs-bubble">“{creator.message}”</p>}
        {goal && (
          <div className="tzs-goal" data-testid="goal">
            <div className="tz-row"><b>{goal.title}</b><span className="tz-spacer" /><span className="tz-small tz-muted">{goal.pct}%</span></div>
            <div className="tzs-goal__bar" role="progressbar" aria-label={goal.title} aria-valuemin={0} aria-valuemax={goal.targetUsd} aria-valuenow={goal.raisedUsd} style={{ ["--_p" as string]: `${goal.pct}%` }}><span /></div>
            <span className="tz-small tz-muted">${goal.raisedUsd.toLocaleString("en-US")} of ${goal.targetUsd.toLocaleString("en-US")} raised</span>
          </div>
        )}
        <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }}>
          <span className="tz-overline">Send {name} a tip</span>
          <div className="tz-amounts" role="group" aria-label="Tip amount">
            {AMOUNTS.map((a) => (
              <button key={a.usd} type="button" className="tz-amount-opt" aria-pressed={!custom && amountUsd === a.usd} onClick={() => { setAmountUsd(a.usd); setCustom(""); }}>
                <span className="tz-amount">${a.usd}</span><small>{a.label}</small>
              </button>
            ))}
          </div>
          <div className="tz-field">
            <label className="tz-label" htmlFor="custom">Other amount</label>
            <input id="custom" className="tz-input" inputMode="decimal" placeholder="$ 10" value={custom} aria-invalid={!!custom && !amountOk} aria-describedby="custom-h"
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))} />
            <span id="custom-h" className={custom && !amountOk ? "tz-field__error" : "tz-hint"}>{custom && !amountOk ? "The smallest tip is $1. Network fees would eat the rest." : "Anything from $1."}</span>
          </div>
        </div>
        {err && <ErrorNote>{err}</ErrorNote>}
        {demo}
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={goPay} disabled={!amountOk}>Send {usd(amountNow).replace(/\.00$/, "")} to {name}</button>
        {creator.pass && <a className="tz-btn tz-btn--secondary tz-btn--block" href={`/@${creator.handle}/pass`}>Get {name}'s Pass · ${creator.pass.priceUsd}</a>}
        <p className="tzs-trust"><Icon name="shield" />Pay from any wallet, any chain. {name} gets dollars.</p>
        {wall.length > 0 && (
          <section className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }} aria-label="Supporters" data-testid="wall">
            <span className="tz-overline">Recent supporters</span>
            <ul className="tzs-wall">{wall.map((w) => (
              <li key={w.id}><b>{w.name}{w.isPass && <span className="tz-badge">Pass</span>}</b>{w.message && <span>“{w.message}”</span>}</li>
            ))}</ul>
          </section>
        )}
        <div className="tzs-foot"><Mark />woven by tezeo</div>
      </>
    );
  } else if (step === "pay") {
    const topChains = chains.slice(0, 5), moreChains = chains.slice(5);
    const topCoins = coins.slice(0, 5), moreCoins = coins.slice(5);
    const cur = chains.find((c) => c.id === chain);
    body = (
      <>
        {bar(2)}{mini}
        <h1 className="tz-h1">Where's your money?</h1>
        <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }}>
          <span className="tz-overline" id="net-l">Network</span>
          <div className="tz-chips" role="group" aria-labelledby="net-l">
            {topChains.map((c) => <Chip key={c.id} on={chain === c.id} color={CHAIN_COLOR[c.id]} glyph={c.label.slice(0, 3).toUpperCase()} label={c.label} onClick={() => pickChain(c.id)} />)}
            {chain && !topChains.some((c) => c.id === chain) && cur && <Chip on color={CHAIN_COLOR[chain]} glyph={cur.label.slice(0, 3).toUpperCase()} label={cur.label} onClick={() => {}} />}
            {moreChains.length > 0 && <Chip color="#5E5266" glyph={`+${moreChains.length}`} label="More" onClick={() => setSheet("chain")} />}
          </div>
        </div>
        <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }}>
          <span className="tz-overline" id="coin-l">Coin</span>
          <div className="tz-chips" role="group" aria-labelledby="coin-l">
            {topCoins.map((c) => <Chip key={c.assetId} on={assetId === c.assetId} color={c.stable ? "#2775CA" : CHAIN_COLOR[c.chain] ?? "#5E5266"} glyph={c.symbol.slice(0, 3)} label={c.symbol} onClick={() => setAssetId(c.assetId)} />)}
            {assetId && !topCoins.some((c) => c.assetId === assetId) && <Chip on color="#5E5266" glyph="•" label={coins.find((c) => c.assetId === assetId)?.symbol ?? ""} onClick={() => {}} />}
            {moreCoins.length > 0 && <Chip color="#5E5266" glyph={`+${moreCoins.length}`} label="More" onClick={() => setSheet("coin")} />}
          </div>
        </div>
        <p className="tz-small tz-muted" style={{ margin: 0 }}>Not sure? Pick the network your wallet app shows at the top. You can't pick wrong. We'll check before you send.</p>
        <div className="tz-field">
          <label className="tz-label" htmlFor="refund">Your wallet address{cur ? ` on ${cur.label}` : ""}</label>
          <input id="refund" className="tz-input tz-mono" value={refundTo} autoCapitalize="none" spellCheck={false} autoComplete="off" placeholder="So we can send it back if anything goes wrong"
            onChange={(e) => setRefundTo(e.target.value.trim())} aria-describedby="refund-h" />
          <span id="refund-h" className="tz-hint">Only used to return your money if something fails. It must be an address you control on {cur?.label ?? "this network"}.</span>
        </div>
        {err && <ErrorNote>{err}</ErrorNote>}
        {demo}
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={requestQuote} disabled={busy || !assetId || !cryptoAmount || refundTo.length < 10}>{busy ? "Getting your quote…" : "See the quote"}</button>
      </>
    );
  } else if (step === "quote" && tip && asset) {
    body = <QuoteStep {...{ tip, asset, name, now, bar, mini, demo, busy }} mode={data?.mode ?? ""} onSent={() => setStep("track")} onRefresh={() => requestQuoteFor(tip)} onBack={reset} />;
  } else if (step === "track" && tip && asset) {
    body = <TrackStep {...{ tip, asset, creator, name, pageUrl, demo }} onAgain={retryFresh} onHome={reset} onTip={setTip} onShare={() => setSheet("share")} />;
  } else {
    body = <p className="tz-muted" role="status">Loading your tip…</p>;
  }

  /** New quote for the same coin, amount and refund address (a fresh deposit address and price). Returns an error message, or null. */
  async function requestQuoteFor(t: Tip): Promise<string | null> {
    setBusy(true);
    try {
      const a = data!.assets.find((x) => x.assetId === t.originAssetId)!;
      const r = await fetch("/api/tips", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(passMode ? { handle: creator.handle, originAssetId: a.assetId, pass: true, fanMessage: t.fanMessage, fanName: t.fanName, refundTo: t.refundTo } : { handle: creator.handle, originAssetId: a.assetId, amount: coin(t.amountIn, a.decimals, 8), refundTo: t.refundTo }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return friendly(j.error);
      setTip(j); history.replaceState(null, "", `?tip=${j.id}`);
      return null;
    } catch { return "We couldn't reach the server. Check your connection and try again."; }
    finally { setBusy(false); }
  }

  const accentStyle = { ["--creator-accent" as string]: creator.accent };
  const isThanks = step === "track" && tip?.status === "received";
  return (
    <div className="tzs-page tz-creator" style={accentStyle}>
      {step === "amount" && !passMode && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, display: "flex", gap: 8 }}>
        <button type="button" className="tz-btn tz-btn--secondary tz-btn--icon tzs-theme tzs-share-mobile" aria-label="Share this page" onClick={() => setSheet("share")}><Icon name="share" /></button>
        <ThemeToggle />
      </div>}
      {isThanks && <Weave slim />}
      {step === "amount" && !passMode && <Weave height={96} />}
      <div className="tzs-creator-layout">
        <main className={`tzs-main${step === "amount" && !passMode ? " tzs-main--flush" : ""}`} aria-live="off">{body}</main>
        {step === "amount" && !passMode && (
          <aside className="tzs-desktop-qr" aria-label="Scan to tip">
            <div className="tz-qr tzs-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <b>Scan to tip {name}</b><span className="tz-small tz-muted">Or share <span className="tz-mono">/@{creator.handle}</span></span>
          </aside>
        )}
      </div>

      {sheet === "share" && (
        <Sheet title={`Share ${name}'s page`} onClose={() => setSheet(null)}>
          <div className="tz-qr tzs-qr" style={{ margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <CopyBox value={pageUrl} label="Copy page link" toast="Link copied" />
        </Sheet>
      )}
      {sheet === "chain" && <PickerSheet title="All networks" items={chains.map((c) => ({ id: c.id, label: c.label }))} onPick={(id) => { pickChain(id); setSheet(null); }} onClose={() => setSheet(null)} />}
      {sheet === "coin" && <PickerSheet title={`Coins on ${chains.find((c) => c.id === chain)?.label ?? ""}`} items={coins.map((c) => ({ id: c.assetId, label: c.symbol }))} onPick={(id) => { setAssetId(id); setSheet(null); }} onClose={() => setSheet(null)} />}
    </div>
  );
}

function friendly(e?: string) {
  if (!e) return "Something went wrong. Try again.";
  if (/refundTo/i.test(e)) return "That wallet address doesn't look right for this network. Check it and try again.";
  if (/amount|minimum|too low|below/i.test(e)) return "That amount is too small to send on this network. Try a bit more.";
  return e.startsWith("Aurora") ? "We couldn't get a quote right now. Try again in a moment." : e;
}

function Chip({ on, color, glyph, label, onClick }: { on?: boolean; color?: string; glyph: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className="tz-chip" aria-pressed={!!on} style={{ ["--chip-color" as string]: color ?? "#5E5266" }} onClick={onClick}>
      <span className="tz-chip__coin">{glyph}</span>{label}
    </button>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="tzs-sheet" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="tz-row"><h2 className="tz-h2" style={{ fontSize: "var(--tz-text-lg)" }}>{title}</h2><span className="tz-spacer" /><button className="tz-btn tz-btn--ghost" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}

function PickerSheet({ title, items, onPick, onClose }: { title: string; items: { id: string; label: string }[]; onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <Sheet title={title} onClose={onClose}>
      <input className="tz-input" placeholder="Search" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="tz-chips">{list.map((i) => <Chip key={i.id} glyph={i.label.slice(0, 3).toUpperCase()} label={i.label} onClick={() => onPick(i.id)} />)}{list.length === 0 && <span className="tz-muted tz-small">Nothing matches.</span>}</div>
    </Sheet>
  );
}

// ======================= C. Quote & deposit =======================
function QuoteStep({ tip, asset, name, now, bar, mini, demo, busy, mode, onSent, onRefresh, onBack }: {
  tip: Tip; asset: Asset; name: string; now: number; bar: (n: number) => React.ReactNode;
  mini: React.ReactNode; demo: React.ReactNode; busy: boolean; mode: string;
  onSent: () => void; onRefresh: () => Promise<string | null>; onBack: () => void;
}) {
  const [qr, setQr] = useState("");
  const [wallet, setWallet] = useState<WalletState>("idle");
  const [refreshErr, setRefreshErr] = useState("");
  useEffect(() => { QRCode.toDataURL(tip.depositAddress, { margin: 1, width: 168, color: { dark: "#1C1424", light: "#FFFFFF" } }).then(setQr).catch(() => {}); }, [tip.depositAddress]);

  // Counted from when the fan first sees this quote (their own clock), so server/browser clock skew can't expire it early.
  const start = useMemo(() => Date.now(), [tip.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = start + QUOTE_HOLD_MS - now;
  // While the wallet is asking the fan to confirm, never pull the screen out from under them.
  const expired = left <= 0 && wallet === "idle";

  const sendAmt = coin(tip.amountIn, asset.decimals, 8, asset.stable ? 2 : 0);
  const sendUsd = Number(sendAmt) * (asset.usdPrice ?? 0);
  const recv = Number(usdc(tip.amountOutUsdc, 6).replace(/,/g, ""));
  const b = breakdown(sendUsd, tip.appFeeBps, recv);
  const feePct = tip.appFeeBps / 100;
  // One-tap wallet payment: EVM coins on supported chains, real deposit addresses only (never the simulator's).
  const tx = mode === "live" ? walletTx(asset, tip.depositAddress, tip.amountIn) : null;

  const refresh = async () => { setRefreshErr(""); const e = await onRefresh(); if (e) setRefreshErr(e); };

  const manual = (
    <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "14px" }}>
      <ol className="tzs-howto">
        <li>Open your wallet app, or your exchange's <b>withdraw</b> screen.</li>
        <li>Choose <b>{asset.symbol}</b> on the <b>{asset.chainLabel}</b> network. <span className="tzs-howto__warn">Another network can lose your money.</span></li>
        <li>Paste the address below, or scan the QR. <span className="tz-muted">The QR holds the address only, so type the amount yourself.</span></li>
        <li>Send exactly <b className="tz-mono">{sendAmt} {asset.symbol}</b> and confirm.</li>
        <li>Come back and tap <b>I've sent it</b>. We spot your payment by ourselves.</li>
      </ol>
      <div className="tz-card tz-card--sunken tz-stack" style={{ ["--tz-stack-gap" as string]: "12px", padding: "var(--tz-space-4)" }}>
        <div className="tz-row" style={{ alignItems: "flex-start" }}>
          <div className="tz-qr" style={{ padding: 8, borderRadius: 12 }}>{qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} width={96} height={96} alt={`QR code for the ${asset.chainLabel} deposit address`} style={{ display: "block" }} />}</div>
          <div style={{ fontSize: "var(--tz-text-sm)" }}>
            <b>Send exactly<br /><span className="tz-amount" style={{ fontSize: "1.35rem" }}>{sendAmt} {asset.symbol}</span></b><br />
            <span className="tz-muted">on {asset.chainLabel}, to:</span>
          </div>
        </div>
        <CopyBox value={tip.depositAddress} />
        {tip.depositMemo && <p className="tz-small" style={{ margin: 0 }}>Include this memo: <b className="tz-mono">{tip.depositMemo}</b></p>}
      </div>
      <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={onSent} disabled={expired}>I've sent it</button>
    </div>
  );

  return (
    <>
      {bar(3)}{mini}
      <h1 className="tz-h1">Here's the deal</h1>
      <dl className="tz-quote" data-testid="quote">
        <div className="tz-quote__row"><dt>You send</dt><span className="tz-quote__lead" /><dd>{sendAmt} {asset.symbol}</dd></div>
        <div className="tz-quote__row"><dt>Network &amp; swap</dt><span className="tz-quote__lead" /><dd>−{usd(b.network)}</dd></div>
        <div className="tz-quote__row"><dt>Tezeo &amp; Aurora ({feePct}%)</dt><span className="tz-quote__lead" /><dd>−{usd(b.fee)}</dd></div>
        <div className="tz-quote__row tz-quote__row--total"><dt>{name} receives</dt><span className="tz-spacer" /><dd>{usdc(tip.amountOutUsdc)} USDC</dd></div>
      </dl>

      {tx ? (
        <>
          <section className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }} aria-label="Pay with your wallet">
            <WalletPay tx={tx} tipId={tip.id} symbol={asset.symbol} amountLabel={`${sendAmt} ${asset.symbol}`} onSent={onSent} onState={setWallet} />
            <p className="tz-small tz-muted" style={{ margin: 0 }}>Your wallet opens and asks you to confirm. We fill in the address and the exact amount, so there's nothing to copy.</p>
          </section>
          <details className="tzs-manual">
            <summary>Or pay it yourself, step by step</summary>
            {manual}
          </details>
        </>
      ) : (
        <section className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }} aria-label="How to pay">
          <h2 className="tz-h2" style={{ fontSize: "var(--tz-text-lg)" }}>How to pay</h2>
          {manual}
        </section>
      )}

      <p className="tz-quote__note"><Icon name="clock" size={14} /><span>Price held for <span className="tz-timer">{clock(left)}</span>. When it runs out you can get a fresh quote, no harm done.</span></p>
      {demo}
      <span className="tz-sr-only" role="status">{left > 0 && left <= 10_000 ? "Ten seconds left on this price." : ""}</span>

      {expired && (
        <div className="tzs-sheet tzs-sheet--center" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="exp-t" aria-describedby="exp-d" data-testid="expired-modal">
            <span className="tz-pill" data-status="pending">Quote expired</span>
            <h2 id="exp-t" className="tz-h1" style={{ fontSize: "var(--tz-text-2xl)" }}>Prices moved while you were away.</h2>
            <p id="exp-d" className="tz-muted" style={{ margin: 0 }}>
              This quote only holds for a few minutes. Get a fresh one: it comes with a new address and an updated price.
              <b style={{ color: "var(--tz-text)" }}> Already sent your payment? Don't worry, we're still watching for it.</b>
            </p>
            {refreshErr && <p className="tzs-error" role="alert"><Icon name="x" />{refreshErr}</p>}
            <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={refresh} disabled={busy} autoFocus>{busy ? "Getting a fresh quote…" : "Get a fresh quote"}</button>
            <button className="tz-btn tz-btn--ghost tz-btn--block" onClick={onBack} disabled={busy}>Start over</button>
          </div>
        </div>
      )}
    </>
  );
}

// ======================= D–G. Tracking & outcomes =======================
function TrackStep({ tip, asset, creator, name, pageUrl, demo, onAgain, onHome, onTip, onShare }: {
  tip: Tip; asset: Asset; creator: PublicCreator; name: string; pageUrl: string; demo: React.ReactNode;
  onAgain: () => void; onHome: () => void; onTip: (t: Tip) => void; onShare: () => void;
}) {
  const sendAmt = coin(tip.amountIn, asset.decimals, 8, asset.stable ? 2 : 0);
  const [note, setNote] = useState(tip.fanMessage);
  const [fan, setFan] = useState(tip.fanName);
  const [saved, setSaved] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/tips/${tip.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fanName: fan, fanMessage: note }) });
      if (r.ok) { setSaved(true); onTip(await r.json()); }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, fan]);

  const s = tip.status;
  const noteField = (
    <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }}>
      <div className="tz-field"><label className="tz-label" htmlFor="note">While you wait — leave {name} a note?</label>
        <textarea id="note" className="tz-textarea" style={{ minHeight: "4.5rem" }} maxLength={140} value={note} onChange={(e) => { dirty.current = true; setSaved(false); setNote(e.target.value); }} />
        <span className="tz-counter">{note.length} / 140{saved ? " · saved" : ""}</span></div>
      <div className="tz-field"><label className="tz-label" htmlFor="fan">Your name (optional)</label>
        <input id="fan" className="tz-input" maxLength={40} value={fan} onChange={(e) => { dirty.current = true; setSaved(false); setFan(e.target.value); }} /></div>
    </div>
  );
  const ref = (
    <details className="tz-small tz-muted"><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Details for support</summary>
      <p style={{ margin: "4px 0" }}>Reference</p><CopyBox value={tip.id} label="Copy reference" toast="Reference copied" />
      {tip.refundDetail && <p>Note: {tip.refundDetail}</p>}</details>
  );

  if (s === "received") return <Thanks {...{ tip, creator, name, pageUrl, onHome, onShare }} />;

  if (s === "pending" || s === "converting") {
    const conv = s === "converting";
    return (
      <>
        <div className="tz-row"><span className="tz-pill" data-status={s}>{conv ? "Converting" : "Waiting"}</span><span className="tz-spacer" /><span className="tz-small tz-muted">{conv ? "usually under a minute" : "usually a minute or two"}</span></div>
        <h1 className="tz-h1">{conv ? `We're weaving your ${asset.symbol} into dollars for ${name}` : "Waiting for your payment"}</h1>
        <Loom symbol={asset.symbol} />
        <ol className="tz-steps" data-status={s}>
          <Step state={conv ? "done" : "active"} title={conv ? `Got your ${sendAmt} ${asset.symbol}` : `Waiting for your ${sendAmt} ${asset.symbol}`} desc={conv ? undefined : "It shows up once the network confirms it."} />
          <Step state={conv ? "active" : "todo"} title="Weaving it into USDC" desc={conv ? "You can close this tab. We'll keep going." : undefined} />
          <Step state="todo" title={`Delivered to ${name}`} />
        </ol>
        {noteField}
        {!conv && <button className="tz-btn tz-btn--ghost tz-btn--block" onClick={onAgain}>Change something</button>}
        {demo}
        <span className="tz-sr-only" role="status" aria-live="polite">{conv ? "Step 2 of 3: weaving it into USDC" : "Step 1 of 3: waiting for your payment"}</span>
        {ref}
      </>
    );
  }

  if (s === "refunded") {
    return (
      <>
        <div className="tzs-moment">
          <svg viewBox="0 0 112 112" width="112" height="112" aria-hidden="true"><circle cx="56" cy="56" r="52" fill="var(--tz-refunded-bg)" /><path d="M10 44 H70 C90 44 90 74 70 74 H38" fill="none" stroke="#FFC23D" strokeWidth="7" strokeLinecap="round" /><path d="M44 64 34 74 44 84" fill="none" stroke="var(--tz-refunded-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="tz-pill" data-status="refunded">Refunded</span>
          <h1 className="tz-h1">Your money is back home.</h1>
          <p className="tz-muted" style={{ margin: 0, maxWidth: "32ch" }}>We sent your {asset.symbol} back to the wallet it came from. The network may keep a small fee that we can't get back.</p>
        </div>
        <div className="tz-card tz-card--sunken" style={{ padding: "var(--tz-space-4)" }}>
          <dl className="tz-quote">
            <div className="tz-quote__row"><dt>You sent</dt><span className="tz-quote__lead" /><dd>{sendAmt} {asset.symbol}</dd></div>
            <div className="tz-quote__row"><dt>Returned to</dt><span className="tz-quote__lead" /><dd className="tz-mono" style={{ color: "var(--tz-refunded-fg)" }}>{shortAddr(tip.refundTo)}</dd></div>
          </dl>
        </div>
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={onAgain}>Try again</button>
        {ref}
      </>
    );
  }

  if (s === "expired") {
    return (
      <>
        <div className="tzs-moment"><span className="tz-pill" data-status="pending">Quote expired</span><h1 className="tz-h1">Prices moved while you were away.</h1><p className="tz-muted" style={{ margin: 0 }}>Nothing was sent, so nothing is lost. Here's a fresh quote whenever you're ready.</p></div>
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={onAgain}>Get a fresh quote</button>
      </>
    );
  }

  // failed
  const under = tip.failReason === "underpaid";
  return (
    <>
      <div className="tzs-moment">
        <svg className="tz-fray" viewBox="0 0 112 112" aria-hidden="true">
          <circle cx="56" cy="56" r="52" fill="var(--tz-failed-bg)" />
          <g fill="none" strokeLinecap="round">
            <path d="M4 58 C24 58 30 52 44 55" stroke="#FFC23D" strokeWidth="7" />
            <g stroke="var(--tz-failed-line)" strokeWidth="2.5"><path className="tz-fray__fibre" d="M44 55 l9 -8" /><path className="tz-fray__fibre" d="M44 55 l11 1" style={{ animationDelay: "-1s" }} /><path className="tz-fray__fibre" d="M44 55 l8 9" style={{ animationDelay: "-2s" }} /></g>
            <path d="M108 56 C88 56 82 62 70 59" stroke="var(--tz-brand)" strokeWidth="7" />
            <g stroke="var(--tz-failed-line)" strokeWidth="2.5"><path className="tz-fray__fibre" d="M70 59 l-8 -9" style={{ animationDelay: "-.5s" }} /><path className="tz-fray__fibre" d="M70 59 l-10 0" /><path className="tz-fray__fibre" d="M70 59 l-8 8" style={{ animationDelay: "-1.5s" }} /></g>
          </g>
        </svg>
        <span className="tz-pill" data-status="failed">Didn't go through</span>
        <h1 className="tz-h1" role="alert">The thread snapped — but your money is safe.</h1>
        <p className="tz-muted" style={{ margin: 0, maxWidth: "32ch" }}>
          {under ? "We got a bit less than the quote needed, so we couldn't convert it. We're sending it back automatically."
            : "No route could deliver it right now. Nothing was converted, and it's on its way back."}
        </p>
      </div>
      <ol className="tz-steps" data-status="failed">
        <Step state="done" title={`Got your ${asset.symbol}`} />
        <Step state="failed" title="Couldn't convert" desc={under ? "The amount was below the quote." : "No route was available."} />
        <Step state="refund" title="Sending it back to you" desc={`To ${shortAddr(tip.refundTo)} · usually a few minutes`} />
      </ol>
      <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }}>
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={onAgain}>Try again with a fresh quote</button>
      </div>
      {ref}
    </>
  );
}

function Step({ state, title, desc }: { state: "done" | "active" | "todo" | "failed" | "refund"; title: string; desc?: string }) {
  const refund = state === "refund";
  return (
    <li className="tz-step" data-state={refund ? "active" : state} aria-current={state === "active" || refund ? "step" : undefined}
      style={refund ? ({ ["--_line" as string]: "var(--tz-refunded-line)", ["--_bg" as string]: "var(--tz-refunded-bg)", ["--_fg" as string]: "var(--tz-refunded-fg)" }) : undefined}>
      <span className="tz-step__knot">{state === "done" && <Icon name="check" className="" />}{state === "failed" && <Icon name="x" className="" />}</span>
      <div className="tz-step__body"><p className="tz-step__title">{title}</p>{desc && <p className="tz-step__desc">{desc}</p>}</div>
    </li>
  );
}

function Loom({ symbol }: { symbol: string }) {
  return (
    <svg className="tz-loom" viewBox="0 0 300 120" role="img" aria-label="Converting your payment into USDC">
      <text className="tz-loom__label" x="0" y="64">{symbol.slice(0, 5)}</text>
      <path className="tz-loom__t tz-loom__t--1" d="M40 20 C110 20 130 60 190 60" /><path className="tz-loom__t tz-loom__t--2" d="M40 60 C80 40 130 80 190 60" /><path className="tz-loom__t tz-loom__t--3" d="M40 100 C110 100 130 60 190 60" />
      <path className="tz-loom__out" d="M190 60 H258" /><circle className="tz-loom__eye" cx="190" cy="60" r="10" /><path className="tz-loom__shuttle" d="M206 54 212 60 206 66 200 60Z" />
      <text className="tz-loom__label" x="266" y="64" style={{ fill: "var(--tz-text)" }}>USDC</text>
    </svg>
  );
}

function Thanks({ tip, creator, name, pageUrl, onHome, onShare }: { tip: Tip; creator: PublicCreator; name: string; pageUrl: string; onHome: () => void; onShare: () => void }) {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    setPlay(true);
    const t = setTimeout(() => { try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(12); } catch { /* unsupported */ } }, 900);
    return () => clearTimeout(t);
  }, []);
  const share = async () => {
    try { if (navigator.share) return await navigator.share({ title: creator.displayName, url: pageUrl }); } catch { return; }
    onShare();
  };
  return (
    <div className={`tz-stack${play ? " is-playing" : ""}`} style={{ ["--tz-stack-gap" as string]: "20px" }} data-testid="thanks">
      <div className="tzs-moment">
        <div className={`tz-knot${play ? " is-playing" : ""}`}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect className="tz-knot__tile" width="64" height="64" rx="16" fill="#D1245A" />
            <path className="tz-knot__thread tz-knot__thread--a" pathLength="80" d="M9.5 19H22c9 0 15.5 6 15.5 14v19.5" fill="none" stroke="#FFC23D" strokeWidth="7.5" strokeLinecap="round" />
            <path className="tz-knot__gap" d="M42 19c-9 0-15.5 6-15.5 14" fill="none" stroke="#D1245A" strokeWidth="13.5" />
            <path className="tz-knot__thread tz-knot__thread--b" pathLength="80" d="M54.5 19H42c-9 0-15.5 6-15.5 14v19.5" fill="none" stroke="#FFF7EC" strokeWidth="7.5" strokeLinecap="round" />
          </svg>
          <div className="tz-burst" aria-hidden="true">
            <i style={{ ["--x" as string]: "-70px", ["--y" as string]: "-50px", ["--r" as string]: "200deg" }} /><i style={{ ["--x" as string]: "70px", ["--y" as string]: "-56px", ["--r" as string]: "-160deg", ["--d" as string]: "40ms" }} />
            <i style={{ ["--x" as string]: "-86px", ["--y" as string]: "10px", ["--r" as string]: "120deg", ["--d" as string]: "80ms" }} /><i style={{ ["--x" as string]: "88px", ["--y" as string]: "6px", ["--r" as string]: "-220deg" }} />
          </div>
        </div>
        <span className="tz-pill tz-rise" data-status="received" style={{ ["--d" as string]: "1000ms" }}>Delivered</span>
        <h1 className="tz-display tz-rise" style={{ ["--d" as string]: "1150ms" }}>{tip.isPass ? `Welcome to ${name}'s Crew.` : `You just made ${name}'s day.`}</h1>
        <p className="tz-rise tz-muted" style={{ ["--d" as string]: "1250ms", margin: 0, maxWidth: "30ch" }}>
          <b style={{ color: "var(--tz-text)" }}>{usdc(tip.amountOutUsdc)} USDC</b> just landed in {name}'s wallet. Your thread is part of their story now.
        </p>
      </div>
      {tip.isPass && tip.passToken && tip.passExpiresAt && (
        <div className="tz-stack tz-rise" style={{ ["--d" as string]: "1350ms", ["--tz-stack-gap" as string]: "12px" }}>
          <PassCard creatorName={name} holder={tip.fanName} expiresAt={tip.passExpiresAt} />
          <span className="tz-overline">Your private pass link</span>
          <CopyBox value={`${typeof location === "undefined" ? "" : location.origin}/pass/${tip.passToken}`} label="Copy pass link" toast="Pass link copied" />
          <p className="tz-small tz-muted" style={{ margin: 0 }}>Save it. It's how you show you're a member, and we can't send it again.</p>
          <a className="tz-btn tz-btn--secondary tz-btn--block" href={`/pass/${tip.passToken}`}>View my pass</a>
        </div>
      )}
      {tip.fanMessage && (
        <div className="tzs-note tz-rise" style={{ ["--d" as string]: "1400ms" }}>
          <span className="tz-overline">Your note</span><p>“{tip.fanMessage}”{tip.fanName ? ` — ${tip.fanName}` : ""}</p>
        </div>
      )}
      <div className="tz-stack tz-rise" style={{ ["--d" as string]: "1500ms", ["--tz-stack-gap" as string]: "10px" }}>
        <button className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" onClick={share}><Icon name="share" />Tell your friends about {name}</button>
        <button className="tz-btn tz-btn--ghost tz-btn--block" onClick={onHome}>Back to {name}'s page</button>
      </div>
    </div>
  );
}
