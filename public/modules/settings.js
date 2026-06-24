/* BLACKLINE AI — settings module (Phase 2) */

async function buildKeysList() {
  const container = document.getElementById('keys-list');
  if (!container) return;
  let savedKeys = {};
  try {
    const r = await fetch('/api/keys');
    if (r.ok) savedKeys = await r.json();
  } catch (e) { console.warn('[keys] Failed to load keys:', e.message); }

  container.innerHTML = '';
  for (const p of PROVIDERS) {
    const isSet = !!savedKeys[p.id];
    const row = document.createElement('div');
    row.className = 'provider-row';
    row.innerHTML = `
      <div class="provider-label">${p.label}</div>
      <span class="key-status ${isSet ? 'set' : 'unset'}">${isSet ? 'SET' : 'NOT SET'}</span>
      <input type="password" class="key-input" id="key-${p.id}"
        placeholder="${isSet ? '(key saved — enter to replace)' : p.placeholder}" />
      <div class="key-actions">
        <button class="save-key-btn" onclick="saveKey('${p.id}')">SAVE</button>
        ${isSet ? `<button class="delete-key-btn" onclick="deleteKey('${p.id}')" title="Remove key">×</button>` : '<button class="delete-key-btn placeholder" tabindex="-1" aria-hidden="true">×</button>'}
      </div>`;
    container.appendChild(row);
    // Enter to save
    const input = row.querySelector('.key-input');
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveKey(p.id); }});
  }
}

async function saveKey(provider) {
  const input = document.getElementById('key-' + provider);
  if (!input) return;
  const key = input.value.trim();
  if (!key) { toast('Please enter a key first', 'err'); return; }
  try {
    const r = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Save failed'));
    input.value = '';
    toast(`${provider} key saved ✓`, 'ok');
    await buildKeysList();
    await loadModels();
  } catch(e) { toast('Save failed: ' + e.message, 'err'); }
}

async function deleteKey(provider) {
  if (!confirm(`Remove ${provider} API key?`)) return;
  try {
    const r = await fetch(`/api/keys/${provider}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Delete failed'));
    toast(`${provider} key removed`, 'ok');
    await buildKeysList();
    await loadModels();
  } catch(e) { toast('Delete failed: ' + e.message, 'err'); }
}

async function buildCustomProvidersList() {
  const container = document.getElementById('custom-providers-list');
  if (!container) return;
  container.innerHTML = '<div class="custom-provider-empty">Loading custom providers…</div>';
  try {
    const r = await fetch('/api/custom-providers');
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Could not load custom providers'));
    const providers = await r.json();
    if (!providers.length) {
      container.innerHTML = '<div class="custom-provider-empty">No custom providers yet.</div>';
      return;
    }
    container.innerHTML = '';
    for (const p of providers) {
      const providerId = `custom:${p.id}`;
      const providerModels = models.filter(m => m.provider === providerId);
      const listedCount = providerModels.filter(m => !m.disabled).length;
      const errorEntry = providerModels.find(m => m.disabled);
      const statusText = errorEntry
        ? `connection/model-list error: ${errorEntry.name}`
        : listedCount > 0
          ? `${listedCount} listed model${listedCount === 1 ? '' : 's'}`
          : 'not refreshed yet / no listed models';
      const row = document.createElement('div');
      row.className = 'custom-provider-row';
      row.innerHTML = `<div><strong>${escHtml(p.label)}</strong><span>${escHtml(p.baseUrl)} · key ${escHtml(p.keyMasked || 'not set')}</span><span class="custom-provider-status">${escHtml(statusText)}</span></div><button class="delete-key-btn" onclick="deleteCustomProvider('${escHtml(p.id)}')">×</button>`;
      container.appendChild(row);
    }
  } catch(e) {
    container.innerHTML = `<div class="custom-provider-empty" style="color:var(--red)">${escHtml(e.message)}</div>`;
  }
}

async function saveCustomProvider() {
  const label = document.getElementById('custom-provider-label')?.value.trim();
  const baseUrl = document.getElementById('custom-provider-base-url')?.value.trim();
  const apiKey = document.getElementById('custom-provider-key')?.value.trim();
  if (!label || !baseUrl || !apiKey) { toast('Provider name, base URL, and API key are required', 'err'); return; }
  try {
    const r = await fetch('/api/custom-providers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, baseUrl, apiKey })
    });
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Could not save provider'));
    ['custom-provider-label','custom-provider-base-url','custom-provider-key'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    toast('Custom provider saved ✓', 'ok');
    await buildCustomProvidersList();
    await loadModels();
  } catch(e) { toast('Custom provider save failed: ' + e.message, 'err'); }
}

async function deleteCustomProvider(id) {
  if (!confirm('Remove this custom provider?')) return;
  try {
    const r = await fetch(`/api/custom-providers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await apiErrorMessage(r, 'Delete failed'));
    toast('Custom provider removed', 'ok');
    await buildCustomProvidersList();
    await loadModels();
  } catch(e) { toast('Delete failed: ' + e.message, 'err'); }
}
