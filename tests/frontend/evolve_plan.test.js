const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');
const vm = require('vm');

describe('frontend/modules/evolve_plan.js', () => {
  const ctx = createMockContext();
  ctx.addEvolveMessage = () => {}; // mock — evolve_plan.js calls this from evolve_messages.js
  runScriptInContext(ctx, 'frontend/modules/core.js');
  runScriptInContext(ctx, 'frontend/modules/state.js');
  runScriptInContext(ctx, 'frontend/modules/evolve_plan.js');

  it('planStateKey generates consistent hash-like key', () => {
    const key1 = vm.runInContext('planStateKey([{ path: "app.js", action: "edit" }])', ctx);
    const key2 = vm.runInContext('planStateKey([{ path: "app.js", action: "edit" }])', ctx);
    assert.strictEqual(key1, key2);
    assert(typeof key1 === 'string');
    assert(key1.length > 0);
  });

  it('planStateKey differs for different plans', () => {
    const key1 = vm.runInContext('planStateKey([{ path: "a.js", action: "edit" }])', ctx);
    const key2 = vm.runInContext('planStateKey([{ path: "b.js", action: "edit" }])', ctx);
    assert.notStrictEqual(key1, key2);
  });

  it('setPlanState persists to evolvePlanStates and localStorage', () => {
    vm.runInContext('setPlanState("testKey", "approved", "done");', ctx);
    const stored = JSON.parse(ctx.localStorage.store['evolvePlanStates'] || '{}');
    assert(stored['testKey']);
    assert.strictEqual(stored['testKey'].status, 'approved');
    assert.strictEqual(stored['testKey'].note, 'done');
    assert(typeof stored['testKey'].updated === 'number');
  });

  it('saveEvolvePlanStates writes to localStorage', () => {
    vm.runInContext('evolvePlanStates = { "key1": { status: "pending", updated: Date.now() } }; saveEvolvePlanStates();', ctx);
    const stored = JSON.parse(ctx.localStorage.store['evolvePlanStates'] || '{}');
    assert(stored['key1']);
    assert.strictEqual(stored['key1'].status, 'pending');
  });

  it('rejectPlan marks state as rejected', () => {
    vm.runInContext('window = {}; window._evolvePlans = { "plan1": [{ path: "app.js", action: "edit" }] }; evolvePlanStates = {}; rejectPlan("plan1");', ctx);
    const stored = JSON.parse(ctx.localStorage.store['evolvePlanStates'] || '{}');
    const key = vm.runInContext('planStateKey([{ path: "app.js", action: "edit" }])', ctx);
    assert.strictEqual(stored[key].status, 'rejected');
  });
});
