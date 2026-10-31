"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/ui";
import type { Wallet } from "./wallets";

export interface Connected { address: string; chainId: number; walletName: string }

/**
 * Connect a browser wallet just to read its address and network (no transaction, no money moves).
 * The address becomes the refund address, so the fan never has to type it.
 */
export function WalletConnect({ wallets, checked, onConnected }: { wallets: Wallet[]; checked: boolean; onConnected: (c: Connected) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function connect(w: Wallet) {
    setErr(""); setBusy(true);
    try {
      const accounts = (await w.provider.request({ method: "eth_requestAccounts" })) as string[];
      const chainId = parseInt((await w.provider.request({ method: "eth_chainId" })) as string, 16);
      if (!accounts?.[0]) throw new Error("no account");
      onConnected({ address: accounts[0], chainId, walletName: w.name });
    } catch (e) {
      const code = (e as { code?: number }).code;
      setErr(code === 4001 ? "You cancelled it in your wallet. Nothing was shared." : code === -32002 ? "Your wallet already has a request open. Check its window." : "We couldn't connect to your wallet. You can also pay by hand.");
    } finally { setBusy(false); }
  }

  if (!checked) return <p className="tz-small tz-muted" style={{ margin: 0 }} role="status">Looking for your wallet…</p>;
  return (
    <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "10px" }} data-testid="wallet-connect">
      {wallets.slice(0, 4).map((w, i) => (
        <button key={w.id} type="button" className={`tz-btn ${i === 0 ? "tz-btn--primary" : "tz-btn--secondary"} tz-btn--lg tz-btn--block`} onClick={() => connect(w)} disabled={busy}>
          {busy ? "Opening your wallet…" : `Connect ${w.name}`}
        </button>
      ))}
      <p className="tz-small tz-muted" style={{ margin: 0 }}>We read your address and network, so there's nothing to type. It's also where your money goes back if something fails. No payment is made yet.</p>
      {err && <ErrorNote>{err}</ErrorNote>}
    </div>
  );
}
