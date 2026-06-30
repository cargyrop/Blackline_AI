const fs = require('fs');
const vm = require('vm');

function createMockContext() {
  const context = {
    console,
    window: {},
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, classList: { add: () => {}, remove: () => {} }, style: {}, textContent: '', innerHTML: '', addEventListener: () => {} }),
      body: { appendChild: () => {}, style: {} },
    },
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] ?? null; },
      setItem(k, v) { this.store[k] = v; },
      removeItem(k) { delete this.store[k]; },
    },
    navigator: { clipboard: { writeText: async () => {} } },
    AbortSignal: { timeout: () => ({}) },
    fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '', body: { [Symbol.asyncIterator]: async function* () {} } }),
    JSON,
    Date,
    Math,
    setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout: () => {},
    String,
    Number,
    Array,
    Object,
    Boolean,
    Promise,
    Error,
    RegExp,
    Map,
    Set,
    URL,
    URLSearchParams,
    Blob,
    FileReader: class FileReader {
      constructor() {}
      readAsText(file) { setTimeout(() => { if (this.onload) this.onload({ target: { result: file } }); }, 0); }
      readAsDataURL() {}
    },
    CSS: { escape: (s) => s.replace(/[^a-zA-Z0-9_-]/g, '') },
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    btoa: (s) => Buffer.from(s).toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
    alert: () => {},
    confirm: () => true,
    prompt: () => '',
    open: () => {},
    location: { href: 'http://localhost:3737' },
    history: {},
    Event: class Event {},
    KeyboardEvent: class KeyboardEvent {},
    MouseEvent: class MouseEvent {},
    PointerEvent: class PointerEvent {},
    CustomEvent: class CustomEvent {},
    DOMRect: class DOMRect {},
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    NodeList: class NodeList {},
    HTMLCollection: class HTMLCollection {},
    HTMLElement: class HTMLElement {},
    Element: class Element {},
    DocumentFragment: class DocumentFragment {},
    Text: class Text {},
    Comment: class Comment {},
    MutationObserver: class MutationObserver { observe() {} disconnect() {} },
    IntersectionObserver: class IntersectionObserver { observe() {} disconnect() {} },
    ResizeObserver: class ResizeObserver { observe() {} disconnect() {} },
    requestAnimationFrame: (fn) => { fn(0); return 0; },
    cancelAnimationFrame: () => {},
    requestIdleCallback: (fn) => { fn({ didTimeout: false, timeRemaining: () => 50 }); return 0; },
    cancelIdleCallback: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    window: { addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {}, getComputedStyle: () => ({ getPropertyValue: () => '' }) },
  };
  // Make window reference itself for circular refs
  context.window = context;
  vm.createContext(context);
  return context;
}

function runScriptInContext(context, filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath });
  return context;
}

module.exports = { createMockContext, runScriptInContext };
