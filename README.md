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

### With Docker (recommended)

```bash
cp .env.example .env          # set POSTGRES_PASSWORD (URL-safe), APP_BASE_URL, AURORA_API_KEY
docker compose up --build     # app + PostgreSQL 16
```

`docker-compose.yml` defines two services, `app` (Next.js standalone, internal port 3000) and `db`
(`postgres:16-alpine` with a named volume). There are **no published ports**, so nothing is reachable from
the host until a reverse proxy is attached. For a quick local look, create an untracked
`docker-compose.override.yml` with `services: { app: { ports: ["3000:3000"] } }` (Compose merges it automatically).
The schema is created automatically on first start. `GET /api/health` returns 200 only when the app can
reach Postgres, and both services have health checks.

### Deploying on Dokploy (Traefik)

1. Create a **Compose** application from this repo (Compose type "Docker Compose", path `./docker-compose.yml`).
2. **Environment** tab: set `POSTGRES_PASSWORD` (e.g. `openssl rand -hex 24`), `APP_BASE_URL` (the public
   `https://…` domain), `AURORA_API_KEY`, and keep `AURORA_MODE=live`.
3. **Domains** tab: add your domain, service `app`, port `3000`, enable HTTPS. Dokploy adds the Traefik
   labels, so the compose file has no `ports:` and no `container_name`.
4. Deploy. Data lives in the `tezeo-pgdata` volume; back it up like any Postgres volume
   (`pg_dump` from the `db` container).

`APP_BASE_URL` is read at runtime, so the same image works on any domain.

### Without Docker

```bash
npm ci
cp .env.example .env.local      # set DATABASE_URL=postgres://user:pass@localhost:5432/tezeo
npm run dev                     # http://localhost:3000
npm run typecheck && npm test   # 55 tests, run on an embedded Postgres (PGlite): no server needed
npm run build && npm start
```

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Set automatically by `docker-compose.yml`. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Used by compose to create the database and build `DATABASE_URL`. The password must be URL-safe. |
| `APP_BASE_URL` | Public origin used in links and QR codes (runtime). |
| `AURORA_API_KEY` | Aurora API key. **Server-side only**; it travels in Aurora's URL path, so `live.ts` scrubs it from errors. |
| `AURORA_MODE` | `live` calls Aurora for real. `simulated` is a local simulator: **no money moves** and the UI shows a "Demo mode" banner. |
| `AURORA_API_BASE` | Defaults to `https://intents-api.aurora.dev`. |
| `TEZEO_FEE_BPS` | Only for the simulator and validation. In live mode Aurora applies the fee configured per API key in the [Client Portal](https://portal.intents.aurora.dev), and the app displays that. |
| `DATABASE_POOL_MAX` | Optional, default 10. |

Simulator tricks (simulated mode only): a tip whose smallest-unit amount ends in `…13` ends **refunded**, `…14` **failed**.

## What's in the box

* `src/lib/aurora/` provider interface, **verified live client** (`live.ts`) and a clearly labelled **simulator**.
* `src/lib/tips.ts` + `domain.ts` tip state machine: `pending → converting → received | failed | refunded | expired`.
  Aurora is the source of truth; the server re-checks status on each poll and never trusts the browser.
* Landing (`/`): the designer's prototype in `design/landing.html` + `landing.css` (spec in `design/LANDING.md`), ported by `npm run landing:sync` (re-run it after any design change; never edit `src/app/_landing/markup.ts` by hand). Behaviour lives in `src/app/_landing/LandingEffects.tsx`.
* Chain and coin logos: vendored from [Web3Icons](https://github.com/0xa3k5/web3icons) (MIT) into `public/icons/` by `npm run icons:sync` (only the ~70 we use, ~130 KB). `src/lib/icons.ts` maps Aurora's chain slugs and coin symbols to them; anything without a logo (a few exotic chains) keeps a text glyph. Logos are trademarks of their owners.
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
| **Pay with wallet** | One-tap payment for EVM coins (MetaMask, Rabby, Coinbase Wallet…): switches chain and sends the exact transfer to Aurora's deposit address. Verified against **live Aurora quotes with a stub wallet** (the transaction's recipient, token contract, chain and amount were checked); **no real wallet was used and no funds moved**. Non-EVM coins (BTC, SOL, NEAR…) use the step-by-step manual flow. Mobile deep links (MetaMask / Coinbase) are not verified. |
| **3. Extras (OBS alerts, goals, supporter wall)** | Built, tested (6 new tests) and driven in a browser on the simulator: OBS Browser Source page `/alerts/[token]` (own token, `?preview=1` to test the look), a funding goal with progress bar, and a public supporter wall (confirmed tips only; names and notes, never amounts or addresses). Not verified against live Aurora, like everything that depends on a confirmed payment. |

### Known gaps and decisions

* Aurora charges a **fixed ≈0.25 USDC payout cost** per delivery (observed), so tips under ~$2 are inefficient. The minimum tip is $1.
* **Tezeo's own cut is not set by this app.** It is configured per API key in Aurora's Client Portal (the key tested reported 2 bps, Aurora's stablecoin floor). Until you set it there, Tezeo earns nothing.
* Fans holding **USDC on Solana** cannot use the swap path (it is the destination asset); a direct transfer flow is not built.
* Failure/refund screens show the cause class (underpaid vs. other) and the refund address, but not exact refunded amounts or a refund explorer link: Aurora's status response carries them, the app doesn't store them yet. There is no support channel yet, so "Details for support" gives a copyable reference ID instead of a "Talk to a human" button.
* "Remind on day 27" for passes is not built (no email/notification channel). The pass UI says it simply ends.
* Creator accent guard deviates from DESIGN.md §3.4 in one number: ΔE threshold is 0.05, not 0.08, because the designer's own default accent (Turquesa) measures 0.064 from Hierba.
* OBS alerts poll every 4s (no websockets), so an alert can lag a confirmed tip by a few seconds.
* The dashboard, OBS and pass links are bearer secrets (shown once, no recovery). Schema changes are additive `CREATE … IF NOT EXISTS` run at start-up; there is no migration tool yet.
* **Docker image not built in CI yet.** The Docker daemon was not available where this was developed, so the image itself was never built. What *was* verified: `docker compose config` is valid, and the exact standalone bundle the Dockerfile ships ran against a real PostgreSQL 16 server (health check, full browser flows, concurrency).
