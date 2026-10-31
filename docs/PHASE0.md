# Phase 0 — Aurora validation (status: API contract VERIFIED live; funded conversion PENDING)

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

1. **Fixed payout cost.** Every quote carries `withdrawFee` ≈ 0.25 USDC for the Solana payout (5 USDC in → ~4.74 USDC out). Tiny tips are inefficient; the quote screen shows this fee explicitly and the UI warns on small amounts.
2. **Tezeo's fee is configured in the Client Portal**, not by the app. The current key reports 2 bps (Aurora's stablecoin floor) — Tezeo's own cut is 0 until the integrator fee is set at https://portal.intents.aurora.dev. `TEZEO_FEE_BPS` is now only a display/validation hint; the quote screen shows what Aurora actually applied. Aurora splits the integrator fee 60/40 with a 2 bps (stable) / 10 bps (non-stable) floor.
3. **USDC on Solana is excluded as an origin** (it is the destination asset); fans already holding USDC on Solana would use a plain transfer outside the swap flow.
4. The API key sits in the URL path, so `live.ts` scrubs it from error messages. Keep every Aurora call server-side.

## What is NOT verified

A real funded conversion. A quote creates a deposit address but moves no funds, so `SUCCESS` (USDC actually landing in a Solana wallet), `REFUNDED` and `FAILED` transitions are **not yet observed live**. Phase 0 is **not passed** until you run:

```bash
# Use a Solana wallet you control as recipient and an address you control on Base for refunds.
AURORA_MODE=live PHASE0_RECIPIENT=<your Solana wallet> \
PHASE0_ASSET='nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near' \
PHASE0_AMOUNT=5000000 PHASE0_REFUND_TO=<your Base address, lowercase 0x…> \
npm run phase0      # AURORA_API_KEY must be set in the environment
```

It prints a deposit address on Base; send exactly **5 USDC (Base)** to it. The script polls until `SUCCESS` (expect ~30 s) and prints the Solana tx. Report the result back and this document will be updated.
