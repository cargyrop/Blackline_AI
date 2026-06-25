/* BLACKLINE AI — evolve_messages module (Phase 2) */

function addEvolveMessage(role, content) {
  evolveMessages.push({ role, content, created: Date.now() });
  saveEvolveMessages();
  appendEvolveMessage(role, content);
}

function appendEvolveMessage(role, content) {
  const container = document.getElementById('evolve-messages');
  if (!container) return;
  document.getElementById('evolve-empty-state')?.remove();

  const div = document.createElement('div');
  div.className = `evolve-msg ${role}`;
  const bubbleWrap = document.createElement('div');
  bubbleWrap.style.display = 'flex';
  bubbleWrap.style.flexDirection = 'column';
  bubbleWrap.style.gap = '4px';
  bubbleWrap.style.maxWidth = '85%';
  if (role === 'user') bubbleWrap.style.alignItems = 'flex-end';

  const bubble = document.createElement('div');
  bubble.className = 'evolve-msg-bubble';

  let cleanContent = content;
  let foundPlans = [];
  if (role === 'assistant') {
    const codeBlockRegex = /```(?:plan|json|javascript|js)?\s*([\s\S]*?)```/ig;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.path) {
          foundPlans.push(parsed);
          cleanContent = cleanContent.replace(match[0], '');
        }
      } catch {}
    }
    cleanContent = cleanContent.trim();
  }

  bubble.innerHTML = formatMd(cleanContent || (foundPlans.length ? 'Review the proposed plan below.' : ''));
  bubbleWrap.appendChild(bubble);

  const actions = document.createElement('div');
  actions.className = 'evolve-msg-actions';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'evolve-msg-action-btn';
  copyBtn.type = 'button';
  copyBtn.textContent = 'COPY';
  copyBtn.addEventListener('click', () => copyTextToClipboard(content, copyBtn));
  actions.appendChild(copyBtn);
  bubbleWrap.appendChild(actions);

  div.appendChild(bubbleWrap);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  for (const plan of foundPlans) renderPlanInChat(plan);
}

function appendEvolveLoading(modelName) {
  const container = document.getElementById('evolve-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'evolve-msg assistant';
  div.id = 'evolve-loading-msg';
  div.innerHTML = `<div class="evolve-msg-bubble"><div class="action-ticker"><span class="ticker-spinner">▪</span><span>${escHtml(modelName)} is thinking…</span></div></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function updateEvolveLoading(text) {
  const div = document.getElementById('evolve-loading-msg');
  if (!div) return;
  const bubble = div.querySelector('.evolve-msg-bubble');
  if (bubble) bubble.innerHTML = formatMd(text);
}

function removeEvolveLoading() { document.getElementById('evolve-loading-msg')?.remove(); }

function renderEvolveMessages() {
  const container = document.getElementById('evolve-messages');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(evolveMessages) || evolveMessages.length === 0) {
    container.innerHTML = `
      <div class="evolve-empty-state" id="evolve-empty-state">
        <div class="hero" aria-hidden="true">⬡</div>
        <h3>Plan safe app improvements</h3>
        <p>Select an Evolve model below, describe one clear change, review the generated plan, then approve it to execute.</p>
      </div>`;
    return;
  }
  for (const msg of evolveMessages) {
    if (msg && ['user', 'assistant'].includes(msg.role) && typeof msg.content === 'string') {
      appendEvolveMessage(msg.role, msg.content);
    }
  }
  container.scrollTop = container.scrollHeight;
}

function saveEvolveMessages() {
  try {
    const MAX = 200;
    while (evolveMessages.length > MAX) evolveMessages.shift();
    localStorage.setItem('evolveMessages', JSON.stringify(evolveMessages));
  } catch(e) { toast('Could not save Evolve chat locally: ' + e.message, 'err'); }
}
