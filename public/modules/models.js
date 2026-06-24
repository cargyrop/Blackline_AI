/* BLACKLINE AI — models module (Phase 2) */

async function loadModels(showToast = false) {
  const sel = document.getElementById('model-select');
  if (!sel) return;
  const previousVal = sel.value;
  const refreshBtn = document.getElementById('model-refresh-btn');
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = 'REFRESHING…'; }
  const center = document.getElementById('model-center-list');
  if (center && showToast) center.innerHTML = '<div class="model-center-empty">Refreshing provider model catalogs…</div>';
  if (showToast) toast('Refreshing model catalog…', 'ok');
  sel.innerHTML = '<option value="">Loading models…</option>';
  try {
    const r = await fetch('/api/models');
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Could not load models'));
    models = await r.json();
    if (!Array.isArray(models)) throw new Error('Model response was not an array');
    await loadModelProbes();
    populateModelSelect(previousVal);
    renderModelCenter();
    buildCustomProvidersList();
    checkOllama();
    if (showToast) toast(`Model catalog refreshed: ${models.length} model/status entr${models.length === 1 ? 'y' : 'ies'}`, 'ok');
    // Kick off background probes for any model that has no probe record yet,
    // so users no longer have to manually click TEST for every model. v1.4.0.
    autoProbeMissingModels();
  } catch(e) {
    sel.innerHTML = '<option value="">Error loading models</option>';
    toast('Could not load models: ' + e.message, 'err');
  } finally {
    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.textContent = 'REFRESH MODEL CATALOG'; }
  }
}

async function autoProbeMissingModels() {
  // Run probes sequentially in the background for any model that doesn't have
  // a probe record yet. We skip `disabled` entries (broken connections).
  const targets = models.filter(m => !m.disabled && !m.probe && !modelProbes[modelKey(m.provider, m.id)]);
  if (!targets.length) return;
  toast(`Auto-probing ${targets.length} new model${targets.length === 1 ? '' : 's'} in background…`, 'ok');
  let done = 0;
  for (const m of targets) {
    try {
      const r = await fetch('/api/models/probe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: m.provider, model: m.id })
      });
      if (r.ok) {
        const result = await r.json();
        modelProbes[modelKey(m.provider, m.id)] = result;
        m.probe = result;
      }
    } catch {}
    done++;
    // Refresh the dropdown periodically so newly-passing models become selectable
    // as soon as their probe completes.
    if (done % 3 === 0 || done === targets.length) {
      populateModelSelect();
      populateEvolveModelSelect();
      renderModelCenter();
    }
  }
  toast(`Auto-probe complete (${done} model${done === 1 ? '' : 's'})`, 'ok');
}

function populateModelSelect(preferredVal) {
  const sel = document.getElementById('model-select');
  const count = document.getElementById('model-count');
  if (!sel) return;
  sel.innerHTML = '';

  populateEvolveModelSelect();

  const selectableModels = models.filter(isModelSelectable);
  if (selectableModels.length === 0) {
    const hint = models.length
      ? '— Models found, but none are tested yet. Open API Keys & Models and click REFRESH. Probes run automatically in the background. —'
      : '— No models yet. Add an API key in Settings to unlock cloud providers. —';
    sel.innerHTML = `<option value="">${hint}</option>`;
    if (count) count.textContent = models.length ? `${models.length} found · 0 tested` : '';
    currentModel = null;
    localStorage.removeItem('currentModel');
    return;
  }

  const groups = {};
  for (const m of selectableModels) {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  }
  for (const [prov, ms] of Object.entries(groups)) {
    const og = document.createElement('optgroup');
    og.label = providerLabel(prov);
    for (const m of ms) {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ id: m.id, provider: m.provider });
      opt.textContent = modelOptionText(m);
      opt.disabled = !!m.disabled;
      opt.title = capabilityBadges(m).join(' · ');
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
  if (count) count.textContent = `${selectableModels.length}/${models.length} selectable`;

  // restore selection: preferredVal (from reload) > saved currentModel > first
  let toSelect = null;
  const tryVals = [preferredVal, currentModel ? JSON.stringify(currentModel) : null, localStorage.getItem('currentModel')].filter(Boolean);
  for (const v of tryVals) {
    if ([...sel.options].some(o => o.value === v)) { toSelect = v; break; }
  }
  if (toSelect) sel.value = toSelect;
  onModelChange();
}

function onModelChange() {
  const sel = document.getElementById('model-select');
  if (!sel) { currentModel = null; return; }
  const val = sel.value;
  if (!val) { currentModel = null; localStorage.removeItem('currentModel'); return; }
  try {
    currentModel = JSON.parse(val);
    localStorage.setItem('currentModel', val);
  } catch { currentModel = null; }
}

function providerLabel(p) {
  if (String(p || '').startsWith('custom:')) {
    const found = models.find(m => m.provider === p && m.providerName);
    return found?.providerName || ('Custom: ' + String(p).slice(7));
  }
  return { anthropic:'Anthropic', openai:'OpenAI', gemini:'Google Gemini', groq:'Groq', openrouter:'OpenRouter', deepseek:'DeepSeek', ollama:'Local (Ollama)' }[p] || p;
}

function capabilityBadges(m) {
  const caps = m.capabilities || {};
  const pricing = m.pricing?.freeStatus || 'unknown';
  const badges = [];
  if (pricing === 'local') badges.push('LOCAL');
  else if (pricing === 'free') badges.push('FREE');
  else if (pricing === 'free-tier-or-paid') badges.push('FREE TIER/PAID');
  else if (pricing === 'paid') badges.push('PAID');
  else badges.push('UNKNOWN COST');
  if (caps.imageInput) badges.push('VISION');
  if (caps.audioInput) badges.push('AUDIO');
  if (caps.fileInput) badges.push('FILES');
  if (caps.toolUse) badges.push('TOOLS');
  if (caps.jsonMode) badges.push('JSON');
  if (caps.reasoning) badges.push('REASONING');
  if (m.evolve?.capable || m.updateCapable) badges.push('EVOLVE ' + Math.round(m.evolve?.score || 60));
  return badges;
}

function modelOptionText(m) {
  return `${m.name || m.id}`;
}

function isModelSelectable(m) {
  if (m.disabled) return false;
  // Local (Ollama) models are user-installed and always trusted for chat.
  // Cloud providers must pass a live probe before appearing in the dropdown.
  if (m.provider === 'ollama') return true;
  const probe = modelProbeFor(m);
  return ['pass', 'partial'].includes(probe?.status);
}

function modelKey(provider, id) { return `${provider}::${id}`; }

function modelProbeFor(m) { return m.probe || modelProbes[modelKey(m.provider, m.id)] || null; }

function setModelCenterFilter(filter) { modelCenterFilter = filter; renderModelCenter(); }

function modelMatchesCenterFilter(m) {
  const caps = m.capabilities || {};
  const pricing = m.pricing?.freeStatus;
  const probe = modelProbeFor(m);
  if (modelCenterFilter === 'all') return true;
  if (m.disabled) return modelCenterFilter === 'all';
  if (modelCenterFilter === 'recommended') return (m.evolve?.score || 0) >= 70 || m.updateCapable;
  if (modelCenterFilter === 'free') return ['local', 'free', 'free-tier-or-paid'].includes(pricing);
  if (modelCenterFilter === 'evolve') return !!(m.updateCapable || m.evolve?.capable || probe?.tests?.evolvePlan?.status === 'pass');
  if (modelCenterFilter === 'vision') return !!caps.imageInput;
  if (modelCenterFilter === 'tested') return !!probe;
  return true;
}

function renderModelCenter() {
  const container = document.getElementById('model-center-list');
  if (!container) return;
  const filtered = models.filter(m => modelMatchesCenterFilter(m));
  document.querySelectorAll('.model-center-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === modelCenterFilter));
  if (!filtered.length) {
    container.innerHTML = '<div class="model-center-empty">No models in this view. Add an API key, connect Ollama, or choose another filter.</div>';
    return;
  }
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'model-center-table';
  table.innerHTML = '<thead><tr><th>Model</th><th>Provider</th><th>Cost</th><th>Capabilities</th><th>Evolve</th><th>Probe</th><th></th></tr></thead><tbody></tbody>';
  const tbody = table.querySelector('tbody');
  for (const m of filtered) {
    const tr = document.createElement('tr');
    const caps = capabilityBadges(m).filter(b => !['PAID','FREE','LOCAL','FREE TIER/PAID','UNKNOWN COST'].includes(b));
    const pricing = m.pricing?.freeStatus || 'unknown';
    const probe = modelProbeFor(m);
    tr.innerHTML = `
      <td><strong>${escHtml(m.name || m.id)}</strong><span>${escHtml(m.id)}</span></td>
      <td>${escHtml(providerLabel(m.provider))}</td>
      <td><span class="model-cost ${escHtml(pricing)}">${escHtml(pricing)}</span></td>
      <td><div class="mini-badges">${caps.slice(0, 5).map(b => `<span>${escHtml(b)}</span>`).join('')}</div></td>
      <td>${escHtml(m.evolve?.tier || 'unknown')}<span>${escHtml((m.evolve?.score ?? '?') + '/100')}</span></td>
      <td>${probe ? `<span class="probe-status ${escHtml(probe.status)}">${escHtml(probe.status)} ${escHtml(String(probe.score ?? '?'))}%</span>` : '<span class="probe-status none">not tested</span>'}</td>
      <td></td>`;
    if (m.disabled) tr.classList.add('disabled-model-row');
    const actions = tr.lastElementChild;
    const infoBtn = document.createElement('button');
    infoBtn.className = 'mini-action-btn';
    infoBtn.textContent = 'INFO';
    infoBtn.addEventListener('click', () => { currentModel = { id: m.id, provider: m.provider }; openModelInfoModal(); });
    const testBtn = document.createElement('button');
    testBtn.className = 'mini-action-btn';
    testBtn.textContent = 'TEST';
    testBtn.disabled = !!m.disabled;
    testBtn.title = m.disabled ? 'Fix provider connection before testing this model.' : 'Run live model probe';
    testBtn.addEventListener('click', () => probeModel(m, testBtn));
    actions.append(infoBtn, testBtn);
    tbody.appendChild(tr);
  }
  container.appendChild(table);
}

async function probeModel(m, btn) {
  if (!m || !m.id || !m.provider) return;
  const old = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'TESTING…'; }
  try {
    const r = await fetch('/api/models/probe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: m.provider, model: m.id })
    });
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Probe failed'));
    const result = await r.json();
    modelProbes[modelKey(m.provider, m.id)] = result;
    m.probe = result;
    toast(`Probe ${result.status}: ${result.score}%`, result.status === 'fail' ? 'err' : 'ok');
    populateModelSelect();
    populateEvolveModelSelect();
    renderModelCenter();
  } catch(e) { toast('Probe failed: ' + e.message, 'err'); }
  finally { if (btn) { btn.disabled = false; btn.textContent = old || 'TEST'; } }
}

async function loadCustomProviderPresets() {
  try {
    const r = await fetch('/api/custom-provider-presets');
    if (!r.ok) throw new Error('Could not load presets');
    customProviderPresets = await r.json();
    const sel = document.getElementById('custom-provider-preset');
    if (sel) {
      sel.innerHTML = '<option value="">Preset…</option>' + customProviderPresets.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.label)}</option>`).join('');
    }
  } catch(e) { console.warn('[custom provider presets]', e.message); }
}

function applyCustomProviderPreset() {
  const id = document.getElementById('custom-provider-preset')?.value;
  const p = customProviderPresets.find(x => x.id === id);
  if (!p) return;
  const label = document.getElementById('custom-provider-label');
  const base = document.getElementById('custom-provider-base-url');
  if (label) label.value = p.label;
  if (base) base.value = p.baseUrl;
}

async function loadModelProbes() {
  try {
    const r = await fetch('/api/model-probes');
    if (r.ok) modelProbes = await r.json();
  } catch { modelProbes = {}; }
}

function populateEvolveModelSelect() {
  const sel = document.getElementById('evolve-model-select');
  if (!sel) return;
  const previousValue = sel.value;
  const showAll = document.getElementById('show-all-evolve-models')?.checked;
  const selectableModels = models.filter(isModelSelectable);
  const targetModels = showAll ? selectableModels : selectableModels.filter(m => m.updateCapable);
  sel.innerHTML = '';
  if (targetModels.length === 0) {
    sel.innerHTML = '<option value="">— No capable models available —</option>';
    return;
  }
  const groups = {};
  for (const m of targetModels) {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  }
  for (const [prov, ms] of Object.entries(groups)) {
    const og = document.createElement('optgroup');
    og.label = providerLabel(prov);
    for (const m of ms) {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ id: m.id, provider: m.provider });
      opt.textContent = `${modelOptionText(m)}${m.updateCapable ? '' : ' (not recommended)'}`;
      opt.disabled = !!m.disabled;
      opt.title = `Evolve: ${m.evolve?.tier || 'unknown'} (${m.evolve?.score ?? '?'}/100) · ${capabilityBadges(m).join(' · ')}`;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
  if (previousValue && [...sel.options].some(o => o.value === previousValue)) {
    sel.value = previousValue;
  }
}

function getEvolveModel() {
  const val = document.getElementById('evolve-model-select')?.value;
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

async function checkOllama() {
  const dot = document.getElementById('ollama-dot');
  const txt = document.getElementById('ollama-status-text');
  if (!dot || !txt) return;
  const localModels = models.filter(m => m.provider === 'ollama');
  if (localModels.length > 0) {
    dot.className = 'status-dot online';
    txt.textContent = `Ollama online — ${localModels.length} local model${localModels.length !== 1 ? 's' : ''} ready`;
  } else {
    try {
      await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(1500) });
      dot.className = 'status-dot online';
      txt.textContent = 'Ollama running — no models downloaded yet. Run: ollama pull llama3.2';
    } catch {
      dot.className = 'status-dot offline';
      txt.textContent = 'Ollama not detected. Install from ollama.com to use local models.';
    }
  }
}

function currentModelObject() {
  if (!currentModel) return null;
  return models.find(m => m.id === currentModel.id && m.provider === currentModel.provider) || currentModel;
}

function yesNoBadge(label, value) {
  return `<span class="model-cap ${value ? 'yes' : 'no'}">${value ? '✓' : '–'} ${escHtml(label)}</span>`;
}
