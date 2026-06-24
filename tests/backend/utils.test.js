const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  prettyModelName,
  safeResolve,
  toPosixPath,
  joinUrl,
  modelIntelligence,
  customProviderKey,
  isCustomProviderId,
  sanitizeCustomProviderInput,
  publicCustomProvider,
} = require('../../backend/utils');
const { extractFirstJson } = require('../../backend/services/probe');

describe('backend/utils', () => {
  describe('prettyModelName', () => {
    it('removes models/ prefix', () => {
      assert.strictEqual(prettyModelName('models/gemini-pro'), 'Gemini Pro');
    });
    it('capitalizes tts to TTS', () => {
      assert.strictEqual(prettyModelName('gpt-4-tts'), 'Gpt 4 TTS');
    });
    it('capitalizes each part', () => {
      assert.strictEqual(prettyModelName('claude-3-sonnet'), 'Claude 3 Sonnet');
    });
  });

  describe('safeResolve', () => {
    const base = '/home/user/app';

    it('allows valid relative paths', () => {
      assert.strictEqual(safeResolve(base, 'public/app.js'), '/home/user/app/public/app.js');
      assert.strictEqual(safeResolve(base, 'styles.css'), '/home/user/app/styles.css');
    });

    it('blocks .. traversal', () => {
      assert.strictEqual(safeResolve(base, '../etc/passwd'), null);
      assert.strictEqual(safeResolve(base, 'public/../../etc/passwd'), null);
    });

    it('blocks absolute paths', () => {
      assert.strictEqual(safeResolve(base, '/etc/passwd'), null);
      assert.strictEqual(safeResolve(base, 'C:\\Windows\\System32'), null);
    });

    it('blocks null bytes', () => {
      assert.strictEqual(safeResolve(base, 'public/app.js\0'), null);
    });

    it('blocks blocked directories', () => {
      assert.strictEqual(safeResolve(base, 'node_modules/express'), null);
      assert.strictEqual(safeResolve(base, '.git/config'), null);
      assert.strictEqual(safeResolve(base, 'data/config.json'), null);
      assert.strictEqual(safeResolve(base, '.env'), null);
    });

    it('blocks empty paths', () => {
      assert.strictEqual(safeResolve(base, ''), null);
      assert.strictEqual(safeResolve(base, null), null);
    });
  });

  describe('toPosixPath', () => {
    it('converts backslashes', () => {
      assert.strictEqual(toPosixPath('public\\app.js'), 'public/app.js');
    });
    it('handles empty string', () => {
      assert.strictEqual(toPosixPath(''), '');
    });
  });

  describe('joinUrl', () => {
    it('joins base and route', () => {
      assert.strictEqual(joinUrl('https://api.example.com/v1', '/chat/completions'), 'https://api.example.com/v1/chat/completions');
    });
    it('handles trailing slash on base', () => {
      assert.strictEqual(joinUrl('https://api.example.com/v1/', 'chat/completions'), 'https://api.example.com/v1/chat/completions');
    });
    it('handles leading slash on route', () => {
      assert.strictEqual(joinUrl('https://api.example.com/v1', '/chat/completions'), 'https://api.example.com/v1/chat/completions');
    });
  });

  describe('modelIntelligence', () => {
    it('scores gpt-4 highly for code', () => {
      const intel = modelIntelligence('openai', 'gpt-4', 'GPT-4');
      assert(intel.evolve.capable);
      assert(intel.evolve.score >= 80);
      assert.strictEqual(intel.evolve.tier, 'recommended');
      assert(intel.capabilities.code);
      assert(intel.capabilities.toolUse);
    });

    it('scores genuinely small models lower', () => {
      const intel = modelIntelligence('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo');
      // gpt-3.5-turbo does not match the high-score bonus regex, so it should score below 65
      assert(!intel.evolve.capable || intel.evolve.score < 65);
    });

    it('ollama deepseek-coder:70b is not evolve-capable due to low score', () => {
      const intel = modelIntelligence('ollama', 'deepseek-coder:70b', 'DeepSeek Coder 70B');
      assert(!intel.evolve.capable);
      assert(intel.capabilities.code);
      assert.strictEqual(intel.pricing.freeStatus, 'local');
    });

    it('caps score at 0-100', () => {
      const intel1 = modelIntelligence('openai', 'gpt-4', 'GPT-4');
      assert(intel1.evolve.score >= 0 && intel1.evolve.score <= 100);
      const intel2 = modelIntelligence('openai', 'gpt-3.5-turbo-mini', 'Tiny Model');
      assert(intel2.evolve.score >= 0 && intel2.evolve.score <= 100);
    });

    it('marks vision models correctly', () => {
      const intel = modelIntelligence('openai', 'gpt-4o', 'GPT-4o');
      assert(intel.capabilities.imageInput);
    });

    it('marks reasoning models correctly', () => {
      const intel = modelIntelligence('openai', 'o3-mini', 'o3-mini');
      assert(intel.capabilities.reasoning);
    });
  });

  describe('customProviderKey', () => {
    it('extracts key from custom: prefix', () => {
      assert.strictEqual(customProviderKey('custom:kimi'), 'kimi');
    });
    it('returns empty for non-custom', () => {
      assert.strictEqual(customProviderKey('openai'), '');
    });
  });

  describe('isCustomProviderId', () => {
    it('accepts valid IDs', () => {
      assert(isCustomProviderId('custom:kimi'));
      assert(isCustomProviderId('custom:my-provider_1'));
    });
    it('rejects invalid IDs', () => {
      assert(!isCustomProviderId('custom:'));
      assert(!isCustomProviderId('custom:a')); // 1 char is below the 2-char minimum
      assert(!isCustomProviderId('openai'));
    });
  });

  describe('sanitizeCustomProviderInput', () => {
    it('validates all required fields', () => {
      assert.throws(() => sanitizeCustomProviderInput({ label: 'Test', baseUrl: 'https://example.com' }), /API key/);
      assert.throws(() => sanitizeCustomProviderInput({ label: 'Test', apiKey: 'key' }), /base URL/);
      assert.throws(() => sanitizeCustomProviderInput({ baseUrl: 'https://example.com', apiKey: 'key' }), /id/);
    });

    it('rejects non-HTTP base URLs', () => {
      assert.throws(() => sanitizeCustomProviderInput({ label: 'Test', baseUrl: 'ftp://example.com', apiKey: 'key' }), /http/);
    });

    it('returns normalized object on success', () => {
      const result = sanitizeCustomProviderInput({ label: 'Kimi', baseUrl: 'https://api.example.com/', apiKey: 'secret' });
      assert.strictEqual(result.label, 'Kimi');
      assert.strictEqual(result.baseUrl, 'https://api.example.com');
      assert.strictEqual(result.apiKey, 'secret');
      assert.strictEqual(result.chatPath, '/chat/completions');
      assert.strictEqual(result.modelsPath, '/models');
      assert.strictEqual(result.enabled, true);
    });
  });

  describe('publicCustomProvider', () => {
    it('masks the API key', () => {
      const p = publicCustomProvider({ id: 'test', label: 'Test', baseUrl: 'https://example.com', apiKey: 'sk-abcdef123456', modelsPath: '/models', chatPath: '/chat', enabled: true });
      assert.strictEqual(p.keyMasked, '••••3456');
      assert.strictEqual(p.apiKey, undefined);
    });
  });

  describe('extractFirstJson', () => {
    it('extracts JSON from markdown fence', () => {
      assert.deepStrictEqual(extractFirstJson('```json\n{"ok": true}\n```'), { ok: true });
    });
    it('extracts raw JSON', () => {
      assert.deepStrictEqual(extractFirstJson('{"ok": true}'), { ok: true });
    });
    it('extracts first array from fence', () => {
      assert.deepStrictEqual(extractFirstJson('```\n[1, 2, 3]\n```'), [1, 2, 3]);
    });
    it('extracts object after text', () => {
      const text = 'Some explanation here\n\n```json\n{"path": "file.js", "action": "edit"}\n```';
      assert.deepStrictEqual(extractFirstJson(text), { path: 'file.js', action: 'edit' });
    });
  });
});
