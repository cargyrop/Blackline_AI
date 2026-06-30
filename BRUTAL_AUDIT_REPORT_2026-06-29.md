# ARKEL — Brutal Structured Audit Report

Date: 2026-06-29  
Repo: `https://github.com/cargyrop/Blackline_AI.git`  
Auditor stance: direct, unsentimental, implementation-focused

---

## Executive summary

ARKEL has crossed the line from chaotic prototype into a real local-first AI application with meaningful structure. That is the good news.

The bad news is that it is still in an awkward middle state:

- too structured to call it mere vibe coding
- not structured enough to call it a true harness-driven agentic engineering system
- too UI-ambitious to tolerate legacy frontend debt for much longer
- too security-sensitive to keep rendering and event wiring as casually as it currently does

In plain terms:

**The repo foundation is good. The execution substrate is not mature enough yet for the product vision you are aiming at.**

The app is strongest in:
- repository structure
- local-first model/provider support
- tests and contracts
- AI-agent guidance docs
- self-modification safety basics

The app is weakest in:
- frontend safety model
- legacy inline event/style debt
- oversized high-risk modules
- shallow harness/run orchestration
- product-level state model for future multi-project, multi-skill, multi-agent workflows

---

## What was audited

The following were reviewed directly:

- repository structure
- `README.md`
- `AGENTS.md`
- `CONTEXT_INDEX.md`
- `contracts/ARCHITECTURE.md`
- `contracts/INVARIANTS.md`
- `contracts/EVOLVE_PROTOCOL.md`
- `backend/services/evolveEngine.js`
- `frontend/index.html`
- `frontend/modules/markdown.js`
- frontend file structure
- inline-handler/style grep results
- repo line counts
- current tests and repo check output
- prior audit and harness plan
- Google PDF: **The New SDLC With Vibe Coding — From ad-hoc prompting to Agentic Engineering**

Commands run:

- `npm test`
- `npm run check`
- targeted grep and file tree inspection

Observed current baseline:

- `npm test` → **110 tests passing**
- `npm run check` → **passes with 19 warnings**

---

## Hard verdict

### Overall product maturity

**Rating: 6.5/10**

This is a serious project with real potential, but not yet a dependable AI engineering console.

### Harness maturity

**Rating: 4.5/10**

There are harness-shaped pieces, but not a real first-class harness runtime yet.

### Frontend safety maturity

**Rating: 3.5/10**

The current rendering and event model is still too legacy-heavy for the product’s risk profile.

### AI-editability maturity

**Rating: 6/10**

Much better than before, but key oversized files and UI wiring patterns still work against future AI changes.

### Documentation/context maturity

**Rating: 8/10**

Strong improvement. This is one of the repo’s best areas right now.

---

## What is genuinely good

### 1. The repo now has usable AI context scaffolding

This is real progress, not cosmetic.

Good files include:
- `AGENTS.md`
- `CONTEXT_INDEX.md`
- architecture/invariant/protocol contracts
- route/service/module contracts

This directly improves success rates for weaker coding agents.

### 2. The project has actual tests and they pass

Current result:
- **110 passing tests**

That matters. It is one of the few things standing between self-modification and silent regression.

### 3. The local-first architecture is coherent

The general model is consistent:
- local config
- local keys
- browser local storage for conversation state
- backend mediates provider access
- no frontend build step

This is defensible for the product’s current stage.

### 4. The Evolve flow has real safety basics

Not enough, but real:
- backup before writes
- path safety via `safeResolve()`
- plan item cap
- stream feedback
- fixed test command with timeout
- some patch repair logic

### 5. Context drift was substantially cleaned up

The prior major context problem has mostly been fixed:
- README now matches live structure
- stale frontend legacy folders are gone
- repo gate exists

This is a meaningful Phase 0 success.

---

## Brutal findings by severity

# Critical

## C1. Frontend markdown/render path is still too trusting

### Evidence
`frontend/modules/markdown.js` uses `marked.parse()` and returns HTML for insertion into the DOM. No sanitizer layer is visible in the reviewed path.

### Why this is bad
Your app renders model output. Model output is untrusted. If the rendering path is not strongly constrained, you are inviting XSS-class problems.

This is especially dangerous because:
- the app is model-centric
- the app wants future web/deep research capabilities
- the app still tolerates inline execution patterns elsewhere

### Impact
- XSS risk
- weaker trust in generated UI content
- future harness UI becomes more dangerous if this remains unresolved

### Priority
**P0 — urgent**

### Required action
- define a strict markdown rendering policy
- sanitize HTML or disable unsafe HTML rendering entirely
- add regression tests for assistant output rendering
- treat all model output as hostile by default

---

## C2. Inline handler debt remains widespread in live UI

### Evidence
`npm run check` warns about legacy inline handlers in multiple live files, including:
- `frontend/index.html`
- `frontend/modules/chat_render.js`
- `frontend/modules/conversations.js`
- `frontend/modules/evolve_plan.js`
- `frontend/modules/markdown.js`
- `frontend/modules/model_roles.js`
- `frontend/modules/models.js`
- `frontend/modules/settings.js`

### Why this is bad
Inline handlers force a weaker browser security posture and scatter behavior across markup strings.

This is bad for:
- CSP hardening
- safe AI edits
- maintainability
- long-term UI evolution

### Impact
- blocks strong CSP
- raises risk of bad HTML becoming executable behavior
- increases UI brittleness

### Priority
**P0 — urgent**

### Required action
- migrate handlers to `addEventListener` / event delegation
- replace string-bound action handlers with `data-action` patterns
- remove `'unsafe-inline'` dependency from script execution path once migration is complete

---

# High

## H1. Phase 1 is not complete despite passing check script

### Evidence
Current oversized files remain:
- `backend/services/evolveEngine.js` → 489 lines
- `frontend/modules/models.js` → 485 lines
- `frontend/styles.css` → 1185 lines

### Why this is bad
The repo passes `npm run check`, but the pass is tolerant. It is a non-regression gate, not proof of completion.

There is a real risk of psychological false confidence here:
- “the check passes” sounds like “the phase is done”
- but the core refactors still have not happened

### Impact
- AI-editability is still compromised in the most important files
- future harness work will pile into already oversized modules

### Priority
**P1 — high**

### Required action
- explicitly mark Phase 1 as incomplete
- finish the structural split work before major new UX expansion

---

## H2. Evolve is still a guarded patch pipeline, not a first-class harness runtime

### Evidence
Current Evolve behavior still centers on:
- planner/executor flow
- model-generated patch or rewrite
- backup
- apply
- test after write

Missing first-class harness elements include:
- persisted run entity
- explicit stage state machine
- visible agent handoffs
- dry-run diff preview before write
- run artifact structure
- eval/trajectory memory
- durable review loop UX

### Why this is bad
Your product vision now clearly goes beyond self-edit chat. You are moving toward a multi-project, multi-agent AI engineering environment.

The current runtime model is too shallow for that future.

### Impact
- difficult to scale into Engineering panel cleanly
- hard to support Fusion/team workflows later
- poor observability and user trust for larger changes

### Priority
**P1 — high**

### Required action
- refactor Evolve into a run/stage system
- add durable run storage and stage artifacts
- separate plan, diff, apply, gate, repair, and final review stages

---

## H3. The current frontend interaction model is still too string-driven

### Evidence
Live UI still depends heavily on:
- HTML string generation
- inline handlers
- global functions
- load-order coupling

### Why this is bad
This is manageable in a small app. It becomes fragile when the app evolves into:
- floating panels
- file trees
- team controls
- run dashboards
- project workspaces
- skill-generated artifacts

### Impact
- expanding Engage/Nexus/Crew/Engineering will be harder than necessary
- AI changes remain more brittle than they should be

### Priority
**P1 — high**

### Required action
- keep no-build architecture if desired
- but move interaction wiring toward explicit delegated event handling and clearer component ownership

---

# Medium

## M1. Documentation is now much better, but protocol docs still overstate future maturity in places

### Evidence
The repo docs are better, but some conceptual language can still make the system seem more mature than the runtime actually is.

### Why this matters
Documentation should clarify what exists today versus what is planned.

### Priority
**P2 — medium**

### Required action
- distinguish “current behavior” from “target behavior” more aggressively in protocol docs and product docs

---

## M2. Stylesheet scale is becoming a design-system problem

### Evidence
`frontend/styles.css` is 1185 lines.

### Why this matters
The UI is expanding in complexity and naming is evolving. A giant stylesheet will slow down iteration and raise accidental-regression risk.

### Priority
**P2 — medium**

### Required action
- split into logical sections or files
- if not split yet, add strict region map and naming conventions immediately

---

## M3. Conversation and project concepts are not yet unified in the product model

### Evidence
The current app still thinks mainly in chat conversations and evolve messages. Your updated UX vision reframes the main surface as **Engage**, where a chat may itself map to a project/workspace with files and artifacts.

### Why this matters
This is a major conceptual upgrade, not just a rename.

### Priority
**P2 — medium**

### Required action
- define the data model before implementing UI changes
- decide what is a conversation, what is a project, what is a workspace thread, what gets a folder, and what persists where

---

# Low

## L1. Global script architecture is acceptable for now, but likely not forever

### Why this is low for now
For a local no-build app, globals and script order are tolerable.

### Why it is not zero-risk
As the app grows, it becomes easier to create hidden coupling and harder to reason about state.

### Priority
**P3 — low**

### Required action
- do not migrate to build tooling unless you want that cost
- but do reduce global UI wiring chaos over time

---

## Status of previous audit roadmap

## Phase 0 — Clean the AI context surface

### Verdict
**DONE**

### Evidence
- README updated and aligned
- `AGENTS.md` present and useful
- `CONTEXT_INDEX.md` present and useful
- stale frontend paths removed
- repo check exists and is active

### Notes
This phase should be counted complete.

---

## Phase 1 — Enforce AI-editability gates

### Verdict
**PARTIALLY DONE, NOT COMPLETE**

### What is done
- `npm run check` exists
- `scripts/check-repo.js` exists
- non-regression gating is active
- stale paths and return of known debt are monitored

### What is not done
- `frontend/modules/models.js` still oversized
- `backend/services/evolveEngine.js` still oversized
- `frontend/styles.css` still oversized
- inline handler/style debt still exists in live code
- the gate tolerates legacy debt instead of representing full compliance

### Practical completion estimate
**~50% complete**

---

## Updated roadmap

This roadmap reflects the current repo reality and the revised product vision.

# Phase 1A — Finish AI-editability hardening

## Goal
Complete the incomplete parts of existing Phase 1 before broadening the UI vision.

## Actions
1. Split `backend/services/evolveEngine.js` into smaller units:
   - `evolve/executePlan.js`
   - `evolve/modelStream.js`
   - `evolve/patch.js`
   - `evolve/backup.js`
   - `evolve/testRunner.js`
   - optional `evolve/contextPack.js`
2. Split `frontend/modules/models.js` into smaller units:
   - `models_catalog.js`
   - `models_render.js`
   - `models_probe.js`
   - `models_select.js`
3. Break up or strongly section `frontend/styles.css`
4. Tighten `scripts/check-repo.js` to reflect completion goals, not only debt freeze
5. Add explicit status docs marking which debt is transitional and by when it must be removed

## Exit criteria
- no known oversized critical modules remain
- repo check remains green without oversized-file warnings for core modules

---

# Phase 1B — Frontend safety baseline

## Goal
Make the frontend safe enough to support richer Engage/Nexus/Engineering workflows.

## Actions
1. Remove inline event handlers from `frontend/index.html`
2. Remove inline handlers from generated frontend HTML
3. Replace action strings with delegated listeners and `data-action` attributes
4. Reduce inline styles in generated markup
5. Add sanitized or locked-down markdown rendering policy
6. Add XSS regression tests for:
   - assistant messages
   - model labels
   - engineering plan cards
   - file previews
   - modal content
7. Move CSP toward removal of `'unsafe-inline'` for scripts

## Exit criteria
- no inline handler warnings remain in live frontend
- script CSP no longer depends on legacy inline execution
- assistant/model output rendering is explicitly tested

---

# Phase 2 — Turn Evolve into Engineering runtime

## Goal
Replace the current evolve-only mental model with a real engineering run system.

## Core product rename
- `Role Matrix` → `Crew`
- Evolve/Harness/Ops/Forge combined runtime panel concept → `Engineering`

## Actions
1. Introduce durable `Run` model
2. Introduce explicit run stages:
   - intake
   - context
   - plan
   - review
   - dry-run/diff
   - apply
   - gates
   - repair
   - final
   - memory capture
3. Persist runs on disk under a dedicated runtime directory
4. Add plan review UI
5. Add diff preview before write
6. Add gate result capture
7. Add repair loop with bounded attempts and visible approvals
8. Add summaries/artifacts per run

## Exit criteria
- engineering activity is no longer just streamed text in a chat log
- users can inspect a run as a structured object with stages and artifacts

---

# Phase 3 — Implement the revised UI/UX shell

## Goal
Reshape the app around your updated top-level product concept.

## Final top-level sections
- **Engage**
- **Model Hub**
- **Settings**

## Floating panels inside Engage
- **Nexus** — universal file tree / explorer / artifact browser
- **Crew** — model teams and role orchestration
- **Engineering** — create, monitor, review, approve engineering tasks

## Why this structure is strong
It keeps the app feeling like one main intelligent workspace rather than a fragmented admin dashboard.

### Actions
1. Rename Chat to Engage
2. Define Engage as the primary interaction space for:
   - simple chat
   - project/chat threads
   - file-aware work
   - future Fusion team responses
   - future deep research
3. Add floating panel system with open/close/pin behavior
4. Implement Nexus panel with file tree + file preview + artifact browsing
5. Implement Crew panel for role/team presets and future Fusion setups
6. Implement Engineering panel for engineering runs and controls
7. Keep Model Hub and Settings as top-level sections

## Exit criteria
- Engage is clearly the main workspace
- side capabilities are discoverable through panels instead of separate full-page silos

---

# Phase 4 — Define workspace/project/memory model

## Goal
Prevent future product confusion by formalizing what gets a folder, what gets saved, and what counts as a project.

## Proposed model
### Engage thread
A user interaction context. May be:
- a simple conversation
- a research thread
- a learning thread
- an engineering thread

### Workspace folder
A saved container on disk that can include:
- discussion markdown
- artifacts
- generated files
- notes
- references
- future research output

### Project
A workspace with code, rules, and optional engineering capabilities.

### Root project special case
Updating ARKEL/BLACKLINE itself targets the root workspace.

## Actions
1. Define folder layout for Engage threads and engineering tasks
2. Define markdown transcript saving rules
3. Define how Nexus exposes:
   - project files
   - memory files
   - skill files
   - reusable rules
4. Define when an Engage thread becomes a project
5. Define how summaries can be saved into memory/skills/rules buckets

## Exit criteria
- persistent storage model is explicit
- UI labels match the underlying data model

---

# Phase 5 — Vault concepts absorbed into Nexus-backed storage

## Goal
Honor the new UX idea that Vault and Projects do not need separate top-level sections if they are navigable through Nexus.

## Important nuance
This is a **UI consolidation**, not a disappearance of the concepts.

Even if “Vault” and “Projects” are not top-level tabs, the system still needs internal concepts for:
- memory
- skills
- reusable knowledge
- rules
- workspaces/projects

## Actions
1. Implement storage folders such as:
   - `data/memory/`
   - `data/skills/`
   - `data/rules/`
   - `data/workspaces/`
   - `data/runs/`
2. Surface them in Nexus with clear labels
3. Add actions from Engage to save outputs into these buckets
4. Add retrieval logic for Crew/Engineering/Engage use

## Exit criteria
- user can browse all persistent artifacts through Nexus
- internal architecture still preserves separate concepts even without separate tabs

---

# Phase 6 — Fusion and deep research

## Goal
Extend Engage beyond single-model chat once Engineering runtime exists.

## Future Engage capabilities
1. **Fusion**
   - multiple models collaborate to produce one answer
   - visible crew selection
   - optional debate/review modes
2. **Deep Research**
   - web search / retrieval by capable models
   - citations
   - structured research outputs
   - exportable reports
3. **Skill invocation**
   - user can call skills directly, e.g. `/teach`
   - skill may generate structured output folders and learning artifacts

## Example skill future
`/teach` could produce:
- lesson folder
- lesson markdown
- lesson HTML pages
- summary notes
- exercises

## Exit criteria
- Engage evolves into a serious interaction/workspace layer, not just chat history

---

## Final UI/UX vision

Subtitle: **The intelligence gateway beyond the human layer.**

# Top-level navigation

- **Engage**
- **Model Hub**
- **Settings**

This is the correct simplification for your product.

It keeps the app feeling focused instead of over-tabbed.

---

# Engage — final role in the product

Engage is the main interface.

It is not merely “chat renamed.” It becomes the operating surface for:
- ordinary model conversation
- file-aware interaction
- saved workspace threads
- future research threads
- future learning/skill execution threads
- future engineering conversations and task launches

## Engage behaviors
- user can start a quick conversation
- user can open or pin Nexus/Crew/Engineering panels
- user can inspect files and reference them in context
- user can save key takeaways into memory/skills/rules storage
- user can launch engineering work from inside an Engage thread
- an Engage thread may map to a folder/workspace on disk

## Important implication
This means Engage needs a stronger underlying thread/workspace model than today’s plain conversation list.

---

# Nexus — floating panel

Nexus is the universal explorer.

## Purpose
Browse and inspect:
- project/workspace files
- root app files
- memories
- skills
- reusable rules/knowledge
- run artifacts
- generated learning or research outputs

## Why this is good
It replaces the need for separate top-level Vault/Projects tabs while still making those concepts visible.

## Minimum UX features
- tree navigation
- file preview
- open in context
- attach/reference file to Engage thread
- quick actions:
  - summarize
  - save takeaway to memory
  - convert to rule/skill draft
  - include in engineering context

---

# Crew — floating panel

Crew replaces Role Matrix.

## Purpose
Manage model teams, not just static role assignments.

## Immediate use
- planner
- executor
- reviewer
- repair
- micro editor / tester / scribe later

## Future use
- Fusion response teams
- research teams
- teaching/content teams
- engineering presets

## UX notes
Crew should feel like assembling specialists, not filling dropdown bureaucracy.

---

# Engineering — floating panel

Engineering merges the ideas previously discussed as Forge + Ops.

## Purpose
Create, control, review, and monitor engineering work.

## Why one panel is correct
Because your product is centered around Engage as the main space. Splitting engineering across separate top-level pages would over-fragment the experience.

## Engineering responsibilities
- start engineering tasks
- scope work
- choose mode and risk level
- view active/past runs
- inspect plan
- inspect diffs
- approve or reject changes
- monitor gates and repair attempts

## Internal subareas
Even if it is one panel, it should still internally include:
- task creation area (old Forge idea)
- run monitor area (old Ops idea)

---

# Model Hub

Model Hub remains top-level.

## Role
- endpoint management
- model discovery
- enable/disable models
- probe status
- capability/cost view
- provider/network health later

This remains a strong separate section and should not be buried into panels.

---

# Settings

Settings remains top-level.

## Role
- global app preferences
- storage behavior defaults
- safety defaults
- UI preferences
- future panel/layout behavior defaults

---

## Product experience examples

### Example 1 — simple use
User opens **Engage**, chats normally with one model, opens Nexus to inspect a markdown file, references it into the discussion, then saves a useful summary into memory storage.

### Example 2 — engineering use
User opens **Engage**, discusses a feature request, opens Crew to choose planner/reviewer/executor models, opens Engineering to launch a task, then monitors run state and approves a diff.

### Example 3 — future Fusion use
User opens **Engage**, selects a Fusion team in Crew, asks a complex architecture question, and receives a merged answer produced by multiple models.

### Example 4 — future teaching skill use
User opens **Engage**, asks to use `/teach` for a topic, the system generates a structured learning workspace folder, and the user explores lessons in Nexus.

### Example 5 — future deep research use
User opens **Engage**, requests a research report with citations, the system runs a research flow, stores the report and sources in a workspace folder, and the user explores the outputs in Nexus.

---

## Immediate next actions I recommend

### 1. Do not start with broad UI repaint first
The revised UX vision is strong, but implementing it on top of current frontend debt too early will make the code harder to stabilize.

### 2. Finish Phase 1 before major Engage panel expansion
Specifically:
- split `evolveEngine.js`
- split `models.js`
- tame `styles.css`
- remove inline handlers
- harden markdown rendering

### 3. Then build Engineering runtime model
Do not build the final Engineering panel before you have a real run/stage model underneath it.

### 4. Then implement Engage + floating panels shell
The shell should sit on a better substrate, not on top of the current evolve-chat assumptions.

---

## Final unsugarcoated conclusion

ARKEL is no longer a sloppy project. That part is true.

But it is also not yet the product it wants to be.

Right now it is best described as:

**a promising local-first AI app with strong context scaffolding, decent test discipline, and an immature harness/runtime/UI safety core.**

That is not an insult. It is an accurate staging label.

The worst possible move now would be to mistake passing checks and improved docs for architectural completion.

The best move is:
1. finish the hardening work already identified
2. turn Evolve into a real Engineering runtime
3. implement the new Engage/Nexus/Crew/Engineering UX on top of that stronger foundation

If you do that in order, the product vision becomes believable.
If you skip the substrate work and jump straight to shiny panels, you will accumulate new chaos with nicer labels.
