# BLACKLINE AI — Modular Architecture Blueprint (v2.0)

## Goal
Enable AI-driven development where an AI can implement a new feature or update an existing one by reading **only a small fraction of the codebase** (typically 1–3 files + contracts), while remaining confident it won't break the rest of the app.

## Core Principle: Contracts Over Source
Instead of dumping the entire codebase into every prompt, we expose:
1. **Architecture Manifest** — a single high-level map of all modules and data flows (always loaded, never source code).
2. **Module Contracts** — each module exposes a `README.md` or `contract.json` describing its public API, inputs/outputs, and invariants. The AI reads this when planning.
3. **Module Source** — full source is fetched **only** for modules the AI is actively editing.
4. **Integration Tests** — each module has tests that verify its contract. The AI runs these after editing to prove it didn't break anything.

---

## 1. Directory Structure (Target State)

```
Blackline_AI/
├── server.js                 ← Thin bootstrap (50 lines). Only requires() modules and starts Express.
├── package.json
├── START.bat / start.sh
│
├── backend/                  ← All backend logic
│   ├── manifest.json         ← Machine-readable architecture map
│   ├── bootstrap.js          ← Express setup, middleware registration, route mounting
│   ├── config/
│   │   ├── index.js          ← loadConfig, saveConfig, schema validation
│   │   └── schema.json       ← JSON schema for config.json (AI uses this to validate changes)
│   ├── middleware/
│   │   ├── security.js       ← securityHeaders, CSP, rateLimiter
│   │   └── errors.js         ← error handling middleware
│   ├── providers/            ← One file per AI provider
│   │   ├── anthropic.js
│   │   ├── openai.js
│   │   ├── gemini.js
│   │   ├── groq.js
│   │   ├── openrouter.js
│   │   ├── deepseek.js
│   │   ├── ollama.js
│   │   └── custom.js         ← OpenAI-compatible custom provider logic
│   ├── routes/               ← Express route handlers (thin, delegate to services)
│   │   ├── health.js
│   │   ├── keys.js
│   │   ├── models.js
│   │   ├── chat.js
│   │   ├── evolve.js         ← Evolve execution endpoint
│   │   ├── files.js
│   │   └── manifest.js       ← Serves architecture manifest
│   ├── services/             ← Core business logic (no req/res objects here)
│   │   ├── modelDiscovery.js ← All model-fetching logic
│   │   ├── chatProxy.js      ← Streaming proxy logic for all providers
│   │   ├── evolveEngine.js   ← Backup, plan execution, search/replace patches
│   │   ├── fileTree.js       ← safeResolve, readFileMap, listVisibleEntries
│   │   └── probe.js          ← Model probing logic
│   └── utils/
│       ├── http.js           ← readErrorMessage, joinUrl, fetch with timeout helpers
│       ├── strings.js        ← prettyModelName, escHtml, etc.
│       └── paths.js          ← safeResolve, toPosixPath, joinRelPath
│
├── frontend/                 ← All frontend logic (replaces public/)
│   ├── manifest.json         ← Frontend architecture map: modules, dependencies, DOM contracts
│   ├── index.html            ← Shell only: no inline event handlers, no inline scripts
│   ├── styles.css            ← Global variables + layout shell only
│   ├── app.js                ← Thin bootstrap: imports modules, wires events, mounts app
│   └── modules/              ← One file per feature
│       ├── core/
│       │   ├── state.js      ← All global state (models, conversations, currentConvId, etc.)
│       │   ├── storage.js    ← localStorage helpers
│       │   ├── markdown.js   ← marked + highlight.js initialization
│       │   └── utils.js      ← escHtml, autoResize, debounce, etc.
│       ├── chat/
│       │   ├── index.js      ← Exports: initChat(), sendMessage(), stopGenerating()
│       │   ├── render.js     ← appendMessage(), renderMessages(), scrollBottom()
│       │   ├── ui.js         ← DOM queries for chat panel, input handling, keyboard events
│       │   └── contract.md   ← "I render messages in #messages. I depend on storage.js and markdown.js"
│       ├── evolve/
│       │   ├── index.js      ← Exports: initEvolve(), sendEvolveMessage(), approvePlan()
│       │   ├── plan.js       ← Plan parsing, state management, retry logic
│       │   ├── fileTree.js   ← loadFileTree(), renderFileTreeNodes(), showFileViewer()
│       │   ├── ui.js         ← DOM queries for evolve panel
│       │   └── contract.md
│       ├── conversations/
│       │   ├── index.js      ← Exports: newConversation(), loadConversation(), deleteConversation()
│       │   ├── sidebar.js    ← renderConvList(), filterConversations(), rename UI
│       │   └── contract.md
│       ├── models/
│       │   ├── index.js      ← Exports: loadModels(), populateModelSelect(), probeModel()
│       │   ├── center.js     ← renderModelCenter(), setModelCenterFilter()
│       │   └── contract.md
│       ├── settings/
│       │   ├── keys.js       ← buildKeysList(), saveKey(), deleteKey()
│       │   ├── customProviders.js
│       │   └── contract.md
│       └── ui-shell/
│           ├── panels.js     ← showPanel(), panel visibility management
│           ├── modals.js     ← openSystemModal(), closeModal(), etc.
│           ├── toast.js      ← toast queue
│           └── contract.md
│
├── tests/                    ← NEW: Automated guardrails
│   ├── backend/
│   │   ├── config.test.js
│   │   ├── fileTree.test.js
│   │   └── evolveEngine.test.js
│   └── frontend/
│       └── (can use simple Node test runner or vitest — no browser needed for logic tests)
│
├── contracts/                ← Human + AI readable architecture docs
│   ├── ARCHITECTURE.md       ← Data flow diagrams, module map
│   ├── DATA_FLOW.md          ← How messages flow from user input → backend → AI → backend → frontend
│   ├── INVARIANTS.md         ← Things that must NEVER change (e.g., "safeResolve must block .. traversal")
│   └── EVOLVE_PROTOCOL.md    ← How the evolve system works: prompt format, plan schema, patch rules
│
└── public/                   ← (kept for Express static serving, but all source lives in frontend/)
    ├── (compiled/bundled output if we ever add a build step)
    └── vendor/
        ├── marked.min.js
        ├── highlight.min.js
        └── highlight-github-dark.min.css
```

---

## 2. The Manifest System (The Key Innovation)

### Backend Manifest (`backend/manifest.json`)
```json
{
  "version": "2.0.0",
  "modules": {
    "config": { "path": "backend/config/index.js", "lines": 80, "exports": ["loadConfig", "saveConfig"], "dependencies": [] },
    "securityMiddleware": { "path": "backend/middleware/security.js", "lines": 45, "exports": ["securityHeaders", "rateLimiter"], "dependencies": [] },
    "modelDiscovery": { "path": "backend/services/modelDiscovery.js", "lines": 320, "exports": ["fetchModelsForProvider"], "dependencies": ["config", "httpUtils"] },
    "chatProxy": { "path": "backend/services/chatProxy.js", "lines": 280, "exports": ["streamChat"], "dependencies": ["config", "httpUtils"] },
    "evolveEngine": { "path": "backend/services/evolveEngine.js", "lines": 350, "exports": ["executePlan", "createBackup", "applyPatch"], "dependencies": ["config", "fileTree", "probe"] },
    "evolveRoute": { "path": "backend/routes/evolve.js", "lines": 60, "exports": [], "dependencies": ["evolveEngine", "config"] }
  },
  "routes": [
    { "method": "GET", "path": "/api/health", "handler": "backend/routes/health.js", "dependencies": [] },
    { "method": "POST", "path": "/api/evolve/execute", "handler": "backend/routes/evolve.js", "dependencies": ["evolveEngine"] }
  ]
}
```

### Frontend Manifest (`frontend/manifest.json`)
```json
{
  "version": "2.0.0",
  "modules": {
    "chat": { "path": "frontend/modules/chat/index.js", "exports": ["sendMessage", "stopGenerating"], "domTargets": ["#messages", "#msg-input", "#send-btn"], "dependencies": ["core/state", "core/markdown", "core/storage"] },
    "evolve": { "path": "frontend/modules/evolve/index.js", "exports": ["sendEvolveMessage", "approvePlan"], "domTargets": ["#evolve-messages", "#evolve-input", "#evolve-file-tree"], "dependencies": ["core/state", "core/storage"] }
  }
}
```

**Why this matters:** When the AI plans a new feature, it reads the manifest (2KB) instead of the full source (100KB). It sees exactly which modules exist, what they do, and what they touch. It then decides which 1–3 modules need editing, and **only** fetches the full source for those files via the existing `/api/files` endpoint.

---

## 3. The Evolve Protocol v2 (How AI Actually Edits Code)

### Step 1: Investigation (AI sees manifest + contracts only)
The user asks: *"Add a 'Favorite Models' feature so I can pin models to the top of the dropdown."*

The AI receives:
- `contracts/ARCHITECTURE.md` (how the app is structured)
- `frontend/manifest.json` + `backend/manifest.json` (module map)
- `frontend/modules/models/contract.md` (what the model module does)
- `frontend/modules/chat/contract.md` (what the chat module does, because the dropdown lives in chat)

The AI does **NOT** receive `app.js`, `server.js`, `styles.css`, or any module source code at this stage.

### Step 2: Planning (AI proposes which modules to touch)
The AI responds with a plan:
```json
{
  "plan": [
    { "module": "frontend/modules/models", "action": "edit", "description": "Add favoriteIds to state; add toggleFavorite(modelId) and isFavorite(modelId); update populateModelSelect() to sort favorites first." },
    { "module": "frontend/modules/chat", "action": "edit", "description": "Add a star button next to each model option; wire onclick to toggleFavorite." },
    { "module": "frontend/modules/settings", "action": "edit", "description": "Add 'Favorites' section in Model Center showing favorited models with unfavorite buttons." },
    { "module": "frontend/core/storage", "action": "edit", "description": "Persist favoriteIds in localStorage alongside conversations." }
  ]
}
```

### Step 3: Execution (AI fetches only the files it needs)
For each planned module, the Evolve endpoint now fetches **only**:
1. The module's full source code (via `/api/files`)
2. The contract of any module it depends on (for reference)

It does **not** fetch unrelated modules like `evolve/plan.js`, `backend/services/chatProxy.js`, or `vendor/marked.min.js`.

### Step 4: Patching (same search/replace, but safer)
The AI edits the targeted files using the existing search/replace patch system. Because each file is now smaller (150–300 lines instead of 2000), the patches are more likely to succeed.

### Step 5: Verification (NEW — the safety net)
After applying patches, the server automatically runs:
```bash
npm test
```
If tests fail, the update is rolled back from the backup, and the AI is told which test failed. This is how we ensure the AI doesn't need to "understand the whole codebase" — the tests act as the guardrails.

---

## 4. Module Contracts (What Each Module Promises)

Every module folder contains a `contract.md`:

```markdown
# Module: chat/index.js

## Responsibility
Handles sending user messages, streaming AI responses, and managing the chat UI state (send button, stop button, input textarea).

## Public API
- `sendMessage(overrideText?: string): Promise<void>`
- `stopGenerating(): void`
- `initChat(): void`

## DOM Targets (what HTML elements this module touches)
- `#messages` — renders chat bubbles here
- `#msg-input` — reads user input from here
- `#send-btn` — toggles disabled state
- `#stop-btn` — shows/hides during streaming

## State Dependencies (reads/writes)
- Reads: `core/state.currentModel`, `core/state.conversations`
- Writes: `core/state.conversations` (appends assistant messages)

## Events Published (if using an event bus)
- `chat:messageSent` — when a user message is sent
- `chat:streamingStart` — when streaming begins
- `chat:streamingEnd` — when streaming ends

## Invariants (things that must always be true)
- `sendMessage()` must not be callable while `streaming === true`
- `stopGenerating()` must set `streaming = false` and abort the fetch controller
- The DOM must always have exactly one `#messages` element

## Dependencies (other modules this imports)
- `core/state`
- `core/markdown`
- `core/storage`
```

When an AI needs to edit this module, it reads the contract first. It knows exactly what it can and cannot do without breaking other modules.

---

## 5. The Invariants File (The "Do Not Touch" List)

`contracts/INVARIANTS.md`:
```markdown
# Global Invariants

These must never be violated by any AI-generated change.

1. **Path Safety**: `safeResolve()` must always block `..`, absolute paths, and any write to `node_modules`, `.git`, `data/`, `.env`.
2. **No Inline Event Handlers**: All HTML event handlers must use `addEventListener` in JS modules. This allows CSP `script-src 'self'` without `'unsafe-inline'`.
3. **No Inline Styles in HTML**: All styling must come from CSS modules. HTML uses class names only.
4. **API Key Sanitization**: The `/api/keys` endpoint must never return full keys. Only masked `••••XXXX`.
5. **Backup Before Evolve**: `evolveEngine.executePlan()` must create a backup before any write. No exceptions.
6. **No npm install from AI**: The AI cannot add new dependencies. If a feature needs a new package, the human must add it manually.
```

These are the "laws of the codebase." The AI is reminded of them in every evolve prompt.

---

## 6. Implementation Roadmap (Do This In Order)

**Phase 1 — COMPLETE ✅**
- `backend/` directory structure created.
- All functions extracted from `server.js` into modules: `config/`, `middleware/`, `providers/`, `services/`, `routes/`, `utils/`.
- `server.js` is now a 42-line bootstrap. All existing endpoints preserved and tested.
- Largest backend file: `evolveEngine.js` (410 lines). Original monolith was 1,591 lines.

**Phase 2 — COMPLETE ✅**
- `public/modules/` directory created with 16 focused frontend modules.
- Original `app.js` (2,011 lines) split into: `state.js`, `core.js`, `toast.js`, `markdown.js`, `panels.js`, `models.js`, `settings.js`, `conversations.js`, `chat_render.js`, `chat_send.js`, `chat_actions.js`, `evolve_tree.js`, `evolve_messages.js`, `evolve_plan.js`, `evolve_send.js`, `data.js`.
- New `app.js` is a 67-line bootstrap that only loads modules and runs `DOMContentLoaded` initialization.
- `index.html` updated to load all modules in dependency order before the bootstrap.
- Largest frontend module: `models.js` (349 lines). No module exceeds 350 lines.
- All inline `onclick` handlers still work because all functions remain global-scope.

**Phase 3 — COMPLETE ✅**
- `contracts/` directory created with architecture docs: `ARCHITECTURE.md`, `INVARIANTS.md`, `EVOLVE_PROTOCOL.md`, `DATA_FLOW.md`.
- `backend/manifest.json` — machine-readable map of all 18 backend modules with paths, exports, dependencies, line counts.
- `public/modules/frontend-manifest.json` — machine-readable map of all 16 frontend modules with paths, exports, dependencies, DOM targets, line counts.
- Every backend module has a `contract.md` co-located: `backend/config/contract.md`, `backend/middleware/contract.md`, `backend/providers/contract.md`, `backend/utils/contract.md`, `backend/services/contract.md`, `backend/services/contract-*.md`, `backend/routes/contract-*.md`.
- Every frontend module has a `contract.md` in `public/modules/contracts/`: 16 files covering API, DOM targets, invariants, dependencies.
- Total contract documentation: ~15,000 words across 35 files.
- The AI can now understand the entire architecture by reading 2KB of manifest JSON + specific module contracts, without reading any source code.

**Phase 4 — COMPLETE ✅**
- `tests/backend/` created with 4 test suites (config, utils, evolveEngine, fileTree) — 58 tests
- `tests/frontend/` created with 4 test suites (core, state, evolve_plan, models, data) — 28 tests
- `package.json` updated with `"test": "node --test tests/"` script
- `backend/services/evolveEngine.js` updated: `runTests()` function executes `npm test` after applying patches, streams results via SSE (`test_pass`, `test_fail`, `test_error`)
- Evolve execution final message includes test status and warns if tests fail with backup path
- All 86 tests pass across 22 test suites. Zero failures.

**Phase 5 — COMPLETE ✅**
- `backend/services/fileTree.js` updated: new `readFilesByPaths(appDir, paths)` function reads only requested files.
- `backend/routes/files.js` updated: accepts `?files=path1,path2` query parameter for smart file loading. Full tree returned if no `files` param.
- `backend/services/evolveEngine.js` updated: instead of `readFileTree(appDir)` (all files + content), it now:
  - Builds a lightweight manifest from `readFileMap` (paths + line counts only, ~200 bytes)
  - Reads only the files in the plan via `readFilesByPaths` for full content
  - `create` prompts get the manifest + target files (~200-500 lines instead of 2000+)
  - `edit` prompts get only the target file content (~100-400 lines)
  - Estimated context reduction: 60-70% for typical single-file edits
- `public/modules/evolve_send.js` updated: `EVOLVE_SYSTEM_PROMPT` added (was lost in Phase 2 extraction) with smart file loading instructions. The AI is now told to read manifests, then only request files it needs to edit.
- `backend/services/modelDiscovery.js` updated: Ollama discovery timeout increased from 1.5s to 5s (cold Ollama servers need more time).
- `public/modules/models.js` updated: `isModelSelectable` now trusts local Ollama models immediately (no probe required for chat selectability). Probes still run for metadata, but models appear in the dropdown right away.
- **Bugs fixed during this phase**:
  - `EVOLVE_SYSTEM_PROMPT` was lost during Phase 2 extraction (it was a global constant between function declarations, not inside any function). Restored in `evolve_send.js`.
  - `MAX_CONVERSATIONS` was lost during Phase 2 extraction. Restored in `conversations.js`.
  - `MAX_EVOLVE_MSGS` was lost during Phase 2 extraction. Already fixed in `evolve_messages.js` (switched to inline `const MAX = 200`).
  - Ollama models not selectable because `isModelSelectable` required probes for ALL models. Now local models are trusted.
  - Ollama backend timeout too short (1.5s) for cold servers.

### Phase 6: Plugin Architecture (Future — 2+ AI sessions) — NEXT

### Phase 3: Write Contracts & Manifests (1 AI session)
1. Write `backend/manifest.json`, `frontend/manifest.json`, and all `contract.md` files.
2. Write `contracts/ARCHITECTURE.md`, `contracts/INVARIANTS.md`, `contracts/EVOLVE_PROTOCOL.md`.
3. **Test**: The AI can answer questions about the architecture using only the manifest.

### Phase 4: Add Tests (2–3 AI sessions)
1. Add `tests/backend/` with unit tests for `safeResolve`, `applySearchReplacePatch`, config load/save, etc.
2. Add `tests/frontend/` with logic tests for state management, plan parsing, etc.
3. Hook `npm test` into the evolve execution flow.
4. **Test**: `npm test` passes. Intentionally break a test and verify it fails.

### Phase 5: Upgrade Evolve to Smart File Loading (1 AI session)
1. Modify `backend/routes/evolve.js` so that instead of `readDir(appDir)` (full dump), it:
   - Accepts a plan that specifies modules/files to edit
   - Loads the manifest to find those files
   - Fetches only those files + their dependency contracts
2. Update the evolve prompt to tell the AI: "You are editing a modular codebase. Use the manifest to understand the structure. Only request files you need to edit."
3. **Test**: A new feature is implemented by the AI reading <20% of the total codebase lines.

### Phase 6: Plugin Architecture (Future — 2+ AI sessions)
1. Create a `plugins/` directory.
2. Add a plugin loader: `backend/bootstrap.js` and `frontend/app.js` scan `plugins/` and register each plugin.
3. A plugin is a self-contained folder with its own `index.js`, `contract.md`, and `style.css`.
4. New features can be added as plugins without touching core code at all. The AI only sees the plugin folder.

---

## 7. How This Solves Your Exact Problem

| Problem | Solution |
|---|---|
| **AI has to read entire codebase** | Manifest + contracts mean the AI reads ~2KB of architecture map instead of 100KB of source code. |
| **AI breaks unrelated features** | Contracts define invariants and DOM boundaries. Tests verify them after every edit. |
| **Context window limits** | Each module is 150–400 lines. The AI only loads 1–3 modules at a time. |
| **Search/replace patches fail** | Smaller files = more precise context matching. Patches are far more reliable. |
| **Dead code (Phase 3) piles up** | Every module has a contract. If it's unused, the manifest shows it has no dependents. |
| **Hard to onboard new AI models** | The manifest is a single JSON file any model can parse. No need to understand 2000 lines of spaghetti. |

---

## 8. Immediate Win: Start With Contracts Before Code

If you do nothing else, do this **today**:

1. Keep your current monolithic code working.
2. Create a `contracts/` folder with `ARCHITECTURE.md` and `INVARIANTS.md`.
3. Update your Evolve prompt to include: **"Before writing code, analyze the architecture in contracts/ARCHITECTURE.md. Only request the files you need to edit. Respect all invariants in contracts/INVARIANTS.md."**
4. Update the `/api/evolve/execute` endpoint to accept an optional `files` array in the plan: `{"path":"public/app.js","action":"edit",...}` can be replaced with `{"module":"chat","action":"edit",...}` which the server resolves via the manifest.

This alone will cut your AI context usage by 60–70% and make the AI's reasoning much sharper.
