/* BLACKLINE AI — evolve_tree module (Phase 2) */

function initEvolveResizer() {
  const layout = document.querySelector('.evolve-layout');
  const left = document.querySelector('.evolve-left');
  const right = document.querySelector('.evolve-right');
  const resizer = document.getElementById('evolve-resizer');
  if (!layout || !left || !right || !resizer) return;

  const saved = Number(localStorage.getItem('evolveLeftWidthPct'));
  if (saved >= 35 && saved <= 78) {
    left.style.width = saved + '%';
    right.style.width = (100 - saved) + '%';
  }

  let dragging = false;
  const onMove = (event) => {
    if (!dragging) return;
    const rect = layout.getBoundingClientRect();
    const pct = ((event.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(35, Math.min(78, pct));
    left.style.width = clamped.toFixed(2) + '%';
    right.style.width = (100 - clamped).toFixed(2) + '%';
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    const pct = parseFloat(left.style.width);
    if (!Number.isNaN(pct)) localStorage.setItem('evolveLeftWidthPct', pct.toFixed(2));
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  resizer.addEventListener('pointerdown', (event) => {
    dragging = true;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    resizer.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

async function loadFileTree() {
  const container = document.getElementById('evolve-file-tree');
  if (!container) return;
  container.innerHTML = '<div class="evolve-pending-empty">Loading...</div>';
  try {
    const r = await fetch('/api/files');
    if (!r.ok) throw new Error('Failed to load file tree');
    const tree = await r.json();
    container.innerHTML = '';
    renderFileTreeNodes(tree, container, 0);
  } catch (e) {
    container.innerHTML = `<div class="evolve-pending-empty" style="color:var(--red)">Error: ${escHtml(e.message)}</div>`;
  }
}

function fileTreeLabel(fullPath) {
  const normalized = String(fullPath || '').replace(/\\/g, '/');
  return normalized.split('/').filter(Boolean).pop() || normalized;
}

function renderFileTreeNodes(nodes, container, level) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    const normalizedPath = String(node.path || '').replace(/\\/g, '/');
    node.path = normalizedPath;

    const div = document.createElement('div');
    div.className = 'evolve-tree-item';
    if (level === 0) div.classList.add('evolve-tree-root-item');
    div.style.paddingLeft = (level * 14 + 8) + 'px';
    div.title = normalizedPath;

    if (node.type === 'dir') {
      div.classList.add('evolve-tree-dir');
      div.innerHTML = `<span class="evolve-tree-icon">DIR</span><span class="evolve-tree-name">${escHtml(fileTreeLabel(normalizedPath))}</span>`;
      const childContainer = document.createElement('div');
      childContainer.className = 'evolve-tree-children';
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        childContainer.style.display = childContainer.style.display === 'none' ? 'block' : 'none';
      });
      container.appendChild(div);
      container.appendChild(childContainer);
      renderFileTreeNodes(node.children, childContainer, level + 1);
    } else {
      div.classList.add('evolve-tree-file');
      div.innerHTML = `<span class="evolve-tree-icon">FILE</span><span class="evolve-tree-name">${escHtml(fileTreeLabel(normalizedPath))}</span>`;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        showFileViewer(normalizedPath, node.content);
        document.querySelectorAll('.evolve-tree-file').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
      });
      container.appendChild(div);
    }
  }
}

function showFileViewer(path, content) {
  const viewer = document.getElementById('evolve-file-viewer');
  if (!viewer) return;
  viewer.innerHTML = `<div class="evolve-file-viewer-title">${escHtml(path)}</div><pre>${escHtml(content)}</pre>`;
  viewer.style.display = 'block';
}
