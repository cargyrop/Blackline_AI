const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

function loadFrontendModule(filePath) {
  const context = {
    console,
    window: {},
    document: {},
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] ?? null; },
      setItem(k, v) { this.store[k] = v; },
      removeItem(k) { delete this.store[k]; },
    },
    navigator: { clipboard: { writeText: async () => {} } },
    FileReader: class FileReader {
      constructor() {}
      readAsText(file) { setTimeout(() => { if (this.onload) this.onload({ target: { result: file } }); }, 0); }
      readAsDataURL() {}
    },
    AbortSignal: { timeout: () => ({}) },
    fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
    JSON,
    Date,
    Math,
    setTimeout,
    clearTimeout,
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
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    btoa: () => '',
    atob: () => '',
    alert: () => {},
    confirm: () => true,
    prompt: () => '',
    open: () => {},
    location: { href: 'http://localhost:3737' },
  };
  vm.createContext(context);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath });
  return context;
}

describe('frontend/modules/core.js', () => {
  const ctx = loadFrontendModule('frontend/modules/core.js');

  it('escHtml escapes all entities', () => {
    assert.strictEqual(ctx.escHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    assert.strictEqual(ctx.escHtml('5 < 10 && 10 > 5'), '5 &lt; 10 &amp;&amp; 10 &gt; 5');
    assert.strictEqual(ctx.escHtml('no special'), 'no special');
    assert.strictEqual(ctx.escHtml(''), '');
  });

  it('loadStoredJson returns parsed value', () => {
    ctx.localStorage.store['testKey'] = '{"value": 42}';
    assert.deepStrictEqual(ctx.loadStoredJson('testKey', 'fallback'), { value: 42 });
  });

  it('loadStoredJson returns fallback on missing key', () => {
    assert.strictEqual(ctx.loadStoredJson('missingKey', 'fallback'), 'fallback');
    assert.strictEqual(ctx.loadStoredJson('missingKey', null), null);
    assert.deepStrictEqual(ctx.loadStoredJson('missingKey', []), []);
  });

  it('loadStoredJson returns fallback on invalid JSON and removes key', () => {
    ctx.localStorage.store['badKey'] = 'not json';
    assert.strictEqual(ctx.loadStoredJson('badKey', 'fallback'), 'fallback');
    assert.strictEqual(ctx.localStorage.store['badKey'], undefined);
  });

  it('loadStoredJson handles null fallback', () => {
    ctx.localStorage.store['nullKey'] = 'null';
    assert.strictEqual(ctx.loadStoredJson('nullKey', 'fallback'), 'fallback'); // null is falsy, so fallback wins
  });

  it('autoResize sets height based on scrollHeight', () => {
    let setHeight = null;
    const el = {
      style: { height: '' },
      scrollHeight: 50,
    };
    ctx.autoResize(el);
    // First sets to 'auto', then to min(scrollHeight, 160) + 'px'
    assert.strictEqual(el.style.height, '50px');
  });

  it('autoResize caps at 160px', () => {
    const el = {
      style: { height: '' },
      scrollHeight: 500,
    };
    ctx.autoResize(el);
    assert.strictEqual(el.style.height, '160px');
  });

  it('flashCopied temporarily changes button text', () => {
    const btn = { textContent: 'Copy', dataset: {}, classList: { add: () => {}, remove: () => {} } };
    ctx.flashCopied(btn);
    assert.strictEqual(btn.textContent, '✓ Copied');
  });
});

describe('frontend/modules/state.js', () => {
  const ctx = loadFrontendModule('frontend/modules/core.js');
  vm.runInContext(fs.readFileSync('frontend/modules/state.js', 'utf8'), ctx, { filename: 'frontend/modules/state.js' });

  it('defines all required state variables', () => {
    const result = JSON.parse(vm.runInContext(`
      JSON.stringify({
        models: Array.isArray(models),
        modelProbes: typeof modelProbes === 'object',
        modelCenterFilter: modelCenterFilter === 'recommended',
        conversations: Array.isArray(conversations),
        currentConvId: currentConvId === null,
        convSearchFilter: convSearchFilter === '',
        systemPrompt: systemPrompt === '',
        appManifest: appManifest === null,
        appManifestString: appManifestString === '',
        streaming: streaming === false,
        activeAbortController: activeAbortController === null,
        evolveMessages: Array.isArray(evolveMessages),
        evolvePlanStates: typeof evolvePlanStates === 'object',
        evolveStreaming: evolveStreaming === false,
        evolveAbortController: evolveAbortController === null,
        renamingConvId: renamingConvId === null,
      });
    `, ctx));
    assert(result.models);
    assert(result.modelProbes);
    assert(result.modelCenterFilter);
    assert(result.conversations);
    assert(result.currentConvId);
    assert(result.convSearchFilter);
    assert(result.systemPrompt);
    assert(result.appManifest);
    assert(result.appManifestString);
    assert(result.streaming);
    assert(result.activeAbortController);
    assert(result.evolveMessages);
    assert(result.evolvePlanStates);
    assert(result.evolveStreaming);
    assert(result.evolveAbortController);
    assert(result.renamingConvId);
  });

  it('defines PROVIDERS array with expected entries', () => {
    const hasAnthropic = vm.runInContext('PROVIDERS.some(p => p.id === "anthropic")', ctx);
    const hasOpenAI = vm.runInContext('PROVIDERS.some(p => p.id === "openai")', ctx);
    const hasGemini = vm.runInContext('PROVIDERS.some(p => p.id === "gemini")', ctx);
    assert(hasAnthropic);
    assert(hasOpenAI);
    assert(hasGemini);
  });

  it('conversations is array after loadStoredJson', () => {
    const isArray = vm.runInContext('Array.isArray(conversations)', ctx);
    assert(isArray);
  });
});
