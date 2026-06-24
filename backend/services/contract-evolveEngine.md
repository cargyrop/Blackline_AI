# Module: backend/services/evolveEngine.js

## Responsibility
Execute AI-generated code plans: create backups, generate prompts per file, apply search/replace patches or full rewrites, stream progress via SSE. This is the core self-modification engine.

## Public API
- `executePlan(port, req, res): Promise<void>` — Main entry. Reads plan, creates backup, processes each item, streams results.
- `streamModelText(port, provider, model, prompt, onText, cfg, sendEvent): Promise<string>` — Stream AI code generation
- `applySearchReplacePatch(original, changes, filePath): string` — Apply validated search/replace patches
- `extractJsonObject(text): object` — Parse JSON from AI response (strip think tags, markdown fences)
- `stripGeneratedFileContent(text, filePath): string` — Clean AI-generated file content (remove fences, path markers)
- `cleanupOldBackups(parentDir, appName, currentBackupDir): number` — Prune old backups, keep 5
- `MAX_BACKUPS_TO_KEEP: 5`
- `MAX_PLAN_ITEMS: 25`
- `EVOLVE_EXECUTION_TIMEOUT_MS: 900000` (15 minutes)

## Invariants
- Backup MUST be created before ANY write. If backup fails, operation aborts.
- `safeResolve` is used for every file path. If it returns null, that item is skipped with error.
- `applySearchReplacePatch` validates: each search must match exactly once. If 0 or 2+ matches, throw error.
- Each search string must be non-empty. Each replace must be a string.
- If patch JSON parse fails, that file is skipped (other files may still succeed).
- If model returns empty content, that file is skipped.
- Maximum 25 plan items. Exceeding returns 400 before any work.
- Timeout after 15 minutes returns error message with advice.
- Gemini overload: retry with `gemini-1.5-flash` automatically.
- All AI prompts for code generation explicitly tell the model to output ONLY the requested format (no markdown explanation).

## Dependencies
- `backend/utils` (safeResolve, readErrorMessage, joinUrl, getCustomProvider)
- `backend/config` (loadConfig, saveConfig)
- `backend/services/fileTree` (readFileTree)
