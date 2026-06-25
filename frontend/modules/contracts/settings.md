# Module: settings.js

## Responsibility
API key management UI, custom provider management UI. Save and delete keys via backend API.

## Public API
- `buildKeysList(): Promise<void>` — Render API key input fields for all providers
- `saveKey(provider): Promise<void>` — Save API key for a provider, reload models
- `deleteKey(provider): Promise<void>` — Delete API key, reload models
- `buildCustomProvidersList(): Promise<void>` — Render list of saved custom providers
- `saveCustomProvider(): Promise<void>` — Validate and save custom provider from form
- `deleteCustomProvider(id): Promise<void>` — Delete custom provider by ID

## DOM Targets
- `#keys-list` — API key input fields container
- `#custom-providers-list` — Custom provider list container
- `#custom-provider-preset` — Preset dropdown
- `#custom-provider-label` — Provider name input
- `#custom-provider-base-url` — Base URL input
- `#custom-provider-key` — API key input

## Invariants
- Saving a key always triggers `loadModels()` (models may have changed)
- Deleting a key always triggers `loadModels()`
- Keys are validated non-empty before sending
- Custom providers are validated: label, base URL (http/https), key all required
- Form fields are cleared after successful save
- Errors show toast

## Dependencies
- state.js (`PROVIDERS`, `customProviderPresets`)
- models.js (`loadModels`, `loadCustomProviderPresets`, `applyCustomProviderPreset`)
- core.js (`apiErrorMessage`)
- toast.js

## Used By
app.js bootstrap
