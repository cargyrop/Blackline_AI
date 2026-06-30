# ARKEL — Implementation Log

Date started: 2026-06-29

This file is the carry-over log for future chats. It records:
- what was decided
- what was implemented
- what is next
- how roadmap phases map to findings

---

## Product renaming decisions

Approved branding direction:
- Product name: **ARKEL**
- Subtitle: **The intelligence gateway beyond the human layer.**

Approved top-level navigation direction:
- **Engage**
- **Model Hub**
- **Settings**

Approved floating panels inside Engage:
- **Nexus** — file tree / explorer / artifact browser
- **Crew** — model teams and role setup
- **Engineering** — engineering task creation + run monitoring

Future Engage expectations:
- main interface for simple chat and serious project work
- floating windows should be easy to open/close
- floating windows should be easy to rearrange so users can create their own working layout
- future Fusion mode: teams of models producing one response
- future deep research with citations
- future skill invocation and artifact generation

---

## How findings map to roadmap phases

### Critical findings

#### C1. Unsafe/trusting markdown/render path
Covered by:
- **Phase 1B — Frontend safety baseline**
- sanitize or lock down markdown rendering
- add XSS regression tests
- remove inline-handler dependency that weakens CSP

#### C2. Inline handler debt across live UI
Covered by:
- **Phase 1B — Frontend safety baseline**
- migrate handlers to delegated listeners and JS-bound behavior
- reduce/remove script `'unsafe-inline'` dependency in CSP

### High findings

#### H1. Phase 1 not actually complete
Covered by:
- **Phase 1A — Finish AI-editability hardening**
- split oversized modules
- tighten repo gate

#### H2. Evolve not yet a real engineering runtime
Covered by:
- **Phase 2 — Turn Evolve into Engineering runtime**
- durable run model, stages, artifacts, diff review, gates, repair loop

#### H3. Frontend too string-driven and fragile for future UI
Covered by:
- **Phase 1B — Frontend safety baseline**
- **Phase 3 — Implement Engage + floating panel shell**
- explicit event wiring, panel state model, draggable panel substrate

### Medium findings

#### M1. Docs can still overstate maturity
Covered by:
- ongoing doc updates during every phase
- especially Phase 2 and Phase 3 specs

#### M2. Stylesheet scale / design-system problem
Covered by:
- **Phase 1A — Finish AI-editability hardening**

#### M3. Conversation/project/workspace model not yet formalized
Covered by:
- **Phase 4 — Define workspace/project/memory model**
- plus expanded product spec below

### Low findings

#### L1. Global script architecture may not scale forever
Covered indirectly by:
- Phases 1B, 2, and 3
- reduce fragility without forcing a build-step migration yet

---

## What has been implemented in this chat

### 1. Brand rename started
Changed:
- `frontend/index.html`
  - title changed to `ARKEL`
  - meta description updated
  - major header branding updated to `ARKEL`
  - subtitle changed to `The intelligence gateway beyond the human layer.`
- `server.js`
  - startup log now prints `ARKEL`
- `README.md`
  - top heading and intro updated to ARKEL branding
- `BRUTAL_AUDIT_REPORT_2026-06-29.md`
  - branding references updated to ARKEL

### 2. Phase 1B Step 1 started — static shell inline-handler removal
Changed:
- `frontend/index.html`
  - removed many inline handlers from static shell elements
  - added IDs / data-action hooks for JS-bound events
- `frontend/app.js`
  - added `bindStaticShellEvents()`
  - static shell controls are now wired via `addEventListener`

Handled in this step:
- sidebar panel navigation buttons
- conversation filter input + clear button
- new chat button
- toolbar buttons
- chat suggestion chips
- chat model select
- chat send/stop controls
- local endpoint test box
- endpoint provider select
- endpoint test/add buttons
- refresh catalog button
- export/import data controls
- role matrix auto-assign / clear buttons
- evolve clear button
- evolve planner select
- evolve send/stop controls
- refresh file tree button
- system modal buttons
- model info modal close button
- modal overlay click-close wiring

Still remaining after this step:
- inline handlers in generated markup modules
- some live shell text still says Chat / Role Matrix / Evolve App
- remaining branding cleanup beyond major surface

### 2B. Bug fix from user testing
Fixed:
- `New chat` creating two conversations instead of one

Cause:
- static shell event binding could be attached more than once under certain reload/update conditions

Fix:
- added a one-time shell binding guard in `frontend/app.js`
- made the new chat button binding idempotent

### 2C. Phase 1B Step 1b + Step 2 progress
Completed/advanced:
- rebuilt `frontend/index.html` so the major static shell reflects the intended no-inline-handler version from this phase
- removed inline handler usage from:
  - `frontend/modules/markdown.js` code-copy button
  - `frontend/modules/conversations.js` conversation rename/delete controls
  - `frontend/modules/model_roles.js` role-summary action button
  - `frontend/modules/evolve_plan.js` approve/reject plan buttons
  - `frontend/modules/chat_render.js` suggestion chips, message action buttons, thinking toggles, code-copy buttons

Still remaining after this wave:
- some inline styles in `frontend/index.html`, `chat_render.js`, `chat_send.js`, `evolve_plan.js`, `evolve_send.js`, `evolve_tree.js`, `models.js`, and `settings.js`
- markdown safety itself is not yet hardened; only the inline handler path was removed there
- oversized core modules still remain (`evolveEngine.js`, `models.js`, `styles.css`)

### 2D. User-reported regression fixed
Fixed:
- conversation rename/delete stopped working after handler migration

Cause:
- conversation list click handler had reverted to a button-ignore version instead of action dispatch

Fix:
- restored action dispatch in `frontend/modules/conversations.js`

### 2E. Phase 1B Step 2 continued
Completed:
- removed remaining inline event handler from `frontend/modules/model_roles.js` role select
- removed inline event handlers from `frontend/modules/models.js`
- removed inline event handlers from `frontend/modules/settings.js`

Follow-up fixes:
- fixed Role Matrix select persistence regression by restoring the missing change listener attachment after render
- refactored `frontend/modules/models.js` slightly to offset prior growth and restore repo-check compliance

Current `npm run check` status after this step:
- no inline event handler warnings remain
- remaining warnings are now inline styles + oversized files
- repo check is green again

### 3. Brutal audit report written
Created:
- `BRUTAL_AUDIT_REPORT_2026-06-29.md`

### 4. Carry-over implementation log created
Created:
- `IMPLEMENTATION_LOG.md`

---

## Immediate proposed next steps

Recommended order:

1. **Complete the ARKEL rename surface pass**
   - replace remaining major user-facing `BLACKLINE AI` labels in live UI/docs
   - do not blindly mass-replace internal historical references yet

2. **Start Phase 1B with the highest-value live UI cleanup**
   - remove inline handlers from `frontend/index.html`
   - keep behavior unchanged
   - wire listeners from JS bootstrap/panel code

3. **Add a product spec + storage spec before big UX expansion**
   - define Engage/Nexus/Crew/Engineering behavior
   - define workspaces, threads, memories, skills, runs on disk
   - define floating-panel layout persistence model

4. **Then continue frontend safety hardening**
   - generated HTML action buttons
   - markdown constraints/sanitization
   - CSP tightening path

---

## Detailed product spec draft

# Top-level app model

## Engage
The main workspace.

Engage is not only chat. It is the central interaction layer for:
- plain model conversation
- file-aware discussion
- research threads
- learning threads
- engineering threads
- future Fusion team interactions

### Engage core user capabilities
- start a new thread
- continue old threads
- browse related files via Nexus
- attach/refer files into context
- save takeaways into memory/rules/skills buckets
- launch engineering tasks from the thread
- later: launch deep research or Fusion response flows

### Engage persistence concept
Each meaningful Engage thread can map to a workspace folder.
Minimum persisted artifacts:
- `thread.md` or equivalent transcript file
- metadata JSON
- referenced/generated artifacts
- optional summaries

## Nexus
A floating explorer panel.

### Purpose
Provide universal browsing of:
- current project files
- workspace thread files
- memory files
- skill files
- rules/reusable knowledge files
- engineering run artifacts
- generated research or lesson outputs

### Required UX
- easy open/close
- easy pin/unpin
- easy drag/reposition
- resize support
- file preview
- quick actions from selected file:
  - attach to Engage
  - summarize
  - save takeaway to memory
  - save as rule draft
  - save as skill draft
  - include in Engineering context

## Crew
A floating team/role panel.

### Immediate scope
Manage role assignments for engineering:
- planner
- executor
- reviewer
- repair
- optional tester/scribe later

### Future scope
Manage model teams for:
- Fusion
- research
- teaching
- other workflows

### Required UX
- quick model assignment
- saved presets
- visible team purpose
- future mode templates (engineering, fusion, research, teach)

## Engineering
A floating operational panel.

### Purpose
Unify the old Forge + Ops ideas into one panel.

### Immediate responsibilities
- create engineering tasks
- scope work
- choose mode/risk
- inspect current and past runs
- review plans
- review diffs
- approve/reject runs
- inspect gates/results

### Required UX
Panel internal sections:
- **Create** — new task
- **Runs** — active/history
- **Review** — plan/diff/gate details

---

## Technical storage architecture draft

Initial storage should stay filesystem-first.

## Proposed directories

```text
data/
├── config.json
├── workspaces/
│   ├── engage/
│   │   └── <thread-id>/
│   │       ├── meta.json
│   │       ├── thread.md
│   │       ├── artifacts/
│   │       └── summaries/
│   ├── projects/
│   │   └── <project-id>/
│   │       ├── meta.json
│   │       ├── rules/
│   │       ├── memories/
│   │       ├── skills/
│   │       └── runs/
│   └── system/
│       └── arkel-root/
├── memory/
│   ├── global/
│   └── project/
├── skills/
│   ├── built-in/
│   └── custom/
├── rules/
│   ├── global/
│   └── project/
├── runs/
│   └── <run-id>/
│       ├── meta.json
│       ├── timeline.json
│       ├── context/
│       ├── plan.json
│       ├── diff/
│       ├── gates/
│       ├── logs/
│       └── final-summary.md
└── layouts/
    └── engage-layout.json
```

## Notes
- The exact structure can be simplified at first.
- The important thing is to distinguish conceptually between:
  - threads
  - projects/workspaces
  - memories
  - skills
  - rules
  - runs
  - UI layout persistence

## Minimum layout persistence model
Store per-user local layout state such as:
- open panels
- panel positions
- panel sizes
- z-order
- pinned state
- last active Engage thread

Possible initial file or browser storage key:
- localStorage first: `engageLayout`
- later mirrored to `data/layouts/engage-layout.json` if needed

---

## Next coding target

### Target for next implementation step
**Begin Phase 1B by removing inline handlers from `frontend/index.html` and moving them to JS listeners without changing behavior.**

Why this first:
- directly attacks critical/high findings
- low conceptual risk
- improves CSP path
- creates cleaner substrate for Engage panel evolution

---

## Notes for future chat continuation

When continuing in a new chat:
1. read `IMPLEMENTATION_LOG.md`
2. read `BRUTAL_AUDIT_REPORT_2026-06-29.md`
3. check current state of `frontend/index.html`, `frontend/app.js`, `frontend/modules/panels.js`
4. continue with Phase 1B implementation unless priorities changed

---

## 2026-06-30 — models.js split

### Context
`npm run check` was failing with:
```
FAIL frontend/modules/models.js: known oversized file grew from 486 to 502 lines. Split or shrink it first.
```

### What was done
Split `frontend/modules/models.js` (502 lines) into 4 focused modules:

1. **`models_helpers.js`** (70 lines) — shared utility functions
   - `providerLabel`, `capabilityBadges`, `modelOptionText`, `isModelSelectable`
   - `modelKey`, `modelProbeFor`, `setModelCenterFilter`, `modelMatchesCenterFilter`
   - `arenaEloValue`, `arenaEloText`, `modelIdSubtitle`, `yesNoBadge`

2. **`models_select.js`** (149 lines) — model selection and population
   - `loadModels`, `populateModelSelect`, `populateEvolveModelSelect`
   - `onModelChange`, `currentModelObject`, `getEvolveModel`

3. **`models_center.js`** (154 lines) — Model Center catalog rendering
   - `renderModelCenter`, `modelRowHtml`
   - `bindProviderHeaderActions`, `bindModelRowActions`
   - contains 4 legacy inline style attributes (baseline tracked)

4. **`models_actions.js`** (135 lines) — toggle, ping, probe, collapse
   - provider collapse state helpers
   - `toggleProviderTable`, `toggleEntireProvider`, `toggleModelEnabled`, `bulkToggleFiltered`
   - `pingModel`, `probeModel`, `loadModelProbes`, `checkOllama`

### Files changed
- **Deleted**: `frontend/modules/models.js`
- **Created**: `frontend/modules/models_helpers.js`, `frontend/modules/models_select.js`, `frontend/modules/models_center.js`, `frontend/modules/models_actions.js`
- **Updated**: `frontend/index.html` — replaced single `<script src="/modules/models.js">` with 4 script tags in dependency order
- **Updated**: `scripts/check-repo.js` — removed `models.js` from LINE_BASELINE, INLINE_HANDLER_BASELINE, INLINE_STYLE_BASELINE; added `models_center.js` to INLINE_STYLE_BASELINE with count 4
- **Updated**: `tests/frontend/models.test.js` — loads 4 split files instead of single models.js
- **Updated**: `tests/frontend/model_roles.test.js` — loads 4 split files instead of single models.js

### Verification
- `npm run check` → **PASS** (0 errors, 10 warnings)
- `npm test` → **110 passing** (0 failures)

### Remaining check warnings
- 8 inline style warnings across: index.html (12), chat_render.js (2), chat_send.js (2), evolve_plan.js (10), evolve_send.js (2), evolve_tree.js (1), models_center.js (4), settings.js (2)
- evolveEngine.js at 490/500 hard-limit
- styles.css at 1186 lines

### Next recommended steps
1. Populate Nexus panel with file tree (adapt from Evolve codebase tree)
2. Populate Crew panel with role matrix content (adapt from Role Matrix)
3. Populate Engineering panel with evolve content (adapt from Evolve App)
4. Eventually fold Role Matrix and Evolve App nav items into the floating panels
5. Split `frontend/styles.css` (1230 lines) — only remaining oversized warning
6. Move toward Engage floating panel substrate

---

## 2026-06-30 Turn 2 — Inline style cleanup, markdown hardening, evolveEngine split

### 1. Inline style cleanup — ALL INLINE STYLES ELIMINATED

Replaced all 35 inline `style=` attributes across 8 files with CSS classes.

New CSS classes added to `styles.css`:
- `.initially-hidden` — general purpose display:none (JS toggles via style.display)
- `.icon-send-arrow`, `.icon-stop-mark` — button icon sizing (16px, 14px)
- `.error-text` — red error text (replaces `style="color:var(--red)"`)
- `.testing-status` — yellow testing text
- `.plan-investigation-title`, `.plan-investigation-desc` — investigation card styling
- `.plan-proposed-title`, `.plan-proposed-desc`, `.plan-text-accent` — plan card styling
- `.plan-change-card`, `.plan-change-header`, `.plan-change-action`, `.plan-change-path`, `.plan-change-desc` — plan change items
- `.exec-started-title`, `.exec-feed` — execution feed styling
- `.td-center`, `.td-actions`, `.th-act`, `.th-actions` — model center table alignment
- ID-based rules: `#stop-btn { display:none }`, `#keys-list, #custom-providers-list { display:none }`, `#evolve-model-select, #show-all-evolve-models { display:none }`

Files modified:
- `frontend/index.html` — 12 inline styles removed
- `frontend/modules/chat_render.js` — 2 removed (thinking container, answer bubble)
- `frontend/modules/chat_send.js` — 2 removed (error spans)
- `frontend/modules/evolve_plan.js` — 10 removed (plan/investigation cards)
- `frontend/modules/evolve_send.js` — 2 removed (execution feed)
- `frontend/modules/evolve_tree.js` — 1 removed (error div)
- `frontend/modules/models_center.js` — 4 removed (table alignment)
- `frontend/modules/settings.js` — 2 removed (testing status, drawer)

Check script baselines cleared:
- `INLINE_STYLE_BASELINE` is now empty `{}`
- `INLINE_HANDLER_BASELINE` is now empty `{}`

### 2. Markdown safety hardening

`frontend/modules/markdown.js` now has 3 defense-in-depth layers:
1. **marked `sanitize: true`** — escapes raw HTML in markdown input
2. **`sanitizeHtmlOutput()`** — post-processing sanitizer that strips:
   - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<base>`, `<meta>`, `<link>` tags
   - All `on*` event attributes (onclick, onerror, etc.)
   - `javascript:`, `vbscript:`, `data:` URLs in href/src/action
3. **Safe renderer override** — code blocks use `data-action` for copy buttons, not inline handlers

Also restored `frontend/vendor/marked.min.js` (marked v4.3.0) which was missing from the vendor directory.

### 3. CSP tightened

`backend/middleware/security.js` CSP header updated:
- `script-src` changed from `'self' 'unsafe-inline'` to just `'self'`
  - Safe because all inline handlers were eliminated in prior work
- `style-src` retains `'unsafe-inline'` for now (highlight.js needs it)
- Added `font-src 'self'`

### 4. evolveEngine.js split (490 → 76 + 155 + 299)

Split into 3 focused modules:
- **`evolvePatching.js`** (76 lines) — pure utilities: `stripGeneratedFileContent`, `extractJsonObject`, `applySearchReplacePatch`, `cleanupOldBackups`, constants
- **`evolveStreaming.js`** (155 lines) — `streamModelText` with all provider-specific streaming logic
- **`evolveEngine.js`** (299 lines) — `executePlan`, `runTests` orchestrator, re-exports everything for backward compatibility

No consumers needed updating — `require('../services/evolveEngine')` still works.

### Verification
- `npm run check` → **PASS** (0 errors, 1 warning — styles.css size)
- `npm test` → **110 passing**

### Current repo health status
- **0 inline handlers** across entire frontend
- **0 inline styles** across entire frontend
- **1 remaining warning**: `frontend/styles.css` at 1230 lines
- **0 remaining errors**
- CSP has `script-src 'self'` (no 'unsafe-inline')
- Markdown rendering is 3-layer hardened

---

## 2026-06-30 Turn 3 — CSS split, Engage floating panel substrate

### 1. CSS split — styles.css eliminated (1230 → 5 focused files)

Split the monolithic `frontend/styles.css` into 5 logical CSS files:
- **`base.css`** (255 lines) — :root variables, reset, layout, sidebar, toolbar, responsive, a11y
- **`chat.css`** (243 lines) — chat panel, messages, bubbles, input, actions, code blocks, streaming, thinking
- **`settings.css`** (306 lines) — settings panel, API keys, endpoints, model center, catalog
- **`evolve.css`** (269 lines) — evolve panel, file tree, plan cards, modals
- **`components.css`** (151+ lines) — technopunk styling, role matrix, Phase 1B replacement classes, floating panel styles

`index.html` updated to load all 5 CSS files. Old `styles.css` deleted.

Check script updated:
- Removed `frontend/styles.css` from `LINE_BASELINE`
- Reduced `MAX_CSS_LINES` from 1300 to 500 (per-file limit)
- **Result: `npm run check` now shows 0 errors, 0 warnings** — first completely clean run ever

### 2. Engage floating panel substrate created

New file: `frontend/modules/floating_panels.js`

Features implemented:
- **Panel definitions** for Nexus (◈), Crew (◬), Engineering (⬡) with default positions/sizes
- **`openFloatingPanel(id)`** — creates panel element dynamically or shows existing
- **`closeFloatingPanel(id)`** — hides panel, persists closed state
- **`toggleFloatingPanel(id)`** — toggle open/closed
- **`minimizeFloatingPanel(id)`** — collapses body, keeps header visible
- **Drag system** — mousedown on header starts drag, mousemove/mouseup tracked globally, position persisted
- **Z-order management** — clicking a panel brings it to front via incrementing z-index
- **Layout persistence** — all panel positions, sizes, open/closed states saved to `localStorage('floatingPanelLayout')`
- **`restoreFloatingPanelLayout()`** — on init, re-opens panels that were previously open
- **Engage Panel Bar** — row of toggle buttons at bottom of Engage panel, rendered by `renderEngagePanelBar()`

CSS for floating panels added to `components.css`:
- `.floating-panel` — absolute positioned, bordered, shadowed, flex column
- `.fp-header` — drag handle with title, subtitle, minimize/close buttons
- `.fp-body` — scrollable content area
- `.fp-minimized` — collapsed state
- `#engage-panel-host` — relative positioned container for panels to overlay
- `#engage-panel-bar` — flex row of panel toggle buttons
- `.engage-panel-btn` — technopunk-styled toggle buttons

### 3. Navigation rename: Chat → Engage

Sidebar nav button changed from "Chat" to "Engage"
`chat-panel` aria-label changed from "Chat" to "Engage"

### 4. Product spec written

Created `ENGAGE_PRODUCT_SPEC.md` with:
- Engage structure diagram
- Panel descriptions (Nexus, Crew, Engineering) with current/future scope
- Panel UX requirements
- Panel state model (localStorage schema)
- Storage architecture draft
- Integration points with existing Role Matrix and Evolve App
- Navigation transition plan

### Verification
- `npm run check` → **PASS** (0 errors, **0 warnings** — first fully clean run)
- `npm test` → **110 passing**

### Current repo health status
- **0 errors, 0 warnings** in `npm run check`
- **0 inline handlers** across entire frontend
- **0 inline styles** across entire frontend
- **CSP**: `script-src 'self'` only
- **Markdown**: 3-layer hardened
- **All JS modules** under 350 lines (most under 155)
- **All CSS files** under 310 lines
- **Engage floating panel system** operational with Nexus/Crew/Engineering shells

---

## 2026-06-30 Turn 4 — Rate limiter fix, subtitle removal, Engage panel redesign

### 1. Rate limiter bug fixed

**Cause**: Rate limiter (90 req/60s) was applied as global middleware BEFORE `express.static`, so every CSS, JS, vendor file request counted. A single page refresh generates ~30 requests — 3 rapid refreshes hit the limit.

**Fix**: Moved `express.static` BEFORE the rate limiter. Rate limiter now applies only to `/api` routes with increased limit (200 req/60s). Static assets are never throttled.

### 2. Subtitle removed

Removed "The intelligence gateway beyond the human layer." from the sidebar header. Only "ARKEL" remains.

### 3. Engage floating panel system redesigned per user feedback

User feedback: chat as background is inconvenient when using floating panels; need resizable panels; need snap-to-edges; need multiple chat panels; each chat needs its own model select and controls; panel buttons should be at top; sidebar conversations should open chat panels; New Chat should be at top.

Major changes:

**Architecture**: Chat is no longer a fixed panel — it's a floating panel type. Multiple chat panels can be open simultaneously, each with its own model selection, system prompt, clear, and export controls. The Engage panel host is now a full workspace area.

**New features in floating_panels.js**:
- Resize handles (bottom-right corner drag)
- Maximize button (☐) — fills entire host area
- Unmaximize on drag from maximized state — panel reappears around mouse position
- Edge snapping — panels snap to edges when dragged within 12px threshold
- Chat panels — full chat experience in floating windows with model select, system/clear/export buttons, message area, input area
- Panel bar moved to bottom of Engage (New Chat + tool buttons + chat tabs)

**New file: floating_chat.js** (260 lines):
- `populateChatModelSelect(convId)` — populates per-panel model dropdown
- `wireChatPanelEvents(convId)` — input/send/model change handlers per panel
- `sendFloatingChatMessage(convId)` — sends via /api/chat with per-panel model
- `updatePanelBar()` — renders panel bar with New Chat, tool buttons, chat tabs
- `restoreFloatingPanelLayout()` — restores all panels on init, including chat messages
- `openConversationAsPanel(convId)` — opens sidebar conversation as floating chat

**Sidebar integration**:
- Clicking a conversation in sidebar opens it as a floating chat panel
- `loadConversation()` now calls `openConversationAsPanel()` instead of rendering into static messages div
- New Chat button in sidebar creates a new conversation and opens it as a floating panel

**CSS**: Full floating panel styling including:
- `.fp-resize-handle` — bottom-right resize grip
- `.fp-chat-body`, `.fp-chat-toolbar`, `.fp-chat-messages`, `.fp-chat-input-area` — chat panel internals
- `.fp-chat-msg`, `.fp-chat-msg-bubble` — per-message bubbles (user/assistant)
- `.engage-panel-btn.new-chat-btn` — highlighted New Chat button
- `.chat-tab-btn` — open chat tab styling
- Maximized/minimized panel states

### Verification
- `npm run check` → PASS (0 errors, 1 warning — floating_panels.js 423L exceeds 350 target)
- `npm test` → 110 passing

### Next recommended steps
1. Test the floating panel system thoroughly in the browser
2. Wire the System Prompt / Clear / Export buttons inside chat panels
3. Populate Nexus panel with file tree content
4. Populate Crew panel with role matrix content
5. Populate Engineering panel with evolve content
