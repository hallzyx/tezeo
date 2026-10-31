import { CHAIN_ICONS, COIN_ICONS } from "./icons.generated";

/** Aurora chain slugs we may meet under another name (the local simulator uses long names). */
const ALIAS: Record<string, string> = {
  ethereum: "eth", arbitrum: "arb", optimism: "op", polygon: "pol", avalanche: "avax",
  bitcoin: "btc", solana: "sol", binance: "bsc", bnb: "bsc",
};

/** Logo for a blockchain (Aurora slug such as "base", "arb", "eth"), or undefined to fall back to a text glyph. */
export function chainIcon(slug: string): string | undefined {
  const s = ALIAS[slug.toLowerCase()] ?? slug.toLowerCase();
  return CHAIN_ICONS.has(s) ? `/icons/chains/${s}.svg` : undefined;
}

/**
 * Logo for a coin by symbol ("USDC", "ETH"...). A chain's own coin (TON, NEAR, SUI...) falls back to the
 * chain logo. Unknown tokens return undefined so the caller keeps its text glyph.
 */
export function coinIcon(symbol: string): string | undefined {
  const s = symbol.toLowerCase();
  if (COIN_ICONS.has(s)) return `/icons/coins/${s}.svg`;
  return CHAIN_ICONS.has(s) ? `/icons/chains/${s}.svg` : undefined;
}
