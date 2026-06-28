# BLACKLINE AI Context Index

Use this file to load only the context needed for a task. Avoid dumping the whole repo into a model prompt when a focused context pack is enough.

## Always-load static context

For any code change, load:

1. `AGENTS.md`
2. `README.md`
3. `contracts/ARCHITECTURE.md`
4. `contracts/INVARIANTS.md`
5. `contracts/DATA_FLOW.md` if the task touches request/response or state flow
6. `contracts/EVOLVE_PROTOCOL.md` if the task touches Evolve

## Backend task context

### Express routes / API behavior

Load:

- `backend/routes/index.js`
- relevant `backend/routes/*.js`
- matching `backend/routes/contract-*.md`
- relevant service under `backend/services/*.js`
- relevant tests in `tests/backend/*.test.js`

Rules:

- Route handlers validate inputs and shape responses.
- Business logic belongs in services.
- Do not return full API keys.

### Config and API keys

Load:

- `backend/config/index.js`
- `backend/config/contract.md`
- `backend/utils/index.js`
- `tests/backend/config.test.js`
- `tests/backend/utils.test.js`

Rules:

- Preserve key masking.
- Do not log secrets.
- Do not move secrets into frontend storage.

### Provider/model discovery/probing

Load:

- `backend/services/modelDiscovery.js`
- `backend/services/probe.js`
- `backend/services/chatProxy.js`
- `backend/providers/presets.js`
- `backend/routes/models.js`
- `backend/routes/probes.js`
- `tests/backend/modelDiscovery.test.js`

Rules:

- Keep provider-specific behavior isolated.
- Preserve enabled/disabled model handling.
- Do not make unavailable/unprobed models silently selectable.

### Evolve execution

Load:

- `backend/services/evolveEngine.js`
- `backend/services/contract-evolveEngine.md`
- `backend/routes/evolve.js`
- `backend/routes/contract-evolve.md`
- `backend/services/fileTree.js`
- `backend/utils/index.js`
- `tests/backend/evolveEngine.test.js`
- `contracts/EVOLVE_PROTOCOL.md`

Rules:

- Backup before write.
- Enforce path safety.
- Keep plan limits.
- Do not expand command execution beyond the fixed verification path without human approval.

## Frontend task context

### General frontend boot/panel behavior

Load:

- `frontend/index.html`
- `frontend/app.js`
- `frontend/modules/state.js`
- `frontend/modules/panels.js`
- `frontend/modules/contracts/state.md`
- `frontend/modules/contracts/panels.md`

Rules:

- Scripts are global and order-loaded.
- Do not add inline handlers.
- Update `frontend/modules/frontend-manifest.json` when module responsibilities or exports change.

### Chat UI / messages / streaming

Load:

- `frontend/modules/chat_send.js`
- `frontend/modules/chat_render.js`
- `frontend/modules/chat_actions.js`
- `frontend/modules/markdown.js`
- `frontend/modules/conversations.js`
- matching contracts under `frontend/modules/contracts/`
- `tests/frontend/core.test.js`

Rules:

- Treat model output as untrusted.
- Preserve streaming stop behavior.
- Preserve `conversations` as source of truth.

### Model Hub / roles

Load:

- `frontend/modules/models.js`
- `frontend/modules/settings.js`
- `frontend/modules/model_roles.js`
- `frontend/modules/contracts/models.md`
- `frontend/modules/contracts/settings.md`
- `frontend/modules/contracts/model_roles.md`
- `tests/frontend/models.test.js`
- `tests/frontend/settings.test.js`
- `tests/frontend/model_roles.test.js`

Rules:

- Keep model enabled/disabled state consistent.
- Preserve provider table collapse persistence.
- Preserve Role Matrix assignments and auto-assign rules.

### Evolve frontend

Load:

- `frontend/modules/evolve_send.js`
- `frontend/modules/evolve_messages.js`
- `frontend/modules/evolve_plan.js`
- `frontend/modules/evolve_tree.js`
- matching contracts under `frontend/modules/contracts/`
- `tests/frontend/evolve_messages.test.js`
- `tests/frontend/evolve_plan.test.js`
- `contracts/EVOLVE_PROTOCOL.md`

Rules:

- Plans must require explicit approval.
- Keep plan state persisted.
- Preserve retry/failed-plan behavior.

### Styling / visual design

Load:

- `frontend/styles.css`
- `frontend/index.html`
- source module that emits the markup you are styling

Rules:

- Reuse existing CSS variables.
- Do not add inline styles.
- Keep responsive behavior intact.
- Prefer small component-scoped CSS sections with clear comments.

## Repo hygiene gate

Load these when changing repo structure, docs, scripts, module size limits, or AI-agent rules:

- `scripts/check-repo.js`
- `package.json`
- `AGENTS.md`
- `README.md`
- `contracts/INVARIANTS.md`

Run:

```bash
npm run check
```

The gate blocks stale/orphan frontend paths from returning, detects possible committed secrets, prevents new inline handlers/styles beyond the current documented baseline, and prevents known oversized files from growing.

## Test map

| Area | Tests |
|---|---|
| Backend config | `tests/backend/config.test.js` |
| Backend utils/path safety | `tests/backend/utils.test.js` |
| Evolve engine | `tests/backend/evolveEngine.test.js` |
| File tree | `tests/backend/fileTree.test.js` |
| Model discovery | `tests/backend/modelDiscovery.test.js` |
| Arena sync | `tests/backend/arenaSync.test.js` |
| Frontend core/state/data | `tests/frontend/core.test.js`, `tests/frontend/data.test.js` |
| Frontend models/settings/roles | `tests/frontend/models.test.js`, `tests/frontend/settings.test.js`, `tests/frontend/model_roles.test.js` |
| Frontend Evolve | `tests/frontend/evolve_messages.test.js`, `tests/frontend/evolve_plan.test.js` |

## Dynamic context strategy

For an AI coding task, construct a context pack like this:

1. Always-load static context from the top of this file.
2. Add only the task-specific section above.
3. Add the exact files to edit.
4. Add the nearest tests.
5. Add relevant contracts.
6. Add previous failure logs only if repairing a failed run.

This keeps prompts smaller, reduces context rot, and improves success rates across models.
