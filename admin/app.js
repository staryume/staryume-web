// Admin boot / open-save / navigation
(function (global) {
  'use strict';

  async function openFolder(handle) {
    try {
      const data = await global.AdminFS.loadProject(handle);
      global.AdminState.state.dirHandle = handle;
      global.AdminState.setLoaded(data);
      global.AdminUI.showWorkspace(true);
      global.AdminUI.setSection('blog');
      global.AdminPosts.onSectionShow();
      global.AdminUI.updateDirtyBadge();
      const folderLabel = document.getElementById('folderLabel');
      if (folderLabel) {
        folderLabel.textContent = handle.name || 'project';
        folderLabel.classList.remove('hidden');
      }
      global.AdminUI.showToast('Project loaded: ' + (handle.name || 'folder'));
    } catch (e) {
      global.AdminUI.showToast('Failed to load project: ' + e.message, 'error');
      console.error(e);
    }
  }

  async function onOpenClick() {
    if (!global.AdminFS.supportsFS()) {
      global.AdminUI.showToast('Use Chrome or Edge for the admin CMS.', 'error');
      return;
    }
    try {
      if (global.AdminState.state.dirty) {
        if (
          !global.AdminUI.confirmDialog(
            'You have unsaved changes. Open a different folder and discard them?'
          )
        )
          return;
      }
      const handle = await global.AdminFS.pickDirectory();
      await openFolder(handle);
    } catch (e) {
      if (e.name !== 'AbortError') {
        global.AdminUI.showToast('Open failed: ' + e.message, 'error');
      }
    }
  }

  async function onReopenClick() {
    try {
      const handle = await global.AdminFS.reopenLastDirectory();
      if (!handle) {
        global.AdminUI.showToast('No saved folder — use Open project folder.', 'error');
        return;
      }
      if (global.AdminState.state.dirty) {
        if (!global.AdminUI.confirmDialog('Discard unsaved changes and reopen last folder?'))
          return;
      }
      await openFolder(handle);
    } catch (e) {
      global.AdminUI.showToast('Reopen failed: ' + e.message, 'error');
    }
  }

  async function onSaveClick() {
    // Always pull latest Shop settings form into memory before writing
    if (global.AdminStore?.flushShopSettings) {
      global.AdminStore.flushShopSettings();
    }

    // Flush events form into memory before write
    if (global.AdminEvents?.flushEditForm) {
      global.AdminEvents.flushEditForm();
    }

    const {
      dirHandle,
      siteData,
      storeConfig,
      storeProducts,
      eventCatalog,
      eventUiStrings,
      dirty,
    } = global.AdminState.state;
    if (!dirHandle) {
      global.AdminUI.showToast('Open a project folder first.', 'error');
      return;
    }
    if (!dirty) {
      global.AdminUI.showToast('Nothing to save.');
      return;
    }
    try {
      await global.AdminFS.saveProject(dirHandle, {
        siteData,
        storeConfig,
        storeProducts,
        eventCatalog,
        eventUiStrings,
      });
      global.AdminState.markClean();
      const open = !!(storeConfig && storeConfig.shopStatus && storeConfig.shopStatus.isOpen);
      global.AdminUI.showToast(
        '✓ Saved data.js + store.js + events.js' + (open ? ' · shop OPEN' : ' · shop CLOSED')
      );
    } catch (e) {
      global.AdminUI.showToast('Save failed: ' + e.message, 'error');
      console.error(e);
    }
  }

  global.AdminApp = {
    saveAll: onSaveClick,
  };

  function onNav(section) {
    if (!global.AdminState.state.siteData) return;
    if (global.AdminState.state.section === 'events' && section !== 'events') {
      global.AdminEvents?.flushEditForm?.();
    }
    global.AdminUI.setSection(section);
    if (section === 'blog') global.AdminPosts.onSectionShow();
    if (section === 'gallery') global.AdminGallery.onSectionShow();
    if (section === 'store' || section === 'shop') global.AdminStore.onSectionShow(section);
    if (section === 'events') global.AdminEvents?.onSectionShow?.();
  }

  function bind() {
    document.getElementById('btnOpen')?.addEventListener('click', onOpenClick);
    document.getElementById('btnReopen')?.addEventListener('click', onReopenClick);
    document.getElementById('btnSave')?.addEventListener('click', onSaveClick);
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => onNav(btn.dataset.nav));
    });

    global.AdminPosts.bind();
    global.AdminGallery.bind();
    global.AdminStore.bind();
    global.AdminEvents?.bind?.();

    window.addEventListener('beforeunload', (e) => {
      if (global.AdminState.state.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    if (!global.AdminFS.supportsFS()) {
      document.getElementById('fsWarning')?.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', bind);
})(window);
