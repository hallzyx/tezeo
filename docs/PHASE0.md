# Phase 0 — Validation

**Goal (PRD):** prove Aurora's Swap API delivers USDC on Solana. Exit criterion: a real test conversion reaches the destination wallet.

## Status: NOT YET VALIDATED

The build environment could not reach `docs.intents.aurora.dev` (blocked by network policy), had no `AURORA_API_KEY`, and has no funds. So:

- `src/lib/aurora/live.ts` is written against the PRD's quote → deposit → status flow, but **every endpoint path and field name is an unverified assumption** (marked `ASSUMPTION` in the file). They must be checked against <https://docs.intents.aurora.dev/llms-full.txt>.
- `src/lib/aurora/simulator.ts` is a **local dev simulator**, not Aurora. It lets the UI, polling, failure and refund states be built and tested. It proves nothing about the integration.

## How to complete Phase 0

1. Create an API key in Intents Studio; put it in `.env.local` as `AURORA_API_KEY`.
2. Read the docs and fix any wrong paths/fields in `src/lib/aurora/live.ts`. Confirm Solana USDC is a supported **destination** for the Swap API.
3. Run a small mainnet test (no public testnet exists):

```bash
AURORA_MODE=live PHASE0_RECIPIENT=<your solana wallet> PHASE0_ASSET=<origin assetId> \
PHASE0_AMOUNT=<smallest units> PHASE0_REFUND_TO=<origin-chain address> npm run phase0
```

4. Send the deposit; the script polls until `SUCCESS` and prints the Solana tx.
5. If Solana is not a valid destination for the Swap API, switch to **Intents Connect** (PRD plan B) by replacing only `live.ts`; nothing else depends on Aurora's wire format.

## Fee rules encoded

Aurora floor 10 bps (non-stable) / 2 bps (stable), ceiling 500 bps; fee split 60% integrator / 40% Aurora. Tezeo targets 100 bps (`TEZEO_FEE_BPS`) and clamps it per asset (`clampFeeBps`).
