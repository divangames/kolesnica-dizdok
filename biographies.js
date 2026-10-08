'use strict';
(() => {
  let active = null;
  let opener = null;
  let previousHash = '#cast';
  const dialogs = [...document.querySelectorAll('.biography-dialog')];
  function openBiography(id, trigger, updateHistory = true) {
    const dialog = document.getElementById('bio-' + id);
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (dialog === active && dialog.open) return;
    if (active?.open) active.close();
    previousHash = /^#(?:character|bio)-/.test(location.hash) ? '#cast' : location.hash || '#cast';
    opener = trigger || document.querySelector(`[data-biography="${id}"]`);
    active = dialog;
    if (updateHistory) history.pushState(null, '', '#character-' + id);
    document.documentElement.classList.add('biography-open');
    dialog.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    dialog.showModal();
    dialog.querySelector('.biography-scroll').scrollTop = 0;
    dialog.querySelector('.biography-close').focus({ preventScroll: true });
  }
  function syncHash() {
    const match = location.hash.match(/^#(?:character|bio)-(\d{2})$/);
    if (match) openBiography(match[1], null, false);
    else if (active?.open) active.close();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-biography]');
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openBiography(trigger.dataset.biography, trigger);
  });
  for (const dialog of dialogs) {
    dialog.querySelector('.biography-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      const stops = [...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = stops[0], last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    let pressedBackdrop = false;
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    dialog.addEventListener('pointerdown', event => { pressedBackdrop = outside(event); });
    dialog.addEventListener('pointerup', event => {
      if (pressedBackdrop && outside(event)) dialog.close();
      pressedBackdrop = false;
    });
    dialog.addEventListener('close', () => {
      if (active !== dialog) return;
      active = null;
      document.documentElement.classList.remove('biography-open');
      if (/^#(?:character|bio)-/.test(location.hash)) history.replaceState(null, '', previousHash);
      opener?.focus({ preventScroll: true });
    });
  }
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);
  syncHash();
})();
