# BLACKLINE AI — Codebase Audit and Harness Plan

Date: 2026-06-27  
Repo audited: `https://github.com/cargyrop/Blackline_AI.git`  
Baseline commands run:

- `npm test` → **104 tests passing**
- Server smoke test after `npm ci --omit=dev`: `GET /api/health` and `GET /api/manifest` worked
- Reviewed the Google PDF: **The New SDLC With Vibe Coding — From ad-hoc prompting to Agentic Engineering**

## Executive summary

BLACKLINE AI is already much better structured than the README suggests. The repo has a modular backend, modular frontend, contract files, architecture docs, invariants, and a real Node test suite. That is a strong foundation for AI-assisted development.

The honest assessment: the app is in the transition zone between structured vibe coding and early agentic engineering. It has many of the right ideas, but the harness is not yet a harness. The current Evolve flow is still mostly a single-model code-writing pipeline with backups and tests. To make future AI updates succeed reliably across different models, the next work should focus less on features and more on deterministic structure: context packaging, schemas, gates, diff review, role orchestration, UI state clarity, and safety hooks.

## What is good

1. **Modular backend exists.** Routes, services, middleware, config, providers, and utils are separated.
2. **Modular frontend exists.** The loaded app uses `frontend/modules/*.js` plus `frontend/app.js` as bootstrap.
3. **Contracts and invariants exist.** This is exactly the kind of context AI agents need.
4. **Tests exist and currently pass.** 104 tests passed on the cloned repo.
5. **Local-first architecture is coherent.** API keys stay local, config is on disk, conversations are browser localStorage.
6. **Evolve has important safety basics.** It creates backups before writes, validates paths, caps plan items, and streams execution.
7. **Model role work has started.** The UI/code already has Planner, Executor, Reviewer, Repair, and Micro Editor concepts.
8. **No build step keeps onboarding simple.** This is good for a local personal tool and for AI agents that need fast edit/test loops.

## Main problems, unsugarcoated

### 1. The repo has contract drift

The README still describes an older single-file `server.js` / `public/app.js` layout, while the actual repo uses `backend/` and `frontend/modules/`.

Why this matters: AI agents trust README files heavily. Stale docs will make weaker models edit the wrong files or create duplicate systems.

Priority: **high**.

### 2. There are orphan/legacy frontend files

`frontend/js/*`, `frontend/script.js`, `frontend/css/style.css`, and possibly older frontend assets appear to be unused by `frontend/index.html`.

Why this matters: unused files are context poison. Agents may inspect or edit stale code and think they fixed the app.

Priority: **high**.

### 3. The invariants say “No Shell Execution,” but `evolveEngine.js` runs `npm test` through `child_process.exec`

Current files:

- `backend/services/evolveEngine.js` imports `exec` and runs `npm test`
- `server.js` imports `exec` to open the browser

The browser-open exception is documented. The `npm test` execution is not. The app’s own invariant says backend must never use child processes other than opening the browser.

Why this matters: this is either a policy violation or a policy that needs a narrow, explicit harness exception. Agentic systems do need controlled command execution, but it must be governed by a command allowlist, timeout, cwd restriction, log capture, and UI approval policy.

Priority: **critical**.

### 4. Markdown rendering is likely XSS-prone

Assistant messages are rendered with `marked.parse()` and then inserted as `innerHTML`. There is no sanitizer layer visible in `frontend/modules/markdown.js`.

Why this matters: the AI provider output is not trusted input. A malicious or accidental HTML payload could execute because CSP currently allows `'unsafe-inline'` scripts for legacy inline handlers.

Priority: **critical**.

### 5. Inline event handlers and inline styles are still widespread

Static scan found approximately:

- **70 inline handler attributes** across `index.html` and generated frontend HTML
- **35 inline style attributes** across `index.html` and modules

This directly conflicts with the future-CSP invariant.

Why this matters: inline handlers force `script-src 'unsafe-inline'`, which weakens the security model and makes model-rendered HTML more dangerous.

Priority: **high**.

### 6. Some modules are above the stated AI-editable size limits

Examples:

- `backend/services/evolveEngine.js` ~490 lines
- `frontend/modules/models.js` ~485 lines
- `frontend/styles.css` ~1186 lines

Why this matters: the repo’s own invariant says smaller files are better for AI edits. Large files increase missed-context and accidental-regression risk.

Priority: **medium-high**.

### 7. The frontend is modular by files, but not by module system

The architecture uses global functions and script load order rather than ES modules.

This is not automatically wrong. For a no-build local app it is simple and usable. But it means:

- dependencies are implicit
- circular dependencies are easy to introduce
- tests have to simulate globals
- agents can call or rename functions without import errors catching it

Priority: **medium**.

### 8. The Evolve pipeline is too optimistic

Current flow: model creates a plan, user approves, model writes/patches files, tests run at the end.

Missing harness-grade controls:

- typed plan schema validation
- dry-run diff preview before writes
- per-file preflight checks
- post-file lint/static checks
- reviewer model pass
- repair loop with bounded attempts
- trajectory log/eval
- deterministic policy hooks
- command allowlist
- one-click restore/rollback UX

Priority: **high**.

### 9. The Role Matrix is not yet a full multi-agent system

The UI has roles, but the execution path still behaves mostly as planner/executor, not as a team of agents with visible handoffs and independent checks.

Priority: **high** for your harness vision.

## What I learned from the Google PDF and how it applies here

The paper’s core message is: **a model is not the system. The harness around the model is the system.**

The most relevant concepts for BLACKLINE AI:

1. **Agent = model + harness.** Your current app has models and some tools, but the harness needs first-class structure: state, tools, policies, sandboxes, hooks, orchestration, and observability.
2. **Context engineering beats prompt cleverness.** BLACKLINE needs better static context and dynamic context retrieval.
3. **Six context types matter:** instructions, knowledge, memory, examples, tools, and guardrails.
4. **Static vs dynamic context should be explicit.** Do not dump the whole app into every prompt. Load global rules always, then retrieve relevant contracts/files/skills per task.
5. **Skills are the scalable pattern.** Add task-specific skill packs like “frontend UI edit,” “backend route edit,” “security review,” “test creation,” and “migration.”
6. **Tests and evals are different.** Tests verify code output. Evals verify agent behavior, tool choice, reasoning trajectory, and quality of final output.
7. **The developer becomes conductor/orchestrator.** The UI should let the user guide runs live, or delegate tasks asynchronously to model teams.

## Recommended optimization roadmap

### Phase 0 — Clean the AI context surface

Goal: remove misleading context before adding more automation.

Actions:

1. Update README to match actual structure.
2. Delete or archive unused legacy frontend files.
3. Add `AGENTS.md` at repo root with:
   - architecture summary
   - allowed edit patterns
   - test command
   - safety rules
   - file size limits
   - “do not edit legacy/orphan files” note
4. Add a `CONTEXT_INDEX.md` or generated context map that points agents to the right docs.
5. Add a repo check that fails on stale README paths like `public/` if the app uses `frontend/`.

### Phase 1 — Enforce AI-editability gates

Goal: make future AI changes safer before features are added.

Actions:

1. Add `npm run check` as the default preflight.
2. Add a no-dependency Node script under `scripts/check-repo.js` that checks:
   - module line limits
   - no inline event handlers
   - no inline styles
   - no forbidden directories in planned writes
   - no accidental API key patterns
   - no orphan frontend edits
3. Split `frontend/modules/models.js` into smaller modules:
   - `models_catalog.js`
   - `models_render.js`
   - `models_probe.js`
   - `models_select.js`
4. Split `backend/services/evolveEngine.js` into:
   - `evolve/executePlan.js`
   - `evolve/modelStream.js`
   - `evolve/patch.js`
   - `evolve/backup.js`
   - `evolve/testRunner.js`
5. Split `frontend/styles.css` into sectional files or at least add a strict table of contents and region headers.

### Phase 2 — Fix security before broad agent execution

Goal: do not let model output become executable UI.

Actions:

1. Remove inline handlers from `index.html` and generated HTML.
2. Replace generated `onclick="..."` with event delegation and `data-action` attributes.
3. Add a minimal HTML sanitizer or strict markdown renderer policy.
4. Remove `'unsafe-inline'` from `script-src` once handlers are gone.
5. Add XSS regression tests for assistant messages, model labels, plan cards, and file previews.
6. Decide formally whether harness command execution is allowed. If yes, replace the broad “No Shell Execution” invariant with a command allowlist policy.

### Phase 3 — Convert Evolve into a proper local harness run

Goal: every update becomes an observable state machine, not a single opaque model response.

Recommended run stages:

1. **Intake** — user describes task.
2. **Clarify** — planner asks questions if requirement is ambiguous.
3. **Context pack** — harness selects files, contracts, tests, and skills.
4. **Plan** — planner emits typed JSON.
5. **Review plan** — reviewer checks risk, missing files, and test impact.
6. **Approve** — user approves exact plan.
7. **Dry run** — executor generates patches but does not write.
8. **Diff preview** — user sees exact changes.
9. **Apply** — harness writes files after backup.
10. **Gates** — tests/checks run.
11. **Repair loop** — repair agent gets failures and bounded retry budget.
12. **Final review** — reviewer summarizes what changed and remaining risks.
13. **Record memory** — run log, decisions, and lessons are saved.

### Phase 4 — Build the project-agnostic harness system

Goal: Evolve App becomes just one workspace/project. Users can point the harness at any project.

Core backend concepts:

- `Project`: local folder, repo metadata, rules, allowed tools, ignored paths
- `Agent`: role, model, temperature, tool permissions, context policy
- `Skill`: metadata, trigger rules, instructions, examples, deep references
- `Task`: user goal, status, assigned agents, project, constraints
- `Run`: execution instance with timeline, steps, logs, costs, artifacts
- `Tool`: read file, search, patch, run allowed command, HTTP fetch, etc.
- `Gate`: deterministic check such as tests, security scan, lint, size limit
- `Memory`: project memory, run summaries, accepted architecture decisions
- `Eval`: task outcome rubric and trajectory scoring

Suggested storage at first: local JSON files under `data/harness/`, then migrate to SQLite later if needed.

## Suggested UI vision

### Navigation

Replace or augment the current sidebar with:

- Chat
- Model Hub
- Role Matrix
- Harness
- Projects
- Runs
- Skills
- Settings

“Evolve App” should become a preconfigured Project named `BLACKLINE AI` inside Harness.

### Harness dashboard

Top cards:

- Active runs
- Waiting for approval
- Failed gates
- Token/cost today
- Best-performing model roles

Main table:

| Run | Project | Goal | Stage | Agents | Gates | Cost | Action |
|---|---|---|---|---|---|---|---|
| #128 | BLACKLINE AI | Remove inline handlers | Plan Review | Planner + Reviewer | 3/5 | $0.12 | Review |

### New task screen

Fields:

- Project selector
- Goal textarea
- Mode:
  - Ask / investigate only
  - Plan only
  - Dry-run patch
  - Apply with approval
  - Autonomous within budget
- Risk level:
  - Prototype
  - Normal
  - Sensitive/security-critical
- Agent team preset:
  - Fast solo
  - Balanced team
  - Strict review team
  - Cheap local-first
- Budget limits:
  - max tokens
  - max cost
  - max tool calls
  - max files changed

### Run detail screen

A split layout would work well:

Left rail: timeline/stages

- Intake
- Context
- Plan
- Review
- Patch
- Test
- Repair
- Final

Center: current agent conversation and artifacts

Right rail:

- Selected context files
- Active skill cards
- Tool calls
- Gates/checks
- Cost/latency
- Approval buttons

### Plan/diff approval UI

Before writing files, show:

- file list with risk badges
- exact diff
- tests expected to run
- policy warnings
- approve/reject/request revision buttons

### Agent team UI

Represent each model as a visible role card:

- Planner: creates task breakdown
- Architect: checks structure and boundaries
- Executor: writes patch
- Reviewer: reviews patch and risks
- Tester: chooses/runs gates
- Repair: fixes failures
- Scribe: writes summary/memory

Each card should show:

- assigned model
- status
- last action
- tokens/cost
- confidence or gate result

## Concrete implementation order I recommend

If I were optimizing this repo for future AI work, I would do this order:

1. **Fix docs/context drift** — README, AGENTS.md, remove/archive orphan files.
2. **Add repo checks** — enforce line limits, inline handler ban, stale docs ban.
3. **Fix markdown/XSS and CSP path** — this is the biggest safety issue.
4. **Split oversized modules** — especially `evolveEngine.js` and `models.js`.
5. **Refactor Evolve execution into explicit stages** — context, plan, dry-run, diff, apply, gates, repair.
6. **Add run persistence** — every harness run needs a durable timeline.
7. **Add project abstraction** — make BLACKLINE AI just one project.
8. **Add skill packs** — small, triggerable instruction bundles.
9. **Add evaluator/reviewer passes** — model and deterministic gates.
10. **Build the Harness UI** — dashboard, new task, run detail, skills, projects.

## Bottom line

BLACKLINE AI has a strong foundation for a local-first multi-provider AI development tool. But future-proofing it is not mainly about adding more model calls. It is about making the surrounding harness deterministic, observable, and hard to misuse.

The first real optimization should be cleaning and enforcing the context surface so any model can understand the repo correctly. The second should be security and policy gates. Only after that should the app expand into a multi-agent project harness.
