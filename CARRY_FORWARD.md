# ARKEL — Carry Forward (Updated 2026-06-30)

If you start a new chat, carry these markdown files forward:

## Must carry
1. `IMPLEMENTATION_LOG.md` — primary continuity file (all work history)
2. `ENGAGE_PRODUCT_SPEC.md` — product vision for Engage/Nexus/Crew/Engineering
3. `BRUTAL_AUDIT_REPORT_2026-06-29.md` — audit findings and severity ratings

## Strongly recommended
4. `CARRY_FORWARD.md` — this file
5. `PHASE_1B_NEXT_STEPS.md` — immediate action plan

## Current state snapshot

### What works
- `npm run check` → PASS (0 errors, 1 warning)
- `npm test` → 110 passing
- 0 inline handlers, 0 inline styles across entire frontend
- CSP: `script-src 'self'` only (no unsafe-inline)
- Markdown: 3-layer hardened (sanitize + output sanitizer + safe renderer)
- Rate limiter: only applies to /api routes, static assets never throttled
- CSS split into 5 files (base, chat, settings, evolve, components)
- models.js split into 4 files (helpers, select, center, actions)
- evolveEngine.js split into 3 files (patching, streaming, engine)

### What's in progress / needs browser testing
- **Floating panel system** — created but had integration issues
  - Chat is now a floating panel type (one per conversation)
  - Panel bar at top of Engage with New Chat + Nexus + Crew + Engineering buttons
  - Panels are draggable, resizable, minimizable, maximizable
  - Edge snapping, layout persistence
  - Each chat panel has its own model select, System/Clear/Export buttons
  - Sidebar conversations open floating chat panels on click
  - **Status**: Framework code is written, needs browser testing and bug fixing

### Known issues to fix next
1. **Floating panel auto-open on init** — logic is there but needs browser verification
2. **Sidebar nav buttons** (Model Hub, Role Matrix, Evolve App) — `showPanel()` fixed but needs testing
3. **Chat panel System/Clear/Export buttons** — HTML is in floating panels but event handlers not fully wired
4. **Panel bar rendering** — `renderEngagePanelBar()` called on init but needs verification
5. **Chat message streaming** — `sendFloatingChatMessage()` implemented but needs browser testing

### File structure reference
```
frontend/
├── index.html          — app shell (no inline handlers/styles)
├── base.css            — variables, reset, layout, sidebar, responsive
├── chat.css            — chat messages, bubbles, input, code blocks
├── settings.css        — settings, endpoints, model center
├── evolve.css          — evolve panel, file tree, modals
├── components.css      — technopunk, role matrix, floating panel styles
├── app.js              — bootstrap, event binding, init
├── modules/
│   ├── core.js         — escHtml, loadStoredJson, autoResize, flashCopied
│   ├── state.js        — all global state, PROVIDERS
│   ├── toast.js        — toast() function
│   ├── markdown.js     — 3-layer hardened markdown rendering
│   ├── conversations.js — conversation CRUD, now calls openConversationAsPanel
│   ├── models_helpers.js — providerLabel, capabilityBadges, etc.
│   ├── models_actions.js — toggle, ping, probe, collapse
│   ├── models_center.js  — Model Center catalog rendering
│   ├── models_select.js  — loadModels, populateModelSelect, onModelChange
│   ├── floating_panels.js — panel framework (create, drag, resize, maximize)
│   ├── floating_chat.js   — chat panel specifics (send, model select, bar, restore)
│   ├── panels.js        — showPanel, modals
│   ├── settings.js      — endpoint management
│   ├── model_roles.js    — role matrix
│   └── ... (other modules unchanged)
backend/
├── services/
│   ├── evolvePatching.js   — strip, extract, applySearchReplace
│   ├── evolveStreaming.js  — streamModelText (all providers)
│   └── evolveEngine.js     — executePlan, runTests, re-exports
└── middleware/security.js  — CSP with script-src 'self' only
```

### Product direction
- Top-level: **Engage**, **Model Hub**, **Settings**
- Engage has floating panels: **Nexus** (files), **Crew** (roles), **Engineering** (tasks)
- Chat is a floating panel type — multiple chats possible
- Legacy Role Matrix and Evolve App panels remain until their content migrates into Crew and Engineering floating panels
