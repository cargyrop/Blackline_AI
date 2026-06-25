const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createMockContext, runScriptInContext } = require('./helpers');
const vm = require('vm');

describe('frontend/modules/models.js', () => {
  const ctx = createMockContext();
  runScriptInContext(ctx, 'frontend/modules/core.js');
  runScriptInContext(ctx, 'frontend/modules/state.js');
  runScriptInContext(ctx, 'frontend/modules/models.js');

  it('modelKey formats provider::id', () => {
    assert.strictEqual(vm.runInContext('modelKey("anthropic", "claude-3")', ctx), 'anthropic::claude-3');
  });

  it('providerLabel returns label for known provider', () => {
    assert.strictEqual(vm.runInContext('providerLabel("anthropic")', ctx), 'Anthropic');
    assert.strictEqual(vm.runInContext('providerLabel("openai")', ctx), 'OpenAI');
    assert.strictEqual(vm.runInContext('providerLabel("ollama")', ctx), 'Local (Ollama)');
    assert.strictEqual(vm.runInContext('providerLabel("unknown")', ctx), 'unknown');
  });

  it('providerLabel returns custom provider label for custom: prefix', () => {
    vm.runInContext('models = [{ provider: "custom:test", providerName: "My Provider" }];', ctx);
    assert.strictEqual(vm.runInContext('providerLabel("custom:test")', ctx), 'My Provider');
  });

  it('modelOptionText returns name or id', () => {
    const text = vm.runInContext('modelOptionText({ id: "gpt-4o", name: "GPT-4o" })', ctx);
    assert.strictEqual(text, 'GPT-4o');
  });

  it('modelOptionText falls back to id when name missing', () => {
    const text = vm.runInContext('modelOptionText({ id: "gpt-4o" })', ctx);
    assert.strictEqual(text, 'gpt-4o');
  });

  it('isModelSelectable returns false when no probe status', () => {
    const result = vm.runInContext('isModelSelectable({ id: "x", provider: "openai" })', ctx);
    assert.strictEqual(result, false);
  });

  it('isModelSelectable returns false for disabled models', () => {
    const result = vm.runInContext('isModelSelectable({ id: "x", disabled: true })', ctx);
    assert.strictEqual(result, false);
  });

  it('isModelSelectable returns true for pass/partial probe', () => {
    vm.runInContext('modelProbes = { "openai::gpt-4": { status: "pass" } };', ctx);
    const result = vm.runInContext('isModelSelectable({ id: "gpt-4", provider: "openai" })', ctx);
    assert.strictEqual(result, true);
  });

  it('capabilityBadges generates cost and capability badges', () => {
    const badges = vm.runInContext('capabilityBadges({ capabilities: { imageInput: true }, pricing: { freeStatus: "free" } })', ctx);
    assert(badges.includes('FREE'));
    assert(badges.includes('VISION'));
  });

  it('capabilityBadges generates unknown cost for missing pricing', () => {
    const badges = vm.runInContext('capabilityBadges({ capabilities: {} })', ctx);
    assert(badges.includes('UNKNOWN COST'));
  });

  it('yesNoBadge generates checkmark for true', () => {
    const html = vm.runInContext('yesNoBadge("Test", true)', ctx);
    assert(html.includes('Test'));
    assert(html.includes('✓'));
  });

  it('yesNoBadge generates dash for false', () => {
    const html = vm.runInContext('yesNoBadge("Test", false)', ctx);
    assert(html.includes('Test'));
    assert(html.includes('–'));
  });
});
