/* BLACKLINE AI — main.js (Phase 3 entry point) */

import { initChat, getCurrentModel, setCurrentModel } from './chat.js';
import { initPWA } from './pwa.js';
import { toast } from './ui.js';

export async function bootstrapApp() {
  console.log('%c[BLACKLINE] Phase 3 modular bootstrap', 'color:#00f0ff');

  // Initialize core modules
  initChat();
  
  // PWA
  try {
    initPWA();
  } catch (e) {}

  // Expose a few globals for backward compatibility during migration
  window.BLACKLINE = {
    getCurrentModel,
    setCurrentModel,
    toast
  };

  console.log('%c[BLACKLINE] Phase 3 modules ready', 'color:#39ff88');
}

// Auto-bootstrap when loaded as module
if (import.meta.url.endsWith('main.js')) {
  bootstrapApp();
}
