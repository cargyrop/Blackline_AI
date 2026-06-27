const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');
const vm = require('vm');

describe('frontend/modules/settings.js', () => {
  const ctx = createMockContext();
  runScriptInContext(ctx, 'frontend/modules/core.js');
  runScriptInContext(ctx, 'frontend/modules/state.js');
  runScriptInContext(ctx, 'frontend/modules/settings.js');

  it('makeEndpointInstanceId keeps remote endpoint additions unique', () => {
    const a = vm.runInContext('makeEndpointInstanceId("custom")', ctx);
    const b = vm.runInContext('makeEndpointInstanceId("custom")', ctx);
    assert.notStrictEqual(a, b);
    assert(a.startsWith('custom-'));
  });

  it('makeEndpointInstanceId keeps Ollama stable', () => {
    assert.strictEqual(vm.runInContext('makeEndpointInstanceId("ollama")', ctx), 'ollama');
  });
});
