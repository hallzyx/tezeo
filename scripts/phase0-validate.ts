/**
 * PHASE 0 - Validation. Proves (or disproves) that Aurora's Swap API delivers USDC on Solana.
 *
 *   AURORA_MODE=live AURORA_API_KEY=... PHASE0_RECIPIENT=<your solana wallet> \
 *   PHASE0_ASSET=<origin assetId> PHASE0_AMOUNT=<smallest units> PHASE0_REFUND_TO=<origin-chain address> \
 *   npm run phase0
 *
 * It requests a real quote, prints the deposit address, then polls status until you send the
 * deposit and the swap settles. Exit criterion (PRD): a real test conversion reaches the wallet.
 */
import { getAurora } from "../src/lib/aurora";
import { isValidSolanaAddress } from "../src/lib/domain";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) { console.error(`Missing ${k}`); process.exit(2); }
  return v;
};

async function main() {
  const aurora = getAurora();
  console.log(`Aurora mode: ${aurora.mode}`);
  if (aurora.mode === "simulated") {
    console.error("Refusing to run: Phase 0 must hit the REAL API. Set AURORA_MODE=live and AURORA_API_KEY.");
    process.exit(2);
  }
  const recipient = need("PHASE0_RECIPIENT");
  if (!isValidSolanaAddress(recipient)) { console.error("PHASE0_RECIPIENT is not a valid Solana address"); process.exit(2); }

  const assets = await aurora.listOriginAssets();
  console.log(`Origin assets offered: ${assets.length}`);
  const asset = assets.find((a) => a.assetId === need("PHASE0_ASSET"));
  if (!asset) { console.error("PHASE0_ASSET not in Aurora's list. Available:", assets.map((a) => a.assetId).join(", ")); process.exit(2); }

  const quote = await aurora.quote({
    originAssetId: asset.assetId, amountIn: need("PHASE0_AMOUNT"),
    recipient, refundTo: need("PHASE0_REFUND_TO"), appFeeBps: 100,
  });
  console.log("\nQuote OK. Send EXACTLY", quote.amountIn, `of ${asset.symbol} on ${asset.chain} to:`);
  console.log(" ", quote.depositAddress, quote.depositMemo ? `(memo ${quote.depositMemo})` : "");
  console.log(`  Expected USDC out (min): ${quote.amountOutUsdc} (${quote.minAmountOutUsdc})  deadline ${quote.deadline}\n`);

  let last = "";
  for (;;) {
    const s = await aurora.status(quote.depositAddress);
    if (s.status !== last) { console.log(new Date().toISOString(), s.status, s.settlementTx ?? ""); last = s.status; }
    if (["SUCCESS", "REFUNDED", "FAILED"].includes(s.status)) {
      console.log(s.status === "SUCCESS"
        ? `\nPHASE 0 PASSED. Check ${recipient} on Solana for USDC. Tx: ${s.settlementTx}`
        : `\nPHASE 0 NOT PASSED: ${s.status}. Fall back to Intents Connect (PRD plan B).`);
      return;
    }
    await new Promise((r) => setTimeout(r, 7000));
  }
}
main().catch((e) => { console.error("PHASE 0 FAILED:", e.message); process.exit(1); });
