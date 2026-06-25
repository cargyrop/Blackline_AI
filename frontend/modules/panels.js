/* BLACKLINE AI — panels module (Phase 2) */

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('visible'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(name + '-panel');
  if (panel) panel.classList.add('visible');
  const nav = document.querySelector(`[data-panel="${name}"]`);
  if (nav) nav.classList.add('active');

  const toolbar = document.getElementById('toolbar');
  if (toolbar) toolbar.classList.toggle('hidden', name !== 'chat');

  if (name === 'chat') document.getElementById('msg-input')?.focus();
  if (name === 'evolve') {
    document.getElementById('evolve-input')?.focus();
    loadFileTree();
  }
}

function openSystemModal() {
  const inp = document.getElementById('system-prompt-input');
  if (inp) inp.value = systemPrompt;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) { overlay.classList.add('open'); overlay.style.display = 'flex'; setTimeout(() => inp?.focus(), 30); }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) { overlay.classList.remove('open'); overlay.style.display = 'none'; }
}

function closeModalOutside(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

function openModelInfoModal() {
  const overlay = document.getElementById('model-info-overlay');
  const content = document.getElementById('model-info-content');
  const m = currentModelObject();
  if (!overlay || !content) return;
  if (!m) {
    content.innerHTML = '<p class="model-info-muted">Select a model first.</p>';
  } else {
    const caps = m.capabilities || {};
    const pricing = m.pricing || {};
    const evolve = m.evolve || {};
    const probe = modelProbeFor(m);
    const probeRows = probe?.tests ? Object.entries(probe.tests).map(([name, t]) =>
      `<div class="probe-detail-row"><span>${escHtml(name)}</span><strong class="${escHtml(t.status)}">${escHtml(t.status)}</strong><em>${escHtml(t.error || t.detail || '')}</em></div>`
    ).join('') : '<p class="model-info-muted">Not tested yet. Use TEST in Model Center to verify real access and Evolve behavior.</p>';
    content.innerHTML = `
      <div class="model-info-name">${escHtml(m.name || m.id)}</div>
      <div class="model-info-id">${escHtml(providerLabel(m.provider))} · ${escHtml(m.id)}</div>
      <div class="model-info-badges">${capabilityBadges(m).map(b => `<span>${escHtml(b)}</span>`).join('')}</div>
      <h4>Capabilities</h4>
      <div class="model-cap-grid">
        ${yesNoBadge('Text', caps.text !== false)}
        ${yesNoBadge('Vision / image input', caps.imageInput)}
        ${yesNoBadge('Audio input', caps.audioInput)}
        ${yesNoBadge('File input', caps.fileInput)}
        ${yesNoBadge('Tool use', caps.toolUse)}
        ${yesNoBadge('JSON / structured output', caps.jsonMode)}
        ${yesNoBadge('Reasoning signal', caps.reasoning)}
        ${yesNoBadge('Long-context signal', caps.longContext)}
      </div>
      <h4>Pricing / availability</h4>
      <p class="model-info-muted">Status: <strong>${escHtml(pricing.freeStatus || 'unknown')}</strong> · Source: ${escHtml(pricing.source || m.source || 'unknown')}</p>
      ${pricing.note ? `<p class="model-info-muted">${escHtml(pricing.note)}</p>` : ''}
      <h4>Evolve suitability</h4>
      <p class="model-info-muted"><strong>${escHtml(evolve.tier || 'unknown')}</strong> · Score: ${escHtml(evolve.score ?? '?')}/100</p>
      <div class="model-info-reasons">${(evolve.reasons || []).map(r => `<div>• ${escHtml(r)}</div>`).join('')}</div>
      <h4>Live probe</h4>
      <p class="model-info-muted">${probe ? `Status: <strong>${escHtml(probe.status)}</strong> · Score: ${escHtml(probe.score ?? '?')}% · ${escHtml(probe.updatedAt || '')}` : 'Not tested'}</p>
      <div class="probe-detail-grid">${probeRows}</div>
      <p class="model-info-warning">Capability and pricing data combine provider model-list APIs, provider metadata where available, BLACKLINE AI local metadata, and optional live probes. Treat pricing as a guide; provider billing pages remain authoritative.</p>`;
  }
  overlay.style.display = 'flex';
  overlay.classList.add('open');
}

function closeModelInfoModal() {
  const overlay = document.getElementById('model-info-overlay');
  if (overlay) { overlay.classList.remove('open'); overlay.style.display = 'none'; }
}

function closeModelInfoOutside(e) { if (e.target === document.getElementById('model-info-overlay')) closeModelInfoModal(); }

function saveSystemPrompt() {
  const inp = document.getElementById('system-prompt-input');
  systemPrompt = inp ? inp.value.trim() : '';
  localStorage.setItem('systemPrompt', systemPrompt);
  closeModal();
  toast('System prompt saved ✓', 'ok');
}
