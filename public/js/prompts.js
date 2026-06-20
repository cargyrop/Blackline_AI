/* BLACKLINE AI — prompts.js (Phase 3) — Prompt Library */

const PROMPT_LIBRARY = [
  { id: 'explain', label: 'Explain a concept', text: 'Explain {topic} in simple terms with an analogy.' },
  { id: 'debug', label: 'Debug code', text: 'Debug this code and explain the issue:\n\n```js\n{code}\n```' },
  { id: 'refactor', label: 'Refactor code', text: 'Refactor the following code for better readability and performance:\n\n```js\n{code}\n```' },
  { id: 'test', label: 'Write tests', text: 'Write comprehensive unit tests for this function:\n\n```js\n{code}\n```' },
  { id: 'summarize', label: 'Summarize text', text: 'Summarize the following text in 4 bullet points:\n\n{text}' }
];

export function getPromptLibrary() {
  return PROMPT_LIBRARY;
}

export function showPromptLibrary(inputElement) {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;bottom:70px;left:20px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;z-index:300;min-width:220px;box-shadow:0 8px 20px rgba(0,0,0,.4)';
  
  PROMPT_LIBRARY.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p.label;
    btn.style.cssText = 'display:block;width:100%;text-align:left;padding:8px 12px;margin:2px 0;border:none;background:transparent;color:var(--text);cursor:pointer;border-radius:4px;';
    btn.onmouseenter = () => btn.style.background = 'var(--surface2)';
    btn.onmouseleave = () => btn.style.background = 'transparent';
    btn.onclick = () => {
      const val = prompt(`Fill in the template for "${p.label}"`, '');
      if (val !== null) {
        const filled = p.text.replace(/\{[^}]+\}/g, val);
        inputElement.value = filled;
        inputElement.focus();
      }
      container.remove();
    };
    container.appendChild(btn);
  });

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.style.cssText = 'margin-top:8px;width:100%;padding:6px;font-size:12px;';
  close.onclick = () => container.remove();
  container.appendChild(close);

  document.body.appendChild(container);
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(ev) {
      if (!container.contains(ev.target)) {
        container.remove();
        document.removeEventListener('click', handler);
      }
    }, { once: true });
  }, 50);
}
