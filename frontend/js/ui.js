/* BLACKLINE AI — ui.js (Phase 3) */

let toastQueue = [];
let toastTimer = null;
let isToastShowing = false;

export function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;

  toastQueue.push({ msg, type });
  if (!isToastShowing) showNextToast(el);
}

function showNextToast(el) {
  if (toastQueue.length === 0) {
    isToastShowing = false;
    return;
  }
  isToastShowing = true;
  const { msg, type } = toastQueue.shift();

  el.textContent = msg;
  el.className = `show ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = '';
    setTimeout(() => showNextToast(el), 120);
  }, 2700);
}

export function showModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.add('open');
  }
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
}

export function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const ren = document.querySelector('.conv-rename-input');
      if (ren) {
        // handled in chat.js
        return;
      }
      closeModal();
    }
  });
}
