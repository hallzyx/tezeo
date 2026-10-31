"use client";
import { useEffect, useState } from "react";
import { walletIcon } from "@/lib/icons";

export interface Eip1193 { request(a: { method: string; params?: unknown }): Promise<unknown> }
export interface Wallet { id: string; name: string; provider: Eip1193; icon?: string; rdns?: string }

/** Browser wallets announce themselves (EIP-6963); fall back to a lone window.ethereum. */
export function useWallets(): { wallets: Wallet[]; checked: boolean } {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const found = new Map<string, Wallet>();
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent<{ info: { uuid: string; name: string; icon?: string; rdns?: string }; provider: Eip1193 }>).detail;
      found.set(d.info.uuid, { id: d.info.uuid, name: d.info.name, provider: d.provider, icon: d.info.icon, rdns: d.info.rdns });
      setWallets([...found.values()]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const t = setTimeout(() => {
      const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
      if (eth && found.size === 0) setWallets([injectedWallet(eth)]);
      setChecked(true);
    }, 400);
    return () => { window.removeEventListener("eip6963:announceProvider", onAnnounce); clearTimeout(t); };
  }, []);
  return { wallets, checked };
}


/** A wallet that only exposes window.ethereum (no EIP-6963): name it from the flags it sets. Brave sets isMetaMask too, so check it first. */
export function injectedWallet(eth: Eip1193): Wallet {
  const f = eth as unknown as Record<string, boolean | undefined>;
  const [name, rdns] = f.isBraveWallet ? ["Brave Wallet", "com.brave.wallet"] : f.isRabby ? ["Rabby Wallet", "io.rabby"]
    : f.isCoinbaseWallet ? ["Coinbase Wallet", "com.coinbase.wallet"] : f.isMetaMask ? ["MetaMask", "io.metamask"] : ["Browser wallet", ""];
  return { id: "injected", name, rdns, provider: eth };
}

export const isMetaMask = (w: Wallet) => w.rdns === "io.metamask" || /^metamask/i.test(w.name);
export const isMobileDevice = () => typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
/** The wallet's own logo (announced) or our copy of it. */
export const walletImage = (w: Wallet) => w.icon || walletIcon(w.rdns || w.name);

/** Mobile deep links that reopen this page inside a wallet app's browser (same quote, `?tip=` is in the URL). */
export function deepLinks(url: string) {
  const bare = url.replace(/^https?:\/\//, "");
  return [
    { id: "metamask", name: "MetaMask", href: `https://metamask.app.link/dapp/${bare}`, icon: walletIcon("metamask") },
    { id: "coinbase", name: "Coinbase Wallet", href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`, icon: walletIcon("coinbase") },
    { id: "trust", name: "Trust Wallet", href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`, icon: walletIcon("trust") },
  ];
}
