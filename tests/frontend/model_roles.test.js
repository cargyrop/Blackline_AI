const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');
const vm = require('vm');

describe('frontend/modules/model_roles.js', () => {
  const ctx = createMockContext();
  runScriptInContext(ctx, 'frontend/modules/core.js');
  runScriptInContext(ctx, 'frontend/modules/state.js');
  runScriptInContext(ctx, 'frontend/modules/models_helpers.js');
  runScriptInContext(ctx, 'frontend/modules/models_actions.js');
  runScriptInContext(ctx, 'frontend/modules/models_center.js');
  runScriptInContext(ctx, 'frontend/modules/models_select.js');
  runScriptInContext(ctx, 'frontend/modules/model_roles.js');

  it('auto-assigns suitable enabled models by role ELO', () => {
    vm.runInContext(`
      models = [
        { provider: 'gemini', id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', enabled: true, arena: { matched: true, leaderboards: { text: { score: 1504 }, code: { score: 1506 } } }, capabilities: { jsonMode: true, longContext: true } },
        { provider: 'ollama', id: 'qwen2.5-coder:3b', name: 'qwen2.5-coder:3b', enabled: true, arena: { matched: false, chatElo: 1050, codeElo: 1110 }, capabilities: { jsonMode: false, longContext: false } }
      ];
      modelRoles = {};
      autoAssignModelRoles(true);
    `, ctx);
    const planner = vm.runInContext('JSON.parse(modelRoles.planner)', ctx);
    const executor = vm.runInContext('JSON.parse(modelRoles.executor)', ctx);
    assert.strictEqual(planner.id, 'gemini-3.5-flash');
    assert.strictEqual(executor.id, 'gemini-3.5-flash');
  });

  it('leaves role empty when no enabled model meets auto-pick minimums', () => {
    vm.runInContext(`
      models = [{ provider: 'ollama', id: 'qwen2.5-coder:3b', name: 'qwen2.5-coder:3b', enabled: true, arena: { matched: false, chatElo: 1030, codeElo: 1080 }, capabilities: { jsonMode: false } }];
      modelRoles = {};
      autoAssignModelRoles(true);
    `, ctx);
    assert.strictEqual(vm.runInContext('modelRoles.planner', ctx), undefined);
    assert.strictEqual(vm.runInContext('modelRoles.executor', ctx), undefined);
  });
});
