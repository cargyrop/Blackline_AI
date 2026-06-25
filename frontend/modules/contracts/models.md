# Module: models.js

## Responsibility
Model discovery, selection, probing, Model Center rendering, Ollama status check, evolve model selection.

## Public API
- `loadModels(showToast): Promise<void>` — Fetch /api/models, populate selects, auto-probe missing models
- `autoProbeMissingModels(): Promise<void>` — Background probe all newly discovered models without updateCapable flag
- `populateModelSelect(preferredVal): void` — Fill #model-select with sorted models, select preferred or first
- `onModelChange(): void` — Save selected model to state + localStorage, update UI
- `providerLabel(p): string` — Return provider display name from PROVIDERS array
- `capabilityBadges(m): string` — Generate HTML capability badges for a model
- `modelOptionText(m): string` — Generate option text for model select
- `isModelSelectable(m): boolean` — Check if model is selectable (not disabled, not error)
- `modelKey(provider, id): string` — Return `provider::id` string
- `modelProbeFor(m): object|null` — Get probe result for a model
- `setModelCenterFilter(filter): void` — Set and re-render Model Center filter
- `modelMatchesCenterFilter(m): boolean` — Check if model matches current filter
- `renderModelCenter(): void` — Render Model Center grid/list
- `probeModel(m, btn): Promise<void>` — Run live probe on a model, update UI
- `loadCustomProviderPresets(): Promise<void>` — Fetch and populate preset dropdown
- `applyCustomProviderPreset(): void` — Fill custom provider form from preset selection
- `loadModelProbes(): Promise<void>` — Load cached probe results from /api/model-probes
- `populateEvolveModelSelect(): void` — Fill evolve model select with updateCapable models (or all if "Show all" checked)
- `getEvolveModel(): object|null` — Get currently selected evolve model
- `checkOllama(): Promise<void>` — Check Ollama status, update dot + text
- `currentModelObject(): object|null` — Get current model object from models array
- `yesNoBadge(label, value): string` — Generate yes/no badge HTML

## DOM Targets
- `#model-select` — Chat model dropdown
- `#model-count` — Model count badge
- `#model-center-list` — Model Center grid
- `.model-center-tabs` — Filter tabs
- `#evolve-model-select` — Evolve model dropdown
- `#show-all-evolve-models` — Show all models checkbox
- `#ollama-dot` — Ollama status indicator dot
- `#ollama-status-text` — Ollama status text
- `#custom-provider-preset` — Preset dropdown
- `#custom-provider-label`, `#custom-provider-base-url`, `#custom-provider-key` — Custom provider form fields

## Invariants
- Model select is sorted by provider then name
- Disabled/error models are shown but not selectable
- Probe results are cached in `modelProbes` and `localStorage` (via config)
- Ollama status is checked on init and can be refreshed
- Evolve model select only shows `updateCapable` models unless "Show all" is checked
- `modelProbeFor` checks both live `m.probe` and cached `modelProbes`

## Dependencies
- state.js (`models`, `modelProbes`, `modelCenterFilter`, `customProviderPresets`, `currentModel`, `PROVIDERS`, `evolvePlanStates`)
- core.js (`escHtml`, `apiErrorMessage`)
- toast.js
- panels.js (`openModelInfoModal`)

## Used By
app.js bootstrap, settings.js, chat_send.js, evolve_send.js
