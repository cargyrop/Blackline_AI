const { describe, it } = require('node:test');
const assert = require('node:assert');

const { discoverModels } = require('../../backend/services/modelDiscovery');

function mockJsonResponse(data, ok = true) {
  return { ok, json: async () => data, text: async () => JSON.stringify(data) };
}

describe('backend/services/modelDiscovery endpoint catalog integration', () => {
  it('includes added endpoint models and still discovers other configured providers', async (t) => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });

    global.fetch = async (url) => {
      const target = String(url);
      if (target.includes('api.openai.com/v1/models')) {
        return mockJsonResponse({ data: [{ id: 'gpt-4o-mini', created: 1 }] });
      }
      if (/11434/.test(target)) throw new Error('ollama offline in test');
      throw new Error('Unexpected fetch: ' + target);
    };

    const models = await discoverModels({
      keys: { openai: 'sk-test' },
      endpoints: [
        {
          id: 'mistral',
          label: 'Mistral',
          icon: '◆',
          baseUrl: 'https://api.mistral.ai/v1',
          apiKey: 'mk-test',
          enabled: true,
          disabledModels: [],
          models: [{ id: 'mistral-large-latest', name: 'Mistral Large' }]
        }
      ]
    });

    assert(models.some(m => m.provider === 'mistral' && m.id === 'mistral-large-latest'));
    assert(models.some(m => m.provider === 'openai' && m.id === 'gpt-4o-mini'));
  });

  it('honors disabled models for added endpoints', async (t) => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    global.fetch = async (url) => {
      if (/11434/.test(String(url))) throw new Error('ollama offline in test');
      throw new Error('Unexpected fetch: ' + url);
    };

    const models = await discoverModels({
      endpoints: [
        {
          id: 'together',
          label: 'Together AI',
          apiKey: 'tk-test',
          enabled: true,
          disabledModels: ['disabled-model'],
          models: [
            { id: 'enabled-model', name: 'Enabled Model' },
            { id: 'disabled-model', name: 'Disabled Model' }
          ]
        }
      ]
    });

    assert(models.some(m => m.provider === 'together' && m.id === 'enabled-model'));
    assert(!models.some(m => m.provider === 'together' && m.id === 'disabled-model'));
  });
});
