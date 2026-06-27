/* Toast Queue — standalone module */
let toastQueue = [];
let toastTimer = null;
let isToastShowing = false;

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;

  toastQueue.push({ msg, type });

  if (!isToastShowing) {
    showNextToast(el);
  }
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
    setTimeout(() => showNextToast(el), 130);
  }, 2700);
}

// Export for global use
window.toast = toast;
