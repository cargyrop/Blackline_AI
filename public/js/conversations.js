/* BLACKLINE AI — conversations.js (Phase 3) */

import { saveConversations } from './storage.js';

let conversations = [];
let currentConvId = null;
let convSearchFilter = '';

export function setConversations(arr) {
  conversations = arr;
}

export function getConversations() {
  return conversations;
}

export function getCurrentConvId() {
  return currentConvId;
}

export function setCurrentConvId(id) {
  currentConvId = id;
}

export function getConvSearchFilter() {
  return convSearchFilter;
}

export function setConvSearchFilter(q) {
  convSearchFilter = q || '';
}

export function getFilteredConversations() {
  const q = convSearchFilter.trim().toLowerCase();
  if (!q) return conversations;
  return conversations.filter(c => (c.title || '').toLowerCase().includes(q));
}

export function renderConvList() {
  const list = document.getElementById('conv-list');
  if (!list) return;

  const filtered = getFilteredConversations();
  list.innerHTML = '';

  for (const c of filtered) {
    const el = document.createElement('div');
    el.className = 'conv-item' + (c.id === currentConvId ? ' active' : '');
    el.setAttribute('data-id', c.id);
    el.setAttribute('role', 'listitem');
    el.setAttribute('tabindex', '0');

    el.innerHTML = `
      <span class="conv-item-title">${escapeHtml(c.title)}</span>
      <button class="conv-rename-btn" onclick="startRenameConversation('${c.id}', event)" title="Rename">✎</button>
      <button class="conv-delete" onclick="deleteConversation('${c.id}', event)" title="Delete">✕</button>
    `;

    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (window.loadConversation) window.loadConversation(c.id);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.loadConversation) window.loadConversation(c.id);
      }
    });

    list.appendChild(el);
  }

  if (filtered.length === 0 && conversations.length > 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:8px 10px;color:var(--text-dim);font-size:11px;';
    empty.textContent = 'No matches';
    list.appendChild(empty);
  }
}

export function filterConversations(q) {
  convSearchFilter = q || '';
  renderConvList();
}

export function clearConvSearch() {
  const inp = document.getElementById('conv-search');
  if (inp) {
    inp.value = '';
    filterConversations('');
    inp.focus();
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Make some functions globally available during transition
window.filterConversations = filterConversations;
window.clearConvSearch = clearConvSearch;
