# Tezeo Creator Onboarding Review: From "Create my page" to the First Tip

Scope: the landing CTA "Create my page" → `/onboarding` → "You're live" → the first dashboard visit, plus how a new creator learns what to do next, and the empty states.

I reviewed it against the running demo at `localhost:4300`, driving the real UI with Playwright. I looked at screens at 320, 390, 768, 1024, 1440 and 1920px, light everywhere and dark for the key screens.

Prototype: `design/onboarding.html` + `design/onboarding.css` (every new class is `ob-`; it builds on `tokens.css`, `components.css` and `flow.css`).
- Open one screen with `?screen=you|look|look-guard|wallet-help|wallet|live|dashboard|states`.
- Add `&theme=dark` for dark. Add `&clean=1` to hide the viewport notes. `&shot=1` makes docks static for full-page captures.
- Each screen carries a viewport note saying what changes at each breakpoint.
- Mateo Quispe, `@mateodraws`, Violeta and the wallet are examples. The wallet is the demo's sample address.

Screenshots: `design/screenshots/onboarding-<screen>-<before|after>-<mobile|desktop|tablet|320|1920>-<light|dark>[-viewport].png`. "Before" is the live app; "after" is the prototype. `-viewport` files show only what fits on a 390×844 screen without scrolling.

Note on FLOW.md §2.8: the onboarding part of the earlier flow review (side-by-side preview, CTA copy) was **not built**. The live `/onboarding` is still the single-column form. This document supersedes §2.8. It keeps §2.8's phone preview (`.fl-phone`, `.fl-seg`) and builds on it.

Product rules respected throughout:
- No accounts, email or passwords. The private dashboard link stays the creator's identity.
- No WalletConnect.
- The fan sees only what they pay; costs live in the creator's dashboard.
- Tokens, components and signature elements are unchanged. Motion is CSS-only and respects reduced motion.
- Anything that needs the server to change is marked **needs backend** and sized.

---

## 1. Findings, ranked

Impact: **H** high · **M** medium · **L** low. Size: **S** small (copy/CSS/a few lines) · **M** medium (new component or flow logic) · **L** large.
**BE** = needs backend work (sized in the row).

| # | Screen | Viewport | What's wrong | Fix | Impact | Size |
|---|---|---|---|---|---|---|
| 1 | You're live | all | **The private dashboard link can be lost in one tap.** It sits in a muted sunken card, the same weight as the wallet notice, below the fold at 390×844 (its top edge is at y≈700). The primary button "Go to my dashboard" leaves without any save step. The screen is client-only React state, so **a refresh or Back wipes it**: the form comes back empty and the link is gone for good. | A **save card** (`.ob-keep`), first after the headline, with an "Only shown once" tag. Three save actions: **Download a backup file** (a client-side `.txt`), **Copy link**, **Send to myself** (system share sheet). "Go to my dashboard" lives *inside* the card and waits for a required tick: "I've saved it somewhere safe". Keep the result in `sessionStorage` so refresh and Back restore it. Warn on `beforeunload` until it's saved. §2.6 | H | M |
| 2 | Form | 390 (any scrolled view) | **Server errors are invisible.** "That handle is taken" (409) and the colour rejection (422) are written next to fields far above the button. After tapping "Create my page" the page stays scrolled at the bottom (`scrollY` 405) and focus is on `<body>`. Nothing visibly happens. | Map every server error to its field, go to that field's step, scroll it into view, focus it, and announce it. Never leave focus on `<body>`. §2.5 | H | S |
| 3 | Wallet field | all | **The highest-stakes field gets the least help.** It's the last field in a long form. It's one line, so a 44-character address is cut off and can't be checked. There's no "where do I find it". The error fires on the first keystroke ("GBR7vw" → red "doesn't look like a Solana address"). An Ethereum `0x…` address gets the same generic error. | A dedicated step 3, "Where should your tips land?". A 2-line mono box that always shows the whole address, a **Paste** button, and validation on paste or blur only. Specific errors for Ethereum, the USDC coin address, non-addresses and a pasted recovery phrase. Plain-language help tabs (Phantom, Solflare, An exchange). A "Never paste these" list. A **read-back** in 4-character groups with the first and last groups inked, plus a required "This is my own wallet" tick. §2.4 | H | M |
| 4 | Wallet field | all | **The USDC coin address passes the browser check**, then the server says "That doesn't look like a valid Solana address". That's untrue (it *is* valid; it's a coin, not a wallet). It also shows in a generic red note at the bottom while the field's hint still says "Double-check it…". | Share one `walletProblem(addr)` helper (in `lib/domain.ts`, used by browser and server) that returns a reason code: `eth`, `token`, `phrase`, `format`. Show "That's the address of the USDC coin itself, not a wallet." on the field. The API adds `field: "wallet", code` to its 400. **BE: S** (response shape only). | H | S |
| 5 | After creation | — | **Nothing can be changed later.** There is no profile editor. "My page" in the dashboard opens the public page. A wallet typo means tips go to the wrong place forever, and the UI never says so. | Short term (copy, no backend): tell the truth at the moment it matters: "For now your link and wallet can't be changed after this, so take a second." Long term: **BE: M**: `PATCH /api/dashboard/:token/profile` for name, message, photo and colour. Changing the wallet should also require pasting the old wallet's first and last four characters. | H | S (copy) / M (BE) |
| 6 | Form | ≥1024 | A 448px form column in a huge empty page. The "live preview" is two 160px tiles showing only "@handle $5". On desktop the creator never sees their page until it's live. | Step card (544px) beside a **sticky phone preview of the real page** (384px; 416px at ≥1440): weave, avatar, name, handle, bubble, tiles, CTA, trust line, with its own Light/Dark switch. Phones get a compact "peek" on step 1 and both themes side by side on step 2. §2.1 | H | M |
| 7 | Form | all | **No sense of length or of what's needed.** It's one long form of 6 fields, and the wallet, the one thing many creators must go and fetch, is a surprise at the very end. | Three short steps: **You → Your colour → Where tips land**, with a stitched 3-segment progress bar ("Step 2 of 3 · Your colour"). Step 1 says "About 2 minutes" and lists what you'll need, with a "Where do I find it?" link to the wallet help. §2.1 | H | M |
| 8 | Handle | all | Availability is only known after submit (409). Any character can be typed (dots, dashes, accents) and fails later with a generic error at the bottom. `maxLength` is 25 but the rule is 3–24, so a 25-character handle fails on the server. The link preview is a muted hint line. | The link *is* the field: `tezeo.app/@` is a fixed prefix (`.ob-affix`). Clean as you type (lowercase; drop spaces, accents, dots; explain once). `maxLength=24`. Suggest a handle from the name. **Live availability** with three free suggestions when taken. **BE: S**: `GET /api/creators/handle?h=` → `{ available, suggestions[] }`, rate-limited. Without it, fall back to #2. §2.2 | M | S + BE S |
| 9 | Colour | all | The guard only runs after submit, though `validateAccent` is pure and client-safe. The rejection is a long red sentence plus a pink ghost button "Use #B07400" crammed into the same line. The rejected colour is still painted on both preview tiles. | Run the guard on every pick in the browser. Show `.ob-guard`: the crossed swatch, one plain sentence, and two one-tap swaps (the guard's suggestion and the nearest preset). The preview keeps the last good colour. "Next" waits, with the reason under it. §2.3 | M | S |
| 10 | Colour preview | OS dark | **Bug:** with the OS in dark mode (no saved theme), the "Light" tile renders dark, so both tiles show dark. The tile restates dark tokens but never light ones. | `.ob-light` / `.ob-dark` restate the *full* light and dark token sets plus the accent derivation, for any subtree. Use them for the phone preview and the light/dark pair. §2.3 | M | S |
| 11 | Colour | all | Swatches are unnamed (`aria-label="Colour #1A9E8F"`). Black is invisible on dark (`#111` on `#120D18` with a faint ring). The custom colour is a raw native square next to round swatches. | Named swatches with visible labels: Turquesa, Violeta, Cielo, Mandarina, Lima, Rosa, Noche, Any. 44px circles with a text-tinted ring (visible on both themes), a rombo knot on the selected one, and a conic "Any" swatch that opens the native picker. | M | S |
| 12 | Form | all | **"Create my page" is disabled with no reason given.** It's skipped by Tab, and a creator who missed a field doesn't know why it won't work. | Each step's button explains itself when disabled (`.fl-why-disabled`, `aria-describedby`): "Paste your wallet address to continue." In steps, only step-local requirements block. | M | S |
| 13 | First dashboard | all | **No next step.** The page opens with a heavy wallet notice and three "0" cards ("0.00 USDC · 0 · 0"). The only action is "Copy my link", which opens the share sheet on phones (label mismatch). The tools are long full-width forms below. The creator gets no QR and no reminder to bookmark. | Hide the zero stats until the first tip. A **"Get your first tip" checklist** (`.ob-start`) built only from existing data: saved link (local flag), share your page (QR + copy), $1 test tip (optional, done when any tip exists), funding goal (`goal.targetUsd > 0`), OBS alerts (local "Mark as done"). Pass offer as a footer link. A one-time bookmark strip. A listening empty state. §2.7 | H | M |
| 14 | You're live + dashboard | all | The new-wallet notice is long and technical ("USDC account", "set-up cost", "delivery costs") and leads the dashboard above everything. On "You're live" it competes with the link card. | Shorter and calmer, placed after the important things: "Good to know: your wallet is new to USDC…". In the dashboard it's one line with a "Why?" disclosure, under the tips card, and it disappears once `walletHasUsdc` is true. §2.6, §2.7 | M | S |
| 15 | You're live | all | No brand moment: a 96px avatar and an `h1`. The knot, the one celebration the system has, is unused. There's no QR or "download QR", though the page already renders one. | The knot (96px; 120px at ≥1024) and "You're live, Mateo!" in display type. A share card: QR (download as PNG/SVG), Copy, Share, Open my page. Desktop: two columns, with the save card sticky on the right. §2.6 | M | S |
| 16 | Photo | all | A small 40px avatar with "Upload a photo". It doesn't say it will be cropped to a square/circle. A read error shows at the bottom of the form, far from the photo. HEIC files fail on non-Safari browsers. | One big target (`.ob-photo`): an 80px avatar with a camera badge *is* the button. "Square works best. We'll crop it to a circle. JPG or PNG." Change/Remove after upload. Errors go under the photo field: "…On iPhone, a screenshot of the photo works too." | M | S |
| 17 | Form | 390 | The CTA isn't docked; on a phone it's ~1,200px down. Field hints like "3–24 letters, numbers or _" wrap awkwardly next to the URL. | Per-step docked buttons (`.fl-dock`) with Back + Next. Shorter steps mean less scrolling. §2.8 | M | S |
| 18 | Message | all | The browser allows 160 characters, the server 280. The label "A short message for your fans" doesn't say it's optional. | Keep 160 (it matches the bubble design); set the server to 160. Label "A hello for your fans" with "Optional". **BE: S** (one zod limit). | L | S |
| 19 | Theme toggle | OS dark | **Bug (global):** `ThemeToggle` shows the moon icon and "Switch to dark mode" while the page is already dark from the OS, because it reads only `data-theme`. | Initialise from `matchMedia('(prefers-color-scheme: dark)')` when no `data-theme` is set. | L | S |
| 20 | Copy | all | "Let's weave your page" is good. Elsewhere the copy goes generic: "Handle", "Your Solana wallet (where USDC arrives)", "Heads up about your wallet", "Something went wrong.". | Copy deck in §2.9. One "!" per screen (only on "You're live, Mateo!"). | M | S |

Checked, not issues:
- No horizontal scroll at 320 in the live app, or in the prototype at any width.
- The client-side photo resize works (a 400×300 PNG became a 192px JPEG), and the avatar renders in the ring.
- Keyboard order in the form is logical (name → handle → message → photo → swatches → custom → wallet). Its only gap is the disabled submit (#12).
- The OKLCH clamp keeps every preset readable in both themes. The guard rejects `#D9481F` and `#12A065` as intended.

**Suggested order:** 2, 4, 12, 10, 19 (one small PR) → 1 (the save card; the single biggest risk) → 3 + 7 + 6 (steps, the wallet step, the preview) → 13 + 14 → 8 (live check, small backend) → 9, 11, 15, 16, 17, 18, 20 → 5 (profile editing, backend).

---

## 2. Specs for the engineer

Breakpoints are the same as FLOW.md:
- **<768** phone
- **768–1023** tablet: one wider column
- **≥1024** desktop: two panes
- **≥1280** wide (dashboard)

Every new class is in `design/onboarding.css` (prefix `ob-`). It reuses `tz-` components and these `fl-` pieces unchanged: `.fl-progress`, `.fl-theme`, `.fl-dock`, `.fl-phone`, `.fl-seg`, `.fl-id`, `.fl-bubble`, `.fl-howto`, `.fl-check`, `.fl-btnrow`, `.fl-why-disabled`, `.fl-dash*`, `.fl-card-h`, `.fl-tabbar`.

### 2.1 Structure: three steps beside a live preview (medium) — items 6, 7, 17

**Why steps, not one page:** the form mixes a fun part (name, look) with a careful part (the wallet). Splitting lets the wallet get the whole screen and the full help, and keeps each phone screen to one or two thumbs of scrolling. Three steps and no more: there's no separate review step, because the preview *is* the review.

- **Route:** keep `/onboarding`. Hold the step in the URL with `history.pushState` (`?step=1|2|3`), so Android/iOS Back goes to the previous step instead of leaving.
- **Draft:** store the draft (name, handle, message, accent, avatar data URL, wallet) in `sessionStorage['tz-onb-draft']` on change. A refresh never loses work. Clear it after success.
- **Markup:**
  ```
  div.ob-page
    header.ob-top
    div.ob-shell
      form.ob-step
      aside.ob-pv
  ```
  - `header.ob-top` holds `a.ob-logo` (mark plus letters `g.ob-letters`), then `.fl-progress` (3 segments), then `button.fl-theme`.
  - `form.ob-step`: `.ob-head` (`h1[tabindex=-1]`), the fields, then `.fl-dock.ob-dock`.
  - `aside.ob-pv`: the preview.
- **Top bar:** max 76rem, 12px/gutter padding.
  - The progress label reads "**Step 2 of 3** · Your colour". Segments: done `on`, current `now` (running stitch); `.fl-progress__track` gets 3 columns in `.ob-top`.
  - ≤420px: the logo shows the mark only (`.ob-letters` hidden), so the step label fits.
- **Shell:**
  - **<768:** one column, max 480px, gutter 16, `grid-template-columns: minmax(0,1fr)`, and every child gets `min-width: 0`. This is required: the handle input otherwise forces 49px of overflow at 320.
  - **768–1023:** max 576px + 2×32px padding.
  - **≥1024:** `grid-template-columns: minmax(0, 34rem) minmax(20rem, 24rem)`, gap `clamp(2rem, …, 5rem)`, centred, padding 32/40/64.
    - `.ob-step` becomes a card: surface, radius xl, 1.5px border, shadow-2, padding `clamp(28px, …, 40px)`, gap 24.
  - **≥1440:** form 36rem, preview 26rem.
- **Step headings:**
  - `h1` is display 800 at `--tz-text-3xl`, −0.03em, `text-wrap: balance`.
  - The lede is muted, max 44ch.
  - Step 1 also has `.ob-eyebrow`: the overline "Create your page" and `.ob-time` (clock icon) "About 2 minutes".
  - Step 1 also has `ul.ob-need` (sunken; rombo bullets) listing what you'll need.
- **Preview** `.ob-pv` (≥1024 only; `position: sticky; top: 24px`):
  - Head: the overline "How fans see it", then `.fl-seg` Light/Dark (`aria-pressed`).
  - The phone: `.fl-phone` with a 6px surface-2 bezel and radius 36, carrying `.ob-light` or `.ob-dark`, so it renders that theme regardless of the page theme.
  - Its content mirrors `/@handle`: URL bar, 84px weave, 80px avatar, name, handle, bubble, "Send Mateo a tip", 3 tiles, primary "Send $5 to Mateo", trust line.
  - Foot: a hierba rombo and "Live preview. It changes as you type."
  - Empty fields show `.fl-placeholder` text: "Your name", "@yourname", "Your hello goes here".
  - The default theme is the page's current theme.
- **Phones:**
  - Step 1 shows `.ob-peek`: a slim weave, a 52px avatar, the name, the link in accent text, and "Your page so far. You'll see all of it on the next step."
  - Step 2 shows `.ob-duo` (both themes side by side; §2.3).
  - Step 3 shows no preview.
- **Dock:** `.fl-dock.ob-dock` holds `.ob-dock__row`: a secondary "Back" (56px, arrow icon) and the primary lg button.
  - Step 1 has only the primary, "Next: your colour →".
  - Step 2: "Next: where tips land".
  - Step 3: "Create my page".
  - On phones it's sticky with safe-area padding (FLOW.md §2.6). At ≥1024 it's static, with the buttons at the two ends of the row (`justify-content: space-between`, primary min-width 15rem).
- **Step change:**
  - Validate only the current step.
  - Then push the new step, scroll to top, and **move focus to the new `h1`** (`tabindex=-1`, no outline).
  - Announce through the `h1` ("Pick your colour"). The progress label is real text.
- **Motion:** `.ob-step[data-enter]` uses `ob-step-in`: translateX 16px → 0 and opacity 0 → 1, 420ms, `--tz-ease-out` (threads move forward, left to right). Reduced motion: none.
- **Keep:** the "Let's weave your page" headline, the client-side photo resize, the API contract (one POST at the end), and the trust line idea.

### 2.2 Step 1: You (small, plus one small backend call) — items 8, 16, 18

Fields, in this order:

1. **Your name** (`autocomplete="name"`, max 60). Hint: "Real name or stage name, as your fans know you."
2. **Your link** `.ob-affix`: a fixed `span.ob-affix__pre` "tezeo.app/@" (aria-hidden; the input's label is "Your link"), then the input (700 weight, `autocapitalize=none`, `spellcheck=false`, `maxlength=24`, `width: 0; flex: 1`), then a 40px `.ob-affix__state` icon slot.
   - **Prefill:** when the name is typed and the link is untouched, suggest a slug: lowercase, accents stripped (NFD), non-`[a-z0-9_]` removed, cut to 24. "Mateo Quispe" → `mateoquispe`.
   - **Clean as you type:** apply the same normalisation. If anything was removed, show a warn status once: "Links can't have spaces, accents or dots, so we made it mateo_quispe."
   - **States** (`.ob-affix[data-state]` + `p.ob-status[data-state]`, `aria-live="polite"`, linked by `aria-describedby`):

     | State | Look | Copy |
     |---|---|---|
     | empty | neutral | "3 to 24 letters, numbers or _. This is the link you'll share." |
     | too short | neutral (until blur) | same hint; on blur: "At least 3 characters." (error) |
     | checking (BE) | turning rombo | "Checking @mateo…" (debounced 350ms) |
     | available (BE) | hierba border + ✓ | "**@mateodraws is free.**" |
     | taken (BE) | arcilla border + ✕ | "@mateo is taken. These are free:" + three 40px pill buttons (`.ob-suggest`) |
     | no backend / offline | neutral | the hint only; the 409 is handled at Create (§2.5) |

   - **Needs backend (S):** `GET /api/creators/handle?h=<raw>` → `{ handle, valid, available, suggestions: string[3] }`. Normalise with `normalizeHandle`. Suggestions are `<h>_<word>` / `<h><digit>` / initials, checked for availability in one query. Rate-limit per IP (e.g. 30/min). Don't log raw input. ~30 lines.
3. **A hello for your fans**, with an "Optional" tag. Textarea max 160, 80px min height, live counter "70 / 160". Server limit set to 160 (**BE: S**).
4. **Photo** `.ob-photo`, "Optional": a dashed surface card. `button.ob-photo__btn` is an 80px `tz-avatar` (initial fallback) with a 30px ink camera badge. Next to it: "Add a photo" / "Square works best. We'll crop it to a circle. JPG or PNG." and a secondary "Choose a photo".
   - After upload the title reads "Looking good", with Change (secondary) and Remove (ghost).
   - Error state (`data-state="error"`, arcilla dashed border) puts its message under the card, not at the bottom of the form.
   - No crop/zoom UI: the centre-square crop is fine for v1. A drag-to-position crop is a later M.

### 2.3 Step 2: Your colour (small) — items 9, 10, 11

- **Lede:** "It dyes your stripe in the weave, your photo ring and your tip buttons. The pay button stays Tezeo pink, so fans always know it's a real payment page." This replaces the old hint, which used "call-to-action".
- **Swatches** `.ob-swatches` (`role="group"`, labelled "Your colour"):
  - Layout: 4 columns on phones, 8 from 480px. Each `button.ob-swatch[aria-pressed]` (min 48px tall) holds a 44px `i` (ring `0 0 0 1.5px color-mix(text 30%)`) and a visible 11px name.
  - Selected: a 3px text-colour ring, scale 1.06 (spring 240ms), and a 10px surface rombo knot in the centre.
  - Presets, unchanged values, new names: **Turquesa** #1A9E8F · **Violeta** #7C3AED · **Cielo** #0EA5E9 · **Mandarina** #F97316 · **Lima** #E8FF3A · **Rosa** #FF66CC · **Noche** #111111.
  - "**Any**" is a conic swatch that opens a visually hidden `<input type=color>`. Once a custom colour is picked, its swatch shows that colour and its label shows the hex.
  - Measured ΔE (OKLab) from the guard's two status colours: Mandarina is the closest preset to Arcilla (0.111, above the 0.05 limit). Turquesa is 0.064 from Hierba (as accent.ts documents). Don't add more oranges or greens to the presets.
- **Light and dark** `.ob-duo`: two cards (`.ob-light` / `.ob-dark`), each with a 52px weave, a 44px avatar overlapping it by 24px, the overline, the handle in accent text, and a 48px accent tile "$5". This shows on every viewport.
  - Under it, a status line: "✓ Easy to read in both. We adjust the shade for dark screens automatically."
- **Theme restatement (bug fix #10):** `.ob-light` and `.ob-dark` restate `--tz-bg`, `--tz-surface*`, `--tz-border*`, `--tz-text*`, `--tz-brand*`, `--tz-on-brand`, `--tz-shadow-brand` and the four creator-accent tokens (with the same OKLCH clamps as tokens.css). This replaces the `.tzs-preview > [data-theme="dark"]` partial restatement.
- **Guard in the browser:** call `validateAccent(hex)` on every pick.
  - On `ok: false`, keep the *last good* accent on the preview and the duo, and show `.ob-guard` (`role="status"`, linked to the custom swatch with `aria-describedby`):
    - A row: the 40px crossed swatch, then "**That red-orange looks like our "didn't go through" colour.** Fans could mistake your page for a payment error, so pick a nearby one:". For a near-Hierba colour, use "…looks like our "received" green…".
    - Two secondary buttons with 24px swatches: "Use ochre #B07400" (the guard's suggestion; name it by hue band) and "Use Mandarina" (the preset nearest in OKLab hue that passes).
  - "Next" is disabled with "Pick one of the colours above to continue."
  - Motion: `ob-rise` 240ms. Reduced: none.
  - The server keeps the guard as the final check (unchanged).
  - Observation for whoever owns accent.ts: both rejections suggest ochre or olive (#B07400, #938B00). Offering the nearest preset as well, as above, gives a nicer choice. No change to the guard itself is needed.

### 2.4 Step 3: Where tips land (medium) — items 3, 4, 5, 12

- **Copy:**
  - H1 "Where should your tips land?"
  - Lede: "Paste your Solana wallet address. Tips arrive there as USDC, digital dollars, straight from your fans. Tezeo never holds your money."
- **Field:**
  - `.ob-label-row`: label "Your Solana wallet address" + `button.ob-paste` (secondary, 44px, paste icon, "Paste"). Show it only when `navigator.clipboard?.readText` exists. It reads, trims and validates at once.
  - `.ob-wallet > textarea` (2 rows, `resize: none`, mono 15px/1.5, `word-break: break-all`, `autocomplete=off`, `autocapitalize=none`, `spellcheck=false`). The full address is always visible.
  - Placeholder: "Paste it here. It's 32 to 44 letters and numbers."
- **Validation timing:** on paste and on blur only, never while typing. On input, strip whitespace and newlines (if any were removed, the ok line adds "We removed a space that came with the paste.").
- **States** (`.ob-wallet[data-state]` + `p.ob-status`):

  | Detect (browser, `walletProblem`) | State | Copy |
  |---|---|---|
  | empty | hint | "Copy it from your wallet app and paste it. Typing it by hand is how mistakes happen." |
  | `<32` chars, base58 so far, focused | hint | "Keep going. Solana addresses are 32 to 44 letters and numbers." |
  | `/^0x[0-9a-f]{40}$/i` | error | "That's an Ethereum address (it starts with 0x). Tips land on Solana, so we need your **Solana** address. In Phantom it's the one next to Solana." |
  | in `NOT_WALLETS` (USDC mint) | error | "That's the address of the USDC coin itself, not a wallet. Paste the address from your own wallet app." |
  | ≥12 words of `[a-z]+` separated by spaces | **stop** | `.ob-stop` (`role="alert"`): "**Stop: that looks like your secret recovery phrase.** We cleared it and didn't save or send it. Never share those words with anyone, including us. We only need your address." + "Show me where my address is" (opens the help). **Clear the field immediately; never put it in state, the draft or a request.** |
  | anything else invalid (`isValidSolanaAddress` false) | error | "That doesn't look like a Solana address. It's 32 to 44 letters and numbers, with no spaces or symbols." |
  | valid | ok | "✓ That's a valid Solana address." + the read-back |

  `walletProblem(addr): null | "eth" | "token" | "phrase" | "format"` goes in `lib/domain.ts` next to `isValidSolanaAddress`, used by browser and server. The server's 400 returns `{ error, field: "wallet", code }` (**BE: S**). Browser validation needs `@solana/web3.js` `PublicKey` in the client bundle. If that's too heavy, use base58-decode → 32 bytes (a tiny bs58 check) and leave the curve check to the server.
- **Read-back** `.ob-readback` (sunken, radius lg; `ob-rise` on appear):
  - Title (shield icon, hierba): "Check it against your wallet app".
  - `ul.ob-chunks`: the address in 4-character groups, mono 15px, each in a 1px-bordered surface chip. The **first and last groups are inked** (`.is-key`: text background, bg-coloured text).
  - Text: "Look at the first and last four: **GBR7** … **wMrJ**. If they match what your wallet shows, you're set."
  - A required `.fl-check`: "This is my own wallet, and I copied it from my wallet app." Changing the address unticks it.
- **Help** `details.ob-help` ("Where do I find my Solana address?", help icon): open by default while the field is empty, closed once valid.
  - `.ob-tabs` (`role=tablist`, roving tabindex, arrow keys) has three tabpanels using `ol.fl-howto` (numbered brand rombos):
    - **Phantom:** "Open the Phantom app." · "Tap **Receive**." · "Find **Solana** in the list and tap **Copy**." · "Come back here and tap **Paste**." Then: "Phantom also shows Ethereum and other addresses. Use the one next to Solana."
    - **Solflare:** "Open the Solflare app." · "Tap **Receive**." · "Tap **Copy** under your address." · "Come back here and tap **Paste**."
    - **An exchange:** "Go to **Deposit** and choose **USDC**." · "Pick the **Solana** network." · "Copy the address and paste it here." Then, in warn text: "If the exchange also shows a memo or tag, use a personal wallet instead. Tezeo can't add a memo, so tips might not reach your account."
  - Under the tabs: "No wallet yet? Phantom and Solflare are free apps, and setting one up takes a few minutes. Write down the recovery phrase it gives you and keep it to yourself."
  - App menus change between versions. Re-check these steps each release (I couldn't verify them on devices).
- **Never paste these** `ul.ob-never` (sunken; always visible while empty; can collapse into the help once valid): "**Your secret recovery phrase** (12 or 24 words). No one at Tezeo will ever ask for it." · "**An Ethereum address**, the kind that starts with 0x." · "**A coin's address**, like USDC's own. It has to be your wallet."
- **Test-tip hint** (status line, shield icon): "Want to be extra sure? Once you're live, send yourself a $1 tip from your own page and watch it land." This is honest: the minimum tip is $1, and the creator page works for anyone.
- **Dock:** Back + "Create my page". Disabled until the address is valid and ticked, with "Paste your wallet address to continue." or "Tick the box to confirm it's your wallet." Under it, `.ob-fine`: "For now your link and wallet can't be changed after this, so take a second." When profile editing ships (**BE: M**, finding 5), change this to "You can change your look later. Your wallet stays as is."
- **The new-wallet notice** is not shown here. Knowing at this step needs **BE: S** (`GET /api/wallet-check?w=` wrapping `walletHasUsdcAccount`, cached, rate-limited). It isn't worth the latency or the anxiety at this moment. Show it once, calmly, on "You're live" (§2.6).

### 2.5 Create, and errors after Create (small) — item 2

- **Busy:** the button label becomes "Weaving your page…" (`aria-disabled`, keeps its width), with the fine print "This takes a second or two."
- **Error routing** (map the response, then go to the step, scroll, focus and announce):

  | Response | Go to | Field state + copy |
  |---|---|---|
  | 409 | step 1, focus the link input | `role="alert"` banner at the step top: "Someone just took @mateodraws. We took you back to step 1: pick another link and everything else stays as you left it." + the field's taken state with suggestions (BE) |
  | 400 handle | step 1 | "3 to 24 letters, numbers or _." on the field |
  | 400 wallet `code` | step 3 | that code's row from §2.4 |
  | 422 accent | step 2 | `.ob-guard` with `suggestion` |
  | 400 other / 5xx | stay | `.tzs-error` above the dock: "Something on our side didn't work, so nothing was saved. Try again in a moment." |
  | network failure | stay | "We couldn't reach Tezeo, so nothing was saved. Check your connection and try again." + the primary turns into "Try again" |

- Focus never lands on `<body>`. Errors use `role="alert"` once, not on every keystroke.

### 2.6 "You're live" (medium) — items 1, 14, 15

- **Persistence:** on success, store `{handle, dashboardToken, walletHasUsdc, name, accent, avatar}` in `sessionStorage['tz-onb-done']`. Render this screen whenever it exists, including after refresh or Back from the dashboard. Clear it only after the gate is ticked *and* the creator has opened the dashboard.
  - Until the tick, `beforeunload` asks the browser's standard "Leave site?" (no custom text possible).
  - Optional "Remember on this device": localStorage. I don't recommend it as a default on shared or family phones.
- **Markup:**
  ```
  div.tz-weave--slim
  header.ob-top        (logo + theme)
  main.ob-live.tz-creator
    .ob-moment
    section.ob-keep
    section.ob-share
    .ob-note
  ```
- **Layout:**
  - **<1024:** a single column (max 480; 576 on tablets) in that order: moment, save card, share, note.
  - **≥1024:** `grid-template-columns: minmax(0,1fr) minmax(24rem,30rem)`, areas `"moment keep" "share keep" "note keep"`. The save card is `position: sticky; top: 24px` with 28px padding. The moment is left-aligned.
- **Moment** `.ob-moment`:
  - `.tz-knot.is-playing` at 96px (120px ≥1024), the existing markup and burst.
  - `h1.tz-display` "You're live, Mateo!" (4xl; at ≥1024 `clamp(52px, …, 88px)`, max 11ch). This is the screen's one "!".
  - Lede: "Your page is up at **tezeo.app/@mateodraws**. Share it, and the first tip will show up in your dashboard, live." The link is accent text.
  - Motion: the knot 1.2s. Reduced motion: drawn, no burst.
  - Haptic: `navigator.vibrate(12)` when the knot closes, as on the fan thank-you.
- **Save card** `section.ob-keep` (`aria-labelledby`): surface, radius xl, **2px text-colour border**, an inner dashed stitch (`::after`), shadow-3. This is deliberately the strongest card in the product.
  - `.ob-keep__tag` (maíz pill, key icon): "Shown only once".
  - `h2[tabindex=-1]` "Save your private dashboard link". **Focus moves here after the knot**, about 1.2s; immediately with reduced motion.
  - Text: "**It's your only way back to your tips.** There's no password and no email, so if you lose it we can't send it again. Anyone who has it can see your tips, so keep it to yourself."
  - `.tz-copy` with the full link (mono 14px, wraps anywhere, no truncation, no icon button: the actions below cover copying).
  - `.ob-keep__actions` (1 column; 2 columns ≥480 with the first button full width). Each is a 52px secondary button with an icon and a right-aligned `small` for its done state:
    1. **Download a backup file**: a client-side `Blob` `text/plain`, filename `tezeo-<handle>.txt`. Contents:
       ```
       Tezeo backup for Mateo Quispe (@mateodraws), created 1 Nov 2026

       PRIVATE: your dashboard. Anyone with this link can see your tips. Don't share it.
       https://tezeo.app/dashboard/<token>

       PUBLIC: your page. Share this one.
       https://tezeo.app/@mateodraws

       Your wallet (where tips land): GBR7vwX5Thj7GzMLYHDUS21rnyTFhGciaz59Bm7jwMrJ

       Keep this file somewhere safe, like your notes app or a password manager.
       ```
    2. **Copy link** (clipboard).
    3. **Send to myself**: `navigator.share({ title: "My Tezeo dashboard (private)", text, url })`. Hidden when `navigator.share` is missing. The share sheet lets the creator pick Notes, Saved Messages or their own WhatsApp chat. No email is sent by Tezeo.
    - Each action sets `data-done="true"` (hierba border, `small` reads "Done ✓") and updates a `role="status"` line: "Nice. Tick the box below once it's somewhere you'll find it again."
  - `.ob-keep__gate` (dashed top divider):
    - `.fl-check` "I've saved it somewhere safe" (required).
    - The primary lg block `a` "Go to my dashboard", `aria-disabled="true"` until ticked (not `disabled`, so it stays focusable and its reason is read).
    - `p.fl-why-disabled` "Save your link first. It's the only way back in." (hidden once ticked).
  - Why a tick and not "any action unlocks": copying to a clipboard that's overwritten a minute later isn't saving. The tick is the creator's own promise, and it costs one tap.
- **Share card** `section.ob-share`:
  - The top row: a `.tz-qr` (84px; 104px ≥1024) next to the overline "Your public page", the link (display 800, 16/18px) and "Put it in your bio, on stream, on your class slides."
  - `.fl-btnrow` (44px buttons): Copy link · Share · QR code (download PNG at 1024px plus SVG; generate client-side with the `qrcode` package already in dependencies) · ghost "Open my page".
- **New-wallet note** `.ob-note` (sunken, gold rombo; only if `walletHasUsdc === false`; `role="note"`): "**Good to know: your wallet is new to USDC.** Solana opens a USDC account for it with your first tip. That costs about $0.25, once, and comes out of that tip. After that, delivery is about $0.01 per tip. Nothing for you to do."
  - If `walletHasUsdc === null` (RPC down), show nothing.

### 2.7 First-run dashboard (medium) — items 13, 14

Applies while `stats.totalUsdc === 0 && tips.length === 0`. Everything else follows FLOW.md §2.7 (that layout isn't built yet either; this slots into it).

- **Head:** the overline date, then "**Welcome, Mateo**" on first run instead of the time-of-day greeting.
- **Bookmark strip** `.ob-bookmark` (shown once per device, dismissed into localStorage):
  - Bookmark icon, "Bookmark this page. It's your way back in." `<kbd>Ctrl</kbd> + <kbd>D</kbd>` shows at ≥1024 only (⌘ on Mac).
  - Ghost "Got it".
- **Stats:** hide `.fl-stats` until the first tip. The three zero cards are noise on day one.
- **Checklist** `section.tz-card.ob-start` (`aria-labelledby`):
  - Head: `.fl-card-h` "Get your first tip" + `.ob-start__count` "1 of 5 done".
  - `.ob-thread` (5 segments, 6px; done = hierba line, todo = dashed stitch).
  - `ol.ob-tasks`, each `li.ob-task[data-state=done|next|todo]`:
    - A 28px knot: done = solid hierba rombo with ✓ (`ob-pop` 240ms spring); next = brand outline on brand-soft; todo = dashed.
    - An `h3` with optional `.ob-tag` ("Done", "Optional", "For streamers"), muted text and a 44px button row.
    - The first not-done item gets `aria-current="step"`.

  | # | Task | Done when (real data only) | Action |
  |---|---|---|---|
  | 1 | Save your dashboard link | localStorage `tz-saved-<handle>` set by the "You're live" gate (else todo with "Download a backup file") | — |
  | 2 | Share your page | first tip exists, or local "copied/downloaded QR" flag | `.ob-task__share`: QR 64px (88px ≥480), the link, "Print it, pin it on stream.", Copy link, Download QR |
  | 3 | Send yourself a $1 test tip · *Optional* | `tips.length > 0` | "Open my page" |
  | 4 | Set a funding goal | `goal.targetUsd > 0` | "Add a goal" → scrolls to and focuses the goal name field |
  | 5 | Add tip alerts to OBS · *For streamers* | local "Mark as done" (the server can't know) | "Set up alerts" → the Stream card; ghost "Mark as done" |

  - Copy:
    - Share: "Put your link where your fans already are: your bio, your stream, your class slides, your WhatsApp status."
    - Test tip: "See exactly what your fans see, and watch it land here."
    - Goal: "Give fans a reason: "New microphone, $300". It shows on your page with a progress bar."
    - Alerts: "A card pops up on your stream for every tip."
  - Footer: ghost "Also: offer a 30-day pass" (→ the pass card) and ghost "Hide this list" (localStorage).
  - When all five are done: "Your page is all set." for one visit, then the card is gone.
- **Tips card empty state** `.ob-empty` (replaces the inline `tz-empty` + "Copy my link"):
  - The loose-thread SVG (`svg.ob-loose`, a brand thread with a maíz dashed end; the dashed end runs `ob-wait` 2.4s).
  - "Your first thread is on its way" / "Share your page and the first tip will show up here, live. No need to refresh."
  - `.ob-listen` (hierba pulsing rombo) "Listening for tips". This is true: the dashboard polls every 7s.
  - No button here: the checklist owns "share", which removes the "Copy my link" label mismatch.
- **New-wallet note** `.ob-dash-note`, under the tips card (not above the stats):
  - Gold rombo, "**New wallet.** your first tip pays a one-time set-up of about $0.25."
  - `details` "Why?": "Solana needs a USDC account for your wallet before dollars can land, and opening it costs about $0.25. It comes out of your first tip, once. After that, delivery is about $0.01 per tip."
  - Disappears when `walletHasUsdc` becomes true.
- **Layout:**
  - **≥1280:** `.fl-cols.ob-dash-cols` is two equal columns: the checklist left; the tips card and note right.
  - **<1280:** stacked, with the checklist first.
  - The goal, OBS and pass cards follow as in FLOW.md §2.7.

### 2.8 Mobile quality — item 17

- **Primary action:**
  - Docked on every onboarding step (`.fl-dock`, safe-area padding, `viewport-fit=cover` already set).
  - Fields keep `scroll-margin-bottom: 140–150px`, so the keyboard plus the dock never covers the focused field.
  - On "You're live" the dashboard button sits inside the save card on purpose: it is **not** docked, so it can't be hit before reading.
- **Touch targets:** buttons ≥44px (primary 56px), swatches 48px tall, tabs 40px inside a 46px track, suggestion pills 40px with 8px gaps, checkboxes 22px inside 48px rows.
- **320px:** verified with no horizontal scroll on every prototype screen. The link prefix drops to 14px under 360px. The logo shows the mark only under 420px.
- **Thumb reach:** Paste sits on the label row (top) because it comes before typing. The confirm tick and Create sit in the lower half.

### 2.9 Copy deck (final strings)

| Where | Today | New |
|---|---|---|
| Step 1 eyebrow | Create your page | Create your page · ⏱ About 2 minutes |
| Step 1 lede | — | Three short steps: you, your colour, and where tips land. Your page goes live the moment you finish. |
| You'll need | — | Your name and a short hello for fans · A photo, if you like · Your Solana wallet address, for the last step. **Where do I find it?** |
| Name hint | — | Real name or stage name, as your fans know you. |
| Handle label | Handle | Your link |
| Handle hint | Your link: tezeo.app/@… · 3–24 letters, numbers or _ | 3 to 24 letters, numbers or _. This is the link you'll share. |
| Message label | A short message for your fans | A hello for your fans *(Optional)* |
| Photo | Photo · Upload a photo | Add a photo · Square works best. We'll crop it to a circle. JPG or PNG. · Choose a photo |
| Colour hint | The call-to-action and status colours stay Tezeo's… | It dyes your stripe in the weave, your photo ring and your tip buttons. The pay button stays Tezeo pink, so fans always know it's a real payment page. |
| Wallet label | Your Solana wallet (where USDC arrives) | Your Solana wallet address |
| Wallet hint | Double-check it: tips are paid straight to this address and can't be reversed. | Copy it from your wallet app and paste it. Typing it by hand is how mistakes happen. |
| Trust line | We check your wallet address before saving it. | (replaced by the read-back and) For now your link and wallet can't be changed after this, so take a second. |
| Live H1 | You're live, Mateo. | You're live, Mateo! |
| Live lede | Share your page. Tips will show up in your dashboard as they arrive. | Your page is up at tezeo.app/@mateodraws. Share it, and the first tip will show up in your dashboard, live. |
| Dashboard link | Your private dashboard link · **Save this now.** It's the only way into your dashboard… | Shown only once · Save your private dashboard link · **It's your only way back to your tips.** There's no password and no email, so if you lose it we can't send it again. Anyone who has it can see your tips, so keep it to yourself. |
| Wallet note | Heads up about your wallet · A Solana wallet needs a USDC account… | Good to know: your wallet is new to USDC. Solana opens a USDC account for it with your first tip. That costs about $0.25, once, and comes out of that tip. After that, delivery is about $0.01 per tip. Nothing for you to do. |
| Generic error | Something went wrong. | Something on our side didn't work, so nothing was saved. Try again in a moment. |

Voice checks:
- One "!" (only on the live H1).
- No intent, slippage, bridge, gas or settlement.
- "USDC" is explained once as "digital dollars".
- The creator is named by first name.
- Bad news leads with safety: "nothing was saved", "We cleared it and didn't save or send it".

### 2.10 Accessibility notes

- **Labels and errors:** every field has a visible `<label>` (the link prefix is decorative, so the input's name is "Your link"). Status lines are in `aria-describedby` with `aria-invalid` on errors. They're `aria-live="polite"`, and `role="alert"` is used only for the stop card, post-Create errors and the 409 banner.
- **Focus:**
  - Step changes focus the step `h1`.
  - Post-Create errors focus the field.
  - "You're live" focuses the save card's `h2` after the knot.
  - The disabled dashboard link uses `aria-disabled` + `aria-describedby`, so it stays reachable and explains itself.
- **Groups:** swatches are `role="group"` with `aria-pressed` and visible names. The help is `role="tablist"` with roving tabindex and ←/→/Home/End. The checklist is an `<ol>` with `aria-current="step"` on the next item.
- **Contrast:**
  - All copy uses the semantic tokens measured in DESIGN.md §3.3. The inked read-back chunks are text-on-bg, 16.6:1 light and 16.8:1 dark.
  - The maíz tag is ink on maíz, 11.1:1.
  - The hierba ok line on the page bg uses `--tz-received-fg`, which passes AA (DESIGN.md §3.3 measures it 5.72:1 on its tint).
  - Colour is never the only signal: every status has an icon and words.
- **Recovery phrase:** the field is cleared and never stored, logged or sent. Screen readers hear the alert only.
- **Motion:** `ob-step-in`, `ob-rise`, `ob-pop`, `ob-wait`, the turning rombo and the listening pulse all stop under `prefers-reduced-motion`. The knot renders drawn with no burst (components.css).
- **Theme:** the preview renders both themes through `.ob-light`/`.ob-dark`, independent of the page theme. Fix the `ThemeToggle` initial state (#19).

### 2.11 Keep as is

- The single POST `/api/creators` and its validation order. The server-side accent guard and wallet check remain the final word.
- The client-side photo resize to a 192px JPEG (no file storage).
- The dashboard token model and the `no-referrer` / `noindex` headers on the dashboard.
- "Let's weave your page", "Your first thread is on its way" and the new-wallet facts (about $0.25 once, then about $0.01).
- The preset colour values.
- The weave, knot, rombo bullets, stitched primary buttons and the running-stitch progress, all unchanged.

### 2.12 Suggested build order

1. **Small PR** (S, about a day): error routing and focus (#2). The `walletProblem` helper + `field/code` in the 400 (#4). Disabled reasons (#12). `.ob-light/.ob-dark` restatement (#10). `ThemeToggle` initial state (#19). `maxLength=24` and the 160 server limit (#8, #18).
2. **The save card** (#1): sessionStorage, the backup file, copy, share, the tick gate, `beforeunload`, the knot moment and the share card with client QR (#15).
3. **Steps + wallet step + preview** (#3, #6, #7, #17): the draft in sessionStorage, `?step=` history, the read-back, help tabs, recovery-phrase guard, and the phone preview.
4. **First-run dashboard** (#13, #14): the checklist, bookmark strip, empty state, and the compact wallet note.
5. **Live handle check** (#8, **BE: S**), then the colour guard UI and named swatches (#9, #11), photo card (#16) and the copy pass (#20).
6. **Profile editing** (#5, **BE: M**).

---

## 3. What I rendered and looked at

- **Live app ("before"):**
  - The filled form at 320, 390, 768, 1024, 1440 and 1920 in light, and at 390 and 1440 in dark.
  - Error states at 390: a partial wallet while typing, invalid handle characters, a garbage wallet, an Ethereum address, the USDC mint (passes the browser check, generic server error at the bottom), handle taken (off-screen error, focus on `<body>`), the colour guard at 390 and 1440, and a long name, handle and message (the 25-character handle and the 160 limit).
  - "You're live" (with photo upload and the new-wallet notice) at 320, 390, 768, 1440 and 1920 light, and 390 and 1440 dark.
  - The first-run dashboard at the same sizes, plus the public page at 390 and 1440. A tip was created through the API.
  - The keyboard tab order on the form at 1440.
- **Prototype ("after"):** all 8 screens at 320, 390, 768, 1024, 1440 and 1920 in light, and at 390 and 1440 in dark. At 390 I captured the viewport (sticky dock) as well as the full page (dock made static).
  - Overflow was measured at every width: 0 everywhere after fixing a min-content bug in the link field (which the spec calls out).
- **Not verified:**
  - The Phantom and Solflare menu steps on real devices (written from current app layouts; re-check per release).
  - `navigator.share` and the clipboard on iOS/Android.
  - `beforeunload` behaviour on mobile Safari, which often ignores it. The sessionStorage restore is the real protection there.
  - Real keyboard/safe-area behaviour.
  - The live handle check and the wallet check endpoints (they don't exist yet).
  - The dashboard "with a received tip" state: the API tip I created was still converting when captured.
  - Recovery-phrase detection was tested only as a mock state, not against real phrases.
