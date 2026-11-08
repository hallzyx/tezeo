# Process playbook (reusable, theme-agnostic)

How a strong designer works, as procedures. Use the one that matches the mode.

## Flow review (Mode B): audit → rank → spec → prototype → build order

Use for an existing flow (sign-up, checkout, onboarding, dashboard...). Deliver a single `design/<FLOW>.md` plus a prototype.

1. **Walk it for real.** Render the live screens at phone, tablet and desktop widths, light and dark, including empty, error and slow states. Look at every screenshot. Note what you measured (heights, widths, tap targets, contrast), not what you assume.
2. **Findings, ranked.** A table with: id, finding, evidence (screenshot/measurement), user impact, severity (blocker / high / medium / low), effort (S/M/L) and whether it needs backend work. Lead with what can lose the user's money, data or trust, then what blocks completion, then polish.
3. **Principles per flow.** Three to five rules that explain the redesign (for example "one decision per screen", "say what happened before what to do").
4. **Specs an engineer can build.** For each screen/step: structure, exact copy, states (default, focus, disabled with the reason, error with the next step, success), responsive behaviour by breakpoint, motion and its reduced-motion version, accessibility (labels, focus order, announcements), and which existing components are reused.
5. **Copy deck.** A table of "today → new" strings. Check the voice rules (no jargon, bad news leads with safety, one exclamation mark at most).
6. **Prototype.** Static HTML + CSS with a prefixed class namespace (one prefix per flow) that only adds on top of the existing tokens/components. Provide state switches so every state can be seen. Screenshot it.
7. **Keep as is.** List what must not change (and why), so the engineer does not "improve" it.
8. **Build order.** Smallest shippable PRs first; flag backend-dependent items and defer them honestly.
9. **What I rendered and looked at.** An evidence list, plus what could not be verified (real devices, real data).

## Critique checklist (use in every render loop)

- **Hierarchy:** is there one obvious primary action per screen? Can you squint and still read the order?
- **Space:** large empty areas on desktop, cramped touch targets on phone, content hugging one side.
- **Alignment/centering:** columns that look off-centre, orphaned elements, inconsistent gutters.
- **Text:** truncation, overflow at 320px, line length, contrast, hint text that repeats the label.
- **States:** empty, loading, error, disabled-with-reason, success; long names, huge numbers, zero values.
- **Colour:** status colours unambiguous; user accents cannot mimic them; dark mode is designed, not inverted.
- **Motion:** purposeful, short, stops under reduced motion; no loops that distract from the task.
- **Brand:** can you tell what product this is without the logo? Does it pass the swap test?
- **Honesty:** does any copy promise something the product cannot do?

## Interface patterns worth reusing (they carry no style)

- Validate on paste/blur, not on every keystroke; explain why a button is disabled right under it.
- Make the irreversible step the most deliberate one (read-back, confirm, a gate that requires an explicit acknowledgement).
- Show the user's live result beside the form (preview) when the form changes how something looks.
- Persist in-progress work across refresh; never lose a one-time secret on reload.
- Route server errors back to the exact field and step that caused them.
- Prefer real pages with URLs over anchor jumps inside one long page when there are 4+ sections.

## Decision log format (`DECISIONS.md`)

One entry per decision: **Decision**, **Alternatives considered**, **Why** (tied to the Context Pack), **Evidence** (screenshot/measurement), **Revisit if**.
