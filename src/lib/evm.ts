/**
 * "Pay with my wallet": build the exact transaction an EVM wallet must send to a tip's deposit address.
 * Pure functions (no wallet access), so they are unit-tested. Supported: EVM chains Aurora lists as origins.
 */
export interface EvmChain { id: number; name: string; native: string }

// Only chains whose id we are certain of. Anything else falls back to the manual flow.
export const EVM_CHAINS: Record<string, EvmChain> = {
  eth: { id: 1, name: "Ethereum", native: "ETH" },
  base: { id: 8453, name: "Base", native: "ETH" },
  arb: { id: 42161, name: "Arbitrum", native: "ETH" },
  op: { id: 10, name: "Optimism", native: "ETH" },
  pol: { id: 137, name: "Polygon", native: "POL" },
  bsc: { id: 56, name: "BNB Chain", native: "BNB" },
  avax: { id: 43114, name: "Avalanche", native: "AVAX" },
  gnosis: { id: 100, name: "Gnosis", native: "XDAI" },
  scroll: { id: 534352, name: "Scroll", native: "ETH" },
  xlayer: { id: 196, name: "X Layer", native: "OKB" },
  monad: { id: 143, name: "Monad", native: "MON" },
  bera: { id: 80094, name: "Berachain", native: "BERA" },
  // Long names used by the local simulator (live Aurora uses the short slugs above).
  ethereum: { id: 1, name: "Ethereum", native: "ETH" },
  arbitrum: { id: 42161, name: "Arbitrum", native: "ETH" },
  optimism: { id: 10, name: "Optimism", native: "ETH" },
  polygon: { id: 137, name: "Polygon", native: "POL" },
  avalanche: { id: 43114, name: "Avalanche", native: "AVAX" },
};

/** Aurora chain slug for an EVM chain id (what a connected wallet reports), if we support it. */
export function chainSlugById(id: number): string | undefined {
  return Object.entries(EVM_CHAINS).find(([, c]) => c.id === id)?.[0];
}

export const isEvmAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

export interface WalletTx { chainId: number; chainName: string; to: string; data: string; value: string }

/** ERC-20 transfer(address,uint256) calldata. */
export function encodeErc20Transfer(to: string, amount: bigint): string {
  if (!isEvmAddress(to)) throw new Error("Invalid recipient address");
  if (amount <= 0n) throw new Error("Amount must be positive");
  return "0xa9059cbb" + to.slice(2).toLowerCase().padStart(64, "0") + amount.toString(16).padStart(64, "0");
}

/**
 * The transaction for paying `amountIn` (smallest units) of `asset` to `depositAddress`,
 * or null when this asset/chain/address can't be paid from a browser wallet (manual flow instead).
 */
export function walletTx(
  asset: { chain: string; symbol: string; contractAddress?: string },
  depositAddress: string,
  amountIn: string,
): WalletTx | null {
  const chain = EVM_CHAINS[asset.chain];
  if (!chain || !isEvmAddress(depositAddress) || !/^\d+$/.test(amountIn)) return null;
  const amount = BigInt(amountIn);
  if (amount <= 0n) return null;
  if (asset.contractAddress) {
    if (!isEvmAddress(asset.contractAddress)) return null;
    return { chainId: chain.id, chainName: chain.name, to: asset.contractAddress, data: encodeErc20Transfer(depositAddress, amount), value: "0x0" };
  }
  // No contract: only the chain's own native coin can be sent this way.
  if (asset.symbol.toUpperCase() !== chain.native) return null;
  return { chainId: chain.id, chainName: chain.name, to: depositAddress, data: "0x", value: "0x" + amount.toString(16) };
}

export const hex = (n: number) => "0x" + n.toString(16);
