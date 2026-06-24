# Module: evolve_send.js

## Responsibility
Send evolve messages, stream AI responses, handle plan approval and execution via POST /api/evolve/execute, stop generation, keyboard input.

## Public API
- `clearEvolveChat(): void` — Clear evolve messages and plan states after confirm
- `sendEvolveMessage(): Promise<void>` — Send evolve message with system prompt including manifest, stream response, detect plan blocks, render plan cards
- `stopEvolveMessage(): void` — Abort current evolve fetch
- `setEvolveStreamingUI(isStreaming): void` — Toggle evolve send/stop buttons
- `onEvolveInputKey(e): void` — Keydown handler: Enter sends, Shift+Enter newline
- `approvePlan(planId): Promise<void>` — Extract plan from window._evolvePlans, POST to /api/evolve/execute, stream SSE progress, render results in chat

## DOM Targets
- `#evolve-input` — Evolve message textarea
- `#evolve-send-btn` — Evolve send button
- `#evolve-stop-btn` — Evolve stop button
- `#evolve-messages` — Evolve chat container (for streaming appends)
- `#show-all-evolve-models` — Show all models checkbox

## Invariants
- Evolve system prompt includes the app manifest (rendered as text) + evolve rules
- Plans are detected by parsing JSON inside ```plan code blocks
- Only ONE plan per assistant message is processed
- Approve button requires plan to exist in window._evolvePlans
- Execution streams SSE chunks: backup info, file progress, errors, completion
- Partial execution is warned — user must fix failures manually
- After execution, user is told to reload page (and restart server if server.js changed)
- `enableThinking` is set to false for evolve messages (plan generation needs structured output, not reasoning tokens)

## Dependencies
- state.js (`evolveMessages`, `evolvePlanStates`, `evolveStreaming`, `evolveAbortController`, `appManifest`, `appManifestString`)
- core.js (`autoResize`)
- toast.js
- models.js (`getEvolveModel`)
- evolve_messages.js (`addEvolveMessage`, `appendEvolveMessage`, `appendEvolveLoading`, `updateEvolveLoading`, `removeEvolveLoading`)
- evolve_plan.js (`planStateKey`, `saveEvolvePlanStates`, `setPlanState`, `renderPlanInChat`, `renderInvestigationPrompt`, `requestFailedPlanRetry`)
- evolve_tree.js (`loadFileTree`)
- data.js (`renderManifestAsPrompt`)

## Used By
app.js bootstrap (event listener), evolve_plan.js (retry)
