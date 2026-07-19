// Gallery CMS module
(function (global) {
  'use strict';

  let editingId = null;

  function renderList() {
    const el = document.getElementById('galleryList');
    if (!el || !global.AdminState.state.siteData) return;
    const items = global.AdminState.state.siteData.gallery || [];
    if (!items.length) {
      el.innerHTML = '<p class="text-center text-gray-400 py-12 font-mono text-sm">No gallery items.</p>';
      return;
    }
    el.innerHTML = items
      .map((g, index) => {
        return `
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition">
            <img src="${global.AdminUI.escHtml(g.src)}" onerror="this.style.display='none'" class="w-20 h-20 object-cover rounded-lg flex-shrink-0 border">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold px-2 py-0.5 rounded font-mono bg-gray-100">${global.AdminUI.escHtml(g.tag)}</span>
                <span class="text-xs text-gray-300 font-mono">#${g.id}</span>
              </div>
              <p class="text-xs text-gray-500 font-mono truncate">${global.AdminUI.escHtml(g.src)}</p>
            </div>
            <div class="flex flex-col gap-1 flex-shrink-0">
              <button type="button" data-g-up="${g.id}" class="px-2 py-1 text-xs font-mono bg-gray-50 rounded hover:bg-gray-100" ${index === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" data-g-down="${g.id}" class="px-2 py-1 text-xs font-mono bg-gray-50 rounded hover:bg-gray-100" ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
            </div>
            <div class="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              <button type="button" data-edit-g="${g.id}" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-mono">Edit</button>
              <button type="button" data-dup-g="${g.id}" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">Duplicate</button>
              <button type="button" data-del-g="${g.id}" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-mono">Delete</button>
            </div>
          </div>`;
      })
      .join('');

    el.querySelectorAll('[data-edit-g]').forEach((b) =>
      b.addEventListener('click', () => editItem(Number(b.dataset.editG)))
    );
    el.querySelectorAll('[data-dup-g]').forEach((b) =>
      b.addEventListener('click', () => duplicateItem(Number(b.dataset.dupG)))
    );
    el.querySelectorAll('[data-del-g]').forEach((b) =>
      b.addEventListener('click', () => deleteItem(Number(b.dataset.delG)))
    );
    el.querySelectorAll('[data-g-up]').forEach((b) =>
      b.addEventListener('click', () => moveItem(Number(b.dataset.gUp), -1))
    );
    el.querySelectorAll('[data-g-down]').forEach((b) =>
      b.addEventListener('click', () => moveItem(Number(b.dataset.gDown), 1))
    );
  }

  function showList() {
    document.getElementById('galleryListView')?.classList.remove('hidden');
    document.getElementById('galleryEditView')?.classList.add('hidden');
    renderList();
  }

  function showEdit() {
    document.getElementById('galleryListView')?.classList.add('hidden');
    document.getElementById('galleryEditView')?.classList.remove('hidden');
  }

  function updatePreview() {
    const src = document.getElementById('gSrc')?.value.trim();
    const wrap = document.getElementById('gPreviewWrap');
    const img = document.getElementById('gPreviewImg');
    if (!wrap || !img) return;
    if (src) {
      img.src = src;
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  }

  function newItem() {
    editingId = null;
    document.getElementById('galleryEditHeading').textContent = 'New gallery item';
    document.getElementById('gTag').value = 'FANART';
    document.getElementById('gSrc').value = '';
    updatePreview();
    showEdit();
  }

  function editItem(id) {
    const item = global.AdminState.state.siteData.gallery.find((g) => g.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('galleryEditHeading').textContent = 'Edit gallery #' + id;
    document.getElementById('gTag').value = item.tag || 'FANART';
    document.getElementById('gSrc').value = item.src || '';
    updatePreview();
    showEdit();
  }

  function saveItem() {
    const tag = document.getElementById('gTag').value.trim() || 'FANART';
    const src = document.getElementById('gSrc').value.trim();
    if (!src) {
      global.AdminUI.showToast('Image is required.', 'error');
      return;
    }
    const gallery = global.AdminState.state.siteData.gallery;
    if (editingId !== null) {
      const idx = gallery.findIndex((g) => g.id === editingId);
      if (idx !== -1) gallery[idx] = { id: editingId, tag, src };
      global.AdminUI.showToast('Gallery item updated — click Save all.');
    } else {
      gallery.unshift({ id: global.AdminState.nextGalleryId(), tag, src });
      global.AdminUI.showToast('Gallery item added — click Save all.');
    }
    global.AdminState.markDirty();
    showList();
  }

  function duplicateItem(id) {
    const src = global.AdminState.state.siteData.gallery.find((g) => g.id === id);
    if (!src) return;
    const copy = { id: global.AdminState.nextGalleryId(), tag: src.tag, src: src.src };
    const idx = global.AdminState.state.siteData.gallery.findIndex((g) => g.id === id);
    global.AdminState.state.siteData.gallery.splice(idx + 1, 0, copy);
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast(`Duplicated as #${copy.id}.`);
  }

  function deleteItem(id) {
    if (!global.AdminUI.confirmDialog(`Delete gallery item #${id}?\nImage file is kept on disk.`)) return;
    global.AdminState.state.siteData.gallery = global.AdminState.state.siteData.gallery.filter(
      (g) => g.id !== id
    );
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast('Deleted — click Save all.');
  }

  function moveItem(id, delta) {
    const arr = global.AdminState.state.siteData.gallery;
    const i = arr.findIndex((g) => g.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    global.AdminState.markDirty();
    renderList();
  }

  async function pickImage() {
    const path = await global.ImagePicker.open({
      folder: 'assets/gallery',
      namePrefix: 'g' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      width: 1200,
      height: 1600,
    });
    if (!path) return;
    document.getElementById('gSrc').value = path;
    updatePreview();
  }

  function bind() {
    document.getElementById('btnNewGallery')?.addEventListener('click', newItem);
    document.getElementById('btnCancelGallery')?.addEventListener('click', showList);
    document.getElementById('btnCancelGallery2')?.addEventListener('click', showList);
    document.getElementById('btnSaveGallery')?.addEventListener('click', saveItem);
    document.getElementById('btnPickGalleryImg')?.addEventListener('click', pickImage);
    document.getElementById('gSrc')?.addEventListener('input', updatePreview);
  }

  function onSectionShow() {
    showList();
  }

  global.AdminGallery = { bind, renderList, showList, onSectionShow };
})(window);
