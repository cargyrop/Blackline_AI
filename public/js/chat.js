/* BLACKLINE AI — chat.js (Phase 3) */

import { loadStoredJson, saveConversations as saveConvs } from './storage.js';

let conversations = [];
let currentConvId = null;
let currentModel = null;

export function initChat() {
  conversations = loadStoredJson('conversations', []);
  if (!Array.isArray(conversations)) conversations = [];
  currentModel = loadStoredJson('currentModel', null);
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

export function getCurrentModel() {
  return currentModel;
}

export function setCurrentModel(model) {
  currentModel = model;
  try {
    localStorage.setItem('currentModel', JSON.stringify(model));
  } catch {}
}

export function newConversation(switchTo = true) {
  const id = Date.now().toString();
  const conv = { id, title: 'New chat', messages: [], created: Date.now() };
  conversations.unshift(conv);
  saveConvs(conversations);
  if (switchTo) setCurrentConvId(id);
  return conv;
}

export function loadConversation(id) {
  currentConvId = id;
  return conversations.find(c => c.id === id);
}

export function deleteConversation(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConvs(conversations);
  if (currentConvId === id) {
    currentConvId = conversations.length ? conversations[0].id : null;
  }
}

export function saveCurrentConversations() {
  saveConvs(conversations);
}

export function updateConvTitle(id, title) {
  const conv = conversations.find(c => c.id === id);
  if (conv) {
    conv.title = title.slice(0, 80);
    saveConvs(conversations);
  }
}
