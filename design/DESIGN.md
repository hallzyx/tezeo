# Tezeo Brand Book & Design Spec (v1.0)

> **Every tip is a thread. Tezeo weaves them together.**

Files in this folder:

| File | What it is |
|---|---|
| `logo-mark.svg` | Primary mark (app icon / favicon): two threads crossing on a cochinilla tile |
| `logo-mark-mono.svg` | Single-colour mark (`currentColor`, mask-based gap, works on any background) |
| `logo-wordmark.svg` | Mark + hand-drawn `tezeo` lettering; switches to dark-mode colours via `prefers-color-scheme` |
| `logo-wordmark-mono.svg` | Single-colour lockup (`currentColor`) |
| `tokens.css` | All design tokens: palette, light/dark semantics, status colours, creator accent, type, space, radii, shadows, motion |
| `components.css` | Framework-agnostic `tz-` component classes and signature animations |
| `preview.html` | Living style guide and screen mocks. Open it in a browser and use the Light/Dark toggle and the accent picker |
| `screenshots/` | Rendered previews: mobile (390px) and desktop (1440px), light and dark |

---

## 1. Concept

### 1.1 The name

**Tezeo** comes from *tejer* (to weave) plus **-eo**, the Spanish suffix for a continuous, rhythmic action. You hear it in *goteo* (dripping), *tecleo* (typing) and *zapateo* (the stamping folk dance). So *Tezeo* means "the steady weaving": small acts of support, tip after tip, that add up to a creator's livelihood. The **z** in place of the *j* is a zig-zag stitch. That stitch shows up in the wordmark and across the UI.

The weaving metaphor also fits how the product works:

| Product truth | Weaving story |
|---|---|
| Fans pay from *any* chain (ETH, Base, Arbitrum, BTC…) | Many threads of different colours |
| Aurora Intents swaps them cross-chain | The loom |
| Creator always receives USDC on Solana | One strong thread, one fabric |
| A community of small tips | A textile is many small crossings |
| Latin American creators | Andean and Mesoamerican weaving: aguayo cloth, rombo (diamond) motifs, cochineal dye |

### 1.2 Personality

- **Warm, like a neighbour, not like a bank.** It talks the way a friend explains things.
- **Crafted.** Hand-made details such as stitches, knots and rombos. It is never ornate or folkloric kitsch.
- **Calm under pressure.** Errors are explained, never blamed. "Your money is safe" always comes before "what went wrong".
- **Proudly Latin American.** It uses the region's colour and craft without leaning on stereotypes (no sombreros, no generic "fiesta").

### 1.3 Voice & tone

UI copy is English for now. The voice should still feel warm and human, and one Spanish word is welcome at an emotional peak ("¡Gracias!"). The rules:

1. **Say what is happening to the money, in human words.** Say "dollars", "your wallet", "on its way". Never say "intent", "slippage", "bridge", "gas" or "settlement" in the fan flow.
2. **Name the creator.** "Vale receives", not "Recipient receives".
3. **Lead with safety in bad news.** Say it's safe, say what happened, then say what to do.
4. **Short sentences. Contractions. No exclamation spam.** Use at most one "!" per screen.
5. **Never blame the fan.** Write "The price moved too fast", not "You sent the wrong amount".

| Moment | Avoid | Tezeo says |
|---|---|---|
| Creator page CTA | Submit payment | **Send $5 to Vale** |
| Trust line | Multi-chain cross-chain swap supported | **Pay from any wallet, any chain. Vale gets dollars.** |
| Chain picker title | Select source chain | **Where's your money?** |
| Chain helper | — | **Not sure? Pick the network your wallet app shows at the top. You can't pick wrong. We'll check before you send.** |
| Quote title | Quote | **Here's the deal** |
| Quote total | Net amount | **Vale receives 4.72 USDC** |
| Quote expiry | Quote TTL 60s | **Price held for 0:58. If it runs out, we'll refresh it, no harm done.** |
| Deposit | Deposit address | **Send exactly 0.00213 ETH on Ethereum, to:** |
| Pending | Awaiting on-chain confirmation | **Waiting for your payment.** It usually shows up in a minute or two. |
| Converting | Executing swap | **We're weaving your ETH into dollars for Vale.** You can close this tab, we'll keep going. |
| Received | Payment successful | **You just made Vale's day.** |
| Failed | Swap execution failed (slippage) | **The thread snapped, but your money is safe.** The price of ETH moved too fast, so we stopped before anything was lost. |
| Refund in progress | Refund initiated | **Sending it back to you.** Automatic, about 5 minutes. |
| Refunded | Refund complete | **Your money is back home.** |
| Underpaid | Insufficient amount | **We got 0.0019 ETH, a bit less than the 0.00213 we needed.** Send the remaining 0.00023 ETH, or we'll return what arrived. |
| Quote expired | Quote expired | **Prices moved while you were away.** Here's a fresh quote. |
| Empty dashboard | No data | **Your first thread is on its way.** Share your page and the first tip will show up here, live. |
| New tip toast (creator) | Incoming transfer | **New tip from Ana · 4.72 USDC** |
| Min amount error | Invalid amount | **The smallest tip is $1. Network fees would eat the rest.** |

---

## 2. Logo

### 2.1 The mark: *El Cruce* (the crossing)

Two threads come in from opposite sides. A **maíz** (gold) thread comes from the left and an **algodón** (cream) thread from the right. They curve down and cross once, cream over gold, to make a **T**. The small gap where one thread passes over the other is the brand's signature detail. That over-under is what weaving is.

- Built on a 64×64 grid with a 16px tile radius. Threads are 7.5u wide with round caps.
- The two threads stand for fan and creator, or any chain and Solana. One crossing means one transaction.
- At 16px it still reads as a two-tone T on a carmine square, which makes it a strong favicon.

### 2.2 Wordmark

`tezeo` is drawn as monoline lowercase strokes in the same thread weight as the mark (7u, round caps and joins). It is not typeset, so it can't be replaced by a font. Three details:

- The **t**'s crossbar is a cochinilla thread that passes *under* the stem, which echoes the mark.
- The **z** is a zig-zag stitch.
- The **e e o** rhythm is the "-eo" of the name, an ongoing beat.

### 2.3 Usage

| Do | Don't |
|---|---|
| Use the tile mark as app icon, favicon or avatar | Recolour the threads, or swap which thread is on top |
| Keep clear space of ¼ of the mark's width on all sides | Rotate, skew, outline or add a third thread |
| Use `logo-mark-mono.svg` on photos, merch and one-colour print | Put the colour tile on a busy photo |
| Use the dark-mode wordmark (cream letters, `#FF5C8F` t-bar) on obsidiana | Put cochinilla letters on a cochinilla background |
| Keep the minimum size at 16px for the mark and 72px wide for the lockup | Typeset "Tezeo" in a font next to the mark |

Inline `-mono` SVGs and set `color`. When loaded as `<img>`, `currentColor` falls back to black.

---

## 3. Colour

The palette is named after the dyes and fibres of the region. Raw palette tokens (`--tz-cochinilla-500` and so on) live in `tokens.css §1`. Components only use **semantic tokens** (`--tz-brand`, `--tz-text`, `--tz-received-fg`…).

### 3.1 Core palette

| Name | Hex | Role |
|---|---|---|
| **Cochinilla 500** | `#D1245A` | Brand primary: CTA, mark tile, weave band. Carmine from the cochineal insect dye of Oaxaca and the Andes. |
| Cochinilla 600 | `#B0184A` | Hover, brand text on light |
| Cochinilla 400 | `#FF5C8F` | Brand on dark |
| **Maíz 400** | `#FFC23D` | The gold thread: celebration, highlights, pass meter |
| Maíz 500 | `#F2A900` | Pending line |
| **Añil 500** | `#5B4FE0` | Indigo: "in motion" / converting, focus ring |
| **Algodón 50** | `#FBF6EE` | Page background (light) |
| Algodón 0 | `#FFFFFF` | Surface (light) |
| Algodón 200 / 300 | `#EADFCF` / `#D9CBB8` | Borders |
| **Tinta** | `#1C1424` | Body text (light) |
| Obsidiana 500 | `#5E5266` | Muted text (light) |
| **Obsidiana 900** | `#120D18` | Page background (dark), "night" |
| Obsidiana 800 / 700 | `#1C1523` / `#261D2E` | Surfaces (dark) |
| Cream | `#FFF7EC` | The algodón thread, text on night |

### 3.2 Status colours

Each status has three tokens: `fg` (text/icon), `bg` (tint/pill) and `line` (thread/dot). A status is **never** shown by colour alone. It always has its own shape and its own words.

| Status | Name | Light fg / bg / line | Dark fg / bg / line | Shape cue |
|---|---|---|---|---|
| Pending | Maíz | `#8A5A00` / `#FFF1CC` / `#F2A900` | `#FFC23D` / `#3A2C0E` / `#FFC23D` | Pulsing rombo |
| Converting | Añil | `#3E32C8` / `#ECEAFF` / `#5B4FE0` | `#A9A2FF` / `#221E4A` / `#A9A2FF` | Turning rombo, running stitch |
| Received | Hierba | `#0B6B44` / `#DDF5E8` / `#12A065` | `#4FD69A` / `#0E2F22` / `#4FD69A` | Solid rombo, solid thread, ✓ |
| Failed | Arcilla | `#A33116` / `#FDE4DC` / `#D9481F` | `#FF8A6B` / `#3A1710` / `#FF8A6B` | Frayed "≡", broken thread, ✕ |
| Refunded | Piedra | `#3F5D78` / `#E3EBF3` / `#5A7D9C` | `#9CC0E0` / `#182633` / `#9CC0E0` | Return loop ↺ |

Arcilla (failed) is deliberately an **orange brick**, far in hue from brand cochinilla, so an error never looks "on brand" and the brand never looks like an error.

### 3.3 Contrast (WCAG 2.x, computed)

All ratios were computed with the WCAG relative-luminance formula.

| Pair | Ratio | Passes |
|---|---|---|
| Tinta `#1C1424` on Algodón `#FBF6EE` | **16.61** | AAA |
| Tinta on white | 17.87 | AAA |
| Muted `#5E5266` on Algodón | **6.79** | AA (AAA large) |
| Muted on white | 7.31 | AAA |
| Faint `#8C7F92` on Algodón | 3.51 | Large text / decorative only |
| White on Cochinilla `#D1245A` (primary button) | **5.11** | AA |
| Cream `#FFF7EC` on Cochinilla (mark threads) | 4.81 | AA |
| White on Cochinilla 600 `#B0184A` (hover) | 6.83 | AA |
| Cochinilla 600 on Algodón (brand text/links) | **6.35** | AA |
| Tinta on Maíz `#FFC23D` | 11.10 | AAA |
| White on Añil `#5B4FE0` | 5.77 | AA |
| Pending `#8A5A00` on `#FFF1CC` | 5.28 | AA |
| Converting `#3E32C8` on `#ECEAFF` | 7.13 | AAA |
| Received `#0B6B44` on `#DDF5E8` | 5.72 | AA |
| Failed `#A33116` on `#FDE4DC` | 5.75 | AA |
| Refunded `#3F5D78` on `#E3EBF3` | 5.72 | AA |
| White ✓ on Hierba `#12A065` (knot icon, non-text) | 3.36 | ≥3:1 graphics |
| Failed line `#D9481F` on Algodón (non-text) | 3.99 | ≥3:1 graphics |
| **Dark:** text `#F7EFE6` on `#120D18` | **16.82** | AAA |
| Text on surface `#1C1523` | 15.62 | AAA |
| Muted `#B9A9BF` on `#120D18` / `#1C1523` | 8.66 / 8.04 | AAA |
| Faint `#8A7A92` on `#120D18` | 4.81 | AA |
| Night `#120D18` on Cochinilla 400 `#FF5C8F` (dark primary button) | **6.55** | AA |
| Cochinilla 400 on `#1C1523` (brand text, dark) | 6.08 | AA |
| Pending / Converting / Received / Failed / Refunded fg on bg (dark) | 8.43 / 6.87 / 7.88 / 6.95 / 8.09 | AA–AAA |

In dark mode the primary button flips to **dark text on a lighter pink** (`#FF5C8F`). A white-on-`#D1245A` button on near-black glows too much and reads as an alert.

### 3.4 The creator accent

Creators pick **one** accent colour. The accent personalises *their* zone and Tezeo keeps the rest.

**The accent paints:** the rombo row in the weave band, the avatar ring, the selected amount tile, the "Vale receives" total row, the handle, the fan-note card and the pass glow.
**The accent never paints:** the primary CTA, status colours, focus ring, error states or the mark. That's how the page stays recognisably Tezeo with any colour.

How it's made safe (`tokens.css`, *CREATOR ACCENT* block):

```html
<main class="tz-creator" style="--creator-accent: #E8FF3A">…</main>
```

| Token | Light | Dark |
|---|---|---|
| `--creator-accent-fill` | OKLCH L clamped to **≤ 0.52**, chroma ≤ 0.20 | L **≥ 0.76**, chroma ≤ 0.17 |
| `--creator-accent-ink` (text on fill) | `#FFFFFF` | `#120D18` |
| `--creator-accent-text` (text on page) | L ≤ 0.50 | L ≥ 0.78 |
| `--creator-accent-soft` (tint) | L 0.95, chroma ≤ 0.05 | L 0.27, chroma ≤ 0.06 |

The derived tokens must be re-declared where the accent is set. That's why the selector is `:root, .tz-creator`. Always put the accent on a `.tz-creator` wrapper.

Values measured in Chromium (`--creator-accent-fill` with ink, and `-text` on the page):

| Accent picked | Light: ink on fill / text on bg | Dark: ink on fill / text on bg |
|---|---|---|
| Turquesa `#1A9E8F` (default) | 5.11 / 5.14 | 9.32 / 10.03 |
| Violet `#7C3AED` | 6.01 / 6.13 | 8.20 / 8.79 |
| Sky `#0EA5E9` | 5.19 / 5.22 | 9.04 / 9.65 |
| Orange `#F97316` | 5.89 / 5.99 | 8.18 / 8.58 |
| Neon yellow `#E8FF3A` | 5.24 / 5.30 | 17.08 / 17.08 |
| Black `#111111` | 18.88 / 17.55 | 8.93 / 9.55 |
| Hot pink `#FF66CC` | 6.17 / 6.27 | 8.25 / 8.82 |

Text on the soft tint stayed ≥ 4.83 in every case.

**Server-side guard.** Relative colour needs Chrome 119, Safari 16.4 or Firefox 128. Older browsers fall back to the raw value, so validate on save as well:

1. Parse the hex. Compute WCAG contrast of `#FFFFFF` on it.
2. If it's < 4.5, darken in OKLCH (lower L in 0.02 steps) until it's ≥ 4.5. Store that as `accent_light`.
3. Compute contrast against `#120D18`. If it's < 4.5, lighten until it passes. Store that as `accent_dark`.
4. Reject accents within ΔE(OKLab) < 0.08 of Arcilla `#D9481F` or Hierba `#12A065`, so the accent can't be mistaken for a status. Suggest the nearest safe hue.
5. Show the creator a live preview of their page in both themes before saving.

---

## 4. Typography

| Role | Family | Weights | Why |
|---|---|---|---|
| Display, amounts, headings | **Bricolage Grotesque** (opsz 12–96) | 700, 800 | Its quirky ink-traps look cut by hand. It's warm and characterful without being cute, and the optical sizes keep big numbers tight. |
| UI & body | **Instrument Sans** | 400, 500, 600, 700 | Clean and slightly humanist, very legible at 14–16px on cheap Android screens |
| Addresses, tx IDs | **JetBrains Mono** | 400–600 | Unambiguous 0/O and 1/l for anything people copy |

All three are free Google Fonts (OFL).

```css
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap");
```

```ts
// Next.js
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage" });
const body    = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const mono    = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
// <html className={`${display.variable} ${body.variable} ${mono.variable}`}> — tokens pick these up.
```

**Scale.** Body is 16px. It's fluid for headings and amounts.

| Token | Size | Use |
|---|---|---|
| `--tz-text-2xs` | 11 | Overlines (uppercase, +0.12em) |
| `--tz-text-xs` | 12 | Meta, timestamps |
| `--tz-text-sm` | 14 | Secondary text, table |
| `--tz-text-md` | 16 | Body, inputs (never smaller on inputs, to avoid iOS zoom) |
| `--tz-text-lg` | 18 | Card titles |
| `--tz-text-xl` | 20→24 | H2 |
| `--tz-text-2xl` | 24→32 | H1, totals |
| `--tz-text-3xl` | 32→48 | Big amounts, dashboard stats |
| `--tz-text-4xl` | 40→72 | Thank-you headline only |

Rules:

- Numbers always use `font-variant-numeric: tabular-nums`.
- Show fan currency with its unit ("0.00213 ETH"), and creator money as "USDC" (on the creator side) or "$" (on the fan side).
- Display text uses tracking −0.025em.

---

## 5. Layout & grid (mobile first)

- **Fan flow:** a single column, max **480px** (`--tz-column`), with a **16px** gutter. Most fans arrive from a QR code or a link in bio, on a phone.
- **4px spacing base.** Use 16 between fields, 20–24 between groups, 32+ between sections.
- **Touch targets ≥ 48px.** Chips are 44px. Amount tiles are 72px.
- **Primary CTA:** full width, 56px (`tz-btn--lg tz-btn--block`), always the last element in the flow. On mobile, pin it to the bottom with safe-area padding once the content scrolls.
- **Dashboard:** a 220px sidebar plus a fluid main area up to 1152px (`--tz-container`). Below 860px the sidebar becomes a bottom tab bar. Below 640px, table rows stack into cards (`tz-table--stack`).
- **Radii:** 14 for inputs and chips, 20 for cards, 28 for sheets. Pills are reserved for status and chips.
- **Shadows** are tinted with ink (hue 330) and never neutral grey. Primary buttons get a cochinilla glow.

---

## 6. Signature elements

| Element | Class | Description |
|---|---|---|
| **El tejido** (weave band) | `.tz-weave` | Aguayo-style stripes: cochinilla / maíz / accent, with a row of hollow rombos on the accent stripe and zig-zag stitches on the outer stripes. It tops every creator page and the thank-you screen (`--slim`). You can recognise the brand from this alone. |
| **Stitched button** | `.tz-btn--primary` | A dashed inner seam 4px inside every primary button. |
| **Rombo** | `.tz-rombo`, pill dots, chip knot | The Andean diamond replaces the generic dot everywhere: status dots, bullets, selected-chip knot, QR corners, confetti. |
| **Running stitch** | `.tz-stitch`, quote leaders, toast edge | Dashed or dotted lines read as stitches, not as UI chrome. |
| **The loom** | `.tz-loom` | The loader. Three dyed threads flow into one eye and a single cochinilla thread leaves toward "USDC". |
| **The knot** | `.tz-knot` | The success moment. The two threads of the logo draw in, cross, the tile springs and rombos burst. |
| **The fray** | `.tz-fray` | The failure illustration. Two threads with gently swaying broken fibres. Calm, not alarming. |

---

## 7. Screen-by-screen spec

All screens use the 480px column. The labels A–I match `preview.html` and `screenshots/`.

### A. Creator page — `/@handle`

Layout, top to bottom:

1. A 96px **weave band**, full-bleed.
2. A 96px **avatar** in a conic ring (accent → maíz → cochinilla) that overlaps the band by 52px.
3. Name (Display 800, 2xl), **@handle** in accent text, and a one-line bio.
4. The creator's **message** in a speech card with an arrow pointing to the avatar.
5. The *Send Vale a tip* overline, then **3 amount tiles** ($3 "a cafecito", $5 "lunch", $15 "big hug". Creators can rename the labels). One is preselected, and selected uses the accent fill. A "Other amount" field sits below.
6. The primary CTA, **"Send $5 to Vale"**. The label updates live with the amount.
7. The trust line, with a shield icon: *"Pay from any wallet, any chain. Vale gets dollars."*
8. The footer, *"woven by tezeo"*, with a 16px mark.

On desktop, the QR card ("Scan to tip Vale") sits beside the column. On mobile it lives behind a "Share" icon in the top bar. The QR uses `.tz-qr`, with accent and cochinilla rombo corners.

### B. Choose how to pay

1. A back button and a 4-segment progress bar (cochinilla).
2. The mini creator chip "$5 for Vale · Change amount" on an accent-soft background.
3. H1 *"Where's your money?"*
4. **Network** chips, then **Coin** chips. Chips show coin colour, name and (when a wallet is connected) the balance. Selected chips get a cochinilla border and tint plus a rombo knot. Popular networks come first, then "+9 More" opens a searchable sheet.
5. Helper copy: *"Not sure? Pick the network your wallet app shows at the top…"*
6. CTA *"See the quote"*.

Coin chips only show coins that are valid on the chosen network. Unsupported pairs are hidden, never shown disabled.

### C. Quote & deposit

1. H1 *"Here's the deal"*.
2. A `tz-quote` list: You send / Network & swap / Tezeo (2%), with dotted stitch leaders and tabular figures.
3. The **total row** *"Vale receives 4.72 USDC"* in accent-soft, at 2xl, in accent text. This is the creator-first number.
4. The deposit card (sunken). A QR on the left. On the right, *"Send exactly 0.00213 ETH on Ethereum, to:"*. The address is in mono inside a dashed `tz-copy` box with a copy button. Tapping it copies and shows the toast "Address copied".
5. The expiry note with clock: *"Price held for 0:58. If it runs out, we'll refresh it, no harm done."*
6. CTA *"I've sent it"*. Detection is automatic anyway, so this is a reassurance step.

**Quote expired:** the timer reads 0:00. The total row dims to 50% with the label "Refreshing…", and the new numbers fade in with a 240ms highlight on any value that changed.

### D. Status tracking

1. A status pill plus an ETA ("~40 s left").
2. A headline that changes with the state:
   - Pending: *"Waiting for your payment"*
   - Converting: *"We're weaving your ETH into dollars for Vale"*
3. **The loom.** It loops while converting. In the pending state the outgoing thread is a faint dashed guide.
4. A 3-step **thread timeline** (`tz-steps`): *Got your 0.00213 ETH*, then *Weaving it into USDC*, then *Delivered to Vale*. The active step's connector is a moving running stitch.
5. *"While you wait — leave Vale a note?"* A textarea (140 characters) that turns waiting time into a warm moment.
6. Persistent copy: *"You can close this tab — we'll keep going."* Also offer "Email me when it's done".

`aria-live="polite"` announces each step change, for example "Step 2 of 3: weaving it into USDC".

### E. Thank-you (the brand moment)

1. A slim weave band at the top.
2. **The knot** animation at 112px. The gold thread draws first, then the over-under gap appears, then the cream thread draws over it, the tile springs, and accent / maíz / cochinilla rombos burst (1.1s).
3. The pill "Delivered" rises in, then the Display 4xl headline *"You just made Vale's day."*
4. *"**4.72 USDC** just landed in Vale's wallet. Your thread is part of her story now."*
5. The fan's note, echoed back in an accent-soft card.
6. CTA *"Tell your friends about Vale"* (share sheet), plus the ghost button "Back to Vale's page".

Haptics: one light tap (`navigator.vibrate(12)`) when the knot closes, only if the user has interacted.

### F. Failed (refund in progress)

This state gets the same care as the happy path.

1. **The fray** illustration in a circle of arcilla tint. The gold thread is the fan's money and the cochinilla thread is the creator's side, with a gap between them.
2. The pill "Didn't go through".
3. H1 *"The thread snapped — but your money is safe."*
4. A plain-language cause, for example: *"The price of ETH moved too fast while we were converting, so we stopped before anything was lost. We're sending it back automatically."*
5. The timeline. "Got your ETH" turns neutral, and "Couldn't convert" shows an arcilla ✕ with a frayed connector. "Sending it back to you" is active in piedra, with destination and ETA.
6. CTA *"Try again with a fresh quote"*, plus the ghost button "Talk to a human" (help).

Cause-specific copy (keep the structure the same):

- **Price moved:** see above.
- **Underpaid:** *"We got a bit less than needed. Send 0.00023 ETH more within 30 min, or we'll return what arrived."* Offer a "Return it now" action.
- **Wrong network/token:** *"This arrived on Polygon, but the quote was for Ethereum. We'll send it back to the address it came from."*
- **Timeout / route unavailable:** *"No route could deliver it right now. Nothing was converted, and it's on its way back."*

Never show raw error codes in the main UI. Put them in a collapsible "Details for support" section with a copyable reference ID in mono.

### G. Refunded

1. A return-loop illustration (the gold thread U-turns, with a piedra arrow).
2. The pill "Refunded", then H1 *"Your money is back home."*
3. Explain exactly what came back and what didn't: *"We returned **0.00209 ETH** to the wallet it came from. The network kept 0.00004 ETH (about $0.08) in fees. We couldn't get that part back."*
4. A receipt card: You sent / Network fee / Returned (piedra) / To (mono).
5. CTA *"Try again"*, plus "View the refund transaction" (explorer link).

### H. Membership Pass (Phase 2)

1. The mini creator chip, *"Vale's Pass · 30 days of being part of the crew"*.
2. **Pass card** (`tz-pass`): a night background with an accent glow, a woven selvedge on the left edge (cochinilla / maíz / accent with cream rombos), the overline "Membership pass", the title "Vale's Crew", the holder and expiry, a big days counter, and a stitched maíz meter.
3. Benefits listed with accent rombo bullets. Include *"No auto-renew. We'll remind you on day 27."*
4. A message field, *"Message with your pass"*.
5. CTA *"Get the pass · $12"*. After that the flow is the same as C, D and E. On the thank-you screen, the headline becomes *"Welcome to Vale's Crew."* and the pass card flips in.

States: active (meter = days left / 30), expiring (≤ 3 days, meter turns cochinilla, "Renew" CTA), expired (`data-state="expired"`, desaturated).

The inline `tz-badge` "PASS" appears next to the fan's name in the dashboard and in tip lists.

### I. Creator dashboard

1. Sidebar: lockup, Home / Tips / Passes / My page. Active items are cochinilla-soft. On mobile this becomes a bottom tab bar.
2. Header: date overline, *"Good evening, Vale"*, and "Share my page".
3. Stats row:
   - **Received this month** on an inverse card (night in light theme, cream in dark), with the amount in 3xl and a maíz sparkline.
   - Tips count with delta (hierba).
   - Active passes.
4. **Latest tips** table: Fan (avatar, name, badge, first words of the note) / Date / Paid with (coin · network) / **You got** (USDC, tabular, right-aligned) / Status pill.
   - In-progress tips show "Converting" and a header pill "1 on its way".
   - Refunded tips show "—" in the amount column.
5. **Live:** a new tip slides in at the top with a 1.2s maíz row highlight and a toast *"New tip from Ana · 4.72 USDC"*.
6. **Empty state:** `tz-empty`, *"Your first thread is on its way"*, with the CTA "Copy my link".

**My page** editor (not mocked): avatar upload, accent picker with a live preview in both themes plus contrast guard (§3.4), message (160 characters), and amount labels. The weave band, CTA colour and status colours are not editable. That's the identity contract.

---

## 8. Motion

| Principle | Meaning |
|---|---|
| **Threads move forward** | Motion always flows left→right or top→bottom, toward the creator. |
| **Work loops, results settle** | Only in-progress states loop (loom, running stitch, turning rombo). Done states are still. |
| **One celebration per flow** | The knot burst happens once, on success. Nothing else confettis. |
| **Errors don't shake** | Failure is calm: a slow fibre sway, no red flashes or shaking. |
| **Fast UI, slow moments** | UI is 80–240ms. Brand moments are 1.2–1.8s. |

Tokens:

- Durations: `--tz-dur-instant` 80ms (press), `-fast` 160ms (hover), `-base` 240ms, `-slow` 420ms (step change, sheets), `-weave` 1800ms (loom loop), `-moment` 1200ms (knot).
- Easings: `--tz-ease-out` (enter), `--tz-ease-in-out` (threads), `--tz-ease-spring` (knot, chip select), `--tz-ease-in` (exit).

Keyframes live in `components.css §17`. Under **`prefers-reduced-motion: reduce`**, all loops stop and the knot renders fully drawn with no burst. Durations collapse to 1ms. Meaning is always carried by colour + shape + words, never by motion alone.

---

## 9. Accessibility checklist

- [ ] Text contrast is ≥ 4.5:1 (body) and ≥ 3:1 (large text and graphics) in both themes. See §3.3. Faint text is only for decorative or redundant info.
- [ ] Creator accent goes through the OKLCH clamp **and** the server-side guard (§3.4).
- [ ] Status is never conveyed by colour alone: each has a distinct shape (rombo / turning / ✓ / ≡ ✕ / ↺) and a text label.
- [ ] Status changes are announced via `aria-live="polite"`. Failure uses `role="alert"` once, not on every poll.
- [ ] The stepper is an `<ol>`, and the active step has `aria-current="step"`.
- [ ] Chips and amount tiles are `<button aria-pressed>` inside a `role="group"` with an `aria-label`.
- [ ] Inputs have visible `<label>`s, `aria-invalid` and `aria-describedby` pointing at the error. Errors use an icon plus text.
- [ ] The focus ring (`--tz-ring`, añil, 2px with offset) is visible on every interactive element and never removed.
- [ ] Touch targets are ≥ 48px (chips 44px with 8px spacing).
- [ ] Input font is ≥ 16px (no iOS zoom). Amounts use `inputmode="decimal"`.
- [ ] Addresses are in mono, with a copy button labelled "Copy address". Show the full address, never only a truncated one, before payment.
- [ ] The quote timer is not announced every second. Announce it at 10s left and on expiry only.
- [ ] `prefers-reduced-motion` is honoured (§8). No content depends on animation finishing.
- [ ] Decorative SVGs have `aria-hidden="true"`. The loom has `role="img"` and a label ("Converting your payment into USDC").
- [ ] Copy is plain language at roughly a grade 6 reading level, with no crypto jargon in the fan flow. A "Details for support" disclosure holds technical info.
- [ ] Both themes are tested. Never hard-code white or black in components; use tokens.
- [ ] Layout is tested at 320px width and at 200% zoom with no horizontal scroll.
