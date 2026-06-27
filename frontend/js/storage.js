/* BLACKLINE AI — storage.js (Phase 3) */

export function loadStoredJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch (e) {
    console.warn('[storage] Failed to parse', key, e.message);
    localStorage.removeItem(key);
    return fallback;
  }
}

export function saveConversations(conversations) {
  try {
    const MAX = 50;
    while (conversations.length > MAX) conversations.pop();
    const serialized = JSON.stringify(conversations);
    const size = new Blob([serialized]).size;
    if (size > 4 * 1024 * 1024) {
      console.warn('[storage] Conversations approaching limit');
    }
    localStorage.setItem('conversations', serialized);
  } catch (e) {
    console.error('Could not save conversations', e);
  }
}

export function saveEvolveMessages(messages) {
  try {
    const MAX = 200;
    while (messages.length > MAX) messages.shift();
    localStorage.setItem('evolveMessages', JSON.stringify(messages));
  } catch (e) {}
}

export function saveChatParams(params) {
  localStorage.setItem('chatParams', JSON.stringify(params));
}

export function getChatParams() {
  try {
    return JSON.parse(localStorage.getItem('chatParams') || '{}');
  } catch {
    return { temperature: 0.7, max_tokens: 4096, top_p: 1.0 };
  }
}
