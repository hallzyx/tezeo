import { Connection, PublicKey } from "@solana/web3.js";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const RPC = () => process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

type Probe = (wallet: string) => Promise<boolean>;

/** Does this wallet already have a USDC token account? (Solana wallets need one to receive USDC.) */
const realProbe: Probe = async (wallet) => {
  const conn = new Connection(RPC(), "confirmed");
  const res = await conn.getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: USDC_MINT });
  return res.value.length > 0;
};

let probe: Probe = realProbe;
/** Test hook: swap the network call for a fake. */
export function setUsdcProbeForTests(p: Probe | null) { probe = p ?? realProbe; cache.clear(); }

const cache = new Map<string, { at: number; v: boolean }>();
const TTL_TRUE = 60 * 60_000; // once it has the account it keeps it
const TTL_FALSE = 60_000;     // re-check soon: the first tip creates it

/**
 * true / false, or null when we couldn't find out (RPC down or rate-limited). Callers must treat null as
 * "unknown" and show nothing, never as "has no account".
 */
export async function walletHasUsdcAccount(wallet: string): Promise<boolean | null> {
  const hit = cache.get(wallet);
  if (hit && Date.now() - hit.at < (hit.v ? TTL_TRUE : TTL_FALSE)) return hit.v;
  try {
    const v = await Promise.race([
      probe(wallet),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]);
    cache.set(wallet, { at: Date.now(), v });
    return v;
  } catch {
    return null;
  }
}
