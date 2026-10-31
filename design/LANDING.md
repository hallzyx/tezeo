# Tezeo Landing Page Spec (`/`)

Prototype: `design/landing.html` (open it in a browser and append `?theme=dark` or `?theme=light`).
Styles: `tokens.css` → `components.css` → **`landing.css`** (new, every class is `tzl-`).
Screenshots: `design/screenshots/landing-{mobile,desktop}-{light,dark}.png` (390px @2x and 1440px @1x, full page).

---

## 0. Concept: *Un solo hilo* (one thread)

The page tells the story of a single tip as a piece of weaving. Threads in many colours (the chains) come in at the top, pass through **the loom**, and leave as **one cochinilla thread** (USDC on Solana) that ends in the creator's wallet. Each section after that is a **numbered rombo knot** (`.tzl-kicker__knot`, 01–08) on the same thread. The page ties off at the bottom with **the knot** animation.

You should be able to screenshot three moments:

1. The poster hero: **"Any coin in. / Dollars out."** in Bricolage at 152px, with the second line indented. Seven chain-coloured threads braid into one thread, which runs into a wallet card.
2. The night "river": three rows of chain and coin chips strung on threads that drift left to right, then **"~20 chains. ~200 coins."** with an arrow into **One thread**.
3. The snapped thread: a big frayed gold thread, and a piedra return thread with the caption "Back home, automatically", under **"The thread snapped, but your money is safe."**

Brand rules are unchanged. Every colour comes from the existing semantic tokens. The creator accent only paints example creator UI (`.tz-creator`). Arcilla appears only in failure UI.

---

## 1. Global

| Item | Spec |
|---|---|
| Wrapper | `body.tz-app.tzl-page`. Sections use `.tzl-wrap`, which has a max width of 1216px and a fluid gutter of `--tzl-gutter` (16px to 40px). |
| Section rhythm | `.tzl-sec` uses `padding-block: --tzl-sec-pad` (72px to 144px). Each section has one main moment. |
| Section head | `.tzl-head` holds `.tzl-kicker` (a rombo knot with its number, an uppercase label and a stitched tail), `h2.tzl-h2` (34px to 68px, weight 800, −0.035em) and `p.tzl-lede`. |
| Key word | `em.tzl-em` is coloured `--tz-brand-text` and gets a maíz running-stitch underline. On night panels use `.tzl-em--gold` (maíz text with a cochinilla stitch). |
| "Example" tags | `.tzl-example` is a dashed mini tag. Put one on **every** mock that shows a creator name or an amount. |
| Theme | `<html data-theme>` is set before paint from `?theme`, falling back to `prefers-color-scheme`. The toggle is `button.tzl-theme[aria-pressed]` and shows the sun or moon icon. In Next.js, read the theme in a small inline script in `layout.tsx` to avoid a flash. |
| Night panels | `.tzl-night`, `.tzl-built` and `.tzl-foot` use `--tzl-night-bg`. In the light theme that is obsidiana; in the dark theme it is `--tz-bg-sunken`, so the panel still reads as a "deeper night". Inside `.tzl-night`, `--tz-text` and `--tz-text-muted` are re-pointed to the cream values. |
| Reveal JS | About 10 lines. `<html>` gets `.tzl-js`. An IntersectionObserver at 0.35 adds `.is-in` to `[data-reveal]` and replays `.tz-knot` inside it. Without JS everything renders in its final state. With reduced motion everything gets `.is-in` immediately. |

New tokens (in `:root` of `landing.css`): `--tzl-wrap`, `--tzl-gutter`, `--tzl-sec-pad`, `--tzl-text-hero`, `--tzl-text-mega`, `--tzl-text-h2`, `--tzl-text-lede`, `--tzl-nav-h`, `--tzl-night-bg`, `--tzl-night-surface`, `--tzl-night-border`, `--tzl-night-text`, `--tzl-night-muted` and `--tzl-night-brand`.

---

## 2. Sections, in order

### Nav (sticky)
- **Purpose:** wayfinding and the always-visible CTA.
- **Markup:** `header.tzl-nav` > `.tzl-wrap.tzl-nav__inner`: lockup `a.tzl-logo` (mark plus `#tz-letters`) · `nav.tzl-nav__links` · `.tzl-nav__end` (theme toggle, `details.tzl-menu`, `a.tz-btn.tz-btn--primary.tzl-nav__cta`).
- **Mobile (<960px):** the anchor links move into `details.tzl-menu` (a 48px summary button with a dropdown panel). This works without JS; the JS only closes it after a link is tapped. The CTA reads "Create", and "Create my page" from 400px up. Below 360px the lockup clips to the mark alone.
- **Desktop:** anchor links "How it works · Pay from anywhere · For creators · For fans · FAQ", the toggle, and "Create my page".
- **Look:** translucent cotton (`color-mix` 84%) with a backdrop blur and a hairline border. Everything in it is 48px tall.

### 1. Hero: "Any coin in. Dollars out."
- **Purpose:** the promise in three seconds.
- **Copy:**
  - Eyebrow (three rombos): *Tips for Latin American creators*
  - H1: **Any coin in.** / ***Dollars*** **out.**
  - Lede: *Your fans tip from the wallet they already have, on about **20 networks**. Tezeo weaves it into **USDC on Solana** and sends it straight to **your wallet**, usually in under a minute.*
  - CTAs: **Create my page** → `/onboarding` (primary, lg) · **See how it works** → `#how` (secondary, lg)
  - Trust list (hierba rombos): *Fans don't need an account · Automatic refund if anything fails · Built on Solana with Aurora Intents*
  - Seal (decorative, ≥1180px): circular text *No account · Any chain · Paid in dollars ·* around the mark, on a maíz disc rotated −10°.
- **Layout:**
  - **Desktop (≥1080px):** the title runs full width, and line 2 (`.tzl-line--2`) is indented 1.15em. Below it sits a two-column grid (0.72fr / 1.4fr). The copy goes left. On the right is `.tzl-loom-art`: the horizontal SVG plus the wallet card in a 2-column grid. The out-thread runs under the card edge.
  - **Tablet (≥700px):** the horizontal art is used.
  - **Mobile:** single column. The vertical SVG `.tzl-loom-v` has five chain pills on top, threads flowing down into the eye, and the out-thread dropping into the wallet card. Both CTAs are full width.
- **Classes:** `.tzl-hero`, `.tzl-hero__top`, `.tzl-hero-title`, `.tzl-line`, `.tzl-hero__eyebrow`, `.tzl-flags`, `.tzl-hero__grid`, `.tzl-hero__copy`, `.tzl-lede`, `.tzl-ctas`, `.tzl-trustline`, `.tzl-seal`, `.tzl-loom-art`, `.tzl-loom-h`, `.tzl-loom-v`, `.tzl-chain-pill`, `.tzl-t`, `.tzl-t-under`, `.tzl-out`, `.tzl-out-stitch`, `.tzl-eye`, `.tzl-eye-rombo`, `.tzl-art-label`.
- **Wallet card:** `.tz-card.tz-card--raised.tz-creator.tzl-wallet` contains `.tz-weave--slim`, then `.tzl-wallet__head` (avatar sm, "Vale's wallet / USDC on Solana", `.tzl-example`), then `.tzl-wallet__total` ("Just landed **+4.72 USDC**"), then `ul.tzl-wallet__list` with `li.tzl-tiprow` rows:
  - Ana · paid with ETH on Base · 4.72 · Delivered (`.tzl-tiprow--new`)
  - Jorge · TON · 9.80 · Delivered
  - Lucía · BTC · … · Converting
- **Background:** `.tzl-hero::before` draws faint vertical warp threads every 48px, fading out downward.

### Ribbon
A full-bleed `.tz-weave` (64px) between the hero and the story. In the final CTA there is a 96px version.

### 2. How it works (`#how`, knot 01)
- **H2:** From their wallet to yours, in *four moves.* · **Lede:** One thread runs through every tip. Here's where it goes.
- **Steps** (`ol.tzl-how > li.tzl-how__item`, each with a knot, `h3.tzl-how__title`, `p` and `.tzl-how__art`):
  1. **Share your link.** Put **tezeo.app/@you** in your bio, or show your QR on stream. It opens on any phone. No app, no sign-up. *Art:* `.tzl-linkcard` (a `.tz-qr` mock QR, the URL, and Bio / Stream / Chat tags).
  2. **Fans pay with what they hold.** ETH on Base, USDT on Tron, TON, SUI. They pick the network their wallet shows and see the exact deal before sending. *Art:* `.tzl-mini-chips`, "Where's your money?" with `.tz-chip`s and Base pressed.
  3. **We weave it into dollars.** Aurora Intents converts it to USDC on Solana. Every tip gets its own deposit address and live tracking. *Art:* the existing `.tz-loom` (ETH / TON / SUI → USDC).
  4. **Dollars land in your wallet.** USDC arrives in your own Solana wallet, usually in under a minute. Not in an account we hold for you. *Art:* `.tzl-landed` (the static mark, "+4.72 USDC", "in Vale's wallet · example").
- **Layout:** on mobile this is a vertical stepper, with a running-stitch thread between the knots (`::before`). At ≥1000px it becomes 4 columns that use **subgrid** (`grid-template-rows: subgrid`, `.tzl-how__body { display: contents }`), so titles, text and art line up across the row. The thread turns horizontal between the knots.
- **Lifecycle strip** `.tzl-life` (a sunken panel):
  - Heading: **Every tip is tracked, live.** / *Fans watch each stage on their screen. You watch it on your dashboard.*
  - Three `.tzl-life__stage[data-status]` cards, each with a top border in its status line colour and a `.tz-pill`:
    - **Waiting:** "Waiting for your payment" / "It usually shows up in a minute or two."
    - **Converting:** "We're weaving your ETH into dollars for Vale" / "You can close this tab. We'll keep going."
    - **Delivered:** "You just made Vale's day." / "4.72 USDC just landed in Vale's wallet."
  - Stacked on mobile, three columns at ≥760px, joined by a short thread.

### 3. Pay from anywhere (`#anywhere`, knot 02, night panel)
- **H2:** Whatever they hold, *you get dollars.* (gold em) · **Lede:** Your fans don't need to buy a new coin or learn a new app. They send from the wallet and network they already use. **Tezeo does the weaving.**
- **River** `.tzl-river`: three `.tzl-marquee` rows, each strung on a coloured thread (`--_thread`: añil / cochinilla / maíz). Each row has two identical `ul.tzl-marquee__set` lists, and the second is `aria-hidden`.
  - Row 1 networks: Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, NEAR, Bitcoin.
  - Row 2 networks: Sui, TON, Tron, Aptos, Stellar, Monad, X Layer, Gnosis, Solana.
  - Row 3 coins (`.tzl-chain--coin`): ETH, USDC, USDT, BTC, BNB, POL, AVAX, TON, SUI, SOL, NEAR, DAI.
  - Chips are `.tzl-chain` with `.tzl-chain__g` glyph discs. The disc takes the network's own brand colour through `--_c`. Use `.tzl-chain__g--ink` for light colours (BNB, Bitcoin, NEAR, Sui, DAI). These are text glyphs, not third-party logos.
  - In the app, generate the rows from the live Aurora asset list (`CHAIN_LABELS` in `src/lib/aurora/live.ts`).
- **Statement** `.tzl-into`: `p.tzl-mega` "**~20 chains. ~200 coins.**" (the full stops are maíz), then a dashed maíz arrow, then the `.tzl-onethread` pill (a USDC disc, "**One thread** / USDC on Solana, straight to your wallet", cochinilla with a stitched inner seam). On desktop the statement spans the full width and the arrow and pill share the next row; on mobile they stack and the arrow is hidden.
- **Fine print:** *The live list of networks and coins comes from Aurora Intents and can grow or change. Fans only see options that work, so nobody picks something that can't arrive.*
- **Background:** three soft dye glows (`.tzl-night::before`: añil, cochinilla and maíz radial gradients).

### 4. For creators (`#creators`, knot 03)
- **H2:** Everything you need to get paid by *your people.* · **Lede:** A page that looks like you, a dashboard that updates live, and a few extras for when your community wants to do more than tip.
- **Bento** `.tzl-bento` of `article.tzl-tile`s. Each has a `.tzl-tile__label` (icon and overline), an `h3` and a `p`.
  - **Layout:** 1 column on mobile. At ≥760px there are 6 columns (pass and goal share a row). At ≥1100px there are 12 columns:
    - **Page:** 5 columns, spanning 2 rows.
    - **Dashboard:** 7 columns.
    - **OBS:** 7 columns.
    - **Pass, goal and wall:** 4 columns each.
- **Tiles:**

| Tile | Label / H3 / copy | Mock |
|---|---|---|
| `--page` | Your page + QR · **One link for everything.** · Your name, photo, colour and message. Fans pick an amount and pay. Print the QR for a gig or pin it on stream. | `.tzl-pagestage` (a dotted sunken stage) holding `.tzl-minipage.tz-creator`: the URL bar "tezeo.app/@valecodes · example", `.tz-weave`, avatar, name, handle, bio, `.tz-amounts` ($3 a cafecito / **$5 lunch** / $15 big hug), the primary button "Send $5 to Vale", the trust line, and `.tzl-qrpeek` "Scan to tip Vale". Below the stage is `.tzl-swatches`: **Your colour, your page.** *Tezeo keeps it readable in light and dark.* with six accent dots. |
| `--dash` | Live dashboard · **Watch tips arrive as they happen.** · Every tip with its status, what it was paid with and what you received. On a private link only you hold. | `.tzl-dash[data-reveal="toast"]`: the `.tz-toast[data-status=received]` "New tip from Ana · 4.72 USDC", then `.tzl-dash__stats` (inverse card "This month · example **342.18 USDC**" with a maíz sparkline, and "Tips 57 · 1 on its way"), then `ul.tzl-dash__rows`: Ana (Pass badge), ETH · Base, 4.72, Received; Jorge, TON, 9.80, Converting; Lucía, USDT · Tron, 14.85, Received. |
| `--obs` | OBS stream alerts · **Say thanks, live on stream.** | `.tzl-stream[data-reveal="alert"]`: a 16:9 fake stream (4:3.4 on phones) with a LIVE tag, a camera box, a skyline, the mono caption "Browser Source · tezeo alerts", and `.tzl-alert` (accent border, cochinilla/maíz/accent selvedge, mark, "New tip for Vale", **Ana · 4.72 USDC**, the note). This is the same content as `src/app/alerts/[token]/Alerts.tsx`. Below it is `ol.tzl-obs-steps`: Copy your **alerts link** from the dashboard. / In OBS, add a **Browser Source** with that link. / A card pops up for **every confirmed tip**, with the fan's name and note. |
| `--pass` | Membership Pass · optional · **30 days in the crew.** · Fans pay once for a 30-day pass. They get a badge and a private pass link. | `.tz-pass` (violet accent, 70%, "Vale's Crew", "Ana · example", 21 days left), tilted −2.5°; it straightens on hover. `.tzl-facts`: *One-time payment. No auto-renew.* / *[PASS] badge next to their name*. |
| `--goal` | Funding goal · **Show what it's for.** · Set a goal on your page. The band fills with every tip. | `.tzl-goal[data-reveal="goal"]` with "New mic for the stream · 62%", then `.tzl-goal__bar` (a woven band: cochinilla / maíz / accent stripes with cream rombos, `role=progressbar`), then "$186 of $300 raised · example". Fact: *Shows on your public page, under the tip buttons.* |
| `--wall` | Supporter wall · **Thank people in public.** · Fans who leave a name and a note show up on your page. | `ul.tzl-wall`: dashed "patches" (the second one is accent-soft). Ana (Pass) "First dev job, thanks to you." · Jorge "Para el próximo stream." · Mari "Saludos desde Medellín." |

### 5. For fans (`#fans`, knot 04)
- **H2:** No account. No seed-phrase talk. *No surprises.*
- **List** `ul.tzl-nos` (48px soft-brand icon tiles):
  - **Nothing to sign up for.** Open the link, pick an amount, pay from your wallet. No Tezeo account, no login.
  - **Plain words, all the way.** We say "dollars" and "your wallet". Not sure which network? Pick the one your wallet shows at the top. We check before you send.
  - **Every fee, before you pay.** The quote shows what you send, every cost in dollars, and exactly what the creator receives.
- **Quote card** `.tzl-dealwrap > .tzl-deal.tz-creator`: tag **Example quote**, H "Here's the deal", then a `dl.tz-quote`:

  | Row | Amount |
  |---|---|
  | You send | 0.00213 ETH |
  | Network & swap | −$0.18 |
  | Service fee | −$0.10 |
  | **Vale receives** | **4.72 USDC** |

  Then "Send exactly 0.00213 ETH on Ethereum, to:" with a `.tz-copy` full mono address, and the timer note "Price held for 0:58. If it runs out, we'll refresh it, no harm done."
  - The fee row is labelled **"Service fee"**, with no percentage. In the real flow the quote shows the configured fee. Do **not** put a percentage in marketing copy.
- **Callouts** `.tzl-notes` (maíz numbered discs):
  1. Every cost, in dollars, up front
  2. The creator's name, next to what they get
  3. A fresh address, just for this tip

  On desktop (≥1000px) they are absolutely pinned around the card with stitched maíz leaders, and a tilted, dashed brand-soft backing card sits behind the quote (`.tzl-dealwrap::before`). On mobile they become a plain numbered list under the card.
- **Layout:** stacked on mobile; two columns at ≥1000px.

### 6. Your money is safe (`#safe`, knot 05, sunken band)
- **H2** `.tzl-safe__title`: The thread snapped, *but your money is safe.* The second clause is in the refunded colour (piedra): calm, not alarm.
- **Illustration** `svg.tzl-snap` (viewBox 1100×240):
  - The gold "Your money" thread ends in splayed fibres: gold fibres plus one arcilla fibre, in `.tzl-snap__fibre` with `--clay` for the arcilla one.
  - There is a gap, then the faded cochinilla "The creator" thread with its own fibres.
  - A dashed piedra return thread (`.tzl-snap__home`) runs back to the left with an arrowhead and the caption **Back home, automatically**.
  - Below 700px the labels are hidden and the SVG is drawn at 175% width, cropped by the section, so the snap stays big.
- **Grid** (3 columns at ≥960px):
  - **Lede:** *Sometimes a price jumps or a route isn't available. When a tip can't be finished, Tezeo stops before anything is lost and sends it back to the wallet it came from. **Automatically.***
  - **`ul.tzl-promise`:**
    - **Its own address, every time.** Each tip gets a fresh deposit address, so payments never get mixed up.
    - **Automatic refunds.** If the conversion can't finish, the money goes back where it came from. No forms to fill in. The network may keep a small fee we can't recover, and we show you exactly how much.
    - **Tracked in plain words.** Waiting, converting, delivered, or on its way back. You always know where your money is.
  - **Card:** the existing `.tz-steps[data-status=failed]` with the "Didn't go through" pill and the Example tag: Got your 0.00213 ETH ✓ → Couldn't convert ✕ "The price of ETH moved too fast, so we stopped." → Sending it back to you (active, piedra) "To the wallet it came from · automatic".

### 7. Why Solana + USDC (`#why`, knot 06)
- **H2:** Real dollars, in a wallet *you own.* · **Lede:** No bank hours, no waiting for a transfer from abroad. Your tips arrive as digital dollars you can use the same day.
- **Cards** `.tzl-why__card` (1, 2 or 4 columns). Each has a giant `.tzl-why__big` glyph in a status colour, an `h3` and a `p`:
  - **1:1** (hierba) · **Dollars, not a rollercoaster.** USDC is a digital dollar designed to stay at $1. What your fans send is what you count, not a coin that swings overnight.
  - **~1 min** (añil) · **Arrives while you're still live.** Solana confirms in seconds. End to end, a tip usually lands in under a minute once the fan's payment is seen.
  - **¢** (brand) · **Near-zero network cost.** Moving USDC on Solana costs a tiny fraction of what most networks charge, so small tips still make sense.
  - **Yours** (maíz text) · **Your wallet, your money.** Tips go straight to the Solana wallet you choose. Spend it, save it, or cash out through an exchange or app you already use.
- **Credibility block** `.tzl-built` (night):
  - Overline "Under the hood", **Built with Solana and Aurora Intents**, *Tezeo designs the experience. Two open networks move the money.*
  - Two `.tzl-builder` rows with generic glyphs (no third-party logos):
    - **Solana:** Where your dollars land: USDC, in your own wallet.
    - **Aurora Intents:** The loom: turns the coin a fan holds into USDC on Solana.

### 8. What it costs (`#fees`, knot 07)
- **H2:** Honest prices, *before you pay.*
- **Big number** `.tzl-bigone`: **$1** (`.tzl-mega`, up to 176px, brand) + *is the smallest tip. Below that, network fees would eat the rest, and that's not fair to anyone.*
- **Receipt** `.tzl-receipt`: a white slip whose bottom edge is a zig-zag tear (the *z* of tezeo). Title "How fees work". Rows, each with a rombo bullet:
  - **Every fee is on the quote.** Before sending anything, fans see the network & swap cost and the service fee in dollars, and exactly what the creator receives.
  - **A small fixed cost on the Solana payout.** Delivering USDC to your wallet has a small fixed network cost. It's already counted in the quote.
  - **Refunds are itemised too.** If a tip comes back, you see what was returned and what the network kept.
- **Rule:** no Tezeo percentage, no "no fees" claim anywhere.

### 9. FAQ (`#faq`, knot 08)
- **H2 (centred):** Good questions, *straight answers.*
- **Markup:** `.tzl-faq` with `details > summary + .tzl-faq__a`. It works without JS. The first item is `open`. The marker is a cochinilla rombo that turns 180° and fills when open.
- **Questions and answers:**
  1. **Do fans need a wallet or an account?** They need a crypto wallet with some funds in it, on any supported network. They **don't** need a Tezeo account, a login or an email. They open your link, pick an amount and send.
  2. **Which coins and networks can fans pay with?** Around 200 coins on about 20 networks, including Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, NEAR, Sui, TON, Tron, Bitcoin and more. The live list comes from Aurora Intents, so it can grow or change. Fans only see options that work.
  3. **What happens if a payment fails?** The money goes back to the wallet it came from, automatically. If a fan sends a bit less than the quote, they can send the rest or we return what arrived. The network may keep a small fee we can't recover, and the refund screen shows exactly how much.
  4. **Who holds my money?** **You do.** Tips are delivered as USDC straight to the Solana wallet address you set up. Tezeo doesn't keep a balance for you, so there's nothing to withdraw from us.
  5. **How fast do tips arrive?** Usually under a minute once the fan's payment is seen. Some networks take longer to confirm the payment in the first place, Bitcoin for example. Fans and creators can both watch each stage live.
  6. **Is there a minimum tip?** Yes, **$1**. Below that, network fees would eat most of the tip. Every fee is on the quote before the fan pays.
  7. **What is the Membership Pass?** An optional 30-day pass a creator can offer. Fans pay once and get a Pass badge next to their name and a private pass link. There's no auto-renew: after 30 days it simply ends unless they get a new one.
  8. **Can I use it on stream?** Yes. Show your QR on screen, and add your alerts link to OBS as a **Browser Source**. A card pops up for every confirmed tip, with the fan's name and note. Keep that link private.
  9. **What do I need to create a page?** Your name, a handle, and a Solana wallet address where USDC should arrive. Add a photo, a colour and a message for your fans if you like.

### 10. Final CTA
- **Structure:** `section.tzl-final` (brand-soft background), then a full-bleed `.tz-weave` at 96px, then `.tzl-final__inner[data-reveal="knot"]`.
- **Content:** `.tz-knot` (120px) with a burst, then H2 `.tzl-mega` **Every tip is a thread.** ***Start weaving.***, then the lede *Make your page in a few minutes: a name, a handle and your Solana wallet. Then share the link.*, then the CTAs **Create my page** and **See how it works**.

### Footer
`footer.tzl-foot` (night) contains:
- The lockup, with the cochinilla-400 t-bar on night.
- *Tips from any wallet, delivered as dollars to yours. Tezeo comes from tejer, to weave: every tip is a thread.*
- Three link columns, each item with a 48px tap target:
  - **Product:** How it works, Pay from anywhere, For creators, For fans
  - **Help:** FAQ, Your money is safe, What it costs
  - **Start:** Create my page
- The base row: ♥ **Hecho con cariño en LatAm** · *Built on Solana · Converted by Aurora Intents* · *Creators and amounts shown on this page are examples.*

---

## 3. Animations

| Name | Element | Trigger | Duration / easing | Meaning | Reduced motion |
|---|---|---|---|---|---|
| Thread flow (`tz-thread-flow`, reused) | hero `.tzl-t` threads | load, loop | 1.9s, 2.2s or 2.6s linear (varied so it reads as weaving) | fans' coins moving toward the loom, left→right or top→bottom | stopped; static dashed threads |
| Out-thread stitch | `.tzl-out-stitch` | load, loop | 1.4s linear | dollars flowing on to the wallet | stopped |
| Loom eye rombo (`tz-spin-rombo`) | `.tzl-eye-rombo` | load, loop | 2.4s in-out | work in progress | stopped |
| Tip arrives (`tzl-arrive`) | hero `.tzl-tiprow--new`; dashboard row on reveal | load (hero, 1.2s delay) / `.is-in` | 1.2s ease-out, plays once; maíz flash settles to pending-bg | a new tip landing | static highlighted row |
| Toast in (`tz-toast-in`) | dashboard `.tz-toast` | `[data-reveal=toast].is-in` | 420ms spring, 500ms delay | new-tip notification | visible, no animation |
| Alert in (`tzl-alert-in`) | `.tzl-alert` | `[data-reveal=alert].is-in` | 700ms spring, 400ms delay | the OBS card popping on stream | visible, no animation |
| Goal fill | `.tzl-goal__bar > span` width transition | `[data-reveal=goal].is-in` | 1.4s ease-out | the band filling with tips | final width |
| How-it-works stitch (`tzl-stitch-down` / `-right`) | `.tzl-how__item::before` | loop | 1.1s linear | the one thread running between steps | static dashed thread |
| Loom (reused `.tz-loom`) | step 3 art | loop | 1.8s | converting | stops (components.css) |
| Status pills (reused) | pending pulse, converting turn | loop | 1.6s / 1.4s | in-progress states only | stop (components.css) |
| River marquee (`tzl-marquee`) | `.tzl-marquee__track` | loop; pauses on hover or focus | 60s, 70s, 85s linear, **left→right** | many chains streaming toward the creator | rows wrap into a static centred grid; the duplicate set is hidden; the edge mask and threads are removed |
| Fibre sway (`tz-fibre`, reused) | `.tzl-snap__fibre` | loop, alternate | 3.2s in-out | a calm frayed end, never shaking | stopped |
| Flow back (`tzl-flow-back`) | `.tzl-snap__home` | loop | 1.6s linear, dash moves **right→left** | the refund going back home | static dashed thread |
| Knot (reused `.tz-knot`) | final CTA | `.is-in` (replayed when in view) | 1.2s, plus the burst at 1.1s | the one celebration on the page | fully drawn, no burst |
| FAQ rombo | `summary::after` | open/close | 240ms spring | open state | no transition |
| Pass tilt | `.tzl-tile--pass .tz-pass` | hover | 420ms spring | playful | no transition |

There is one celebration per page (the final knot). Nothing else bursts.

---

## 4. SVG assets (all inline in `landing.html`)

| Asset | Where | Notes |
|---|---|---|
| Icon sprite | top of body | Taken from `preview.html` (check, x, return, copy, shield, clock, share, heart, list, brush, pass, help) plus new icons: menu, sun, moon, qr, chart, stream, target, users, arrow, user-off, chat, receipt. 24px grid, 2px strokes, round caps. In Next.js, add them to `src/components/sprite.ts`. |
| `#tz-mark`, `#tz-letters` | nav, steps, alert, seal, footer | Copied from preview.html (the lockup is built from symbols; `--pv-t` colours the t-bar). |
| Hero loom (horizontal) | `.tzl-loom-h`, viewBox 520×440 | Seven chain pills (SVG rect, glyph disc and name). Seven Béziers into the eye at (420, 220), each with a faint under-thread at 18% opacity. A 16px cochinilla out-thread with a cream stitch. |
| Hero loom (vertical) | `.tzl-loom-v`, viewBox 360×260 | Five pills on top, threads down to the eye at (180, 190), out-thread down. |
| Seal | `.tzl-seal`, viewBox 168 | `textPath` on a 62r circle with `textLength=384`. |
| Snapped thread | `.tzl-snap`, viewBox 1100×240 | See §6. |
| Mini loom | step 3 | Existing `.tz-loom` markup. |
| Sparkline | dashboard tile | `preserveAspectRatio=none`, `vector-effect: non-scaling-stroke`. |
| Into-arrow | `.tzl-into__arrow` | Dashed maíz line only (no head, so it doesn't stretch). |
| Builder glyphs | `.tzl-builder__g` | A generic rombo on a violet→green gradient for Solana, and a wave on añil for Aurora. These are **not** their logos. |
| Mock QR | `canvas.tzl-qrsvg` | Decorative and deterministic (same seed as preview.html), **not** scannable. In the app, use a real QR of the example or the creator's URL, or keep it marked as decorative. |

---

## 5. Accessibility notes

- Landmarks: a skip link (`.tzl-skip`), `header` / `main#main` / `footer`, and every `section` has `aria-labelledby` pointing at its h2. Nav regions have labels (Main, Main (mobile), Product, Help, Start).
- Exactly one `h1`. Section `h2`s, then card and step `h3`s.
- The theme toggle is a real `<button aria-pressed>` whose label switches between "Dark theme" and "Light theme". The mobile menu is a `<details>`, so it is keyboard and screen-reader native.
- Decorative art is `aria-hidden`.
  - The hero loom SVGs are `role="img"` with a full sentence label listing the chains.
  - Mock UIs (the example page, dashboard, stream and pass) are `role="img"` with an `aria-label` describing the example, so screen readers don't read fake buttons.
  - The non-interactive mock buttons are `<span>`s, not `<button>`s.
- The marquee has a real list in the first set (`aria-label`); the duplicate set is `aria-hidden`. Hover or focus pauses it. Under reduced motion it becomes a static wrap.
- The goal bar has `role="progressbar"` with the value attributes.
- Contrast: all text uses the semantic tokens audited in DESIGN.md §3.3.
  - Night panels use cream `#F7EFE6` and muted `#B9A9BF` on obsidiana (16.8:1 and 8.7:1).
  - Maíz-300 overlines on night are over 10:1.
  - Chain glyph discs carry redundant decorative text; the chain **name** next to each one is the accessible label.
  - The cream text on the cochinilla-500 "One thread" pill is 5.1:1.
- Touch targets: nav controls, the menu summary, CTAs, footer links and FAQ summaries (64px) are all at least 48px.
- Verified: no horizontal scroll at 320, 390 or 1440px (`scrollWidth === innerWidth`). At <360px the lockup collapses to the mark.
- `prefers-reduced-motion`: every loop stops, reveals show their final state, and smooth scrolling is turned off (see §3).
- Status is never colour-only: pills carry their rombo shape plus words, the life-strip stages carry words, and the failed steps carry ✕ and text.

---

## 6. Porting notes (Next.js)

- Put `landing.css` in the global CSS after `components.css`, or convert it to a CSS module that keeps the class names.
- `src/app/page.tsx` becomes a server component made of section components.
  - Only these need a client island: the theme toggle, the reveal observer, and the menu-close helper. Everything else is static.
- Reuse what already exists: `Weave`, `Mark`, `Icon` and `PassCard` from `src/components/*`.
  - The OBS alert mock should mirror `Alerts.tsx`.
  - The goal bar can become the real component for `.tzs-goal` if you want the woven look on creator pages too (optional).
- Keep **"Example"** tags and the footer disclaimer on every mock that shows a creator name or an amount.
