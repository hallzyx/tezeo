# Tezeo

Any fan, from any chain, tips a Latin American creator, and the creator receives **USDC on Solana**.
Fans need no account. Creators get a public page (`/@handle` + QR), a private dashboard and an optional
30-day membership pass.

> *Tezeo* = *tejer* (to weave) + *-eo*. Brand and UI follow [`design/DESIGN.md`](design/DESIGN.md).

## How Solana powers it

* **Settlement asset.** Every payout is USDC on Solana (mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
  Creators register a Solana wallet, validated server-side (valid base58 public key via `@solana/web3.js`;
  the USDC mint itself is refused, since funds sent there would be lost) before it is saved.
* **Cross-chain in, Solana out.** Fans pay in whatever they hold (ETH, Base, Arbitrum, Optimism, Polygon, BNB Chain,
  ~200 assets). [Aurora Intents](https://docs.intents.aurora.dev) converts it and delivers USDC to the creator's wallet.
  Aurora gives every tip its own deposit address, so a payment is attributable without any fan login.
* **Why Solana for creators:** cents-level fees and sub-minute finality make small tips viable, and USDC is spendable
  or off-rampable from any Solana wallet.

## Run it

```bash
npm ci
cp .env.example .env.local      # then edit
npm run dev                     # http://localhost:3000
npm run typecheck && npm test   # 40 tests
npm run build && npm start
```

| Variable | Meaning |
|---|---|
| `AURORA_API_KEY` | Aurora API key. **Server-side only**; it travels in Aurora's URL path, so `live.ts` scrubs it from errors. |
| `AURORA_MODE` | `live` calls Aurora for real. `simulated` (default) is a local simulator: **no money moves** and the UI shows a "Demo mode" banner. |
| `AURORA_API_BASE` | Defaults to `https://intents-api.aurora.dev`. |
| `TEZEO_FEE_BPS` | Only for the simulator and validation. In live mode Aurora applies the fee configured per API key in the [Client Portal](https://portal.intents.aurora.dev), and the app displays that. |
| `DATABASE_PATH` | SQLite file (default `./data/tezeo.db`). |
| `NEXT_PUBLIC_BASE_URL` | Public origin used in links and QR codes. |

Simulator tricks (simulated mode only): a tip whose smallest-unit amount ends in `…13` ends **refunded**, `…14` **failed**.

## What's in the box

* `src/lib/aurora/` provider interface, **verified live client** (`live.ts`) and a clearly labelled **simulator**.
* `src/lib/tips.ts` + `domain.ts` tip state machine: `pending → converting → received | failed | refunded | expired`.
  Aurora is the source of truth; the server re-checks status on each poll and never trusts the browser.
* Pages: `/alerts/[token]` (OBS), `/` landing, `/onboarding`, `/@handle` (+ `/@handle/pass`), `/dashboard/[token]`, `/pass/[token]`.
* API: `/api/assets`, `/api/creators`, `/api/tips`, `/api/tips/[id]` (GET status, PATCH fan note),
  `/api/dashboard/[token]` (+ `/pass` settings).
* `scripts/phase0-validate.ts` end-to-end conversion check. Details in [`docs/PHASE0.md`](docs/PHASE0.md).

## Honest status

| Phase | Status |
|---|---|
| **0. Aurora validation** | **API contract verified live** with a real key: tokens list, real quote with deposit address, status polling, Solana USDC as destination. **A funded conversion has NOT been run**, so a real USDC delivery to Solana is unproven. Run `npm run phase0` (command in `docs/PHASE0.md`). |
| **1. Core UI** | Built and driven in a real browser (Playwright, mobile + desktop, light + dark). The full fan flow (amount → network/coin → quote → deposit → live tracking → thank-you / failure / refund) and the dashboard were exercised against the **simulator**. Against **live Aurora** we verified the asset list and quote creation through the app (no deposit made). |
| **2. Membership pass** | Built and tested (unit tests with a stub provider + browser run on the simulator). The quote is sized and enforced so the guaranteed minimum covers the price; the pass is issued only once the payment is `received`. |
| **3. Extras (OBS alerts, goals, supporter wall)** | Built, tested (6 new tests) and driven in a browser on the simulator: OBS Browser Source page `/alerts/[token]` (own token, `?preview=1` to test the look), a funding goal with progress bar, and a public supporter wall (confirmed tips only; names and notes, never amounts or addresses). Not verified against live Aurora, like everything that depends on a confirmed payment. |

### Known gaps and decisions

* Aurora charges a **fixed ≈0.25 USDC payout cost** per delivery (observed), so tips under ~$2 are inefficient. The minimum tip is $1.
* **Tezeo's own cut is not set by this app.** It is configured per API key in Aurora's Client Portal (the key tested reported 2 bps, Aurora's stablecoin floor). Until you set it there, Tezeo earns nothing.
* Fans holding **USDC on Solana** cannot use the swap path (it is the destination asset); a direct transfer flow is not built.
* Failure/refund screens show the cause class (underpaid vs. other) and the refund address, but not exact refunded amounts or a refund explorer link: Aurora's status response carries them, the app doesn't store them yet. There is no support channel yet, so "Details for support" gives a copyable reference ID instead of a "Talk to a human" button.
* "Remind on day 27" for passes is not built (no email/notification channel). The pass UI says it simply ends.
* Creator accent guard deviates from DESIGN.md §3.4 in one number: ΔE threshold is 0.05, not 0.08, because the designer's own default accent (Turquesa) measures 0.064 from Hierba.
* OBS alerts poll every 4s (no websockets), so an alert can lag a confirmed tip by a few seconds.
* Storage is a local SQLite file: fine for a demo, replace before multi-instance deployment. The dashboard link is a bearer secret (shown once, no recovery).
