"use client";
import { deepLinks, isMetaMask, isMobileDevice, walletImage, type Wallet } from "./wallets";
import { walletIcon } from "@/lib/icons";

/**
 * A compact, horizontal row of wallet buttons with their logos. MetaMask always comes first: if it is
 * installed it connects like any other; if not, it is an "install" link on desktop and an "open in the
 * MetaMask app" link on mobile (with Coinbase Wallet and Trust Wallet next to it when nothing is installed).
 */
/** "Coinbase Wallet" -> "Coinbase": short names keep the row on one line (the full name stays in the aria-label). */
const short = (n: string) => n.replace(/\s+wallet$/i, "") || n;

export function WalletRow({ wallets, onPick, busy, label }: { wallets: Wallet[]; onPick: (w: Wallet) => void; busy?: boolean; label: string }) {
  const here = typeof location === "undefined" ? "" : location.href;
  const mobile = isMobileDevice();
  const detected = [...wallets].sort((a, b) => Number(isMetaMask(b)) - Number(isMetaMask(a))).slice(0, 5);
  const hasMM = detected.some(isMetaMask);
  const links = mobile && here ? deepLinks(here) : [];

  const items: React.ReactNode[] = [];
  if (!hasMM) {
    const mm = links.find((l) => l.id === "metamask");
    items.push(
      <a key="mm-link" className="tzs-wallet" href={mm?.href ?? "https://metamask.io/download"} {...(mm ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
        <img src={walletIcon("metamask")} alt="" width={20} height={20} /><span>MetaMask</span>{!mm && <small>Get</small>}
      </a>,
    );
  }
  for (const w of detected) {
    const img = walletImage(w);
    items.push(
      <button key={w.id} type="button" className="tzs-wallet" onClick={() => onPick(w)} disabled={busy} aria-label={`${label} ${w.name}`}>
        {img ? <img src={img} alt="" width={20} height={20} /> : <span className="tzs-wallet__dot" aria-hidden="true" />}<span>{short(w.name)}</span>
      </button>,
    );
  }
  if (mobile && detected.length === 0)
    for (const l of links.filter((x) => x.id !== "metamask"))
      items.push(<a key={l.id} className="tzs-wallet" href={l.href} aria-label={`Open in ${l.name}`}><img src={l.icon} alt="" width={20} height={20} /><span>{short(l.name)}</span></a>);

  return <div className="tzs-wallets" role="group" aria-label={label}>{items}</div>;
}
