# Tezeo Demo Stage: a mock livestream for the demo video

> A fake stream, a real tip. The viewer taps "Send a tip" under a mock livestream, pays through the real Tezeo flow without leaving the stream, and watches their own tip pop on stream as the creator's real alert.

Files:

| File | What it is |
|---|---|
| `demo-stream.html` | Prototype of the stage. Switches: `?state=idle\|press\|loading\|sheet\|quote\|track\|hint\|blocked\|away\|delivered\|chat`, `&mode=live\|sim\|rehearse`, `&theme=dark\|light` (Tezeo parts only), `&view=phone` (390×844 device frame on a big screen). The sheet embeds `flow.html` as a stand-in for the real `/@vale`. |
| `demo-stream.css` | All new classes, prefixed `ds-`. Imports nothing: link it after `tokens.css`, `components.css`, `flow.css`. No token or component was changed. |
| `screenshots/demo-stream-*.png` | 21 renders: phone 390×844 (and 320×640), desktop 1280×800, plus the device-frame view. |

---

## 1. Context

**Goal of the journey.** In 60–90 seconds a judge should understand three things without being told: (1) a streamer can drop Tezeo onto their stream like any other overlay or pinned link, (2) a viewer can pay with whatever crypto they hold, from their phone, without leaving the stream, and (3) the tip lands on stream, live, in front of everyone. "Open a link and pay" proves (2) only. The stage proves (1) and (3) by putting the existing flow in the place it will actually live.

**Audience.** Hackathon judges. They watch a phone-shot video with sound off half the time, and some of them will open the link and try it. They give us about one beat to understand the scene ("this is a livestream") and one beat to understand the action ("tap that"). Anything that needs a sentence to explain is too slow.

**Emotional target.**
1. *Recognition*: "oh, a stream, I know this place." The stage looks like a generic livestream page, not like a Tezeo page.
2. *Plausibility*: "a streamer would actually use this." The Tezeo pieces look like what a streamer adds today: a pinned card in chat, overlays on the video (goal bar, "Tip me" tag with QR), an alert.
3. *Ease*: the sheet opens under the video, the stream keeps playing, payment takes a few taps.
4. *Payoff*: the alert pops on the video with the viewer's own name and note, the goal bar moves, chat reacts. It's the viewer's moment on someone else's stage.

**Honesty.** The stage is labelled as a demo on every pixel row that matters: the demo strip ("Demo stage. Not a real stream."), "sample" on the viewer count and chat, a "camera placeholder" label on the fake camera, and no platform name, logo or brand colour. The stream chrome is a neutral graphite (no purple), the channel is made up ("Vale's Workshop"), and the creator is the seeded demo creator Valentina (@vale) with an initial, not a photo. The parts that are real (the tip page, the payment, the alert data, the goal) are named as real.

---

## 2. Three ways to put "Send a tip" on the stream

| | A. Panel under the video | B. Button on the player | C. Pinned card in chat (+ `!tip`) |
|---|---|---|---|
| **What it is** | An "About"-style panel row under the player: "Tip Vale in any crypto · Send a tip". The way streamers add link panels today. | A tappable "Tip with Tezeo" button drawn over the video (bottom-left), as if the overlay itself were clickable. | A card pinned at the top of chat, "Pinned by Valentina", with the Tezeo mark, one line and a **Send a tip** button. A chat bot repeats it when someone types `!tip`. |
| **Phone (390)** | Hidden: on phones panels sit below chat or behind an "About" tab, far below the fold. | Bottom-left of a 219px-tall player: about 32px tall at a believable overlay scale, under 44px. | Directly under the channel row, about 455px from the top: always visible without scrolling, one thumb-reach away. |
| **Desktop (1280)** | Below the player, visible after a short scroll. | Same, readable. | Top of the chat column, next to the video at eye level. |
| **How the flow opens** | Sheet / drawer, as C. | Sheet, as C. | Phone: a sheet that docks **under the player**, so the stream stays visible. Desktop: a drawer that covers the chat column. |
| **Risks** | Invisible on the phone, which is where the video is shot. | Dishonest: real video pixels are not clickable (only platform extensions are, and they're platform-specific). Too small to tap. It hides the video it sits on. | Chat is the busiest area; the card must be visually distinct (it is the only Tezeo-coloured thing in chat). Pinned-message UI exists on real platforms, so it must stay generic (it does: our own card, no platform styling). |

**Choice: C, combined with a non-interactive version of B and (desktop only) A.**

- **C is the entry point.** A pinned link in chat (and a `!tip` bot command) is exactly what streamers do today, so it's believable. On a phone it sits right under the video, so the camera sees the stream and the button in one frame. It is also the cheapest to build (one card).
- **B becomes the OBS overlay, not a button.** The video shows what OBS can really draw: a goal bar and a "Tip me in any crypto" tag with a QR code, plus the alert when a tip lands. It explains the streamer side with no words and gives a second path (scan from another device).
- **A is a desktop nice-to-have.** Three short panels under the player say what's real and what's sample. Useful for judges trying it on a laptop; skipped on phones.

---

## 3. Journey map (the video)

Target: **~75 s** for the phone cut. Times are cumulative and assume a payment route that settles in about 20–30 s. Real routes can take longer; cut the wait in the edit (beat 7 is designed to be trimmed).

| # | Beat | Time | What the camera sees | Microcopy on screen | Stage behaviour |
|---|---|---|---|---|---|
| 1 | **The stage** | 0–6 s | Phone, portrait. Demo strip, the mock stream (code editor, camera placeholder, LIVE · 1.2K sample), goal bar 22%, "Tip me in any crypto" tag. Chat scrolls a little. | "Demo stage. Not a real stream. Tips sent here are real." · "Vale's Workshop · Building a tip jar on Solana, live · day 12" | Idle. |
| 2 | **The viewer notices** | 6–10 s | The pinned card under the video. At 3 s after load the **Send a tip** button pulses twice (soft ring). In chat: `sol_sprout: !tip`, `stagebot: Tip Vale in any coin: tap Send a tip in the pinned card.` | "Pinned by Valentina" · "Tip Vale in any crypto" · "Any coin, any chain. Vale gets dollars." | One-time nudge (2 pulses, 1.4 s each). |
| 3 | **Tap** | 10–12 s | Thumb taps **Send a tip**. The sheet slides up from the bottom and stops under the video. The stream stays on screen. | Sheet header: "Tip Valentina" · "Tezeo's real tip page · tezeo.app/@vale" | Sheet open, iframe loading (three rombos, "Opening Valentina's tip page…"). |
| 4 | **Amount** | 12–20 s | The real creator page inside the sheet: weave, avatar, Valentina's message, goal. Tap $5, then **Send $5 to Valentina**. | (existing flow copy) | — |
| 5 | **Where's your money** | 20–28 s | Pick **Base**, **USDC**. Connect wallet (or the address field). **See the quote**. | "Where's your money?" | — |
| 6 | **Pay** | 28–40 s | "You send 5.00 USDC on Base · Price held for 4:58". Tap **Pay 5.00 USDC with MetaMask**, confirm in the wallet. | (existing flow copy) | If the wallet can't reach the panel, the hint strip shows (see §4.6). |
| 7 | **Tracking** (trim) | 40–55 s | The loom. While it weaves, type a name ("Ana") and a note in "While you wait, leave Vale a note?". Save. | "We're weaving your USDC into dollars for Vale." · "You can close this tab. We'll keep going." | Stage polls the alerts feed every 3 s. |
| 8 | **Delivered + payoff** | 55–65 s | In the sheet: the knot, "You just made Valentina's day." **At the same moment, above it, the alert card pops on the video**: "New tip for Valentina · Ana · 4.72 USDC · "…note…"". The goal bar slides from 22% to 24%. Sheet header turns into "Delivered · it's on stream" + **Back to the stream**. | Alert: "New tip for Valentina" · "Ana · 4.72 USDC" · the note | Alert shown 7 s (same as OBS). Goal tween 1.2 s. Announcer: "Ana's tip of 4.72 USDC is on stream now." |
| 9 | **Chat reacts** | 65–75 s | Tap **Back to the stream**. The sheet slides away; chat shows the highlighted tip row "Ana tipped 4.72 USDC with Tezeo" with the note, then sample reactions ("wait, that went from Base to Solana already?", "ok I need this for my stream", "GG Ana"). Hold on the stage. | Tip row (real data) + sample lines | Row glow 1.2 s (maíz), auto-scroll to it. |

Desktop cut (16:9, 1280×720 window): the same beats, but the drawer covers the chat column, so the video (and the alert) is visible next to the payment the whole time. Beat 8 is the money shot: the knot on the right and the alert on the left in one frame.

### 3.1 Failure branch (if a failed or refunded tip can be recorded)

| # | Beat | Time | Camera | Copy | Stage |
|---|---|---|---|---|---|
| F1 | Pay as usual, but underpay (send less than quoted) on a live route, or use a simulator tip that fails (see §3.2) | 0–15 s | Sheet, tracking | "Waiting for your payment." | Polling. |
| F2 | The flow shows the failure | 15–25 s | Sheet: the fray, "Didn't go through" pill | "The thread snapped, but your money is safe." · "We got a bit less than needed…" or "Sending it back to you. Automatic, about 5 minutes." | **Nothing pops on stream.** That's on purpose and honest: streams only show tips that arrived. |
| F3 | Refunded | 25–35 s | Sheet: return loop | "Your money is back home." | Optional (nice-to-have): a quiet stagebot line "A tip didn't go through. The fan's money is on its way back." Needs the tip status, see §6.2. |

Voiceover for the branch: "And if anything goes wrong, nothing is lost: Tezeo sends it back automatically."

### 3.2 Backup plans when something is slow

1. **Simulator instance (recommended backup, no code).** The app's simulator (`AURORA_MODE=simulated`, the default when unset) runs the whole real flow and settles in **about 20 s** (8 s pending, 12 s converting, then success). Run a second deployment of the same image with `AURORA_MODE=simulated` (or a local run reachable from the phone). The flow already shows "Demo mode: payments here are simulated and no real money moves", and the stage strip switches to the simulated copy. The alert, goal and chat payoff all work, because they read the same alerts feed.
   - Failure screens on the simulator: amounts whose smallest units end in `13` (refunded), `14` (failed) or `15` (underpaid, refunded after 60 s) force the error states. These are hard to hit from the amount tiles, so the nice-to-have "Rehearse a failure" control creates such a tip through the existing `POST /api/tips` (e.g. `eth:usdc`, amount `5.000014`) and loads `/@vale?tip=<id>` in the sheet. The flow already restores from `?tip=`.
2. **Rehearsal mode (`/demo?rehearse=1`, client-only).** No payment at all. The strip turns indigo: "Rehearsal. Not a real stream. The alert is a sample, no payment." A small **Play a sample tip** button (in the pinned card's place) fires the payoff with the same sample the OBS preview uses (Ana · 4.72 USDC), with a **Sample** badge on the alert and the chat row. Use it to rehearse camera moves, never as the shot of a "real" payment.
3. **Split recording.** Record the payment (beats 3–8 in the sheet) and the payoff (beats 8–9) as two takes. The alert pops for any confirmed tip to @vale while the stage is open, so a tip paid earlier on another device can be "replayed" by reloading the stage just before the tip settles. Don't fake it in the edit.

---

## 4. Specs

Breakpoints: **<1024 phone/tablet** (stacked), **≥1024 desktop** (player + 380px chat column). Extra tightening at **<380** (320 phones). The whole stage is `height: 100dvh`, no page scroll; only chat and the sheet scroll.

### 4.0 Layers and colour

- **Stream chrome** (`.ds-stage`, `--ds-ch-*`): dark-only graphite. That is how streams look, and it makes the Tezeo parts read as an add-on. Values and contrast (computed): text `#ECEDEF` on `#0F1013` 16.2:1, on `#17181D` 15.1:1; muted `#A3A6AE` 7.8:1 / 7.3:1; LIVE white on `#D92F35` 4.76:1; chat usernames (`#F2B880`, `#A9C1FF`, `#E6A3C8`, `#B7E07A`, `#7FD1C7`) 8.8–11.8:1 on `#17181D`.
- **Tezeo parts** (pinned card, sheet, chat tip row, overlays on the video) use `tz-` tokens and follow the theme. The page defaults to `data-theme="dark"` so the sheet matches the stream; `?theme=light` is supported (rendered: `demo-stream-phone-sheet-light.png`, `-desktop-chat-light.png`).
- **Video overlays** (goal, tag) are always cream on night (`#FFF7EC` on `#120D18` at 86%), like a real OBS overlay that has to sit on any video. The alert card uses the theme surface, exactly as `/alerts/<token>` does.

### 4.1 Idle (`?state=idle`)

| Region | Phone (<1024) | Desktop (≥1024) |
|---|---|---|
| Demo strip | 36px, full width, sticky, pending colours (same as the app's demo notice). | Same, above the top bar. |
| Top bar | none | 56px: original "stage" glyph + **Demo stage**, tag "Mock livestream · sample viewers and chat", right: link "Open Valentina's real tip page" (new tab). |
| Player | Full width, 16:9 (219px at 390). | Left column, 16:9, radius 14, 20px padding around. |
| Channel row | 44px avatar (initial "V", accent fill, LIVE ring), "Vale's Workshop" + "Valentina · @vale", title on one/two lines. <380: avatar 36, handle hidden, title 1 line. | Same + meta "Software & dev · 1,204 watching (sample numbers)". Then the three About panels. |
| Pinned card | Under the channel row: label "Pinned by Valentina", then the card (§4.2). | Top of the chat column. |
| Chat | Header "Chat · Sample messages", messages bottom-aligned, disabled input "Chat is a sample on this demo stage". | Same, fills the column height. |

**The player is an OBS canvas.** Everything on the video (scene, goal, tag, alert) is laid out on a **640×360 canvas** and scaled to the player with `transform: scale(var(--ds-k))`, `--ds-k = playerWidth / 640` (one `ResizeObserver`). At 390 the scale is 0.61, so the alert's name line (32px) renders at about 19.5px, readable in a phone video. At 1280 the player is ~860px wide (scale 1.34). The LIVE badge, viewer count and hover controls are player chrome, not canvas, and are decorative (`aria-hidden`, not focusable).

**Canvas layout (640×360):** editor window 20,42 → 412,324; camera placeholder circle 176px at bottom-right with the accent ring and "camera placeholder" label; goal widget top-right 200px; "Tip me" tag bottom-left with a 42px QR; alert Browser Source centred, top 78, max-width 520 (the same max-width as `Alerts.tsx`).

### 4.2 Pinned card + press (`?state=press`)

- Markup: `.ds-pin > p.ds-pin__label + .ds-pincard` (slim weave on top edge, 36px mark, title "Tip Vale in any crypto", sub "Any coin, any chain. Vale gets dollars.", button).
- Button: `tz-btn tz-btn--primary`, **48px** tall, heart icon, label **Send a tip**, `aria-haspopup="dialog" aria-controls="sheet"`. <360: the button goes full width under the text.
- Hover: the existing primary hover. Press: the existing `:active` (1px down, 0.985) plus the press colour; focus shows the añil ring (`press` state in the prototype shows both).
- **Nudge**: 3 s after load the button's glow ring expands twice (`ds-nudge`, 1.4 s, ease-out). Once per page load, never again. Off under reduced motion.

### 4.3 Sheet open (`?state=sheet`, `quote`, `track`)

- **Phone**: `position: fixed`, from `top: strip + player height` to the bottom, radius 28 on top corners, shadow up. It never covers the video. Height on a 390×844 phone: about 590px. Slide-up 420ms (`--tz-dur-slow`, ease-out).
- **Desktop**: absolute over the chat column (380px), full height, slide-in from the right 420ms. The video stays fully visible.
- **Header** (`.ds-sheet__head`, 64px + grip on phones): mark 28, h2 "Tip Valentina" (receives focus on open), sub "Tezeo's real tip page · tezeo.app/@vale" with shield (ellipsis if long), then two 44px icon buttons: **Open full screen** (new tab, `aria-label="Open the tip page full screen, in a new tab"`) and **Close** (`aria-label="Close and go back to the stream"`).
- **Body**: `<iframe src="/@vale" title="Tip Valentina with Tezeo" allow="clipboard-write; web-share">` filling the rest. The flow runs unchanged: its own sticky CTA dock works because the iframe is its own viewport.
- **A11y**: `role="dialog" aria-modal="false" aria-labelledby`. While open, the covered regions (pinned card, chat list) get `inert`; the video stays perceivable. **Esc** closes. Closing returns focus to **Send a tip**. The alert announcer lives outside the sheet and outside any inert region.

### 4.4 Sheet loading (`?state=loading`)

- Over the iframe until its `load` event: three rombos (cochinilla, maíz, accent) pulsing in sequence (`tz-pulse`, 160ms stagger), "Opening Valentina's tip page…" (`role="status"`).
- After **8 s** without `load`: add "Slow connection? **Open it full screen**" (new tab).
- Reduced motion: rombos static.

### 4.5 Tip delivered: the payoff (`?state=delivered`, then `?state=chat`)

When the alerts feed returns a new confirmed tip (§5):

1. **Alert on the video**: the exact `Alerts.tsx` card (`tz-card tz-card--raised tz-rise is-playing`, accent border, mark 28, overline "New tip for Valentina", `tz-display` 2xl "Ana · 4.72 USDC", lg quote of the note, `tz-badge` "Pass" when it's a pass). Rise 420ms. Visible **7 s**, then fades; queued alerts follow 600ms later (same timing as OBS).
2. **Goal bar**: width tween to the new % over 1.2 s (`--tz-ease-in-out`); "$66.76 of $300" → "$71.48 of $300". Computed client-side as `raised + usdc` (the feed gives the USDC amount).
3. **Chat**: append the **tip row** (`.ds-tiprow`): woven left edge (cochinilla / maíz / accent), mark, "**Ana** tipped **4.72 USDC** with Tezeo", the note as a quote. Slide-in 240ms + maíz ring fading over 1.2 s. Then 1–3 sample reactions at 1.2 s intervals. Auto-scroll chat to the row.
4. **Sheet header**: when the embedded flow reaches thank-you (or the alert arrives, whichever first), a second row appears: pill `received` "Delivered · it's on stream" + secondary button **Back to the stream** (44px). The sheet is never auto-closed: the thank-you is the fan's moment.
5. **Screen readers**: the stage announcer (`aria-live="polite"`) says "Ana's tip of 4.72 USDC is on stream now." once.
6. **Reduced motion**: alert appears without rising; goal jumps; no row glow. Nothing is lost.
7. **Tab hidden** (fan paying in another tab or app): queue alerts while `document.hidden` and play them on `visibilitychange`, so the viewer sees the payoff when they come back.

### 4.6 Wallet can't reach the panel, or the page won't embed (`?state=hint`, `blocked`, `away`)

Three levels, from lightest to heaviest:

1. **Hint strip** (`.ds-hint`, converting colours, at the top of the sheet body): "Your wallet can't reach this panel. **Open full screen** or pay by hand below." Shown when the top window has a wallet (`window.ethereum` or an EIP-6963 announce) and the iframe's window doesn't, 1.5 s after the iframe loads. Same-origin, so the stage can check `frame.contentWindow.ethereum`. The manual QR/address path inside the panel still works.
2. **Blocked card** (`.ds-fallback`): when the iframe can't be read after load (`contentDocument` null or `about:blank`, e.g. if `frame-ancestors` is ever added) or 15 s pass with no `load`. Card: wallet icon, h "Your wallet works best full screen", "Some wallets can't reach a page inside a panel. Open Valentina's tip page on its own, pay there, then come back. The alert will still pop on this stream.", a 3-step list, primary **Open the tip page** (new tab), ghost **Stay here and pay by hand (QR)**.
3. **Away state** (after **Open full screen / Open the tip page**): close the sheet; the pinned card swaps its button for the pending pill "Waiting for your tip" and "Paying in another tab. Your alert pops here when it lands." The payoff still works because detection doesn't depend on the iframe (§5). The card returns to normal after the alert, or after 30 min.

The way back to the stage: the new tab is a new tab, so the stage is still the previous tab. On phones, if the wallet app's deep link opens the tip page inside the wallet's browser, the viewer returns to the browser app and the queued alert plays (§4.5.7).

### 4.7 Motion summary (CSS only)

| Element | Motion | Duration | Reduced motion |
|---|---|---|---|
| Sheet (phone) | translateY 100% → 0 | 420ms ease-out | none |
| Drawer (desktop) | translateX 100% → 0 | 420ms ease-out | none |
| Send a tip nudge | glow ring ×2, once | 2 × 1.4 s at +3 s | none |
| Loading rombos | `tz-pulse`, staggered | 1.2 s loop | static |
| Alert | `tz-rise` | 420ms | appears |
| Goal bar | width | 1.2 s ease-in-out | jumps |
| Chat tip row | rise 8px + maíz ring fade | 240ms + 1.2 s | appears |

No shaking, no confetti on the stage (the knot burst in the thank-you is the one celebration).

---

## 5. How the stage knows the tip landed

| Option | How | Catches tips paid… | Change to the existing app | Verdict |
|---|---|---|---|---|
| **A. Poll the alerts feed** | The stage calls `GET /api/alerts/<alertToken>?since=<pageLoad>` every 3 s, the same endpoint and loop as `Alerts.tsx`. Each new item has `name`, `message`, `isPass`, `usdc`, `at`. | in the sheet, in a new tab, in a wallet app, on another device (QR scan) | None. A new route reads the token server-side. | **Recommended (MVP).** One source for the alert, the chat row and the goal; it's literally the data OBS shows. |
| B. Read `?tip=` from the iframe, poll `/api/tips/<id>` | The flow writes `?tip=<id>` into its own URL (`history.replaceState`). Same origin, so the stage can read `frame.contentWindow.location.search`. | only in the sheet | None | Nice-to-have **on top of A**, only to show failure/refund quietly in chat. `tipView` has no USDC out amount, so it can't build the alert. |
| C. `postMessage` from the flow | In `TipFlow`, when `tip.status` changes and `window.parent !== window`: `parent.postMessage({ type: "tezeo:tip", id, status }, location.origin)`. | only in the sheet | Tiny: ~3 lines in `TipFlow.tsx` | Nice-to-have: instant "Delivered" row in the sheet header and failure state; not needed for MVP. |
| D. The viewer returns | Wait for `visibilitychange`. | — | None | Not a source on its own; used to hold alerts while the tab is hidden. |
| E. Iframe the real `/alerts/<token>` page over the player | A transparent iframe on the canvas. | all | None | Most literal, but it can't drive chat/goal, and there's a transparency trap (below). Keep as an alternative. |

**Transparency trap (if you choose E).** Verified in Chromium: a transparent page in an iframe gets an **opaque white backdrop** when the iframe element's colour scheme differs from the embedded page's. The stage is dark; `/alerts` is light unless the OS is dark. Setting `color-scheme: light dark` on the `<iframe>` element made it transparent in both OS modes in my test.

**Security note on the alert token.** The stage needs the demo creator's alert token. Read it server-side in the `/demo` route, and **only** for one handle set by env (`DEMO_STAGE_HANDLE=vale`; the route 404s when it's unset), so `/demo?handle=anyone` can't leak other creators' tokens. Anyone who views the source of `/demo` can then read @vale's alert feed: confirmed tips' names, notes and USDC amounts. The names and notes are already on the public wall; the amounts are not. That's fine for a demo creator, and the token can be rotated after the hackathon. Zero-leak alternative (**needs backend, small**): `GET /api/demo/alerts?since=` that resolves the token server-side.

---

## 6. Copy deck

| Where | Copy |
|---|---|
| Demo strip, live | **Demo stage.** Not a real stream. Tips sent here are real. |
| Demo strip, simulator | **Demo stage.** Not a real stream. Payments are simulated, no real money moves. |
| Demo strip, rehearsal | **Rehearsal.** Not a real stream. The alert is a sample, no payment. |
| Top bar (desktop) | Demo stage · Mock livestream · sample viewers and chat · Open Valentina's real tip page |
| Player | LIVE · 1.2K · sample · camera placeholder |
| Channel | Vale's Workshop · Valentina · @vale · Building a tip jar on Solana, live · day 12 · Software & dev · 1,204 watching (sample numbers) |
| Video overlay: goal | Goal · new microphone · 22% · $66.76 of $300 *(from the creator's real goal)* |
| Video overlay: tag | Tip me in any crypto · tezeo.app/@vale *(real QR from `APP_BASE_URL`)* |
| Pinned card | Pinned by Valentina · **Tip Vale in any crypto** · Any coin, any chain. Vale gets dollars. · **Send a tip** |
| Chat | Chat · Sample messages · stagebot: Tip Vale in any coin: tap **Send a tip** in the pinned card. · Input: Chat is a sample on this demo stage |
| Sheet header | Tip Valentina · Tezeo's real tip page · tezeo.app/@vale · (Open full screen) · (Close and go back to the stream) |
| Loading | Opening Valentina's tip page… · Slow connection? Open it full screen |
| Hint strip | Your wallet can't reach this panel. Open full screen or pay by hand below. |
| Blocked card | **Your wallet works best full screen** · Some wallets can't reach a page inside a panel. Open Valentina's tip page on its own, pay there, then come back. The alert will still pop on this stream. · 1 Open the tip page and pay as usual. 2 Come back to this tab when you see "You just made Vale's day." 3 Watch your tip land on stream. · **Open the tip page** · Stay here and pay by hand (QR) |
| Away | Waiting for your tip · Paying in another tab. Your alert pops here when it lands. |
| Delivered (sheet) | Delivered · it's on stream · **Back to the stream** |
| Alert (unchanged) | New tip for Valentina · {name} · {usdc} USDC · "{note}" · (Pass) · (Sample, rehearsal only) |
| Chat tip row | **{name}** tipped **{usdc} USDC** with Tezeo · "{note}" |
| Sample reactions | wait, that went from Base to Solana already? · ok I need this for my stream · GG {name} *(the first one names the fan's network; use a generic line if unknown: "that was fast")* |
| Announcer | {name}'s tip of {usdc} USDC is on stream now. |
| About panels (desktop) | **About this stage**: A mock stream made to show Tezeo. The video, viewers and chat are samples. The tip page and the alert are real. · **What's on the video**: The goal bar, the "Tip me" tag and the tip alert are the overlays a streamer adds in OBS with Tezeo. · **Tip from another device**: Scan the tag on the video. Your alert still pops here. |
| Page title / meta | "Demo stage · Tezeo" · `robots: noindex` |

---

## 7. Build tiers

### MVP (about 3–4 hours, no backend change)

Build order, smallest and most visible first:

1. **Route** `src/app/demo/page.tsx` (server, `dynamic = "force-dynamic"`, `robots: noindex`): if `process.env.DEMO_STAGE_HANDLE` is unset, `notFound()`. Load the creator with `getCreatorByHandle`, the token with `getExtras(c.id).alert_token`, the goal with `goalProgress(c)`, the QR SVG with `qrcode` (already used by `c/[handle]/page.tsx`) for `${env.baseUrl}/@${handle}`, and `env.auroraMode` for the strip. Pass them to a client `<DemoStage/>`. *(20 min)*
2. **Static stage**: copy `demo-stream.css` to `src/styles/` and port the markup from `demo-stream.html` (strip, player canvas, channel row, pinned card, sample chat). Use the existing `Mark` and sprite icons; add the `i-pin`, `i-open`, `i-close`, `i-wallet` symbols from the prototype. Read the accent from the creator (`.tz-creator` with `--creator-accent`). *(60 min)*
3. **Canvas scale**: `ResizeObserver` on the player sets `--ds-k = width / 640`. *(10 min)*
4. **Sheet**: open/close, iframe `src="/@vale"`, focus to the title, Esc, `inert` on the pin + chat, focus back to the button, "Open full screen" link (`target="_blank"`), loading overlay until `load`, 8 s slow link. *(40 min)*
5. **Payoff**: copy the poll loop from `Alerts.tsx` (3 s, `since` = page load, `seen` set, queue, 7 s show, 600ms gap), render the same alert card on the canvas, append the chat row + 1–3 sample reactions, bump the goal, announce, hold while `document.hidden`. Show "Delivered · it's on stream" + **Back to the stream** in the sheet header when an alert arrives while the sheet is open. *(45 min)*
6. **Fallbacks**: wallet hint check (1.5 s after load), blocked card (unreadable iframe or 15 s), away state after "Open full screen". *(30 min)*
7. **Strip copy** from `auroraMode` and `?rehearse=1` with a **Play a sample tip** button (client-only, `Sample` badges). *(20 min)*

### Nice-to-have

| Item | Cost | Needs |
|---|---|---|
| `postMessage` from the flow for an instant "Delivered" row and a failure state (§5 C) | S | ~3 lines in `TipFlow.tsx` |
| Quiet failure line in chat from `/api/tips/<id>` via the iframe's `?tip=` (§5 B) | S | none |
| Phone sheet "expand" detent: drag the grip or tap to cover the video while paying, auto-return to half height on delivery | M | none |
| `!tip` typed in the (enabled) chat input opens the sheet, with a stagebot reply | S | none |
| "Replay last alert" control for retakes (rehearsal only) | S | none |
| "Rehearse a failure" on the simulator instance (creates a magic-amount tip via `POST /api/tips`, loads `/@vale?tip=<id>`) | S | simulator instance |
| About panels under the player (desktop) | S | none |
| `GET /api/demo/alerts` so the alert token never reaches the browser | S | **needs backend** (tiny route) |
| `?embed=1` on `/@vale` to hide the flow's own share/theme buttons inside the sheet | S | small change in `TipFlow.tsx` |

---

## 8. Integration notes

- **Same origin.** `/demo` and `/@vale` are on the same origin. `next.config.ts` sets no `X-Frame-Options` / `frame-ancestors` today, so the iframe is allowed. If a CSP is added later, allow `frame-ancestors 'self'` or the stage falls back to the blocked card.
- **The flow needs no change for MVP.** It already restores from `?tip=`, polls its own status, and has its own sticky dock.
- **Wallets inside an iframe (not verified).** Browser-extension wallets inject into frames differently; some only inject into the top window. EIP-6963 announcements happen per window. Mobile wallet browsers (MetaMask, Coinbase, Trust) may not inject into iframes at all. The flow's mobile deep links ("Open in MetaMask") point at the iframe's own URL, so they take the fan out of the stage into the wallet browser on `/@vale?tip=…`. That's acceptable: it is the away path, and the alert still pops on the stage when the fan comes back. **Test on the recording device before the shoot** (§10).
- **Iframe attributes**: `title`, `allow="clipboard-write; web-share"` (copy address, share sheet on the thank-you), no `sandbox` (it would break wallets and storage).
- **Theme.** The stage defaults to dark. The embedded flow follows the OS or its own toggle (stored per origin, so the stage and the flow share it). Record with the phone in dark mode so the sheet matches the stream.
- **Polling cost.** `alertsSince` refreshes up to 10 open tips per call. At 3 s that's fine for one demo creator; don't leave many stage tabs open on a live route.
- **Timing.** The feed returns tips with `updated_at > since`. `since` is the stage's load time, so the stage only pops tips confirmed after it was opened. Reload the stage before each take.
- **Fan name and note.** The alert uses the name and note saved on the tip. The fan must save them during tracking, before the tip settles, or the alert reads "Someone kind" with no note.

---

## 9. Defect list (prototype review)

Found by looking at the renders, then fixed and re-rendered:

| # | Defect | Fix |
|---|---|---|
| 1 | `[hidden]` elements still showed (away state, delivered row, hint and fallback all visible at once) because `display` rules beat the `hidden` attribute. | `.ds-stage [hidden] { display: none !important; }` |
| 2 | Default `<p>` margins pushed the player down, so the phone sheet's top cut into the sheet title. | Margin reset for `p, h2, h3` inside the stage, via `:where()` so component margins still win. |
| 3 | The first margin reset (`.ds-stage p`) was too strong and removed the gap under "Pinned by Valentina". | Moved to `:where(p, h2, h3)`. |
| 4 | Phone: the page scrolled, so the chat input fell below the fold. | The stage is `100dvh`; only chat and the sheet scroll. Chat bottom-aligns with `margin-top: auto` on the first message (not `justify-content: flex-end`, which breaks scrolling up). |
| 5 | The LIVE badge covered the editor's file name. | Editor moved down 22 canvas px. |
| 6 | The goal on the video ($71.76 of $120) disagreed with the goal on Valentina's page ($66.76 of $300). | The overlay uses the same `goalProgress` data; the prototype shows $66.76 → $71.48 of $300 (22% → 24%). |
| 7 | 320px: the channel row took four lines and chat showed one message. | <380: smaller avatar, handle hidden, title clamped to one line. |
| 8 | Rehearsal: the chat row looked like a real tip. | `Sample` badge on the chat row too. |
| 9 | Desktop drawer: the subtitle wrapped onto two lines. | Single line with ellipsis. |
| 10 | `?view=phone` on a big screen kept the desktop layout (media queries follow the real viewport). | The prototype now loads itself in a 390×844 iframe frame. |

Known prototype artefacts (not defects of the design): the sheet shows `flow.html` (the design prototype), so it carries the prototype's "Demo mode: payments here are simulated" banner and theme/share buttons. On the live route the flow shows no such banner.

---

## 10. Evidence ledger

**Rendered and looked at** (Playwright Chromium, `reducedMotion: reduce` so end states are visible):

- Phone 390×844 (2×): idle, press, loading, sheet (amount), quote, hint, blocked, away, delivered, chat payoff, rehearsal, idle light, sheet light → `screenshots/demo-stream-phone-*.png`.
- Phone 320×640: idle → `demo-stream-phone320-idle.png`.
- Desktop 1280×800: idle, sheet, blocked, delivered, chat payoff, chat payoff light → `demo-stream-desktop-*.png`.
- Device frame `?view=phone` at 1280×900: delivered → `demo-stream-viewphone-delivered.png`.
- Horizontal overflow measured at every render: 0px.
- Iframe transparency vs `color-scheme` (test page, light and dark OS emulation): mismatch gives an opaque white backdrop; `color-scheme: light dark` on the iframe element stays transparent.
- Motion spot check: the nudge animation is applied at +3 s; the alert card ends fully opaque. I did not record or review the motion frame by frame.

**Reasoned from the code, not run:**

- The alerts feed contract (`/api/alerts/<token>?since=` → `{ alerts: [{ id, name, message, isPass, usdc, at }] }`), the 7 s / 600ms alert timing, the flow's `?tip=` restore, the simulator timing (8 s / 20 s) and magic amounts, the absence of framing headers in `next.config.ts`.
- Contrast ratios for the new chrome colours (computed with the WCAG formula, listed in §4.0). The Tezeo parts reuse the computed pairs in DESIGN.md §3.3.
- That the real `/@vale` behaves inside a ~590px-tall iframe like `flow.html` does. The prototype embeds the design prototype, not the live app.

**Not verifiable here:**

- A real phone (iOS Safari, Android Chrome, wallet in-app browsers): safe areas, `100dvh` with the browser bars, the sheet height, touch.
- Wallet connect and one-tap pay **inside an iframe** (MetaMask extension, Rabby, Coinbase; MetaMask mobile browser). This is the biggest risk; the fallbacks in §4.6 exist for it.
- A real live payment end to end and how long a real route takes.
- Screen-reader behaviour of the sheet, the inert regions and the announcer.

---

## 11. Recording tips for the owner

**Before the shoot**

1. Open `/demo` on the recording phone **inside the wallet you will pay with** (MetaMask app → Browser) and do one real $1 tip. If one-tap works in the sheet, record that way. If the hint strip appears, record the manual path instead: the sheet shows the QR and address, and you pay from a second phone, which also makes a great shot (§ "two-phone shot" below).
2. Turn on Do Not Disturb, dark mode, full brightness, battery icon at a calm level, clock at a round time.
3. Seed the moment: set a goal on Valentina's dashboard so the bar visibly moves (a $300 goal moves 2% on a $5 tip; a **$60 goal moves 8%**, which reads better on camera).
4. Reload `/demo` right before each take (the stage only pops tips confirmed after it loaded).
5. Have the name and note ready to paste during tracking ("Ana", "Your Solana course got me my first dev job. ¡Gracias!"). Save it early.
6. Keep the simulator instance open in another tab as the backup (§3.2).

**Framing**

- **Phone cut:** use the phone's own screen recording for crisp UI, then cut in 2–3 seconds of the phone filmed in hand (thumb tapping **Send a tip**) for the "real device" feel. Keep the whole screen in frame; the payoff happens at the top while the thank-you is at the bottom.
- **Two-phone shot (optional, strong):** phone A shows the stage; phone B scans the "Tip me" QR on the video and pays. The alert pops on phone A. It shows the streamer-overlay story without any words.
- **Desktop cut:** a 1280×720 browser window at 100–125% zoom, cursor visible, no bookmarks bar. The drawer covers chat, so the alert and the knot share the frame at beat 8.

**Voiceover, one sentence per beat**

1. "This is a mock livestream, the kind of page your fans already watch."
2. "The streamer pinned one thing: Send a tip, with any crypto."
3. "I tap it, and the stream keeps playing."
4. "I pick five dollars."
5. "I pay with what I have: USDC on Base."
6. "One tap in my wallet."
7. "Tezeo turns it into dollars on Solana while I leave a note."
8. "And there it is, my tip on stream, and the goal moves."
9. "Vale gets USDC, chat sees it, and I never left the stream."

Failure branch: "And if anything goes wrong, nothing is lost: Tezeo sends it back automatically."
