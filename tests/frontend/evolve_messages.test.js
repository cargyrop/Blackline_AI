const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');
const vm = require('vm');

describe('frontend/modules/evolve_messages.js plan extraction', () => {
  const ctx = createMockContext();
  runScriptInContext(ctx, 'frontend/modules/evolve_messages.js');

  function extract(input) {
    ctx.__planInput = input;
    return vm.runInContext('extractEvolvePlans(__planInput)', ctx);
  }

  it('extracts classic fenced plan arrays', () => {
    const result = extract('Here is the plan:\n\n```plan\n[{"path":"frontend/modules/models.js","action":"edit","description":"Fix state"}]\n```');
    assert.strictEqual(result.plans.length, 1);
    assert.strictEqual(result.plans[0][0].path, 'frontend/modules/models.js');
    assert.strictEqual(result.plans[0][0].action, 'edit');
    assert(!result.content.includes('```plan'));
  });

  it('does not split one multi-file plan into duplicate approval cards', () => {
    const result = extract('```plan\n[{"path":"backend/manifest.json","action":"edit"},{"path":"frontend/modules/frontend-manifest.json","action":"edit"}]\n```');
    assert.strictEqual(result.plans.length, 1);
    assert.strictEqual(result.plans[0].length, 2);
  });

  it('merges multiple detected plan fragments into one approval card', () => {
    const result = extract('{"path":"a.js","action":"edit"}\n{"path":"b.js","action":"edit"}');
    assert.strictEqual(result.plans.length, 1);
    assert.strictEqual(result.plans[0].length, 2);
  });

  it('extracts object-wrapped plans emitted by some models', () => {
    const result = extract('Use this:\n```json\n{"plan":[{"path":"frontend/modules/evolve_plan.js","action":"edit","description":"Improve parsing"}]}\n```');
    assert.strictEqual(result.plans.length, 1);
    assert.strictEqual(result.plans[0][0].path, 'frontend/modules/evolve_plan.js');
  });

  it('accepts common file aliases and normalizes missing action to edit', () => {
    const result = extract('{\n  "files": [{ "file": "frontend/styles.css", "description": "Add resize affordance" }]\n}');
    assert.strictEqual(result.plans.length, 1);
    assert.strictEqual(result.plans[0][0].path, 'frontend/styles.css');
    assert.strictEqual(result.plans[0][0].action, 'edit');
  });
});
