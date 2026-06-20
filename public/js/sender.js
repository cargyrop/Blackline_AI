/* BLACKLINE AI — sender.js (Phase 3) — Message sending logic */

import { getCurrentModel } from './chat.js';
import { getChatParams } from './storage.js';
import { toast } from './ui.js';

let streaming = false;
let activeAbortController = null;

export function isStreaming() {
  return streaming;
}

export function setStreaming(val) {
  streaming = val;
}

export function getActiveAbortController() {
  return activeAbortController;
}

export function abortCurrentStream() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  streaming = false;
}

export async function sendMessage(text, onChunk, onDone, onError) {
  const model = getCurrentModel();
  if (!model) {
    toast('Please select a model first', 'err');
    return;
  }

  if (streaming) return;

  streaming = true;
  activeAbortController = new AbortController();

  const params = getChatParams();

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: model.provider,
        model: model.id,
        messages: [], // caller should pass real messages
        systemPrompt: '',
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        top_p: params.top_p,
        enableThinking: false
      }),
      signal: activeAbortController.signal
    });

    if (!r.ok) throw new Error(await r.text());

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) {
            onError?.(data.error);
            break;
          }
          if (data.text) onChunk?.(data.text);
          if (data.done) break;
        } catch {}
      }
    }

    onDone?.();
  } catch (e) {
    if (e.name !== 'AbortError') {
      onError?.(e.message);
    }
  } finally {
    streaming = false;
    activeAbortController = null;
  }
}
