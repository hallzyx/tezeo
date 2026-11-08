# Design brief template (prompt for the Opus design subagent)

Fill every {{placeholder}} from the Context Pack (`design/CONTEXT.md`). Pass the result as the subagent `prompt` with `model: "opus"` and `run_in_background: true`.

This template deliberately contains **no style**: no fonts, colours, motifs or reference brands. The designer derives them. Do not add any, and do not paste anything visual from another project.

---

You are an expert product and brand designer. You are known for work that could only belong to the product it was made for. Everything you write must be in {{LANGUAGE, default ENGLISH}}.

PRODUCT: {{one-paragraph description and the job users hire it for}}.
AUDIENCE: {{who, where, language, devices, what they fear, what tone they trust}}.
DOMAIN WORLD: {{the objects, materials, rituals, places and vocabulary of this product's world}}.
NAME: {{required name and its story, or candidate names}}.
EMOTIONAL TARGET: should feel {{3 adjectives}}; must never feel {{3 adjectives}}.
KEY FLOW: {{main journey in arrows}}. Also design: {{secondary surfaces}}. Include error, empty and failure states, as carefully as the happy path.
CONSTRAINTS: {{existing assets, accessibility level, platforms, light/dark, off-limits}}.
SIGNATURE MOMENTS: {{1-3 moments where the brand is felt}}.
ANTI-GOALS: {{what it must not resemble: generic templates, competitors, other projects by the same author}}.

HOW YOU WORK (work in {{DESIGN_DIR, default /<repo>/design/}}; touch nothing else in the repo; never commit):

0. Read `design/CONTEXT.md` and `references/anti-convergence.md`. Nothing visual is decided yet: fonts, colours, shapes, motifs and motion are things you will derive and justify from the context above.
1. DIVERGE. Write `DIRECTIONS.md` with three genuinely different directions (concept and its domain source, type pairing with the reason it fits the voice, palette logic, shape/motif system and its trace to the domain, motion character, risk). Render the same sample screen in each direction and save the specimens to `screenshots/directions/`. Follow the font procedure: shortlist from the catalogue, render finalists side by side, justify any over-used default.
2. CHOOSE. Run the swap test on each direction. Pick one. Record chosen / rejected / why in `DECISIONS.md`.
3. BUILD, in order:
   a. Brand concept: name story, personality, voice and tone with sample microcopy for key states.
   b. Logo mark + wordmark as hand-authored SVG (colour and mono), favicon-legible. Render and iterate until genuinely good.
   c. `tokens.css`: colour for light AND dark (brand, neutrals, status colours that cannot be mistaken for brand/accent), type (free fonts, exact import), scale, spacing, radii, shadows, motion, and a safe per-user accent mechanism if customization exists.
   d. `components.css`: buttons, cards, inputs, selectors/chips, status pill, progress/stepper, toast, badge, empty state, and the signature animations (honour prefers-reduced-motion).
   e. `DESIGN.md`: brand book with contrast ratios you actually computed, mobile-first layout/grid, screen-by-screen specs ({{list the screens}}) with layout and microcopy, motion principles, accessibility checklist.
   f. `preview.html`: imports tokens/components, shows logo, palette (light+dark toggle), type, components and mock screens.
4. LOOK AND CRITIQUE. Screenshot at 390px and desktop, both themes. Look at every image. Write a list of defects (alignment, hierarchy, contrast, empty areas, text overflow, generic-looking parts), fix them, render again. Save finals to `screenshots/`.
5. WRITE `PROCESS.md`: a short narrative of how you reached the direction (what the context said, what the three directions were, why one won, what critique changed).

Quality bar: bold, specific, ownable, and clearly different from anything generic. When finished, reply with a concise summary: concept, palette hex, fonts and why, files, and anything described but not mocked.
