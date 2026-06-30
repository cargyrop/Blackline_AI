# AGENTS.md — BLACKLINE AI coding-agent instructions

This file is the primary rule sheet for AI agents editing BLACKLINE AI.

## Mission

BLACKLINE AI is a local-first multi-provider AI chat app with an Evolve workflow that can plan and apply approved codebase updates. Optimize for maintainability, safety, and high success rate for future AI-driven changes.

## Load this context first

Before editing, read:

1. `README.md`
2. `CONTEXT_INDEX.md`
3. `contracts/ARCHITECTURE.md`
4. `contracts/INVARIANTS.md`
5. The contract file for each module you will touch.
6. The actual source files you will touch.

Do not rely on old assumptions about a `public/` folder or single-file frontend. The live frontend is under `frontend/`.

## Current live app structure

- Backend bootstrap: `server.js`
- Backend modules: `backend/routes/`, `backend/services/`, `backend/middleware/`, `backend/config/`, `backend/providers/`, `backend/utils/`
- Frontend shell: `frontend/index.html`
- Frontend CSS: `frontend/styles.css`
- Frontend bootstrap: `frontend/app.js`
- Frontend feature modules: `frontend/modules/*.js`
- Tests: `tests/backend/*.test.js`, `tests/frontend/*.test.js`
- Runtime local config: `data/config.json`

## Removed/stale paths

Do not recreate or edit these old frontend paths:

- `frontend/js/`
- `frontend/css/`
- `frontend/script.js`
- `public/`

If you need new frontend behavior, update the live module system in `frontend/modules/` and load order in `frontend/index.html` only when necessary.

## Change discipline

- Make the smallest coherent change that satisfies the request.
- Prefer targeted search/replace edits over full rewrites.
- Preserve current local-first/no-build architecture unless the human explicitly approves a migration.
- Do not add npm dependencies automatically. If a dependency is required, explain it and ask the human to install it.
- Keep files AI-editable:
  - backend modules target < 400 lines, hard limit 500
  - frontend modules target < 350 lines, hard limit 450
  - split files that exceed limits instead of growing them
- Update docs/contracts when behavior or architecture changes.
- Add or update tests for behavior changes when practical.

## Required validation

Run this before handing off when possible:

```bash
npm run check
npm test
```

`npm run check` is the repo hygiene / AI-editability gate. It currently allows documented legacy debt but fails if that debt grows or stale paths return.

If you cannot run checks/tests, say so explicitly and explain why.

## Security rules

Never weaken these without explicit human approval:

- `safeResolve()` must block path traversal, absolute paths, null bytes, drive letters, and blocked dirs.
- API keys must never be logged or returned to the frontend unmasked.
- CORS must stay localhost-only.
- Evolve must create a backup before writing files.
- Evolve plan size limits must stay in place.
- Model output must be treated as untrusted.
- Do not add new inline event handlers or inline styles.
- Do not add arbitrary shell execution.

Current narrow command exceptions:

1. `server.js` may use the OS opener command to open the local browser at startup.
2. The Evolve verification path currently runs the fixed command `npm test` from the app root with a timeout. Do not expand this into user-controlled command execution.

## Frontend conventions

- Global-scope scripts are loaded in a fixed order. This app does not currently use ES modules or a bundler.
- State lives in `frontend/modules/state.js` and browser `localStorage`.
- Use `escHtml()` for user/model-provided strings inserted into HTML.
- Prefer event delegation with `data-*` attributes for new UI. Do not add new `onclick`, `oninput`, `onkeydown`, etc.
- If using `innerHTML`, ensure every dynamic value is escaped unless it is deliberately sanitized markdown.
- Keep UI consistent with existing CSS variables and visual language.

## Backend conventions

- Routes validate HTTP input and delegate to services.
- Services contain business logic and provider calls.
- Utils should be pure where possible.
- Config helpers own `data/config.json` shape and key masking.
- Provider-specific API differences belong in provider/model service code, not frontend UI code.

## Evolve plan guidance

Good plans are small and explicit. Prefer 1–8 file actions. Do not propose broad rewrites unless absolutely necessary.

Plan action shape:

```json
[
  {
    "path": "frontend/modules/example.js",
    "action": "edit",
    "description": "Short, concrete description of the change."
  }
]
```

Allowed actions: `create`, `edit`, `delete`.

## If unsure

Ask a clarifying question rather than guessing. In particular, ask before:

- changing architecture
- adding dependencies
- changing storage format
- touching security-sensitive code
- deleting files that might contain user data
- changing provider API behavior
