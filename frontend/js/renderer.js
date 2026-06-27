/* BLACKLINE AI — renderer.js (Phase 3) */

import { escapeHtml } from './utils.js';

export function renderMessages(container, msgs, appendMessageFn) {
  if (!container) return;
  container.innerHTML = '';

  if (!msgs || msgs.length === 0) {
    container.innerHTML = `
      <div id="empty-state">
        <div class="hero">▰</div>
        <h2>Ready to chat</h2>
        <p>Select a model and start chatting.</p>
      </div>
    `;
    return;
  }

  msgs.forEach((msg, idx) => {
    appendMessageFn(msg.role, msg.content, false, msg.model, idx, msg.thinking, msg.thinkingTime);
  });
}

export function appendMessage(container, role, content, animate = true, model = null, msgIdx = null, thinking = null, thinkingTime = null) {
  if (!container) return null;

  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (msgIdx !== null) div.dataset.msgIdx = msgIdx;

  const avatar = role === 'user' ? 'USR' : 'AI';
  let html = role === 'assistant' 
    ? `<div class="msg-bubble">${content}</div>` 
    : `<div class="msg-bubble">${escapeHtml(content).replace(/\n/g, '<br>')}</div>`;

  if (role === 'assistant' && model) {
    html += `<span class="model-label">${model.icon || ''} ${escapeHtml(model.name || model.id)}</span>`;
  }

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-bubble-container">${html}</div>
  `;

  container.appendChild(div);
  if (animate) container.scrollTop = container.scrollHeight;
  return div;
}
