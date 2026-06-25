# Module: backend/services/modelDiscovery.js

## Responsibility
Fetch model catalogs from all configured providers: Anthropic, OpenAI, Gemini, Groq, OpenRouter, DeepSeek, custom providers, and Ollama local. Apply enrichment metadata (capabilities, pricing, evolve readiness). Handle fallbacks when APIs fail.

## Public API
- `discoverModels(cfg): Array<Model>` — Returns enriched model list
- `GEMINI_FALLBACK_MODELS: Array` — Static fallback when Gemini API fails
- `isUpdateCapable(provider, id, name): boolean` — Heuristic for whether a model can handle evolve tasks

## Invariants
- Each provider fetch has 8-second timeout
- Ollama has 1.5-second timeout (fast fail if not running)
- OpenRouter capped at 150 models
- Gemini fallback used if API fails
- All models go through `enrichModel()` for metadata
- Probe results from config are merged into model objects

## Dependencies
- `backend/utils` (prettyModelName, readErrorMessage, joinUrl, enrichModel, modelProbeKey, getCustomProvider)
- `backend/config` (loadConfig, saveConfig implicitly via caller)
