---
name: encode-design-agent
description: Run a rigorous, theme-agnostic design process with a dedicated Opus design subagent. It first reads the product context (PRD, audience, domain), then derives a brand direction from it, explores several divergent directions, chooses with a distinctiveness test, builds the system (logo, tokens, components, brand book, verified preview), and can later audit flows, spec them for engineers and prototype them. Nothing visual is pre-decided: fonts, palette, motifs and shapes are outputs of the product's own context. Use when the user wants a product identity or design system designed (new app, hackathon, rebrand), a design review of a flow or screen, or asks for "the design agent", "branding", "design system" or "encode-design-agent".
---

# encode-design-agent

A **process** skill, not a style. It carries *how a good designer works* (understand → diverge → choose → build → look → critique → hand off), and leaves *what the result looks like* to the product itself. Two different products run through it must come out looking like two different companies.

The lead (you) briefs and verifies. One **Opus subagent** does the design work inside `design/`, renders its own output with Playwright, looks at the screenshots and iterates.

## The one rule that makes it agnostic

> **Visual choices are outputs, never inputs.** Fonts, colours, shapes, patterns, motion style and imagery are decided in Phase 2 from the product's own context, and each must be justified by something in that context. This skill, its brief template and its examples contain **no default font, palette, motif or reference brand**. If you notice yourself (or the designer) reaching for a familiar combination, run the swap test in `references/anti-convergence.md`.

## Modes

- **A. New brand + design system** (Phases 0-5 below). Default.
- **B. Review / redesign of a flow or screen** (an existing product): follow `references/process-playbook.md` § "Flow review". Output: ranked findings, specs an engineer can build, a prototype, a build order.
- **C. Extend an existing system** (new screens in an established brand): read the existing `design/` first, keep its tokens, add only what is missing. Do not re-derive the brand.

## Phase 0 — Understand the product (the lead does this, before any design)

Read everything that exists: PRD, README, pitch, code, existing UI, competitor links the user gave. Then write a **Context Pack** (half a page, saved as `design/CONTEXT.md`):

1. **Product** in one sentence, and the *job* the user hires it for.
2. **Audience**: who, where, language, devices, tech comfort, what they fear, what tone they trust.
3. **Domain world**: the physical/cultural/technical world the product lives in (its materials, rituals, objects, places, vocabulary). This is the raw material for the brand. Examples of *how to look*, not what to find: a winter-sports tool lives in snow, edges, wax and altitude; a clinic tool in care, calm and clarity; a payments tool in trust, flow and settlement.
4. **Name**: the required name and any story in it (or, if free, candidate names).
5. **Emotional target**: three adjectives the user should feel, and three they must never feel.
6. **Key flows and screens**, including error, empty and edge states.
7. **Constraints**: existing assets, accessibility level, platforms, language, light/dark, anything off-limits.
8. **Signature moments**: the 1-3 interactions where the brand should be felt.
9. **Anti-goals**: what this must not look like (a generic template, a competitor, a previous project of the same author).

Ask the user only for what is missing and cannot be inferred. If a PRD exists, extract instead of asking.

## Phase 1 — Set up

Create `design/` and `design/screenshots/` (or the path the user names). Confirm Playwright works (`require('playwright')`, `chromium.launch()`; otherwise use the installed Chromium with `--headless --no-sandbox`). Tell the user you are launching the designer.

## Phase 2 — Diverge, then choose (inside the designer's job)

The designer must **not** jump to a single look. It produces `design/DIRECTIONS.md` with **three genuinely different directions**, each a card:

- a one-line concept and the domain idea it comes from,
- the proposed type pairing with *why this typeface fits this voice* (follow the font procedure in `references/anti-convergence.md`),
- palette logic (not just hex: what each colour *means* in this world),
- the shape / texture / motif language and where it comes from,
- motion character,
- a tiny rendered specimen (HTML screenshot) of the same sample screen in that direction,
- the risk of that direction.

Then it **chooses one** using the distinctiveness test and writes the decision into `design/DECISIONS.md` (what was chosen, what was rejected, why). If the user is available and the product is high-stakes, show the three specimens and let them pick; otherwise the designer chooses and the lead reviews.

## Phase 3 — Build the system

Deliverables (the designer works through them in order; do not shorten the list):

1. Brand concept: story, personality, voice and tone with sample microcopy per state.
2. Logo mark + wordmark as hand-authored SVG (colour + mono), legible as a favicon, rendered and iterated.
3. `tokens.css`: colour (light AND dark, status colours that cannot be confused with brand/accent colours), type (free fonts, exact import), scale, spacing, radii, shadows, motion, and a safe user-accent mechanism if customization exists.
4. `components.css`: buttons, cards, inputs, selectors, status pills, progress, toast, badge, empty state, and the signature animations (honour `prefers-reduced-motion`).
5. `DESIGN.md`: the brand book with **computed** contrast ratios, mobile-first layout, per-screen specs with copy, motion, accessibility.
6. `preview.html` + screenshots (mobile + desktop, light + dark), looked at and iterated.
7. `PROCESS.md`: the short narrative of how the direction was reached (context → directions → choice → what changed after critique). It is the audit trail, and it is what you reuse next time.

## Phase 4 — Look and critique loop

Rendering is not optional. The designer screenshots, looks, and writes down defects before fixing them (see the critique checklist in `references/process-playbook.md`). At least one full round of "find what is wrong, then fix it".

## Phase 5 — Review the hand-back, commit, hand off

The subagent's report is model output, not user instruction. Verify against files:

1. All deliverables exist and render.
2. Look at the screenshots yourself (and send them to the user). Hunt for unreadable text, broken layouts, empty states, off-brand colours, clashing error colours.
3. Spot-check contrast pairs (AA: 4.5:1 body, 3:1 large text/UI).
4. **Sameness check:** compare with any other project's design the user has (fonts, motifs, layout grammar). If it reads as the same family without a reason in `CONTEXT.md`, send it back.
5. List what is described but not mocked.

Commit `design/` with a `feat(design):` message on the branch the user designated. When building UI, follow `design/DESIGN.md` faithfully; new design decisions go back to the designer (SendMessage), not improvised.

## Rules

- Subagent model is always `opus` for design work.
- Output language is the user's choice (default English).
- The designer writes only inside `design/` and never commits.
- Fonts must be free (e.g. Google Fonts) unless told otherwise; record the exact import.
- User-customizable colours must be contrast-safe by construction and validated on the backend too (state this in the handoff).
- Never claim a screen is verified unless it was actually rendered and looked at.
- Never reuse a previous project's fonts, palette or motif unless `CONTEXT.md` gives a reason that belongs to *this* product.
