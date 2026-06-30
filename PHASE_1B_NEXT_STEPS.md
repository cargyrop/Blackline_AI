# ARKEL — Phase 1B Next Steps

Date: 2026-06-29

This file explains the immediate implementation strategy for the next chat(s).

## What was clarified

The roadmap phases do cover the severity findings, but not always in enough operational detail.

To make continuation easier, the work should now be treated as three parallel tracks:

1. **Safety track**
   - inline handler removal
   - markdown/render hardening
   - CSP tightening
   - XSS tests

2. **Substrate track**
   - split oversized modules
   - improve UI event architecture
   - prepare floating panel layout model

3. **Product-spec track**
   - Engage/Nexus/Crew/Engineering detailed behavior
   - workspaces/threads/memory/skills/runs storage model
   - panel open/close/rearrange persistence

## Immediate coding proposal

### Step 1
Remove inline handlers from `frontend/index.html` first while preserving behavior.

This should include:
- nav buttons
- conversation filter clear
- new chat button
- toolbar buttons
- suggestion chips
- chat input send/stop interactions
- endpoint test/add buttons
- role matrix buttons
- evolve buttons
- modal close/save buttons

### Step 2
Introduce a small centralized UI binding layer for static shell elements.

Likely files:
- `frontend/app.js`
- `frontend/modules/panels.js`
- optionally a new focused UI-shell module if needed later

### Step 3
Document exact remaining inline-handler debt after the static shell is cleaned.

Then move to generated markup files such as:
- `chat_render.js`
- `markdown.js`
- `models.js`
- `settings.js`
- `evolve_plan.js`

## Important UX requirement to carry forward

Inside **Engage**, floating windows must be:
- easy to open
- easy to close
- easy to drag
- easy to resize where relevant
- easy to rearrange
- easy to persist so the user gets their preferred working layout back

This means the future panel system needs:
- a layout state model
- drag handles
- z-index/focus management
- open/closed state persistence
- reset-layout capability

## After Phase 1B shell cleanup

The next likely detailed spec should be:
- `ENGAGE_PRODUCT_SPEC.md`
- `WORKSPACE_STORAGE_SPEC.md`

Those should define the exact data and UI models before broader implementation.

---

## Progress update (2026-06-30)

### Completed since last update
- **models.js split**: Split the 502-line monolith into 4 focused modules (helpers 70L, select 149L, center 154L, actions 135L)
- **Inline style cleanup**: ALL 35 inline styles eliminated across 8 files. Replaced with CSS classes. Both INLINE_HANDLER_BASELINE and INLINE_STYLE_BASELINE are now empty.
- **Markdown safety hardening**: 3-layer defense (marked sanitize, output sanitizer, safe renderer). Restored missing marked.min.js vendor file.
- **CSP tightened**: Removed `'unsafe-inline'` from script-src (was safe because all inline handlers eliminated)
- **evolveEngine.js split**: 490-line backend monolith split into evolvePatching.js (76L), evolveStreaming.js (155L), evolveEngine.js (299L, re-exports for backward compat)

### Current check status
- `npm run check` → PASS (0 errors, **1 warning** — styles.css size)
- `npm test` → 110 passing
- **0 inline handlers** and **0 inline styles** in entire frontend
- CSP: `script-src 'self'` (no unsafe-inline)

### Remaining Phase 1B work
1. Split `frontend/styles.css` (1230 lines) — only remaining warning
2. Begin Engage floating panel substrate
3. Define product spec for Engage/Nexus/Crew/Engineering detailed behavior
