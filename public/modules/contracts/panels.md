# Module: panels.js

## Responsibility
Panel visibility switching, modal open/close, system prompt save/cancel.

## Public API
- `showPanel(name): void` — Show panel by name ('chat', 'settings', 'evolve'). Hides others, updates nav button active states.
- `openSystemModal(): void` — Show system prompt modal, pre-fill from state
- `closeModal(): void` — Hide system prompt modal
- `closeModalOutside(e): void` — Close modal if click was on overlay (not the modal content)
- `openModelInfoModal(): void` — Show model info modal with current model details
- `closeModelInfoModal(): void` — Hide model info modal
- `closeModelInfoOutside(e): void` — Close model info modal if click was on overlay
- `saveSystemPrompt(): void` — Save system prompt from textarea to state and localStorage, close modal

## DOM Targets
- `#chat-panel`, `#settings-panel`, `#evolve-panel` — Panels to show/hide
- `.nav-btn` — Navigation buttons (active class toggled)
- `#modal-overlay`, `#system-modal` — System prompt modal
- `#model-info-overlay`, `#model-info-modal` — Model info modal
- `#system-prompt-input` — System prompt textarea
- `#model-info-content` — Model info content container
- `#model-info-title` — Model info title

## Invariants
- Exactly one panel is visible at a time (has `.visible` class)
- Modal overlays are `display:none` when closed
- System prompt is saved to `localStorage` as 'systemPrompt' key
- Escape key closes modals (handled in app.js bootstrap, not here)

## Dependencies
- state.js (`systemPrompt`, `currentModel`, `models`)
- models.js (`currentModelObject`, `capabilityBadges`, `providerLabel`)
- core.js (`escHtml`)
- markdown.js (`formatMd`)

## Used By
app.js bootstrap, chat_actions.js, models.js
