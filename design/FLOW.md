# Tezeo Product Flow Review: Responsive Layout and Use of Space

Scope: everything after the landing page.
- The fan flow (`/@handle`: amount → where's your money → your payment → tracking → outcome)
- The pass flow
- The creator dashboard, onboarding, the OBS alert and the private pass page

The review was done against the running demo at `localhost:4300`. I looked at screens at 320, 390, 768, 1024, 1440 and 1920px; light everywhere, and dark for the key screens.

Prototype: `design/flow.html` + `design/flow.css` (every class is `fl-`).
- Open one screen with `?screen=amount|pay|quote|track|thanks|dashboard|onboarding`.
- Add `&theme=dark` for dark, and `&clean=1` to hide the prototype notes.
- Each screen carries a viewport note that says what changes at each breakpoint.

Screenshots: `design/screenshots/flow-<screen>-<before|after>-<mobile|desktop|tablet>-<light|dark>.png`. "Before" is the live app. "After" is the prototype.

Product rules respected throughout:
- A fan sees only what they pay, with no fees and no "creator receives" on fan screens.
- No new data and no WalletConnect.
- CSS-only motion.
- Tokens and components are unchanged.

---

## 1. Findings, ranked

Impact: **H** high · **M** medium · **L** low. Size: **S** small (CSS tweaks) · **M** medium (layout + markup) · **L** large (new component structure).

| # | Screen | Viewport | What's wrong | Fix | Impact | Size |
|---|---|---|---|---|---|---|
| 1 | Fan flow: every step after the amount | ≥1024 (worst at 1440–1920) | A 480px phone column floats in an empty page. There's no sense of *who* you're paying beyond a 56px chip, and no logo or frame. It reads as "a mobile page on a desktop". | **Two-pane shell.** A sticky "Your tip" pane (creator, amount, coin and network, refund address) sits beside a raised step card (640px). §2.1 | H | L |
| 2 | Thank-you | ≥768 | The brand moment is cramped. The headline breaks into 3 lines inside 480px, the CTAs stack, and ~60% of the screen is empty. | **Full stage** under a 96px weave band. The moment sits left (136px knot, headline up to 96px); a card on the right shows the wall with the fan's own note pinned as **You**, plus the goal it moved. Only real data is used. §2.5 | H | M |
| 3 | Your payment (quote) | all | The **price timer sits under the CTA**, so most people never read it. On desktop the QR (96px), the exact amount and the five steps all stack in one narrow column. | Amount plus timer go in a **pay hero** at the top. ≥1024: the **send panel** (168px QR, exact amount, address) sits beside the numbered steps. In live mode a **one-tap card** comes first, with "or pay it yourself" below. §2.4 | H | M |
| 4 | Pay and quote steps | phones (390×844) | The primary CTA ("See the quote", "I've sent it") falls just below the fold, and the keyboard covers the address field when focused. | **CTA dock**: sticky bottom with safe-area padding and a fade. Inputs get `scroll-margin-bottom` so a focused field clears the dock. §2.6 | H | S |
| 5 | Dashboard | ≥1280 | Main hugs the left at max 1152px with empty space to the right at 1920. Goal, OBS and pass forms are full-width cards under a long table, with **full-width giant "Save" buttons**. | Centre main (max 1408px). ≥1280: tips table left, **sticky 360px tools rail** right (your page + QR, goal, OBS alerts, pass), compact two-field forms, auto-width save buttons. §2.7 | H | M |
| 6 | Onboarding | ≥1024 | A narrow form centred in a huge page. The "live preview" is two 160px tiles showing only "@handle $5". | Form (512px) beside a **sticky 384px phone preview of the real page** (weave, avatar, name, handle, message, tiles, CTA) with a Light/Dark switch. On phones the same preview sits above the CTA. §2.8 | H | M |
| 7 | Onboarding | all | **Bug:** the CTA reads **"Create you's page"** while the name is empty. | When the first name is empty, show "Create my page". (Or always say "Create my page"; the name is already in the preview.) | M | S |
| 8 | Dashboard → Details | ≤640 | **Bug:** money values in the breakdown wrap mid-value ("–" on one line, "$0.01" on the next). At ≤390 the fan name/message column pushes the table wider than the screen. | `dd { white-space: nowrap }`. The stacked row becomes `minmax(0,1fr) auto`, the detail row spans both columns, and the fan cell gets `min-width: 0` with an ellipsis. | M | S |
| 9 | Demo banner | all, fan flow | The yellow demo card is repeated *inside* the flow, right above every primary CTA, competing with it. | One slim **36px strip** at the very top of the page (`.fl-demo`). | M | S |
| 10 | Tracking | all | No top bar: no back, no theme toggle, no step 4 of 4. The loom labels repeat the coin ("USDC → USDC" when paying in USDC). | Same `.fl-bar` as the other steps ("Step 4 of 4 · On its way"). Loom labels name the **network**: "BASE → SOLANA". ≥1024: the loom sits on a sunken 500px stage, with the steps beside the note form. §2.3 | M | S |
| 11 | Amount page: supporter wall | all | Up to 5 identical accent-tinted slabs. The accent is overused, and on phones the wall pushes the footer a long way down. | Surface list with accent **rombo bullets** and dashed dividers. Show 3, then "Show N more" (client-side, same data). On desktop it lives under the creator pane. | M | S |
| 12 | Tablet portrait | 768–1023 | Same 480px column as a phone. The QR column only appears at ≥900, so the 768–899 range gets nothing. | 576px column, 96px amount tiles, network/coin pickers in an even grid, CTAs side by side on the thank-you. | M | S |
| 13 | Where's your money | ≥768 | Chips wrap raggedly (Base · Arbitrum · Bitcoin / Ethereum), and 44px chips are small for a pointer on a big screen. | `.fl-pickgroup`: an auto-fill grid of 152px+ pickers, 52px tall. | L | S |
| 14 | Amount: "Get Valentina's Pass · $12" | all | A generic secondary button under the main CTA, so two buttons compete. | **Pass teaser row** (`.fl-passoffer`) above the CTA: a mini woven pass chip, "Valentina's Pass", the perk and the price. It reads as an offer, not a second CTA. | M | S |
| 15 | Amount: other amount | all | Placeholder "$ 10" plus a separate hint line. The existing `.tz-amount-custom` ($ prefix, display font) isn't used. | Use `.tz-amount-custom`, with the placeholder "Anything from $1". Keep the error text. | L | S |
| 16 | Disabled "See the quote" | all | A 45%-opacity pink button with no reason given. Text contrast on it is low and the fan doesn't know what's missing. | Keep the disabled state, and add a one-line reason under it: "Add your wallet address to see the quote." (`.fl-why-disabled`, `aria-describedby`). | M | S |
| 17 | Headings in steps | ≥1024 | `tz-h1` (24–32px) looks timid in a 640px card. | Step titles use `--tz-text-3xl`, letter-spacing −0.03em. | L | S |
| 18 | Native checkboxes | all | "Remember this address" and "Offer a pass" render in browser blue. | `accent-color: var(--tz-brand)` and 22px boxes in 48px rows (`.fl-check`). | L | S |
| 19 | Private pass page `/pass/:token` | ≥768 | Narrow column. The mini chip has no avatar, and there's no weave. | Use the thank-you stage pattern: weave band, pass card left, perks and message right (≥1024). Add the avatar to the mini chip. *(Spec only, not mocked.)* | L | M |
| 20 | Failed / refunded | ≥1024 | Same narrow centred column (fine on phones). | Same two-pane shell as tracking: the summary pane shows "Refunds go to 0x71c7…976f". *(Spec only; it reuses §2.1.)* | L | S |

Not issues (checked):
- The quote-expired modal: centred, clear, focus on "Get a fresh quote", reads well at 1440.
- The OBS alert card: transparent background, good contrast.
- Dark mode across the fan flow.
- 320px (no horizontal scroll in the app or the prototype).

**Suggested order:** 4, 7, 8, 9, 10, 16, 18 (one small CSS/copy PR), then 1 + 3 (the shell and quote), then 2, 5, 6, then the rest.

---

## 2. Specs for the engineer

Breakpoints used everywhere:
- **<768** phone
- **768–1023** tablet: one wider column
- **≥1024** desktop: two panes
- **≥1280** wide: dashboard rail

All new classes are in `design/flow.css`. Existing `tz-` classes are reused unchanged.

### 2.1 Fan-flow shell (medium/large) — items 1, 12, 17
- **Markup:**
  ```
  div.fl-page.tz-creator
    .fl-demo
    [band]
    div.fl-shell
      aside.fl-side | aside.fl-sum
      main.fl-stage
      [section.fl-wall]
  ```
- **<768:** `.fl-shell` is a single column, max 480px, 16px gutter. `.fl-sum` is hidden and `.fl-mini` (the old `tzs-mini`, now 56px tall with a "Change" affordance) shows instead.
- **768–1023:** max width 576px + 32px padding. Amount tiles are 96px tall with 32px figures. Pickers become a grid (2.4).
- **≥1024:**
  - Grid: `grid-template-columns: minmax(18rem, 22rem) minmax(0, 40rem)`, column gap `clamp(1.5rem, …, 3rem)`, `justify-content: center`, areas `"side stage" "wall stage"`, padding 40px.
  - `.fl-stage` becomes a card: surface, radius xl, 1.5px border, shadow-2, padding `clamp(20px, …, 40px)`, 24px gap.
  - **Grid areas must be scoped to direct children** (`.fl-shell > .fl-wall`). Otherwise a `.fl-wall` reused inside another card creates phantom columns.
- **Step bar** `.fl-bar`:
  - 48px back button, then `.fl-progress` with a label ("**Step 2 of 4** · Where's your money"), then four 6px segments. Done segments are `on` (brand); the current one is `now` (a brand running stitch).
  - Then the theme toggle. It appears on **every** step, including tracking.
  - Replaces `.tzs-topnav` / `.tzs-progress`.
- **Summary pane** `.fl-sum` (≥1024, `position: sticky; top: 24px`):
  - 48px weave, then a 68px avatar overlapping it, then name and handle.
  - An accent-soft amount block: "$5 / your tip · lunch" on pay and quote; "5.00 USDC / sent on Base" on tracking.
  - A `dl`: Paying with · Refunds go to (or "your wallet, next" in faint text) · Reference (tracking).
  - A shield trust line.
  - It **never** shows fees or the creator's net.
- **Step titles** inside the stage use `font-size: var(--tz-text-3xl)`.
- **A11y:** the progress label is real text, so drop `role="img"` on the bar. The summary pane is `aside aria-label="Your tip"`. Keep `aria-live` on step changes as today.

### 2.2 Amount step (medium) — items 11, 14, 15
- **Band:** `.tz-weave.fl-band` is 96px (<1024) and 128px (≥1024). On desktop the stage card gets `.fl-stage--lift` (`margin-top: 3.5rem`), so it sits on the band's lower edge next to the avatar.
- **Creator pane** `.fl-side--creator`, in order:
  - `.fl-id` (avatar overlapping the band by 52px, name with `overflow-wrap: anywhere` for long names, handle)
  - `.fl-bubble`
  - `.fl-goal`, with a 12px bar and the % shown in accent text
  - `.fl-scan` (≥1024 only): 88px QR, "Scan to tip Valentina", "Or share tezeo.app/@vale". This replaces the floating `.tzs-desktop-qr` column.
- **Share + theme** `.fl-bar--float`: absolute over the band's top-right on phones and tablets, and in the stage card's top-right on desktop (the stage's `h2.fl-ask` gets a 112px right padding).
- **Stage:**
  - `h2.fl-ask` "Send Valentina a tip" (2xl)
  - `.tz-amounts` with 12px gaps
  - "Other amount" using `.tz-amount-custom`, placeholder "Anything from $1"
  - `.fl-passoffer` (only if a pass exists): 64px row with a woven chip, "**Valentina's Pass**" / "30 days in the crew · {perk}", and the price
  - `.fl-dock`: primary "Send $5 to Valentina" + trust line
- **Wall** `.fl-wall`: one surface card with up to 3 rows, then `button.fl-more` "Show N more" (expands in place, client-side). Each row has an accent rombo bullet, the name plus Pass badge, and the message in muted text (`overflow-wrap: anywhere`).
- **Copy:** unchanged, apart from the placeholder.

### 2.3 Tracking (small) — item 10
- Add `.fl-bar` ("Step 4 of 4 · On its way"). Back goes to the creator's page; it says so in its `aria-label`.
- Loom labels: left = network label upper-cased ("BASE"), right = "SOLANA". To fit, the out path ends at x = 234 and the right label sits at x = 242 in the 300-wide viewBox. Keep `role="img"` and the label "Converting your payment into USDC".
- **≥1024:**
  - `.fl-loomwrap` is a sunken stage (padding 24/20, radius lg) with the loom at max 500px.
  - `.fl-track-split` puts `tz-steps` and the note form side by side (2 equal columns, 32px gap).
  - The summary pane says "You can close this tab. We'll keep going."
- **Motion:** unchanged (loom loop, running stitch). Reduced motion is already handled by components.css.

### 2.4 Where's your money + Your payment (medium) — items 3, 13, 16
- **Pickers** `.fl-pickgroup`:
  - ≥768: the `.tz-chips` inside become `grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr))`, with 52px chips at radius md.
  - Same buttons with `aria-pressed`, and the "More" chip is kept.
- **Wallet row** (when a wallet is detected): a label "Connect the wallet you'll pay from", then 48px `.fl-wallet` buttons (logo, name, "detected" on the first), then a stitched divider `.fl-or` "or type it", then the existing field.
  - "Remember this address on this device" uses `.fl-check`: a 48px row with a 22px box in `accent-color` brand.
- **Disabled reason:** under a disabled "See the quote", add `p.fl-why-disabled` ("Add your wallet address to see the quote." or "That address doesn't look right for Base."), and link it with `aria-describedby`.
- **Pay hero** `.fl-pay-hero` (top of the quote step):
  - Overline "You send", then the amount at `clamp(36px, …, 52px)` display weight in accent text with a 45% unit.
  - Then two `.fl-tag` pills: "on Base" and ⏱ "Price held for **4:58**".
  - This replaces the `tz-quote__row--total` and the timer note under the CTA.
  - Screen readers: announce at 10s left and on expiry only (as today).
- **One-tap card** `.fl-onetap` (live mode only, rendered from `WalletPay`): label "Pay in one tap", the primary "Pay 5.00 USDC with MetaMask", and the helper copy (unchanged).
  - Then `.fl-or` "or pay it yourself", then the manual block **open** (not in a `<details>`) on desktop.
  - On phones, keep the `<details>` collapsed when the one-tap card is present.
- **Manual block** `.fl-send`:
  - `.fl-send__panel`: sunken; QR 144px (phone) / 168px (≥1024); "Send exactly **5.00 USDC** on Base, to:"; full `tz-copy` address with a 44px copy button; the memo if any.
  - Then `ol.fl-howto`: steps numbered in brand rombos (warn text kept).
  - ≥1024: `grid-template-columns: minmax(0, 15rem) minmax(0, 1fr)`.
- **CTA:** "I've sent it" is **primary** in demo/manual mode and **secondary** when the one-tap card is shown. It sits in `.fl-dock`, with the line "When the price runs out you can get a fresh quote, no harm done."
- **Expired modal:** unchanged; it works well. It focuses "Get a fresh quote" on open.

### 2.5 Thank-you (medium) — item 2
- **Markup:**
  ```
  .tz-weave (96px)
  div.fl-thanks.is-playing
    .fl-thanks__moment
    aside.fl-thanks__card
  ```
- **<768:** as today, with the card under the CTAs.
- **768–1023:** 576px column, and the CTAs sit in two columns.
- **≥1024:** `max-width: 76rem`, `grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 26rem)`, gap up to 80px, `align-items: center`.
  - The moment is left-aligned: the knot at 136px (`margin: 0`), the pill, then `.tz-display` at `clamp(56px, …, 96px)` max 12ch, then a lg lede, then the CTAs in one row (primary share + ghost "Back to Valentina's page").
- **Card** `.fl-thanks__card`: creator mini (sm avatar, name, handle), then `.fl-goal` with "$71.76 of $300 raised, with your tip", then `.fl-wall` "On Valentina's wall".
  - The fan's note comes first as `li.is-you` (accent soft) with a `.fl-you` "You" tag, then 2 other real wall entries.
  - If the fan left no note, omit the "You" row. If there's no goal, omit the goal.
  - Pass purchases: the card shows the `PassCard` and the private link (the current content) instead of the wall.
- **Motion:** unchanged (knot draw, burst, `tz-rise` stagger; the card rises at 1500ms). Reduced motion shows the final state.

### 2.6 Phone CTA dock (small) — item 4
- `.fl-dock`:
  - `position: sticky; bottom: 0`, z sticky.
  - Margin −16px with 12px padding plus `env(safe-area-inset-bottom)`.
  - Background: a fade from transparent to `--tz-bg` over 28%.
- Contains the primary CTA (+ trust or helper line). Used on amount, pay, quote and onboarding.
- ≥1024 it becomes static.
- Fields get `scroll-margin-bottom: 140px`, so iOS/Android scroll a focused input above the dock and keyboard.
- `viewport-fit=cover` is needed in the `<meta viewport>` for the safe-area padding.
- No animation.

### 2.7 Dashboard (medium) — items 5, 8, 18
- **Shell** `.fl-dash`:
  - `grid-template-columns: minmax(0,1fr)`; at ≥861px, `232px minmax(0,1fr)`.
  - Main `.fl-dash__main` is centred, max **88rem (1408px)**, padding `32px clamp(20–40px)`.
  - The tab bar (<861) gains **Stream** (5 items). At ≤380 the items flex to share the width.
- **Head:** date overline + "Good evening, Valentina", then actions (theme, "Share my page") that wrap on phones.
- **Stats** `.fl-stats`:
  - 2-up with a full-width hero on phones; `1.4fr 1fr 1fr` at ≥641.
  - The hero card gets a 10px slim weave on its bottom edge (`.fl-stat-hero .tz-weave`).
- **Columns** `.fl-cols`: ≥1280, `minmax(0,1fr) 22.5rem`, 24px gap. The rail is sticky (top 24px).
- **Tips card:**
  - Date, paid-with, amount and status are `nowrap` at ≥641. The fan message truncates at 24ch.
  - The "Details" button keeps a 32px target (consider 44px with padding).
  - The breakdown is `.fl-breakdown` (dd nowrap).
  - At ≤640 rows are `minmax(0,1fr) auto`, `td[data-col=detail]` spans both columns, and the fan cell has `min-width:0`.
- **Rail cards**, each with `.fl-card-h` (icon + h2 + optional pill):
  1. **Your page:** 92px QR, `tezeo.app/@vale`, "Print it, pin it on stream.", then "Copy link" (secondary) and "Open my page" (ghost).
  2. **Funding goal:** progress, then `.fl-inline-form` (name + 7rem target), then "Save goal" (auto width).
  3. **Alerts for OBS:** the existing helper copy shortened ("Add a **Browser Source** in OBS with this link. A card pops up for every confirmed tip. Keep it private."), the copy field, and a ghost "Preview the alert" link (`?preview=1`).
  4. **Membership pass:** On/Off pill, the checkbox, then a 7rem price + perk inline form, then "Save pass", then members.
- **Below 1280** the rail cards flow under the table in the same order.
- **New-wallet notice:** keep as is, above the stats. It already reads well.
- **A11y:** the rail is `aside aria-label="Tools"`, every form has labels, and save status stays `role="status"`.

### 2.8 Onboarding (medium) — items 6, 7
- `.fl-onb` grid:
  - <1024: one column (max 480px, or 576px on tablets).
  - ≥1024: `minmax(0, 32rem) minmax(20rem, 24rem)`, areas `"form preview" "cta preview"`. The preview is sticky.
- **Preview** `.fl-preview`:
  - Overline "How fans see it" and a `.fl-seg` Light/Dark switch (`aria-pressed`).
  - Then `.fl-phone`: the URL bar `tezeo.app/@{handle}`, a 72px weave, an 80px avatar, name, handle, bubble, the three tiles, and "Send $5 to {first name}".
  - It renders with the chosen accent and the chosen theme. Reuse the existing `.tzs-preview > [data-theme="dark"]` token restatement for the dark mode of the phone.
  - Empty fields show faint placeholders (`.fl-placeholder`).
- **Swatches** `.fl-swatch` (44px). The custom colour is a conic-gradient swatch with "+" that opens the native colour input (instead of the odd square).
- **CTA** `.fl-onb__cta` (dock on phones): **"Create my page"**, then "We check your wallet address before saving it."

### 2.9 Global small fixes
- `.fl-demo` replaces the in-flow demo card.
- All native checkboxes get `accent-color: var(--tz-brand)`.
- Long creator names wrap (`overflow-wrap: anywhere` on `h1`, bubble and wall messages).

---

## 3. What I rendered and looked at
- **Live app ("before"):**
  - Amount, pay, quote, thank-you, failed, refunded, pass offer, pass thank-you, dashboard (with Details open), onboarding and alerts, at 320, 390, 768, 1024, 1440 and 1920 in light.
  - Amount, pay, quote, thank-you, dashboard and onboarding at 390 and 1440 in dark.
  - Pending and converting tracking, plus the private pass page, at 390, 768 and 1440 in light.
  - The quote-expired modal at 1440 (with the clock fast-forwarded 5:05).
- **Prototype ("after"):** all seven screens at 320, 390, 768, 1024, 1440 and 1920 in light, and at 390 and 1440 in dark.
  - At 390 I captured both the viewport (to see the sticky dock) and the full page (dock made static, so the image doesn't show it overlapping content).
  - Overflow checked at every width: none at 320 after fixes.
- **Not verified:**
  - The **wallet row**: my injected EIP-6963 wallets didn't show up in the running build, which still showed the typed field and "Get MetaMask". The prototype mocks the row from `WalletConnect.tsx`.
  - The **one-tap "Pay with MetaMask"** card is mocked from `WalletPay.tsx` (live mode only).
  - Real-device keyboard and safe-area behaviour.
  - Dark "before" for tracking.
  - The failed, refunded, pass and private-pass layouts are spec only (they reuse §2.1 and §2.5).
