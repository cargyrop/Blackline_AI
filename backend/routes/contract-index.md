# Module: backend/routes/index.js

## Responsibility
Mounts all Express routes and registers the SPA catch-all fallback.

## Public API
- `mountRoutes(app): void` — Mounts all route modules under their paths.

## Invariants
- All API routes mounted BEFORE the catch-all `app.get('*')` (which serves `public/index.html`)
- Static files are served by Express static middleware in `server.js`, not here

## Dependencies
All route modules: keys, customProviders, health, models, chat, manifest, files, probes, evolve.
