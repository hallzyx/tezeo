# Tezeo Creator Dashboard: from one page to a workspace

**The problem, in one paragraph.** The creator dashboard (`/dashboard/<token>`) is one long scrolling page. The sidebar items Home, Tips, Passes and Stream are `#anchor` links into that page, and "My page" leaves the dashboard for the public page with no way back. Clicking an item never opens anything. The page just jumps, `aria-current` stays on Home, and Back does nothing useful. Everything sits in one column at the same weight: 3 stat tiles, then the full tip table (up to 100 rows), then the stream tools and pass forms at the very bottom. With 50 tips the page is **5,560px tall at 1440, 6,616px at 768 and 7,583px at 390**, and reaching the goal form means scrolling past every tip. The visual language is good and stays. **The structure is what changes: every sidebar item becomes a real page with its own URL and its own job.**

Files (new; nothing outside `design/` was edited):
- `design/dashboard.html`: static prototype of the workspace.
  - Pages: `?screen=home|tips|passes|stream|page`.
  - Options: `&theme=dark`, `&state=empty|live`, `&next=1` (shows the "next" filter bar on Tips) and `&clean=1` (hides the prototype notes).
  - Each screen opens with a viewport note.
  - The rows are the seeded demo data from the running app; names, notes and amounts are examples.
- `design/dashboard.css`: every class is `db-`. It imports nothing; load it after `tokens.css`, `components.css` and `flow.css`.
- `design/screenshots/dashboard-before-*.png` (live app) and `dashboard-after-*.png` (prototype). The full list is in §9.

Constraints respected:
- Tokens, components, colours and signature elements are unchanged.
- The fan never sees costs.
- No login, email or WalletConnect.
- CSS-only motion, with reduced motion honoured.
- AA contrast, no horizontal scroll at 320, and touch targets ≥ 44px.

---

## 1. The page map (build this first)

Each existing sidebar item becomes a page. Today's sections **move** onto those pages; nothing is redesigned. The token stays in the URL because the link is the credential.

| Nav label | URL | `<title>` | Job (one sentence) | What moves here from today's `Dashboard.tsx` | Data (all from today's `GET /api/dashboard/<token>`) |
|---|---|---|---|---|---|
| **Home** | `/dashboard/<token>` | Home · Tezeo | "How am I doing, and is anything waiting for me?" | Greeting and date, the "Heads up about your wallet" note, the 3 stat tiles. **New:** the latest 5 tips, plus one small card per other page (goal progress, pass status, page QR), each with one fact and a link. | `creator`, `walletHasUsdc`, `stats.*` (including `totalUsdc`, computed today but never shown), `tips.slice(0,5)`, `goal.progress`, `pass`, `passes` |
| **Tips** | `/dashboard/<token>/tips` | Tips · Tezeo | "Every tip, who sent it, what they said, what I got." | The "Latest tips" table, renamed **Tips**, full width, with the **Details** cost breakdown (`TipBreakdown`). The "N on its way" pill. | `tips` (≤100), `stats.totalUsdc`, `stats.inFlight` |
| **Passes** | `/dashboard/<token>/passes` | Passes · Tezeo | "Set up my Membership Pass and see who's in my crew." | `PassSettings`: the form plus the members list. **New:** a preview of the pass card as fans see it (existing `tz-pass` markup). | `pass`, `passes`; saves with today's `PATCH /api/dashboard/<token>/pass` |
| **Stream** | `/dashboard/<token>/stream` | Stream · Tezeo | "Put tips on my stream and give fans a goal to push." | `StreamTools`: the OBS alert link and the funding goal form. **New:** a static picture of how the alert looks on stream (`Alerts.tsx` markup) and a "Preview the alert" link (`/alerts/<alertToken>?preview=1`, already supported). | `alertToken`, `goal`; saves with today's `PATCH /api/dashboard/<token>/goal` |
| **My page** | `/dashboard/<token>/my-page` | My page · Tezeo | "Share my page, and keep my private link safe." | Today this link **leaves** the dashboard. Now it's a page: a preview card of the public page (weave, avatar initial, name, handle), the copyable `tezeo.app/@handle`, "Open my page" (new tab) and "Share my page", a print-ready QR, and the private-link card. | `creator.handle`, `displayName`, `accent`. QR comes from the `qrcode` package, as `/c/[handle]/page.tsx` already does. |

**What is shared (the shell, rendered once in `layout.tsx`):**
- Sidebar (≥861px) or bottom tab bar (<861px), both listing all five pages.
- Top bar: the creator chip (avatar, name, @handle; links to My page), the live "N on its way" pill, the theme toggle and "Share my page".
- The single poller, the toast stack, the new-row highlight and the `aria-live` region.
- The private-link reminder at the bottom of the sidebar.
- The footer "woven by tezeo · keep this link private".

**URL rules:**
- Segments are lowercase nouns.
- Unknown segments 404 (Next's default `notFound()`).
- Old `#tips`, `#passes` and `#stream` anchors on the Home URL redirect client-side to the matching page, so links in old bookmarks keep working.
- "My page" uses `my-page`, not `page`, so the folder isn't `page/page.tsx`.
- Later, deep links to one tip are `/dashboard/<token>/tips?tip=<id>`; see "next" N3.

**Not added as pages, on purpose:**
- **Supporters, Settings/Wallet, Analytics.** Each needs data or endpoints that don't exist yet (see §7). They join the nav only when they have something real to show.
- **Payouts.** Tezeo never holds funds, so there is nothing to withdraw. The hero says "already in your wallet" instead.

---

## 2. The minimum viable split (front-end only, ship first)

**Scope:** no new endpoints and no new data. Reuse `dashboardData()`, the GET poll, `PATCH /goal` and `PATCH /pass`. Most JSX moves as-is.

```
src/app/dashboard/[token]/
  layout.tsx          server: getCreatorByToken(token) ?? notFound(); initial = await dashboardData(c)
                      metadata: { title: { template: "%s · Tezeo", default: "Dashboard" },
                                  robots: { index: false, follow: false }, referrer: "no-referrer" }
                      renders <DashboardShell token initial accent>{children}</DashboardShell>
  DashboardShell.tsx  client: DashboardContext { token, data, fresh:Set<id>, refresh(), setData }
                      ONE poller (moved from Dashboard.tsx), toasts, Sidebar, TopBar, TabBar
  page.tsx            export const metadata = { title: "Home" };    <OverviewView/>
  tips/page.tsx       export const metadata = { title: "Tips" };    <TipsView/>      (table + TipBreakdown)
  passes/page.tsx     export const metadata = { title: "Passes" };  <PassesView/>    (PassSettings + members)
  stream/page.tsx     export const metadata = { title: "Stream" };  <StreamView/>    (StreamTools)
  my-page/page.tsx    export const metadata = { title: "My page" }; <MyPageView/>
```

1. Move `page.tsx`'s data fetch and metadata to `layout.tsx`. A Next layout does not re-render or unmount when moving between its child pages, so the poller, toasts and fetched data survive navigation.
2. Split `Dashboard.tsx`:
   - The `useEffect` poller, toasts, `fresh`, `share()`, the `<aside>` and the tab bar go into `DashboardShell`.
   - `TipBreakdown`, `PassSettings` and `StreamTools` move to their pages unchanged at first.
   - Each view reads `useDashboard()`.
3. Replace every `<a href="#…">` in the nav with `next/link` `<Link href={`/dashboard/${token}/tips`}>`. Set `aria-current="page"` from `usePathname()`.
4. After a successful PATCH (goal or pass), update `data` in context (`setData` with the response merged in, or call `refresh()`), so Home's cards are right the moment you go back.
5. Ship the small fixes in §6 in the same PR. They are CSS and copy only.

**Done when:**
- Each nav item changes the URL and the page.
- Back and Forward move between pages.
- Reloading `/dashboard/<token>/stream` opens Stream.
- A tip confirmed while you're on Passes still toasts.
- The Home tile counts update without a reload.
- No page is taller than one tip table.

---

## 3. Navigation and shell behaviour (exact)

**Desktop sidebar (≥861px), `aside.db-side`:**
- 232px wide, `position: sticky; top: 0; height: 100dvh`, surface background with a 1px right border.
- `.db-app` paints the sidebar colour down the full page height.
- From top to bottom:
  1. A 10px `tz-weave--slim` on the top edge (it takes the creator's accent).
  2. The lockup, linking to `/`.
  3. `nav.db-nav[aria-label="Dashboard pages"]` with five links, each 44px tall, icon + label.
  4. Pinned to the bottom, `.db-key`: "This link is your key. Anyone with it can see your tips and change your settings. Keep it private." It links to `my-page#key`.
- **Active state** is `a[aria-current="page"]`:
  - `--tz-brand-soft` background and `--tz-brand-text` label, as today.
  - A 7px brand rombo at the right edge, the same knot a selected chip wears. Not colour alone: the rombo plus `aria-current` carry it.
  - Hover is `--tz-bg-sunken`.
- **Live count:** while `stats.inFlight > 0`, the Tips item shows `.db-nav__count` with `aria-label="1 on its way"`. It replaces the rombo when Tips is the active page.
- **Not collapsible.** Five items don't need it. Revisit if the nav grows past 7.

**Phone and tablet (<861px):**
- **Top bar:** the 32px mark, the creator name and @handle, then the actions (theme, Share). Below 480px, Share collapses to its icon; the label is kept for screen readers.
- **Tab bar** (`nav.db-tabbar`): fixed to the bottom with safe-area padding, holding **all five pages: Home · Tips · Passes · Stream · My page.** Today's bar has four and no Stream.
- **Tab sizing:** each item is `flex: 1`, at least 56px tall, with a 22px icon and an 11px label. Verified at 320px, where all five labels fit without truncating.
- **Tab active state:** `aria-current`, a brand-soft pill behind the icon, brand label colour, and a 6px rombo above the icon.
- **Tab live count:** a 18px añil dot with the number on the Tips icon.
- `main` keeps `padding-bottom: tab-bar + 40px`, so the last card never hides behind the bar.

**Top bar (all widths, `header.db-top`):**
- Sticky, 64px, `color-mix(bg 88%)` with a blur, and a hairline bottom border.
- **Left:** the creator chip, which links to My page.
- **Right:**
  - `a.tz-pill.db-live[data-status=converting]` "1 on its way", shown only while `inFlight > 0`. It links to Tips. Below 380px it shows just the number, with an `aria-label`.
  - The theme toggle (today's `ThemeToggle`).
  - "Share my page" (today's `share()`).
- The greeting is **not** in the top bar. It belongs to Home only. Every page has its own `h1` in `.db-head`.

**Page changes:**
- Next scrolls to the top on its own.
- After a client navigation, focus moves to the page `h1` (`tabIndex={-1}`, `focus({ preventScroll: true })`, skipped on first load). Screen-reader users land on "Tips"; Next's route announcer also reads the new `<title>`.
- `a.db-skip` "Skip to content" is the first focusable element. It targets `main#main[tabindex=-1]`.
- **Back button:** every page is a history entry, so Back and Forward work. Expanding a tip's Details is **not** a history entry. Filters (later) use `router.replace` so they don't fill the history.
- **Keyboard:** Tab order is skip link → sidebar → top bar → main. No custom shortcuts in the base split; `/` to focus search arrives with filters (N1).

**One poller, every page:**
- **Where:** `DashboardShell` polls `GET /api/dashboard/<token>` every 7s, exactly as today, but **once**, in the layout. No page polls on its own.
- **When:** add `document.visibilityState` handling. Pause while the tab is hidden, and tick immediately when it comes back. The live state is unchanged.
- **Toasts:**
  - Same rules as today, rendered in the shell's `div.db-toasts[aria-live=polite]`, so they appear on whichever page you're on.
  - Copy: "New tip from Ana · 4.94 USDC", or "A tip from Inés is on its way" with "It'll show as received in about a minute."
  - Each toast carries "See it", a link to Tips.
  - Position: **bottom-right on desktop** (they no longer cover the page head or the table's right edge; today they sit at `bottom: 88px` over the status column) and **above the tab bar on phones**.
  - Each toast stays 6s. It uses `tz-toast` with `data-status`.
- **Row highlight:**
  - `fresh` lives in context, so a new row flashes on Home's latest-5 list *or* on Tips, whichever is visible.
  - `.db-newrow` uses `--tz-pending-bg`, holds for 30% of 1.6s, then fades.
  - **Reduced motion:** no fade. A static "New" tag (`.db-new`) shows on the row for the same time.
- **Live count:** `stats.inFlight` drives the header pill, the Tips nav count and the tab dot together.

**Private link (the token in the URL):**
- `layout.tsx` keeps `robots: noindex` and `referrer: no-referrer` for all five pages.
- Every outbound link (public page, pass page, alert preview) has `target="_blank" rel="noopener noreferrer"`.
- The token never goes into analytics or error-reporting payloads. Strip `/dashboard/[^/]+` before logging.
- The copy appears in three places, each in plain words:
  - the sidebar `.db-key`
  - the footer
  - the My page "Your private dashboard link" card, with its "Copy my private link" backup action

---

## 4. Why it feels like "one page", ranked

Impact **H/M/L**, size **S/M/L**. "Backend" marks anything that needs server work. All of these are fixed by the split plus §6, with no backend.

| # | What's wrong today (seen in the live app) | Fix | Impact | Size |
|---|---|---|---|---|
| 1 | Sidebar items are `#anchors`, so nothing opens. `aria-current` is stuck on Home. "My page" leaves the app. | Five real pages (§1–§3). | H | M |
| 2 | One 5,560–7,883px page. The goal and pass forms sit below up to 100 tip rows. | Each job on its own page. Home shows the latest 5 tips. After: Home 1,182px, Passes 922px, Stream 996px, My page 981px (at 1440). | H | M |
| 3 | The mobile tab bar has no Stream, so the OBS link and goal are unreachable except by scrolling. | Five-item tab bar (fits at 320). | H | S |
| 4 | Nothing on the page says what to do next. Empty creators see three zeros and a dashed box. | Home's three "door" cards each say one fact and one action ("No goal yet… Set a goal", "Turn on a pass", "Share, copy or print it"). | M | S |
| 5 | The stat tiles are dead ends. | Tiles are links: Tips this month → Tips, Active passes → Passes. | M | S |
| 6 | At 768–1280 the amount wraps ("7.90 / USDC") and "Hide details" breaks in two. | The table adapts to the **card** width (container query, §5.3). Details gets its own column. | M | S |
| 7 | A fan's note is cut at 48 characters and can never be read in full. | Details shows the whole note beside the breakdown. Failed and refunded rows get Details too, with a calm explanation. | M | S |
| 8 | Forms are full width with full-width, 56px-tall "Save" buttons. | Compact forms: price/target 8.5rem beside the text field, auto-width buttons, inline "Saved" status. | M | S |
| 9 | Initials circles use white on `#F2A900` (**2.0:1**) and `#1A9E8F` (**3.3:1**) at 13px. | `.db-dot` uses token pairs: brand-soft/brand-text 6.2:1, añil-100/600 7.1:1, maíz-100/700 5.3:1, accent-soft/text ≥4.8:1. "Someone kind" gets a heart, not "?". | M | S |
| 10 | The new-row flash uses `var(--tz-gold-soft, #FFF1CC)`. That token doesn't exist, so dark mode flashes light yellow. It also ignores reduced motion. | `.db-newrow` with `--tz-pending-bg`, plus a static "New" tag under reduced motion. | M | S |
| 11 | `stats.totalUsdc` is computed by the API and never shown. On Nov 1, "Received this month" read **0.00** for a creator with $116 received in October. | Hero subline: "337.97 USDC all time · already in your wallet". (Month-boundary fixes are N7.) | M | S |
| 12 | Desktop main hugs the left at 1920. | Main is centred, max 76rem (1216px) with fluid padding. | L | S |
| 13 | The status-green pill could be reused for "Pass: On". | `.db-onoff` (brand-soft with rombo / neutral with ring). Payment status colours stay reserved for payments. | L | S |

---

## 5. Page and component specs

Shared breakpoints:
- **<641**: stats 2-up with a full-width hero.
- **<861**: top bar plus tab bar.
- **≥861**: sidebar plus centred main.
- **≥1024**: two-column pages (`.db-two`).
- **≥1100**: Home's 340px rail.

The tip table switches on the **card's** width, not the viewport (§5.3).

### 5.1 Shell
- **Markup:**
  ```
  div.db-app.tz-creator[style=--creator-accent]
    a.db-skip
    aside.db-side
    div.db-col
      header.db-top
      main#main.db-main
        {page}
        footer .db-foot
    nav.db-tabbar
    div.db-toasts
  ```
- **Main:**
  - `max-width: calc(76rem + 2 × --db-pad)`, centred.
  - `--db-pad` is `clamp(16px, …, 40px)`.
  - Padding top: 24px on phones, 32px from 861px.
  - 20px gap between blocks.
- **Page head** `.db-head`:
  - `h1.tz-h1` (24–32px) and a muted one-line `p` (max 60ch).
  - Actions sit right and wrap below the title on phones.
- **Classes reused:** `tz-btn` (primary/secondary/ghost/icon), `tz-card`, `tz-pill`, `tz-toast`, `tz-avatar`, `tz-weave(--slim)`, `tz-table(--stack)`, `tz-badge`, `tz-copy`, `tz-qr`, `tz-pass`, `tz-quote`, `tz-field`/`tz-input`, `tz-chip(s)`, and `fl-goal`/`fl-howto` from `flow.css`.
- **New icons** (24px grid, 2px strokes, in the prototype sprite):
  - `i-down`: the Details chevron.
  - `i-external`: opens in a new tab.
  - `i-search`: next, for N1.
- **Already in the app's sprites:** `i-stream` and `i-target` are in `sprite-landing.ts`. Use `i-stream` for Stream instead of today's heart.

### 5.2 Home `/dashboard/<token>`
- **Order:** head → wallet note → stats → `.db-cols` (latest tips | rail).
- **Head:** `tz-overline` date ("Sunday, Nov 1") and `h1` "Good afternoon, {first name}" (today's greeting logic).
- **Wallet note:**
  - Today's `tz-card--sunken` "Heads up about your wallet", unchanged, shown only when `walletHasUsdc === false`.
  - Its last sentence ("You'll see the exact amounts on each tip in your dashboard") goes, because Tips now says it.
- **Stats** `.db-stats`:
  - Layout:
    - <641: `1fr 1fr`, with the hero spanning both columns.
    - ≥641: `1.4fr 1fr 1fr`, 16px gap.
  - All three tiles are `<a>`:
    - **Hero** (`db-stat--hero`, inverse surface, 10px slim weave on the bottom edge):
      - Overline "Received this month".
      - Value `stats.receivedThisMonthUsdc` with unit USDC.
      - Small text "{totalUsdc} USDC all time · already in your wallet".
      - Empty variant: "Tips land straight in your wallet, as USDC."
      - Links to Tips.
    - **"Tips this month"**: `stats.tipsThisMonth`, "See every tip", links to Tips.
    - **"Active passes"**: `stats.activePasses`, then "$12 · 30 days" or "Your pass is off". Links to Passes.
  - Hover: border-strong, a 1px lift and a brand arrow. Reduced motion: no lift.
- **Columns** `.db-cols`:
  - ≥1100: `minmax(0,1fr) 340px`, 24px gap. The rail is sticky under the top bar.
  - 641–1099: the rail cards sit in an auto-fit 2-up grid under the tips.
- **Latest tips card:**
  - Today's table with the latest 5 rows (no Details column; Details lives on Tips).
  - Footer: "Your 5 latest tips" · "See all {n} tips →".
  - The converting pill "1 on its way" (a link to Tips) sits in the card head.
  - **Empty:**
    - `.db-empty`: a dashed loose-thread drawing, "Your first thread is on its way", "Share your page and the first tip will show up here, live."
    - Buttons: primary "Copy my link" and ghost "Get my QR code" (links to My page).
- **Rail "door" cards** (`.db-door`), each with an icon, an h2, one fact and one link:
  1. **Funding goal**:
     - `fl-goal` with title, % in accent text, bar (`role=progressbar` with `aria-valuenow`) and "$116.11 of $300 raised". Links "Edit goal →" to Stream.
     - Empty: "No goal yet. A goal adds a progress bar to your page, and fans love to push it." with "Set a goal →".
  2. **Membership pass**:
     - `.db-onoff` On/Off in the head.
     - "**3** members · $12 for 30 days" and "Ana's pass ends first, on Nov 30." (earliest `expiresAt` among active passes). Links "Manage passes →".
     - Off: "Offer fans 30 days in your crew for a one-time price." with "Turn on a pass →".
  3. **Your page**: an 84px QR in `tz-qr`, "Scan to tip {first name}" and `tezeo.app/@handle` (mono), with "Share, copy or print it →" to My page.
- **Loading:** the layout renders on the server with data, so there's no spinner. If a poll fails, keep the last data silently (as today).

### 5.3 Tips `/dashboard/<token>/tips`
- **Head:**
  - `h1` "Tips".
  - Sub: "{n} tips so far · {totalUsdc} USDC received in total, straight to your wallet."
  - Empty sub: "Every tip shows up here as it arrives, with exactly what it cost."
  - Action: "1 on its way" pill while `inFlight > 0`.
- **Card** `.tz-card.db-tips` is a size container (`container: tips / inline-size`):

  | Card width | Layout |
  |---|---|
  | **≥820px** | Fan (dot, name + PASS badge, note in one line, max 34ch with ellipsis) · Date ("Today, 1:24 PM") · Paid with ("**USDC** on Base") · You got (right-aligned, tabular, nowrap) · Status pill · Details (text + chevron, a 44px button). |
  | **600–819px** | "Paid with" moves under the date as `.db-via` ("USDC on Base"). Details becomes a 44px chevron (its label stays for screen readers: "Details for Ana's tip"). Cell padding is 10px. |
  | **<600px** | Stacked cards, grid `minmax(0,1fr) auto 18px`. Row 1: fan / amount. Row 2: date · coin / status pill + chevron. **The whole card is the Details button**: a stretched transparent `button` with `aria-expanded`/`aria-controls` and a full-card focus ring. |

  The same card is ~360px on a phone, ~600px in Home's column at 1100–1279, ~720px at 768 and 1024, and ~1100px at 1440. A viewport media query can't describe that, which is why today's table wraps at 768–1280.
- **Rows:**
  - Converting rows stay on top with "on its way" in the amount column (muted).
  - Failed and refunded rows show "returned to fan" (muted).
  - "Someone kind" is used when the name is empty.
  - Long names wrap at word boundaries. Notes ellipsize in the row and show in full in Details.
- **Details** (`tr[data-detail]`, colspan, sunken):
  - ≥900px card: two columns, `1fr | 18–24rem`, indented 42px.
  - Left:
    - Overline "{First name}'s note", then the full note in `.db-note` (accent-soft).
    - Or "{Name} didn't leave a note."
  - Right: today's `tz-quote` breakdown, unchanged:
    - Your fan sent
    - Delivery to your wallet
    - Fees & price spread
    - **You received {usdc} USDC** (total row at xl)
    - Then "Your fan only saw what they paid. These costs are for you."
  - The "first-tip set-up cost" note stays as today when `delivery ≥ 0.10`.
  - Failed or refunded: "**This one didn't go through.** / **This one was refunded.** {Name}'s money went back to the wallet it came from, automatically. Nothing reached you and nothing was taken from you."
  - One Details open at a time (as today). Not a history entry.
- **Footer:** "Showing all {n} tips. The dashboard keeps your latest 100."
- **Empty:**
  - `.db-empty` "No tips yet", "When a fan pays, the tip appears here within seconds: who sent it, their note and what you received."
  - Button: "Copy my link".
- **A11y:**
  - `<caption class="tz-sr-only">` "All your tips, newest first".
  - `th scope=col`.
  - Dates are `<time datetime>`.
  - Pills carry shape plus words (today's `tz-pill`).
  - Expanded rows use `aria-expanded` and `aria-controls`.

### 5.4 Passes `/dashboard/<token>/passes`
- **Head:**
  - `h1` "Passes" and "A Membership Pass gives a fan 30 days in your crew for one payment. No auto-renew: it simply ends."
  - Action: ghost "See the pass page ↗" (`/@handle/pass`, new tab), shown when the pass is on.
- **Layout** `.db-two`:
  - ≥1024: `minmax(0,1fr) minmax(20rem,26rem)`, 24px gap. Below 1024 it's one column.
  - **Left:** `form.tz-card.db-form` "Pass settings":
    - The **switch** `.db-switch`: a real `input type=checkbox role=switch`, 48×28, brand when on. Label "Offer a 30-day pass on my page", helper "Fans see it under your tip amounts."
    - `.db-fields` (`8.5rem | 1fr` from 520px):
      - **Price**: `.db-money` with a "$" prefix and `inputmode=numeric` (today's digit filter, 1–500).
      - **What members get**: max 140.
    - Hint: "Paid once, in dollars. You receive the full price in USDC; the fan's quote is sized to cover the fees."
    - `.db-form__end`: primary "Save pass" (auto width, "Saving…" while busy), then `p.db-status[role=status]` "✓ Saved. Your pass is live at /@vale/pass" (or "Saved. The pass is off."). Errors use `data-tone=error` with today's API message.
  - **Right:** `.db-preview`:
    - Overline "How fans see it", then `tz-pass` with "{First name}'s Crew", the perk, "30 days" and a full meter.
    - Then "$12 · paid once · ends after 30 days".
    - It updates live as you type. When the switch is off, `[data-off]` greys it to 70% so it reads "not on sale".
- **Members** card (full width):
  - `.db-onoff` "3 active".
  - A table with Member (dot, name, PASS badge, note) · Ends ("Nov 30") · Days left (`.db-left`: "29 days left" plus a 6px maíz stitched `.db-meter`, cochinilla when ≤3 days, `data-soon`). Sorted by soonest end first.
  - Ended passes stay listed with "Ended" and an empty meter.
  - Below 600px card width: name and end date on the left, the meter on the right.
  - **Empty:** "No members yet. A member appears here once their payment is confirmed."
- **Turning the pass off:** no confirm dialog needed (nothing is lost). The status line says "Saved. The pass is off. Current members keep their pass until it ends."

### 5.5 Stream `/dashboard/<token>/stream`
- **Head:** `h1` "Stream" and "Show a card on your stream for every tip, and a goal your fans can push together."
- **Layout:** `.db-two`, with alerts on the left and the goal on the right; one column below 1024.
- **Alerts card** "Tip alerts for OBS" (`i-stream`), with `ol.fl-howto` numbered in brand rombos:
  1. "**Copy your alert link.** It's separate from this dashboard link, but keep it private too." Then a `tz-copy` (mono, wraps anywhere) with a 40px "Copy alert link" button (✓ for 1.8s, as today).
  2. "**In OBS, add a Browser Source** and paste the link. The background is transparent and the card sits at the bottom centre."
  3. "**That's it.** A card pops up for every confirmed tip, even when this dashboard is closed."
  - **Stage** `.db-stage`:
    - A 16:9 obsidiana stage with soft añil and cochinilla glows and a tag "Your stream".
    - Inside, the real alert card markup from `Alerts.tsx` with the sample tip, wearing the creator's accent. It's static (`role=img` with a full text label), so there's no motion to manage.
  - Below it, secondary "↗ Preview the alert" (`/alerts/<alertToken>?preview=1`, new tab) and the hint "Opens the alert page with a sample tip every few seconds."
- **Goal card** "Funding goal" (`i-target`):
  - `fl-goal` progress: "$116.11 of $300 raised since you set it".
  - Fields: "Goal name" (full width, max 80), then "Target" (`.db-money`, max 10rem).
  - Hint: "It shows on your page. Only tips received after you save count."
  - Buttons: primary "Save goal" and ghost "Remove goal" (sends `targetUsd: 0`, the API's existing remove path; shown only when a goal exists).
  - Status: "Goal saved. It shows on your page and counts tips from now on." / "Goal removed."

### 5.6 My page `/dashboard/<token>/my-page`
- **Head:** `h1` "My page" and "This is where fans tip you. Put the link in your bio and the QR on your stream or your classroom wall."
- **Layout:** `.db-two`.
- **Left** `.db-pagecard`, a small replica of the public page header:
  - A 72px `tz-weave`, an 80px `tz-avatar` overlapping by 40px, the name in Display 2xl and `@handle` in accent.
  - The `tz-copy` with `tezeo.app/@handle` and "Copy my page link".
  - Buttons: secondary "↗ Open my page" (new tab) and primary "Share my page" (today's `share()`).
  - Uses the creator's initial until the API exposes `avatarUrl` (N9).
- **Right** `.db-qrbig`:
  - Overline "Scan to tip", a 176px QR in `tz-qr` (rombo corners), "Scan to tip {first name}" and "Print it, pin it on your stream, put it on a slide."
  - Secondary "Download QR": front-end only, the same `qrcode` SVG as a file named `tezeo-<handle>-qr.svg`.
- **Private-link card** `#key` (`.db-keycard`, dashed border, shield icon), h2 "Your private dashboard link":
  - Text: "There's no password: this link is your key. Anyone who has it can see your tips and change your goal and pass."
  - Rombo bullets:
    - Bookmark it, or save it in your notes or password manager.
    - Don't share screenshots that show the address bar.
    - Your public page is safe to share anywhere. Your OBS alert link is separate: if it leaks, it can only show alerts, never this dashboard.
  - Secondary "Copy my private link" with "To save it somewhere safe. Never paste it in public."

### 5.7 States, motion, a11y (all pages)
- **States:**
  - **Empty:** the copy is in each section above; see the `?state=empty` prototype.
  - **Saved / error:** inline `role=status`, never a toast. Toasts are reserved for tips.
  - **Loading:** none needed (server-rendered layout). A save button shows "Saving…" and is `disabled`.
  - **Poll error:** silent; keep the last data.
- **Motion** (all CSS, using the motion tokens, so durations collapse under reduced motion):
  - nav and background colour: 160ms
  - stat-tile lift: 160ms, removed under reduced motion
  - Details chevron rotation: 160ms
  - switch knob: 240ms spring
  - toast: `tz-toast-in`
  - row highlight: 1.6s, replaced by the static "New" tag under reduced motion
  - No loops anywhere in the dashboard, except the converting pill's turning rombo (components.css, already stopped under reduced motion).
- **A11y:**
  - Landmarks: `aside[aria-label=Dashboard]` > `nav[aria-label="Dashboard pages"]`, `header`, `main#main`, and a second `nav` (tab bar) with the same label (only one is visible at a time).
  - One `h1` per page, which takes focus after navigation.
  - Every control is ≥44px.
  - `aria-live=polite` for toasts only.
  - Contrast: all text pairs come from tokens (§4 #9 for the dots). The `.db-onoff` brand-soft/brand-text pair is 6.2:1 light and 5.5:1 dark.

---

## 6. Small fixes to ship with the split (front-end only)

All S, no backend:
- §4 #6–#13.
- Toasts move bottom-right on desktop.
- Today's 4-item tab bar becomes the 5-item bar.
- Every outbound link gets `rel="noopener noreferrer"`.
- The poller pauses while the tab is hidden.

---

## 7. Next (lower priority, after the split; none of it blocks the base)

| # | Item | Where | Size | Backend? |
|---|---|---|---|---|
| N1 | **Filters and search on Tips**: search "by name or note", status chips with counts (All · Received · Didn't go through · Refunded), coin and date selects, state in the query string (`router.replace`). Client-side over the ≤100 loaded tips first. Prototype: `?screen=tips&next=1`. | Tips | S (client) / M (server) | No for ≤100 tips. Yes (M) for paging: `GET /api/dashboard/<t>/tips?status&coin&q&before&limit` |
| N2 | **Export CSV** (date, fan, note, coin, chain, sent USD, delivery, fees, received USDC, status). Client-side for loaded rows. | Tips | S | Optional (S): `GET /tips.csv` for full history |
| N3 | **Tip detail panel** with a deep link `?tip=<id>`: a right drawer (≥1024) or bottom sheet (phones). It adds what the fan sent in their coin ("0.00008 BTC on Bitcoin"), a 3-step `tz-steps` thread with times, and "View on Solana explorer". | Tips | M | Yes (S): expose `amountIn` + decimals, `settlementTx`, `updatedAt`, failure category from `detail` |
| N4 | **Estimated amount for converting tips** ("≈ 4.93 USDC") instead of "on its way". | Tips, Home | S | Yes (S): expose `amount_out_usdc` as `estUsdc` |
| N5 | **Earnings chart** on Home: received USDC per day for 30 days or per week for 12 weeks, as single-series bars (maíz on the inverse hero, zero baseline, today marked by a label, not colour). It needs a "Show as table" text fallback and must stay hidden until the first tip. Fine client-side while there are ≤100 tips. | Home | M | Yes (M) once a creator passes 100 tips: `GET /summary?range=30d|12w` |
| N6 | **More honest numbers**: "Last month" under the hero, average tip, top coin. Client-side while there are ≤100 tips. | Home | S | Same as N5 beyond 100 tips |
| N7 | **Month boundary in the creator's time zone.** The month starts at UTC midnight today, so a Lima tip at 9 pm on Oct 31 counts in November. On the 1st the hero reads 0.00. | Home | S | Yes (S): accept `tz` (from `Intl`) in GET |
| N8 | **Supporters page**: tips grouped by the name fans typed ("4 tips · since Oct 12"), regulars, pass crew, and "Copy names for a shout-out". Needs copy saying names aren't identities ("Two people with the same name show up together"). Add it to the nav only when it ships. | new page `/supporters` | M | Optional (S): `GET /supporters` (GROUP BY lower(fan_name)) for full history |
| N9 | **Edit profile** (name, message, photo, accent, amount labels) with a live preview in both themes and the §3.4 accent guard. It lives on My page. | My page | M | Yes (M): `PATCH /api/dashboard/<t>/profile`, plus `message`/`avatarUrl` in GET |
| N10 | **Settings: wallet** page. Shows the receiving address in full (mono, in 4-character groups) and its USDC-account state. Changing it is a careful flow: paste → we validate → compare old and new side by side, first and last 4 highlighted → type the last 4 to confirm → the change takes effect after 24h with a dashboard-wide banner "Your wallet changes to …8f3K on Nov 2, 3:10 PM. Not you? Cancel it." That protects against a leaked link. | new page `/settings` | L | Yes (L): `PATCH /wallet` with a delay and cancel, and an audit row |
| N11 | **Make a new private link** (rotate the token; the old one stops working right away). Plus **reset the alert link**. | My page / Stream | S each | Yes (S): `POST /rotate`, `POST /alerts/rotate` |
| N12 | **Send a test alert to OBS** (a real alert through the live Browser Source, not just `?preview=1`). | Stream | S | Yes (S): `POST /alerts/test` |
| N13 | **First-run checklist** on Home (share link · set a goal · turn on a pass · add OBS alerts) on a `tz-steps` thread. Done states come from data plus `localStorage` for "copied link" and "copied alert link". | Home | S | No |
| N14 | "(2) Tips · Tezeo" in the tab title for unseen tips while the tab is hidden, and "6 new since you last looked" on Home (`localStorage`). | Shell | S | No |

**Leave as is:**
- Pending and expired tips stay hidden from the history. They are unpaid quotes, mostly abandoned, and showing them would be noise and a privacy leak.
- Converting tips stay visible, as today.

---

## 8. Build order

1. **PR 1: the split** (§2 + §3, front-end only):
   - The layout and shell with one poller.
   - Five routes, moving today's components.
   - `next/link` with `aria-current`.
   - Focus on `h1`.
   - The 5-item tab bar.
   - Legacy anchor redirect.
   - *Ships the user's request on its own.*
2. **PR 2: the small fixes** (§6): the container-query table, full notes in Details, compact forms, dot contrast, highlight tokens and reduced motion, toast position, all-time total, centred main, door cards and empty copy on Home. Front-end only.
3. **PR 3: new on existing data:** the Stream alert stage, the Passes preview, My page (QR download and private-link card). Front-end only.
4. **Next, front-end only:** N1 and N2 (client-side), N13, N14, then N5 and N6 client-side.
5. **Next, with backend:**
   - **Small:** N4, N7, N3, N11, N12.
   - **Medium:** N9, N1 paging, N8.
   - **Large:** N10.

**Keep as is:**
- The visual language, unchanged: stat tiles with the inverse hero, `tz-table`, `tz-pill`, the `TipBreakdown` copy and math, the wallet note, the 7s poll, the toast copy, the pass and goal API, and the alert page.
- The "1 on its way" concept, now promoted to the shell.

---

## 9. What I rendered and looked at

- **Before (live app, `localhost:4300`):**
  - Seeded with 27 extra tips through the API (2 of them pass purchases): 7 coins and networks, notes of every length (including a 40-character name and a 160-character note), 2 failed, 2 refunded, 2 new passes. That gave 50 history rows, 3 active passes and the "no USDC account" note.
  - Also a fresh empty creator made through `POST /api/creators`.
  - Captured at 320, 390, 768, 1024, 1440 and 1920 in light; 390 and 1440 in dark; empty at 390 and 1440; the live toast and converting row at 1440; and Details open on the long note at 320 and 1024.
  - Saved as `dashboard-before-{home,home-empty,live,details}-{mobile320,mobile,tablet,laptop,desktop,wide}-{light,dark}.png`.
- **After (prototype):**
  - Every page at 390 and 1440 in light.
  - Home, Tips, Passes and Stream in dark at 390 and 1440.
  - Home and Tips at 768 and 1024; Home at 1920; Tips at 320.
  - Empty Home at 390 and 1440 (plus dark 1440).
  - Live state (Tips at 1440, Home at 390, viewport captures).
  - The "next" filter bar at 1440.
  - Saved as `dashboard-after-<page>[-empty|-live|-next]-<viewport>-<theme>.png`. Full-page phone captures show the tab bar at the end of the page; in the app it is fixed to the bottom.
  - `scrollWidth` equals the viewport width at every width, with no horizontal scroll.
  - I iterated on:
    - the phone tip cards (Details as the whole card)
    - the members table at 390
    - the goal fields in the narrow column
    - the tip table's container-query layout, after a 1046px overflow at 768
- **Not verified:**
  - The Next.js implementation itself. The split is specced, not coded: the brief limited edits to `design/`.
  - Real-device safe-area and keyboard behaviour.
  - Screen-reader announcements (reasoned from markup).
  - Download QR and copy buttons are inert in the static prototype.
  - The OBS stage is a static picture of `Alerts.tsx`, not a live iframe.
