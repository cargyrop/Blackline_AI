# BLACKLINE AI — Frontend Modules (Phase 3)

This directory contains the modular JavaScript architecture introduced in **Phase 3**.

## Module Overview

| File              | Responsibility                              | Status     |
|-------------------|---------------------------------------------|------------|
| `storage.js`      | localStorage helpers + limits               | ✅ Ready   |
| `ui.js`           | Toast queue, modals, keyboard nav           | ✅ Ready   |
| `chat.js`         | Core chat state & conversation management   | ✅ Ready   |
| `conversations.js`| Sidebar rendering + filtering + rename      | ✅ Ready   |
| `models.js`       | Model loading & select population           | ✅ Ready   |
| `utils.js`        | Common helpers (escape, resize, flash)      | ✅ Ready   |
| `prompts.js`      | Prompt library UI                           | ✅ Ready   |
| `pwa.js`          | Install prompt + PWA support                | ✅ Ready   |
| `index.js`        | Barrel export for easy importing            | ✅ Ready   |

## Usage

```js
import { toast, loadStoredJson } from './js/index.js';
```

## Migration Strategy

- `app.js` (monolith) remains the main entry point.
- New features and refactors should live in these modules.
- Over time we will gradually move large functions (`sendMessage`, `renderMessages`, etc.) into the appropriate modules.

## Benefits

- Much easier to maintain and test
- Clear separation of concerns
- Enables future tree-shaking / bundling if desired
