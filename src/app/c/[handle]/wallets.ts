"use client";
import { useEffect, useState } from "react";

export interface Eip1193 { request(a: { method: string; params?: unknown }): Promise<unknown> }
export interface Wallet { id: string; name: string; provider: Eip1193 }

/** Browser wallets announce themselves (EIP-6963); fall back to a lone window.ethereum. */
export function useWallets(): { wallets: Wallet[]; checked: boolean } {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const found = new Map<string, Wallet>();
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent<{ info: { uuid: string; name: string }; provider: Eip1193 }>).detail;
      found.set(d.info.uuid, { id: d.info.uuid, name: d.info.name, provider: d.provider });
      setWallets([...found.values()]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const t = setTimeout(() => {
      const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
      if (eth && found.size === 0) setWallets([{ id: "injected", name: "your wallet", provider: eth }]);
      setChecked(true);
    }, 400);
    return () => { window.removeEventListener("eip6963:announceProvider", onAnnounce); clearTimeout(t); };
  }, []);
  return { wallets, checked };
}

