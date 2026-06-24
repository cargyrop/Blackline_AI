/* BLACKLINE AI — messages.js (Phase 3) */

import { escapeHtml } from './utils.js';

let messages = [];

export function setMessages(arr) {
  messages = Array.isArray(arr) ? arr : [];
}

export function getMessages() {
  return messages;
}

export function addMessage(msg) {
  messages.push(msg);
}

export function clearMessages() {
  messages = [];
}

export function renderMessageList(container, formatMdFn) {
  if (!container) return;
  container.innerHTML = '';

  messages.forEach((msg, idx) => {
    const div = document.createElement('div');
    div.className = `message ${msg.role}`;
    div.dataset.msgIdx = idx;

    const content = msg.role === 'assistant' && formatMdFn 
      ? formatMdFn(msg.content) 
      : escapeHtml(msg.content).replace(/\n/g, '<br>');

    div.innerHTML = `
      <div class="msg-avatar">${msg.role === 'user' ? 'USR' : 'AI'}</div>
      <div class="msg-bubble-container">
        <div class="msg-bubble">${content}</div>
      </div>
    `;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}
