const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const { loadConfig, saveConfig, modelProbeKey, clearModelProbesForProvider, ALLOWED_PROVIDERS, DATA_FILE } = require('../../backend/config');

describe('backend/config', () => {
  // Save original config so tests don't corrupt user data
  const originalConfig = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : null;

  it('ALLOWED_PROVIDERS contains expected providers', () => {
    assert(ALLOWED_PROVIDERS.has('anthropic'));
    assert(ALLOWED_PROVIDERS.has('openai'));
    assert(ALLOWED_PROVIDERS.has('gemini'));
    assert(ALLOWED_PROVIDERS.has('groq'));
    assert(ALLOWED_PROVIDERS.has('openrouter'));
    assert(ALLOWED_PROVIDERS.has('deepseek'));
    assert.strictEqual(ALLOWED_PROVIDERS.size, 6);
  });

  it('loadConfig returns fallback when file missing', () => {
    // Temporarily rename the file to test missing case
    const tmp = DATA_FILE + '.tmp';
    if (fs.existsSync(DATA_FILE)) fs.renameSync(DATA_FILE, tmp);
    try {
      const cfg = loadConfig();
      assert(cfg);
      assert.strictEqual(typeof cfg.keys, 'object');
      assert(Array.isArray(cfg.conversations));
    } finally {
      if (fs.existsSync(tmp)) fs.renameSync(tmp, DATA_FILE);
    }
  });

  it('saveConfig writes valid JSON and loadConfig reads it back', (t) => {
    t.after(() => {
      if (originalConfig !== null) fs.writeFileSync(DATA_FILE, originalConfig);
      else fs.unlinkSync(DATA_FILE);
    });
    const testCfg = { keys: { openai: 'sk-test123' }, conversations: [], customProviders: [] };
    saveConfig(testCfg);
    const loaded = loadConfig();
    assert.deepStrictEqual(loaded.keys, { openai: 'sk-test123' });
    assert.deepStrictEqual(loaded.conversations, []);
  });

  it('loadConfig strips placeholder keys', (t) => {
    t.after(() => {
      if (originalConfig !== null) fs.writeFileSync(DATA_FILE, originalConfig);
      else fs.unlinkSync(DATA_FILE);
    });
    const testCfg = { keys: { openai: 'ENTER_YOUR_API_KEY', anthropic: 'sk-real' }, conversations: [] };
    saveConfig(testCfg);
    const loaded = loadConfig();
    assert.strictEqual(loaded.keys.openai, undefined);
    assert.strictEqual(loaded.keys.anthropic, 'sk-real');
  });

  it('loadConfig strips masked keys', (t) => {
    t.after(() => {
      if (originalConfig !== null) fs.writeFileSync(DATA_FILE, originalConfig);
      else fs.unlinkSync(DATA_FILE);
    });
    const testCfg = { keys: { openai: '••••1234' }, conversations: [] };
    saveConfig(testCfg);
    const loaded = loadConfig();
    assert.strictEqual(loaded.keys.openai, undefined);
  });

  it('modelProbeKey formats correctly', () => {
    assert.strictEqual(modelProbeKey('anthropic', 'claude-3-5-sonnet'), 'anthropic::claude-3-5-sonnet');
  });

  it('clearModelProbesForProvider removes matching probes', () => {
    const cfg = {
      modelProbes: {
        'anthropic::claude-3': { status: 'pass' },
        'openai::gpt-4': { status: 'pass' },
        'anthropic::claude-4': { status: 'pass' },
      }
    };
    clearModelProbesForProvider(cfg, 'anthropic');
    assert.strictEqual(cfg.modelProbes['anthropic::claude-3'], undefined);
    assert.strictEqual(cfg.modelProbes['anthropic::claude-4'], undefined);
    assert(cfg.modelProbes['openai::gpt-4']);
  });

  it('clearModelProbesForProvider handles missing modelProbes', () => {
    const cfg = {};
    clearModelProbesForProvider(cfg, 'anthropic');
    assert.strictEqual(cfg.modelProbes, undefined);
  });
});
