# Phase 0 — Aurora validation (status: PASSED — a real funded conversion landed in a Solana wallet)

Last verified: 2026-10-31 with the real `AURORA_API_KEY` (never committed or printed).

## What is verified (real calls, no funds moved)

| Question | Answer | Evidence |
|---|---|---|
| Host | `https://intents-api.aurora.dev` | docs + 200 responses |
| Auth | API key is a **path segment**, not a header | `GET /api/tokens/{apiKey}` → 200, 210 tokens |
| Can the Swap API deliver USDC on Solana? | **Yes** (destination asset exists; quotes accepted) | quote with `recipientType: DESTINATION_CHAIN` and a Solana recipient → 200 + deposit address |
| Destination asset id (USDC/Solana) | `nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near` (mint `EPjFWdd5…Dt1v`, 6 dec) | from `/api/tokens` |
| Quote | `POST /api/quote/{apiKey}`; per-quote `quote.depositAddress`, `amountOut`, `minAmountOut`, `deadline` (~72h), `withdrawFee`, `timeEstimate` | real `dry:false` quote |
| Status | `GET /api/status/{apiKey}?depositAddress=…` → `PENDING_DEPOSIT` observed on a fresh quote | real call |
| Status values | `PENDING_DEPOSIT, KNOWN_DEPOSIT_TX, PROCESSING, SUCCESS, INCOMPLETE_DEPOSIT, REFUNDED, FAILED` (mapped in `live.ts`) | OpenAPI enum in docs |
| Refund address | validated server-side; EIP-55-looking invalid/blocklisted values rejected with `refundTo is not valid` | observed 400 |
| App fee format | **Not a request field.** Sending `appFees` is ignored; the fee is configured per API key in the Client Portal and echoed in `quoteRequest.appFees` (`{recipient, fee}` in bps) | request with `appFees:100` still returned `fee: 2` |

`src/lib/aurora/live.ts` now reflects all of the above; no `ASSUMPTION` markers remain. Plan B (Intents Connect) was **not needed** for delivery to Solana.

## Findings that affect the product

1. **Delivery cost depends on the creator's wallet (corrected).** Every quote carries `withdrawFee`. Measured with real `dry` quotes: **0.0100 USDC** to three active wallets, **0.2549 USDC** to two brand-new wallets, 0.0100 for both 5 and 50 USDC, 0.0100 whether the fan pays with USDC or ETH, and 0.0053 to an Arbitrum address. An earlier version of this document called it a "fixed 0.25 USDC payout cost": that was wrong, we had only ever quoted brand-new wallets. Likely cause (unverified, Aurora doesn't document it): Solana needs a USDC token account for a wallet that never held USDC. The first tip to such a wallet pays ~$0.25 once.
2. **Tezeo's fee is configured in the Client Portal**, not by the app. The current key reports 2 bps (Aurora's stablecoin floor) — Tezeo's own cut is 0 until the integrator fee is set at https://portal.intents.aurora.dev. `TEZEO_FEE_BPS` is now only a display/validation hint; the quote screen shows what Aurora actually applied. Aurora splits the integrator fee 60/40 with a 2 bps (stable) / 10 bps (non-stable) floor.
3. **USDC on Solana is excluded as an origin** (it is the destination asset); fans already holding USDC on Solana would use a plain transfer outside the swap flow.
4. The API key sits in the URL path, so `live.ts` scrubs it from error messages. Keep every Aurora call server-side.

## Funded conversion: PASSED (reported by the project owner)

The owner paid a real tip through the deployed app (`tezeo.arroz.dev`, `AURORA_MODE=live`): a fan paid from an EVM wallet to the per-tip deposit address Aurora issued, the app tracked it live and ended on the "Delivered" screen (which is only shown when Aurora reports `SUCCESS`), and **the owner confirmed the USDC arrived in their Phantom wallet on Solana**.

What this establishes: the whole path works for real — quote, per-tip deposit address, the fan's payment (one-tap wallet flow), Aurora's conversion, delivery of USDC on Solana to the creator's own wallet, and status tracking to "Delivered". Plan B (Intents Connect) is not needed.

Limits of this evidence: it comes from the owner's report. The transaction hash and the exact amount were not recorded here, so they are not independently checked in this repository. It was one payment, from one origin coin.

## Still not verified live

- **Underpayments.** Per Aurora's docs `INCOMPLETE_DEPOSIT` is not final: the rest may arrive until the refund deadline, after which the deposit is refunded (`REFUNDED`). The app keeps such a tip open (pending + underpaid) and never expires it. For `FAILED` the docs say not to assume a refund, so the app does not promise one.
- **`REFUNDED` and `FAILED` transitions.** The failure and refund screens have only been exercised against the simulator. No real refund has been observed.
- **Why the first tip to a new wallet costs ~$0.25.** Measured with dry quotes (0.2549 USDC to brand-new wallets vs 0.0100 to active ones) and explained by Solana's USDC token-account creation, but that explanation is a hypothesis: where the money goes was not checked (look at the delivery transaction on Solscan), and it has not been confirmed that the *next* tip to the same wallet drops to ~0.01.
- **Other origin coins and chains** (anything besides the one used in the payment above), non-EVM origins, and the pass flow with a real payment.
- **Tezeo's own fee**: it is configured per API key in Aurora's Client Portal; nothing is charged until it is set there.

## Re-running the check

```bash
# Use a Solana wallet you control as recipient and an address you control on Base for refunds.
AURORA_MODE=live PHASE0_RECIPIENT=<your Solana wallet> \
PHASE0_ASSET='nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near' \
PHASE0_AMOUNT=5000000 PHASE0_REFUND_TO=<your Base address, lowercase 0x…> \
npm run phase0      # AURORA_API_KEY must be set in the environment
```

It prints a deposit address on Base; send exactly **5 USDC (Base)** to it. The script polls until `SUCCESS` (expect ~30 s) and prints the Solana tx.
