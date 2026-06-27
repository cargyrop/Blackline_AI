const { describe, it } = require('node:test');
const assert = require('node:assert');

const { streamChat } = require('../../backend/services/chatProxy');

function makeSseResponse() {
  return {
    chunks: [],
    ended: false,
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.jsonBody = body; this.ended = true; return this; },
    write(chunk) { this.chunks.push(String(chunk)); },
    end() { this.ended = true; },
  };
}

describe('backend/services/chatProxy Ollama', () => {
  it('falls back to /api/generate when /api/chat is rejected by Ollama', async (t) => {
    const originalFetch = global.fetch;
    const calls = [];
    t.after(() => { global.fetch = originalFetch; });

    global.fetch = async (url) => {
      calls.push(String(url));
      if (String(url).endsWith('/api/chat')) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: 'chat template is not available for this model' }),
          text: async () => 'chat template is not available for this model',
        };
      }
      if (String(url).endsWith('/api/generate')) {
        return {
          ok: true,
          body: [Buffer.from('{"response":"OK","done":false}\n{"done":true,"prompt_eval_count":2,"eval_count":1}\n')],
        };
      }
      throw new Error('Unexpected URL ' + url);
    };

    const req = {
      body: {
        provider: 'ollama',
        model: 'legacy-local-model:latest',
        messages: [{ role: 'user', content: 'ping' }],
      },
    };
    const res = makeSseResponse();

    await streamChat(req, res, { endpoints: [{ id: 'ollama', providerType: 'ollama', baseUrl: 'http://127.0.0.1:11434', enabled: true }] });

    assert.deepStrictEqual(calls, [
      'http://127.0.0.1:11434/api/chat',
      'http://127.0.0.1:11434/api/generate',
    ]);
    assert(res.chunks.join('').includes('"text":"OK"'));
    assert(res.chunks.join('').includes('"done":true'));
  });

  it('surfaces Ollama response details when chat and generate both fail', async (t) => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });

    global.fetch = async (url) => ({
      ok: false,
      status: 500,
      json: async () => ({ error: String(url).endsWith('/api/chat') ? 'model load failed' : 'generate failed' }),
      text: async () => 'failed',
    });

    const req = {
      body: {
        provider: 'ollama',
        model: 'too-large:latest',
        messages: [{ role: 'user', content: 'ping' }],
      },
    };
    const res = makeSseResponse();

    await streamChat(req, res, {});

    const output = res.chunks.join('');
    assert(output.includes('model load failed'));
    assert(output.includes('generate failed'));
  });

  it('tries localhost when the configured 127.0.0.1 Ollama URL cannot run the model', async (t) => {
    const originalFetch = global.fetch;
    const calls = [];
    t.after(() => { global.fetch = originalFetch; });

    global.fetch = async (url) => {
      const target = String(url);
      calls.push(target);
      if (target.startsWith('http://127.0.0.1:11434')) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: '127 runtime failed' }),
          text: async () => '127 runtime failed',
        };
      }
      if (target === 'http://localhost:11434/api/chat') {
        return {
          ok: true,
          body: [Buffer.from('{"message":{"content":"LOCALHOST_OK"},"done":false}\n{"done":true}\n')],
        };
      }
      throw new Error('Unexpected URL ' + target);
    };

    const req = {
      body: {
        provider: 'ollama',
        model: 'llama3.2:latest',
        messages: [{ role: 'user', content: 'ping' }],
      },
    };
    const res = makeSseResponse();

    await streamChat(req, res, { endpoints: [{ id: 'ollama', providerType: 'ollama', baseUrl: 'http://127.0.0.1:11434', enabled: true }] });

    assert(calls.includes('http://127.0.0.1:11434/api/chat'));
    assert(calls.includes('http://localhost:11434/api/chat'));
    assert(res.chunks.join('').includes('LOCALHOST_OK'));
  });

});
