/* BLACKLINE AI — models.js (Phase 3) */

let models = [];
let currentModel = null;

export function setModels(newModels) {
  models = Array.isArray(newModels) ? newModels : [];
}

export function getModels() {
  return models;
}

export function setCurrentModel(model) {
  currentModel = model;
  if (model) {
    try { localStorage.setItem('currentModel', JSON.stringify(model)); } catch {}
  }
}

export function getCurrentModel() {
  return currentModel;
}

export function populateModelSelect(selectEl, preferredVal = null) {
  if (!selectEl) return;
  selectEl.innerHTML = '';

  if (models.length === 0) {
    selectEl.innerHTML = '<option value="">— No models available —</option>';
    return;
  }

  const groups = {};
  models.forEach(m => {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  });

  Object.entries(groups).forEach(([prov, ms]) => {
    const og = document.createElement('optgroup');
    og.label = prov.charAt(0).toUpperCase() + prov.slice(1);
    ms.forEach(m => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ id: m.id, provider: m.provider });
      opt.textContent = `${m.icon || ''} ${m.name}`;
      og.appendChild(opt);
    });
    selectEl.appendChild(og);
  });

  // Restore selection
  let toSelect = preferredVal || (currentModel ? JSON.stringify(currentModel) : null);
  if (toSelect) {
    const found = [...selectEl.options].find(o => o.value === toSelect);
    if (found) selectEl.value = toSelect;
  }
}

export async function loadModelsAPI() {
  const r = await fetch('/api/models');
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  setModels(data);
  return data;
}
