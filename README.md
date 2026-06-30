# ARKEL

The intelligence gateway beyond the human layer.

Local-first multi-provider AI workspace for model interaction, engineering, and future agentic workflows.

BLACKLINE AI lets you chat with cloud and local models, manage model endpoints, assign models to development roles, and use the **Evolve App** workflow to inspect, plan, approve, and apply changes to this codebase with backups and tests.

The app runs on your machine. API keys are stored locally in `data/config.json` and are only sent to the provider API they belong to.

---

## Quick start

### Windows

Double-click `START.bat`.

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

Or run directly:

```bash
npm install
npm start
```

The app opens at:

```text
http://localhost:3737
```

Set a custom port with:

```bash
PORT=8080 npm start
```

---

## Development commands

```bash
npm start      # run server.js
npm run dev    # run with node --watch
npm run check  # run repo hygiene / AI-editability gate
npm test       # run Node test suite
```

Baseline at this cleanup point: `npm run check` passes with known-debt warnings, and `npm test` passes 104 tests.

---

## Current architecture

BLACKLINE AI is intentionally simple: Node.js + Express, vanilla HTML/CSS/JS, no frontend build step.

```text
Blackline_AI/
├── server.js                    # Express app bootstrap, security middleware, static frontend, route mount
├── backend/
│   ├── config/                  # data/config.json load/save and provider config helpers
│   ├── middleware/              # security headers, CSP, rate limiting
│   ├── providers/               # provider presets and metadata
│   ├── routes/                  # HTTP/SSE route handlers
│   ├── services/                # provider proxying, model discovery, evolve execution, file tree logic
│   └── utils/                   # pure helpers: path safety, URL joins, model scoring, escaping, etc.
├── frontend/
│   ├── index.html               # HTML shell and panel markup
│   ├── styles.css               # app CSS/theme
│   ├── app.js                   # thin DOMContentLoaded bootstrap
│   ├── modules/                 # loaded frontend modules, in script-tag order
│   ├── vendor/                  # local vendored browser libraries
│   └── manifest.json            # PWA manifest
├── contracts/                   # high-level architecture, data-flow, evolve protocol, invariants
├── tests/                       # Node test suite for backend and frontend modules
├── data/                        # local runtime config; API keys live here; do not commit real keys
├── AGENTS.md                    # primary instructions for AI coding agents
└── CONTEXT_INDEX.md             # map of docs/modules an AI should load for each task type
```

### Frontend module load order

`frontend/index.html` loads these modules in order:

1. `frontend/modules/core.js`
2. `frontend/modules/state.js`
3. `frontend/modules/toast.js`
4. `frontend/modules/markdown.js`
5. `frontend/modules/chat_render.js`
6. `frontend/modules/conversations.js`
7. `frontend/modules/models.js`
8. `frontend/modules/panels.js`
9. `frontend/modules/settings.js`
10. `frontend/modules/model_roles.js`
11. `frontend/modules/chat_send.js`
12. `frontend/modules/chat_actions.js`
13. `frontend/modules/evolve_tree.js`
14. `frontend/modules/evolve_messages.js`
15. `frontend/modules/evolve_plan.js`
16. `frontend/modules/evolve_send.js`
17. `frontend/modules/data.js`
18. `frontend/app.js`

These are global-scope scripts, not ES modules. Dependencies are order-based. Do not add new loaded frontend files without updating `frontend/index.html`, `frontend/modules/frontend-manifest.json`, and relevant contracts.

---

## Supported AI providers

Built-in provider support includes:

| Provider | Notes |
|---|---|
| Anthropic | Claude models through Anthropic API |
| OpenAI | OpenAI chat models |
| Google Gemini | Gemini API |
| Groq | OpenAI-compatible Groq endpoint |
| OpenRouter | Multi-model OpenAI-compatible gateway |
| DeepSeek | DeepSeek chat models |
| Ollama | Local models at `localhost:11434` |
| Added/custom endpoints | OpenAI-compatible and selected provider-specific remote endpoints |

### Local models with Ollama

1. Install Ollama: <https://ollama.com>
2. Pull a model, for example:

```bash
ollama pull llama3.2
```

3. Open BLACKLINE AI and refresh the model catalog.

---

## Model Center, probing, and roles

The Model Center discovers models from active endpoints and stores probe results. Probes check basic chat behavior, JSON ability, plan output, and patch output.

The Role Matrix lets you assign enabled models to Evolve roles such as:

- Planner
- Executor
- Reviewer
- Repair
- Micro Editor

The current Evolve flow primarily depends on Planner and Executor. Reviewer/Repair-oriented harness work is planned next.

Planned product evolution:
- top-level sections become **Engage**, **Model Hub**, and **Settings**
- Engage becomes the main workspace
- floating panels inside Engage will include **Nexus**, **Crew**, and **Engineering**
- future capabilities include Fusion multi-model responses, deeper workspace/project handling, skill execution, and research workflows

---

## Evolve App workflow

1. Open **Evolve App**.
2. Assign models in **Role Matrix**.
3. Ask for one clear codebase change.
4. The planner discusses the request and can emit a fenced `plan` block containing JSON file actions.
5. The UI renders an approval card.
6. After explicit approval, the backend creates a backup, executes file actions, and streams progress.
7. The backend runs the test suite after applying changes.
8. Reload the browser. Restart Node if backend files changed.

Important constraints:

- Plans are capped at 25 file actions.
- Evolve creates a sibling backup folder before writing.
- Paths are checked by `safeResolve()`.
- Writes to blocked directories such as `.git`, `node_modules`, `data`, `dist`, `build`, and `coverage` are rejected.
- New npm dependencies must not be added automatically by an AI agent. A human must install them first.

---

## AI-agent context files

If you are using an AI coding agent, read these first:

1. `AGENTS.md`
2. `CONTEXT_INDEX.md`
3. `contracts/ARCHITECTURE.md`
4. `contracts/INVARIANTS.md`
5. The contract for the specific module you are editing, for example `frontend/modules/contracts/models.md` or `backend/services/contract-evolveEngine.md`.

Do not edit stale or unused frontend files. Phase 0 cleanup removed the old unused `frontend/js/`, `frontend/css/`, and `frontend/script.js` paths. The live frontend is `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`, and `frontend/modules/*.js`.

---

## Security and privacy notes

- API keys are stored in `data/config.json`.
- `/api/keys` must never return full API keys.
- CORS is restricted to localhost origins.
- CSP is currently compatible with legacy inline handlers. The target state is to remove inline handlers and then remove `'unsafe-inline'` from `script-src`.
- Assistant markdown is rendered in the browser. Treat model output as untrusted and prefer escaped/sanitized rendering when modifying this area.
- Evolve writes must go through path validation and backup creation.

---

## Current limitations / known cleanup targets

These are intentionally documented so future AI agents do not rediscover them as surprises:

1. Some frontend markup still uses inline event handlers. Do not add new ones.
2. Some frontend modules render generated HTML with `innerHTML`. Be careful with escaping and model-provided content.
3. `frontend/modules/models.js`, `backend/services/evolveEngine.js`, and `frontend/styles.css` are larger than ideal for AI editing and should be split in later phases.
4. Evolve is not yet a full multi-agent harness. It needs typed stage state, dry-run diffs, reviewer/repair loops, tool-policy hooks, and persistent run logs.
5. Actual image upload / vision chat is not wired up even if model capability badges mention vision.

---

## License

MIT.
