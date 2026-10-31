"use client";
import { useState } from "react";
import { hex, type WalletTx } from "@/lib/evm";
import { ErrorNote, Icon } from "@/components/ui";

import { useWallets, type Wallet } from "./wallets";

function explain(e: unknown, tx: WalletTx, symbol: string): string {
  const err = e as { code?: number; message?: string };
  const msg = (err?.message ?? "").toLowerCase();
  if (err?.code === 4001 || /reject|denied|cancel/.test(msg)) return "You cancelled it in your wallet. No money moved.";
  if (err?.code === 4902 || /unrecognized chain|add.*chain/.test(msg)) return `Your wallet doesn't have ${tx.chainName} yet. Add that network to your wallet and try again.`;
  if (/insufficient/.test(msg)) return `Your wallet doesn't have enough ${symbol} (keep a little extra for the network fee).`;
  if (err?.code === -32002) return "Your wallet already has a request open. Check the wallet window.";
  return "Your wallet couldn't send it. No money moved. You can try again, or pay by hand below.";
}

export type WalletState = "idle" | "connecting" | "confirming" | "sent";

export function WalletPay({ tx, tipId, symbol, amountLabel, onSent, onState }: {
  tx: WalletTx; tipId: string; symbol: string; amountLabel: string; onSent: () => void; onState: (s: WalletState) => void;
}) {
  const { wallets, checked } = useWallets();
  const [state, setState] = useState<WalletState>("idle");
  const [err, setErr] = useState("");
  const set = (s: WalletState) => { setState(s); onState(s); };

  async function pay(w: Wallet) {
    setErr(""); set("connecting");
    try {
      const accounts = (await w.provider.request({ method: "eth_requestAccounts" })) as string[];
      const current = parseInt((await w.provider.request({ method: "eth_chainId" })) as string, 16);
      if (current !== tx.chainId) await w.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex(tx.chainId) }] });
      set("confirming");
      const txHash = (await w.provider.request({
        method: "eth_sendTransaction",
        params: [{ from: accounts[0], to: tx.to, data: tx.data, value: tx.value }],
      })) as string;
      // Tell Aurora which transaction it was so it can pick it up sooner. Best-effort.
      fetch(`/api/tips/${tipId}/deposit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash }) }).catch(() => {});
      set("sent"); onSent();
    } catch (e) { setErr(explain(e, tx, symbol)); set("idle"); }
  }

  const busy = state === "connecting" || state === "confirming";
  const here = typeof location === "undefined" ? "" : location.href;
  const mobile = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }} data-testid="wallet-pay">
      {wallets.slice(0, 4).map((w, i) => (
        <button key={w.id} type="button" className={`tz-btn ${i === 0 ? "tz-btn--primary" : "tz-btn--secondary"} tz-btn--lg tz-btn--block`} onClick={() => pay(w)} disabled={busy}>
          {state === "connecting" ? "Opening your wallet…" : state === "confirming" ? "Confirm in your wallet…" : `Pay ${amountLabel} with ${w.name}`}
        </button>
      ))}
      {checked && wallets.length === 0 && (
        mobile ? (
          <>
            <a className="tz-btn tz-btn--primary tz-btn--lg tz-btn--block" href={`https://metamask.app.link/dapp/${here.replace(/^https?:\/\//, "")}`}>Open in MetaMask</a>
            <a className="tz-btn tz-btn--secondary tz-btn--block" href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(here)}`}>Open in Coinbase Wallet</a>
            <p className="tz-small tz-muted" style={{ margin: 0 }}>This page reopens inside your wallet app with this same quote.</p>
          </>
        ) : (
          <p className="tz-small tz-muted" style={{ margin: 0 }}>No wallet found in this browser. <a href="https://metamask.io/download" target="_blank" rel="noopener noreferrer">Install one</a> or pay by hand below.</p>
        )
      )}
      {!checked && <p className="tz-small tz-muted" style={{ margin: 0 }} role="status">Looking for your wallet…</p>}
      {state === "confirming" && <p className="tz-small tz-muted" style={{ margin: 0 }} role="status"><Icon name="clock" />Your wallet is asking you to confirm. Check its window.</p>}
      {err && <ErrorNote>{err}</ErrorNote>}
    </div>
  );
}
