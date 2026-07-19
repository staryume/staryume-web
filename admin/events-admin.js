// Events お品書き admin: list / clone / meta / menu images / visual hotspot editor
(function (global) {
  'use strict';

  let editingId = null;
  let menuIdx = 0;
  let selectedHotspot = -1;
  let drag = null; // { mode: 'move'|'resize'|'draw', startX, startY, origin, idx }

  function catalog() {
    return global.AdminState.state.eventCatalog || {};
  }

  function event() {
    return editingId ? catalog()[editingId] : null;
  }

  function menuImage() {
    const ev = event();
    if (!ev || !ev.menuImages || !ev.menuImages.length) return null;
    if (menuIdx < 0 || menuIdx >= ev.menuImages.length) menuIdx = 0;
    return ev.menuImages[menuIdx];
  }

  function productLabel(productId) {
    const p = event()?.products?.[productId];
    if (!p) return productId || '(none)';
    return p.title?.jp || p.title?.en || p.title?.zh || productId;
  }

  function showList() {
    editingId = null;
    selectedHotspot = -1;
    document.getElementById('eventListView')?.classList.remove('hidden');
    document.getElementById('eventEditView')?.classList.add('hidden');
    renderList();
  }

  function showEdit() {
    document.getElementById('eventListView')?.classList.add('hidden');
    document.getElementById('eventEditView')?.classList.remove('hidden');
  }

  function renderList() {
    const el = document.getElementById('eventList');
    if (!el) return;
    const cat = catalog();
    const ids = Object.keys(cat);
    if (!ids.length) {
      el.innerHTML =
        '<p class="text-sm text-gray-400 font-mono py-8 text-center">No events in events.js yet.</p>';
      return;
    }
    el.innerHTML = ids
      .map((id) => {
        const ev = cat[id];
        const title = global.AdminUI.displayTitle(ev.title);
        const nProd = Object.keys(ev.products || {}).length;
        const nMenus = (ev.menuImages || []).length;
        return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <div class="font-mono text-xs text-tech-purple font-bold">${global.AdminUI.escHtml(id)}</div>
            <div class="font-bold text-sm mt-0.5">${global.AdminUI.escHtml(title)}</div>
            <div class="text-[11px] text-gray-400 font-mono mt-1">${nMenus} menu page(s) · ${nProd} products</div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button type="button" data-edit-ev="${global.AdminUI.escHtml(id)}"
              class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-mono">Edit</button>
            <button type="button" data-clone-ev="${global.AdminUI.escHtml(id)}"
              class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">Clone</button>
          </div>
        </div>`;
      })
      .join('');

    el.querySelectorAll('[data-edit-ev]').forEach((b) => {
      b.addEventListener('click', () => openEdit(b.dataset.editEv));
    });
    el.querySelectorAll('[data-clone-ev]').forEach((b) => {
      b.addEventListener('click', () => cloneEvent(b.dataset.cloneEv));
    });
  }

  function cloneEvent(sourceId) {
    const src = catalog()[sourceId];
    if (!src) return;
    const suggested = sourceId + '-copy';
    const newId = window.prompt('New event id (used as blog post eventId):', suggested);
    if (!newId) return;
    const id = newId.trim().replace(/\s+/g, '-');
    if (!id) return;
    if (catalog()[id]) {
      global.AdminUI.showToast('Event id already exists: ' + id, 'error');
      return;
    }
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = id;
    if (copy.title) {
      for (const lang of global.AdminState.LANGS) {
        if (copy.title[lang]) copy.title[lang] = copy.title[lang] + ' (copy)';
      }
    }
    catalog()[id] = copy;
    global.AdminState.markDirty();
    global.AdminUI.showToast('Cloned → ' + id + ' — click Save all.');
    renderList();
  }

  function openEdit(id) {
    if (!catalog()[id]) return;
    editingId = id;
    menuIdx = 0;
    selectedHotspot = -1;
    fillForm();
    showEdit();
    renderMenuTabs();
    renderHotspots();
    fillProductSelect();
  }

  function fillForm() {
    const ev = event();
    if (!ev) return;
    document.getElementById('evEditHeading').textContent = 'Event: ' + editingId;
    document.getElementById('evId').value = editingId;
    document.getElementById('evMetaEvent').value = (ev.meta && ev.meta.event) || '';
    document.getElementById('evMetaDates').value = (ev.meta && ev.meta.dates) || '';
    document.getElementById('evCtaUrl').value = (ev.defaultCta && ev.defaultCta.url) || '';
    for (const lang of global.AdminState.LANGS) {
      document.getElementById('evTitle-' + lang).value = (ev.title && ev.title[lang]) || '';
      document.getElementById('evBooth-' + lang).value =
        (ev.meta && ev.meta.booth && ev.meta.booth[lang]) || '';
      document.getElementById('evCtaLabel-' + lang).value =
        (ev.defaultCta && ev.defaultCta.label && ev.defaultCta.label[lang]) || '';
    }
    fillMenuSrcField();
    renderProductTable();
  }

  function fillMenuSrcField() {
    const menu = menuImage();
    const input = document.getElementById('evMenuSrc');
    if (input) input.value = menu ? menu.src || '' : '';
    for (const lang of global.AdminState.LANGS) {
      const el = document.getElementById('evMenuLabel-' + lang);
      if (el) el.value = (menu && menu.label && menu.label[lang]) || '';
    }
  }

  function flushEditForm() {
    const ev = event();
    if (!ev) return;
    if (!ev.title) ev.title = {};
    if (!ev.meta) ev.meta = {};
    if (!ev.meta.booth) ev.meta.booth = {};
    if (!ev.defaultCta) ev.defaultCta = { label: {}, url: '', external: true };
    if (!ev.defaultCta.label) ev.defaultCta.label = {};

    ev.meta.event = document.getElementById('evMetaEvent')?.value.trim() || '';
    ev.meta.dates = document.getElementById('evMetaDates')?.value.trim() || '';
    ev.defaultCta.url = document.getElementById('evCtaUrl')?.value.trim() || '';
    for (const lang of global.AdminState.LANGS) {
      ev.title[lang] = document.getElementById('evTitle-' + lang)?.value.trim() || null;
      ev.meta.booth[lang] = document.getElementById('evBooth-' + lang)?.value.trim() || null;
      ev.defaultCta.label[lang] =
        document.getElementById('evCtaLabel-' + lang)?.value.trim() || null;
    }
    const menu = menuImage();
    if (menu) {
      menu.src = document.getElementById('evMenuSrc')?.value.trim() || menu.src;
      if (!menu.label) menu.label = {};
      for (const lang of global.AdminState.LANGS) {
        menu.label[lang] =
          document.getElementById('evMenuLabel-' + lang)?.value.trim() || null;
      }
    }
  }

  function onFormChange() {
    flushEditForm();
    global.AdminState.markDirty();
  }

  function renderMenuTabs() {
    const wrap = document.getElementById('evMenuTabs');
    const ev = event();
    if (!wrap || !ev) return;
    const menus = ev.menuImages || [];
    wrap.innerHTML = menus
      .map((m, i) => {
        const label = (m.label && (m.label.jp || m.label.en || m.label.zh)) || m.id || 'page' + (i + 1);
        const active = i === menuIdx;
        return `<button type="button" data-menu-idx="${i}"
          class="px-3 py-1.5 rounded-lg text-xs font-mono ${
            active ? 'bg-tech-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }">${global.AdminUI.escHtml(label)}</button>`;
      })
      .join('');
    wrap.querySelectorAll('[data-menu-idx]').forEach((b) => {
      b.addEventListener('click', () => {
        flushEditForm();
        menuIdx = Number(b.dataset.menuIdx);
        selectedHotspot = -1;
        fillMenuSrcField();
        renderMenuTabs();
        renderHotspots();
      });
    });
  }

  function renderProductTable() {
    const el = document.getElementById('evProductTable');
    const ev = event();
    if (!el || !ev) return;
    const order = ev.productOrder || Object.keys(ev.products || {});
    el.innerHTML = order
      .map((id) => {
        const p = ev.products[id];
        if (!p) return '';
        return `<tr class="border-b border-gray-50">
          <td class="py-1.5 pr-2 font-mono text-[11px] text-purple-700">${global.AdminUI.escHtml(id)}</td>
          <td class="py-1.5 text-xs">${global.AdminUI.escHtml(productLabel(id))}</td>
          <td class="py-1.5 text-[11px] text-gray-400 font-mono">${global.AdminUI.escHtml(p.category || '')}</td>
        </tr>`;
      })
      .join('');
  }

  function fillProductSelect() {
    const sel = document.getElementById('evHotspotProduct');
    const ev = event();
    if (!sel || !ev) return;
    const ids = ev.productOrder || Object.keys(ev.products || {});
    sel.innerHTML =
      '<option value="">— product —</option>' +
      ids
        .map(
          (id) =>
            `<option value="${global.AdminUI.escHtml(id)}">${global.AdminUI.escHtml(
              productLabel(id)
            )} (${global.AdminUI.escHtml(id)})</option>`
        )
        .join('');
    if (selectedHotspot >= 0) {
      const menu = menuImage();
      const h = menu && menu.hotspots && menu.hotspots[selectedHotspot];
      if (h) sel.value = h.productId || '';
    }
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function renderHotspots() {
    const stage = document.getElementById('evHotspotStage');
    const img = document.getElementById('evHotspotImg');
    const menu = menuImage();
    if (!stage || !img || !menu) {
      if (stage) stage.innerHTML = '';
      return;
    }
    img.src = menu.src || '';
    img.alt = editingId + ' menu';

    // Keep image, rebuild boxes
    let layer = document.getElementById('evHotspotLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'evHotspotLayer';
      layer.className = 'absolute inset-0';
      stage.appendChild(layer);
    }
    layer.innerHTML = '';

    (menu.hotspots || []).forEach((h, i) => {
      const [l, t, w, ht] = h.coords || [0, 0, 10, 10];
      const box = document.createElement('div');
      box.className =
        'ev-hotspot absolute border-2 box-border cursor-move select-none ' +
        (i === selectedHotspot
          ? 'border-tech-purple bg-purple-400/25 z-20'
          : 'border-pink-500/70 bg-pink-500/10 z-10');
      box.style.left = l + '%';
      box.style.top = t + '%';
      box.style.width = w + '%';
      box.style.height = ht + '%';
      box.dataset.idx = String(i);
      box.title = productLabel(h.productId);

      const label = document.createElement('span');
      label.className =
        'absolute left-0 top-0 max-w-full truncate text-[9px] font-mono bg-black/70 text-white px-1 leading-tight pointer-events-none';
      label.textContent = productLabel(h.productId);
      box.appendChild(label);

      const handle = document.createElement('div');
      handle.className =
        'absolute right-0 bottom-0 w-3 h-3 bg-tech-purple border border-black cursor-se-resize z-30';
      handle.dataset.resize = '1';
      box.appendChild(handle);

      box.addEventListener('mousedown', onBoxMouseDown);
      layer.appendChild(box);
    });

    updateHotspotMetaUI();
  }

  function updateHotspotMetaUI() {
    const menu = menuImage();
    const coordsEl = document.getElementById('evHotspotCoords');
    const sel = document.getElementById('evHotspotProduct');
    if (!menu || selectedHotspot < 0 || !menu.hotspots[selectedHotspot]) {
      if (coordsEl) coordsEl.textContent = 'No hotspot selected';
      if (sel) sel.value = '';
      return;
    }
    const h = menu.hotspots[selectedHotspot];
    const c = h.coords || [];
    if (coordsEl) {
      coordsEl.textContent = `coords: [${c.map((n) => round1(n)).join(', ')}] · ${h.productId || '?'}`;
    }
    if (sel) sel.value = h.productId || '';
  }

  function pctFromEvent(e) {
    const stage = document.getElementById('evHotspotStage');
    const rect = stage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }

  function onBoxMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const box = e.currentTarget;
    const idx = Number(box.dataset.idx);
    selectedHotspot = idx;
    fillProductSelect();
    renderHotspots();

    const menu = menuImage();
    const h = menu.hotspots[idx];
    const origin = (h.coords || [0, 0, 10, 10]).slice();
    const p = pctFromEvent(e);
    const isResize = e.target && e.target.dataset && e.target.dataset.resize === '1';
    drag = {
      mode: isResize ? 'resize' : 'move',
      startX: p.x,
      startY: p.y,
      origin,
      idx,
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onStageMouseDown(e) {
    if (e.target.closest('.ev-hotspot')) return;
    const menu = menuImage();
    if (!menu) return;
    const p = pctFromEvent(e);
    selectedHotspot = -1;
    drag = {
      mode: 'draw',
      startX: p.x,
      startY: p.y,
      origin: [p.x, p.y, 0, 0],
      idx: -1,
    };
    // temporary hotspot
    if (!menu.hotspots) menu.hotspots = [];
    menu.hotspots.push({ productId: '', coords: [p.x, p.y, 0.5, 0.5] });
    selectedHotspot = menu.hotspots.length - 1;
    drag.idx = selectedHotspot;
    renderHotspots();
    fillProductSelect();
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e) {
    if (!drag) return;
    const menu = menuImage();
    if (!menu || !menu.hotspots[drag.idx]) return;
    const p = pctFromEvent(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    let [l, t, w, ht] = drag.origin;

    if (drag.mode === 'move') {
      l = clamp(l + dx, 0, 100 - w);
      t = clamp(t + dy, 0, 100 - ht);
    } else if (drag.mode === 'resize' || drag.mode === 'draw') {
      if (drag.mode === 'draw') {
        l = Math.min(drag.startX, p.x);
        t = Math.min(drag.startY, p.y);
        w = Math.abs(p.x - drag.startX);
        ht = Math.abs(p.y - drag.startY);
      } else {
        w = clamp(w + dx, 1, 100 - l);
        ht = clamp(ht + dy, 1, 100 - t);
      }
    }

    menu.hotspots[drag.idx].coords = [round1(l), round1(t), round1(Math.max(w, 0.5)), round1(Math.max(ht, 0.5))];
    renderHotspots();
  }

  function onDragEnd() {
    if (drag) {
      const menu = menuImage();
      if (menu && menu.hotspots && drag.idx >= 0) {
        const h = menu.hotspots[drag.idx];
        // drop tiny draw boxes
        if (drag.mode === 'draw' && h && (h.coords[2] < 1 || h.coords[3] < 1)) {
          menu.hotspots.splice(drag.idx, 1);
          selectedHotspot = -1;
          renderHotspots();
        } else {
          global.AdminState.markDirty();
        }
      }
    }
    drag = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    updateHotspotMetaUI();
  }

  function addHotspot() {
    const menu = menuImage();
    if (!menu) return;
    if (!menu.hotspots) menu.hotspots = [];
    const ids = event().productOrder || Object.keys(event().products || {});
    menu.hotspots.push({
      productId: ids[0] || '',
      coords: [10, 10, 30, 20],
    });
    selectedHotspot = menu.hotspots.length - 1;
    global.AdminState.markDirty();
    renderHotspots();
    fillProductSelect();
  }

  function deleteHotspot() {
    const menu = menuImage();
    if (!menu || selectedHotspot < 0) return;
    menu.hotspots.splice(selectedHotspot, 1);
    selectedHotspot = -1;
    global.AdminState.markDirty();
    renderHotspots();
    fillProductSelect();
  }

  function onProductAssign() {
    const menu = menuImage();
    if (!menu || selectedHotspot < 0) return;
    const sel = document.getElementById('evHotspotProduct');
    menu.hotspots[selectedHotspot].productId = sel.value || '';
    global.AdminState.markDirty();
    renderHotspots();
  }

  async function pickMenuImage() {
    if (!global.AdminState.state.dirHandle) {
      global.AdminUI.showToast('Open project folder first.', 'error');
      return;
    }
    try {
      const path = await global.ImagePicker.open({
        folder: 'blog',
        namePrefix: editingId || 'menu',
        width: 1200,
        height: 1600,
      });
      if (!path) return;
      const menu = menuImage();
      if (!menu) return;
      menu.src = path;
      document.getElementById('evMenuSrc').value = path;
      global.AdminState.markDirty();
      renderHotspots();
      global.AdminUI.showToast('Menu image set.');
    } catch (e) {
      if (e.name !== 'AbortError') {
        global.AdminUI.showToast('Image pick failed: ' + e.message, 'error');
      }
    }
  }

  function onSectionShow() {
    showList();
  }

  function bind() {
    document.getElementById('btnCancelEvent')?.addEventListener('click', () => {
      flushEditForm();
      showList();
    });
    document.getElementById('btnAddHotspot')?.addEventListener('click', addHotspot);
    document.getElementById('btnDelHotspot')?.addEventListener('click', deleteHotspot);
    document.getElementById('evHotspotProduct')?.addEventListener('change', onProductAssign);
    document.getElementById('btnPickMenuImg')?.addEventListener('click', pickMenuImage);
    document.getElementById('evHotspotStage')?.addEventListener('mousedown', onStageMouseDown);

    [
      'evMetaEvent',
      'evMetaDates',
      'evCtaUrl',
      'evMenuSrc',
      'evTitle-jp',
      'evTitle-en',
      'evTitle-zh',
      'evBooth-jp',
      'evBooth-en',
      'evBooth-zh',
      'evCtaLabel-jp',
      'evCtaLabel-en',
      'evCtaLabel-zh',
      'evMenuLabel-jp',
      'evMenuLabel-en',
      'evMenuLabel-zh',
    ].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', onFormChange);
      document.getElementById(id)?.addEventListener('change', onFormChange);
    });

    document.getElementById('evMenuSrc')?.addEventListener('change', () => {
      onFormChange();
      renderHotspots();
    });
  }

  global.AdminEvents = {
    bind,
    onSectionShow,
    flushEditForm,
    showList,
  };
})(window);
