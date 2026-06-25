# Module: evolve_messages.js

## Responsibility
Render evolve panel chat messages, loading states, save/load message history from localStorage.

## Public API
- `addEvolveMessage(role, content): void` — Add a message to evolveMessages array, save, render
- `appendEvolveMessage(role, content): void` — Append message HTML to #evolve-messages, scroll to bottom
- `appendEvolveLoading(modelName): void` — Show loading indicator with model name
- `updateEvolveLoading(text): void` — Update loading indicator text
- `removeEvolveLoading(): void` — Remove loading indicator
- `renderEvolveMessages(): void` — Re-render all evolve messages from state
- `saveEvolveMessages(): void` — Save evolveMessages to localStorage (max 200 messages)

## DOM Targets
- `#evolve-messages` — Evolve chat container
- `#evolve-empty-state` — Empty state shown when no messages
- `.evolve-msg` — Message divs (created dynamically)
- `.evolve-loading` — Loading indicator (created dynamically)

## Invariants
- Maximum 200 evolve messages. Oldest removed when exceeding.
- Messages are saved to localStorage as 'evolveMessages'
- Empty state is hidden when messages exist
- Assistant messages are rendered with markdown (formatMd)
- User messages are rendered as plain text (escHtml)
- Scroll to bottom after each append

## Dependencies
- state.js (`evolveMessages`)
- core.js (`escHtml`)
- markdown.js (`formatMd`)

## Used By
evolve_send.js, app.js bootstrap
