# ARKEL — Handover Brief (2026-06-30)

**Read this file first.** It is the primary orientation for any agent continuing ARKEL development.

## What ARKEL Is

ARKEL is a local-first multi-provider AI workspace being built from a cloned repo (`Blackline_AI`). It has:
- A Node/Express backend serving a no-build frontend (plain JS modules, no bundler)
- A chat interface with multiple AI provider support (Ollama, OpenAI, Anthropic, Gemini, etc.)
- An Evolve system that can execute code changes via LLM-generated search/replace patches
- A Model Hub for managing endpoints and model selection
- A Role Matrix for assigning models to engineering roles

The app is being rebranded and expanded toward an **Engage**-centered workspace with floating panels.

## Current State (as of 2026-06-30 end of day)

### What works reliably
- **Backend**: All API routes functional, 110 tests pass
- **Model loading**: Ollama + all cloud providers work (after fix to `loadModels()` that was bailing when `#model-select` was removed from DOM)
- **Settings panel**: API keys, endpoint management, Model Center catalog all work
- **Role Matrix**: Model role assignment works
- **Evolve App**: Code change planning and execution works
- **Rate limiter**: Fixed — only applies to `/api/*` routes, static assets never throttled
- **Repo hygiene**: `npm run check` passes with 0 errors, 1 warning (floating_panels.js slightly over 350 target)
- **Security**: CSP has `script-src 'self'` only, markdown rendering is 3-layer hardened, 0 inline handlers, 0 inline styles

### What's partially working / needs fixing
- **Floating panel system**: The framework is built but has integration issues:
  - Chat panels don't auto-open on page load reliably (init logic may need browser testing)
  - The `openChatPanel` and `openConversationAsPanel` functions exist and create panels, but the auto-open on DOMContentLoaded may not fire correctly
  - Sidebar conversation clicks should open floating chat panels — logic exists but untested
  - Each chat panel has its own model select, System/Clear/Export buttons — HTML exists but Clear/Export/System handlers are NOT wired yet
  - Panel resize, maximize, drag, snap — implemented but untested in browser
  - Panel bar shows Nexus/Crew/Engineering toggle buttons — these work for opening/closing but panels have placeholder content only

### What's NOT built yet
- **Nexus panel content**: Should show file tree (adapt from Evolve's codebase tree)
- **Crew panel content**: Should show role matrix (adapt from Role Matrix panel)
- **Engineering panel content**: Should show evolve tasks (adapt from Evolve App panel)
- **Chat panel Clear button**: Should clear messages in that panel's conversation
- **Chat panel Export button**: Should export that panel's conversation to markdown
- **Chat panel System button**: Should open system prompt modal scoped to that panel
- **Fusion mode**: Multi-model team responses
- **Deep research**: Citation-based research threads
- **Skill execution**: `/teach` and other skills
- **Project workspace model**: Folders per conversation, file attachments

## Key Decisions Made

### Branding
- Name: **ARKEL**
- Subtitle: *"The intelligence gateway beyond the human layer."* (removed from sidebar header, kept in meta description)

### Navigation (current)
- **Engage** (was Chat) — main workspace with floating panels
- **Model Hub** (was Settings) — endpoint management
- **Role Matrix** — role assignment (will migrate into Crew panel)
- **Evolve App** — engineering tasks (will migrate into Engineering panel)

### Engage floating panel design
- **Chat is a floating panel** — one per conversation, each with own model select
- **Nexus** (◈) — file explorer (placeholder only)
- **Crew** (◬) — model teams (placeholder only)
- **Engineering** (⬡) — tasks & runs (placeholder only)
- Panel bar at **top** of Engage shows only tool toggle buttons (no chat tabs, no New Chat)
- **New Chat** button in sidebar only (removed from panel bar)
- Sidebar conversations open floating chat panels on click
- Panels are draggable, resizable, minimizable, maximizable, snap to edges

## File Structure

```
frontend/
├── index.html              — app shell (no inline handlers/styles)
├── base.css                — variables, reset, layout, sidebar, responsive
├── chat.css                — chat messages, bubbles, input, code blocks
├── settings.css            — settings, endpoints, model center
├── evolve.css              — evolve panel, file tree, modals
├── components.css          — technopunk, role matrix, floating panel styles
├── app.js                  — bootstrap, event binding, init
├── modules/
│   ├── core.js             — escHtml, loadStoredJson, autoResize, flashCopied
│   ├── state.js            — all global state variables, PROVIDERS
│   ├── toast.js            — toast() function
│   ├── markdown.js         — 3-layer hardened markdown rendering
│   ├── conversations.js    — conversation CRUD, calls openConversationAsPanel
│   ├── models_helpers.js   — providerLabel, capabilityBadges, etc.
│   ├── models_actions.js   — toggle, ping, probe, collapse
│   ├── models_center.js    — Model Center catalog rendering
│   ├── models_select.js    — loadModels, populateModelSelect, populateChatModelSelectGeneric
│   ├── floating_panels.js  — panel framework (create, drag, resize, maximize)
│   ├── floating_chat.js    — chat panel specifics (send, model select, bar, restore)
│   ├── panels.js           — showPanel, modals
│   ├── settings.js         — endpoint management
│   ├── model_roles.js      — role matrix
│   ├── chat_render.js      — legacy message rendering (still used by old loadConversation path)
│   ├── chat_send.js        — legacy send logic
│   ├── chat_actions.js     — legacy chat actions
│   ├── evolve_tree.js      — codebase file tree
│   ├── evolve_messages.js  — evolve message rendering
│   ├── evolve_plan.js      — plan approval UI
│   ├── evolve_send.js      — evolve send logic
│   └── data.js             — export/import data
backend/
├── services/
│   ├── evolvePatching.js   — strip, extract, applySearchReplace, cleanup
│   ├── evolveStreaming.js  — streamModelText (all providers)
│   └── evolveEngine.js     — executePlan, runTests, re-exports for backward compat
├── middleware/security.js  — CSP with script-src 'self' only, rate limiter
└── ... (routes, config, utils — unchanged from original)
scripts/check-repo.js       — repo hygiene gate (0 errors, 1 warning)
```

## Immediate Next Steps (in priority order)

### P0: Fix floating chat panel auto-open
The init code in `app.js` DOMContentLoaded calls `loadModels().then(...)` which should open a chat panel. If it doesn't work:
1. Open browser DevTools console and look for JS errors
2. Check if `openChatPanel()` or `openConversationAsPanel()` throw
3. The most likely issue: `#engage-panel-host` might have 0 height if the panel doesn't get flex space

### P1: Wire chat panel System/Clear/Export buttons
In `floating_chat.js`, `wireChatPanelEvents(convId)` binds send and model select. Add:
- System button → call `openSystemModal()` (from panels.js)
- Clear button → clear `conversations.find(c=>c.id===convId).messages`, re-render panel messages
- Export button → export conversation to markdown

### P2: Populate Nexus panel with file tree
Adapt the tree rendering from `evolve_tree.js` to work inside the Nexus floating panel body. Use the same `/api/file-tree` endpoint.

### P3: Populate Crew panel with role matrix
Move the role matrix rendering from `model_roles.js` into the Crew panel body. Keep the separate Role Matrix nav item working until migration is complete.

### P4: Populate Engineering panel with Evolve content
Move the evolve chat, plan, and file tree into the Engineering panel. Keep the separate Evolve App nav item working until migration is complete.

### P5: CSS cleanup
- Remove unused CSS rules from `chat.css` that applied to the old static chat panel
- The old `#messages`, `#input-area`, `#msg-input`, `#send-btn`, `#stop-btn` styles are no longer needed in the static shell

## How to Test

```bash
cd /home/user/Blackline_AI
npm install
npm start
# Open http://localhost:3737 in browser
npm test      # should show 110 passing
npm run check # should show 0 errors
```

## Key Patterns to Know

- **No build step**: All JS is plain `<script>` tags loaded in order in index.html
- **Global scope functions**: All modules define top-level functions (no modules/exports on frontend)
- **State module**: `state.js` defines all global variables at the top
- **Check script**: `scripts/check-repo.js` enforces inline handler/style limits, file size limits, and stale path checks
- **Markdown safety**: 3 layers — marked sanitize, output sanitizer, safe renderer
- **Rate limiter**: Only on `/api/*`, static assets never throttled

## Documentation Files to Keep

These markdown files are in the project root and should be preserved:
1. **HANDOVER_BRIEF.md** — this file (read first)
2. **IMPLEMENTATION_LOG.md** — complete work history
3. **ENGAGE_PRODUCT_SPEC.md** — product vision and panel design
4. **CARRY_FORWARD.md** — carry-over instructions
5. **PHASE_1B_NEXT_STEPS.md** — phase plan
6. **BRUTAL_AUDIT_REPORT_2026-06-29.md** — original audit
7. **README.md** — project readme
