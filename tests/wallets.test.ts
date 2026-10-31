import { describe, expect, it } from "vitest";
import { walletIcon } from "@/lib/icons";
import { deepLinks, injectedWallet, isMetaMask, type Eip1193 } from "@/app/c/[handle]/wallets";

const provider = (flags: Record<string, boolean>) => Object.assign({ request: async () => null }, flags) as unknown as Eip1193;

describe("wallet logos", () => {
  it("finds a logo by wallet name or rdns", () => {
    expect(walletIcon("MetaMask")).toBe("/icons/wallets/metamask.svg");
    expect(walletIcon("io.metamask")).toBe("/icons/wallets/metamask.svg");
    expect(walletIcon("Coinbase Wallet")).toBe("/icons/wallets/coinbase.svg");
    expect(walletIcon("Rabby Wallet")).toBe("/icons/wallets/rabby.svg");
    expect(walletIcon("Some Unknown Wallet")).toBeUndefined();
  });
});

describe("wallets without EIP-6963 (only window.ethereum)", () => {
  it("names MetaMask", () => {
    const w = injectedWallet(provider({ isMetaMask: true }));
    expect(w.name).toBe("MetaMask"); expect(isMetaMask(w)).toBe(true);
  });
  it("does not mistake Brave Wallet for MetaMask (Brave also sets isMetaMask)", () => {
    const w = injectedWallet(provider({ isMetaMask: true, isBraveWallet: true }));
    expect(w.name).toBe("Brave Wallet"); expect(isMetaMask(w)).toBe(false);
  });
  it("names Coinbase Wallet and Rabby, and falls back to a generic name", () => {
    expect(injectedWallet(provider({ isCoinbaseWallet: true })).name).toBe("Coinbase Wallet");
    expect(injectedWallet(provider({ isRabby: true })).name).toBe("Rabby Wallet");
    expect(injectedWallet(provider({})).name).toBe("Browser wallet");
  });
});

describe("mobile deep links", () => {
  const url = "https://tezeo.arroz.dev/@arroz?tip=abc";
  const links = deepLinks(url);
  it("reopens the same quote inside the wallet app", () => {
    expect(links.find((l) => l.id === "metamask")!.href).toBe("https://metamask.app.link/dapp/tezeo.arroz.dev/@arroz?tip=abc");
    expect(links.find((l) => l.id === "coinbase")!.href).toBe(`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`);
    expect(links.find((l) => l.id === "trust")!.href).toContain(encodeURIComponent(url));
  });
  it("every link has a logo", () => { for (const l of links) expect(l.icon, l.id).toBeTruthy(); });
});
