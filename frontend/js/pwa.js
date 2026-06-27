/* BLACKLINE AI — pwa.js (Phase 3) */

let deferredPrompt = null;

export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show subtle install button in toolbar
    const toolbar = document.getElementById('toolbar');
    if (toolbar && !document.getElementById('pwa-install-btn')) {
      const btn = document.createElement('button');
      btn.id = 'pwa-install-btn';
      btn.className = 'toolbar-action-btn';
      btn.innerHTML = '📲';
      btn.title = 'Install BLACKLINE AI as app';
      btn.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('%c[PWA] User installed the app', 'color:#39ff88');
        }
        deferredPrompt = null;
        btn.remove();
      };
      toolbar.appendChild(btn);
    }
  });

  // Also handle successful install
  window.addEventListener('appinstalled', () => {
    console.log('%c[PWA] App installed successfully', 'color:#39ff88');
    deferredPrompt = null;
  });
}
