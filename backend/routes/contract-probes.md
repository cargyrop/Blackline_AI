# Module: backend/routes/probes.js

## Responsibility
Model probe handlers: GET /api/model-probes and POST /api/models/probe.

## Routes
- `GET /api/model-probes` — Returns cached probe results from config
- `POST /api/models/probe` — Runs 4 live tests against a model: basicChat, json, evolvePlan, evolvePatch. Stores result in config.

## Invariants
- Probe requires valid API key for the provider (except Ollama)
- 4 tests: basicChat (BLACKLINE_OK), json (parseable JSON), evolvePlan (```plan block), evolvePatch (search/replace JSON)
- Results stored with timestamp, score (0-100), status (pass/partial/fail)
- Timeout per test: 45 seconds (via runSelfChatProbe)

## Dependencies
- `backend/config` (loadConfig, saveConfig, modelProbeKey)
- `backend/utils` (getCustomProvider)
- `backend/services/probe` (runSelfChatProbe, extractFirstJson)
