// Shared UI helpers for admin
(function (global) {
  'use strict';

  let toastTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg, type = 'success') {
    const wrap = $('toast');
    const inner = $('toastInner');
    if (!wrap || !inner) return;
    inner.textContent = msg;
    inner.className =
      'px-5 py-3 rounded-lg shadow-xl font-mono text-sm text-white ' +
      (type === 'error' ? 'bg-red-600' : 'bg-green-700');
    wrap.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => wrap.classList.add('hidden'), 3500);
  }

  function confirmDialog(message) {
    return window.confirm(message);
  }

  function updateDirtyBadge() {
    const badge = $('dirtyBadge');
    const btn = $('btnSave');
    const dirty = !!(global.AdminState && global.AdminState.state.dirty);
    if (badge) badge.classList.toggle('hidden', !dirty);
    if (btn) btn.disabled = !dirty || !global.AdminState?.state?.dirHandle;
  }

  function setSection(section) {
    global.AdminState.state.section = section;
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      const active = btn.dataset.nav === section;
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('text-tech-black', active);
      btn.classList.toggle('shadow', active);
      btn.classList.toggle('text-gray-400', !active);
    });
    document.querySelectorAll('[data-section]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.section !== section);
    });
  }

  function showWorkspace(show) {
    $('placeholder')?.classList.toggle('hidden', show);
    $('workspace')?.classList.toggle('hidden', !show);
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function langChips(langs) {
    const L = global.AdminState.LANGS;
    return L.map((l) => {
      const on = langs && langs[l];
      return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${
        on ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400 line-through'
      }">${l.toUpperCase()}</span>`;
    }).join('');
  }

  function displayTitle(title) {
    if (!title) return '(untitled)';
    return title.jp || title.en || title.zh || '(untitled)';
  }

  global.AdminUI = {
    $,
    showToast,
    confirmDialog,
    updateDirtyBadge,
    setSection,
    showWorkspace,
    escHtml,
    langChips,
    displayTitle,
  };
})(window);
