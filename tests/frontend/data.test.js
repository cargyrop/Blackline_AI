const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');

describe('frontend/modules/data.js', () => {
  const ctx = createMockContext();
  runScriptInContext(ctx, 'public/modules/core.js');
  runScriptInContext(ctx, 'public/modules/state.js');
  runScriptInContext(ctx, 'public/modules/data.js');

  it('renderManifestAsPrompt returns string', () => {
    const manifest = {
      name: 'TestApp',
      version: '1.0',
      techStack: ['Node.js', 'Express'],
      endpoints: [{ method: 'GET', path: '/api/health' }],
    };
    const prompt = ctx.renderManifestAsPrompt(manifest);
    assert(typeof prompt === 'string');
    assert(prompt.length > 0);
    assert(prompt.includes('TestApp'));
    assert(prompt.includes('/api/health'));
  });

  it('renderManifestAsPrompt includes file list', () => {
    const manifest = {
      files: [
        { path: 'server.js', lines: 42 },
        { path: 'public/app.js', lines: 100 },
      ],
    };
    const prompt = ctx.renderManifestAsPrompt(manifest);
    assert(prompt.includes('server.js'));
    assert(prompt.includes('public/app.js'));
  });

  it('renderManifestAsPrompt includes endpoint list', () => {
    const manifest = {
      endpoints: [
        { method: 'GET', path: '/api/health' },
        { method: 'POST', path: '/api/chat' },
      ],
    };
    const prompt = ctx.renderManifestAsPrompt(manifest);
    assert(prompt.includes('GET /api/health'));
    assert(prompt.includes('POST /api/chat'));
  });
});
