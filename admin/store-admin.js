// Store products + shop settings CMS
(function (global) {
  'use strict';

  let editingId = null;
  let draftImgs = [];
  let currentLangTab = 'zh';

  const CAT_OPTIONS = ['featured', 'set', 'books', 'sleeves', 'tcg', 'other', 'goods', 'new'];

  function renderList() {
    const el = document.getElementById('storeList');
    if (!el || !global.AdminState.state.storeProducts) return;
    const products = [...global.AdminState.state.storeProducts].sort((a, b) => b.id - a.id);
    if (!products.length) {
      el.innerHTML = '<p class="text-center text-gray-400 py-12 font-mono text-sm">No products.</p>';
      return;
    }
    el.innerHTML = products
      .map((p) => {
        const title = global.AdminUI.displayTitle(p.title);
        const thumb = p.imgs && p.imgs[0];
        const imgHtml = thumb
          ? `<img src="${global.AdminUI.escHtml(thumb)}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 border" onerror="this.style.display='none'">`
          : `<div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">📦</div>`;
        const badges = [
          p.isNew ? '<span class="text-[10px] font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">NEW</span>' : '',
          p.isSoldOut
            ? '<span class="text-[10px] font-mono bg-red-100 text-red-600 px-1.5 py-0.5 rounded">SOLD OUT</span>'
            : '',
        ].join('');
        return `
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
            ${imgHtml}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xs text-gray-300 font-mono">#${p.id}</span>
                ${badges}
                <span class="text-xs text-gray-400 font-mono">${(p.regions || []).join(',')}</span>
                ${global.AdminUI.langChips(p.langs)}
              </div>
              <p class="font-semibold text-gray-800 truncate text-sm">${global.AdminUI.escHtml(title)}</p>
              <p class="text-xs text-gray-400 font-mono truncate">${(p.category || []).join(', ')}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              <button type="button" data-edit-p="${p.id}" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-mono">Edit</button>
              <button type="button" data-dup-p="${p.id}" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">Duplicate</button>
              <button type="button" data-del-p="${p.id}" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-mono">Delete</button>
            </div>
          </div>`;
      })
      .join('');

    el.querySelectorAll('[data-edit-p]').forEach((b) =>
      b.addEventListener('click', () => editProduct(Number(b.dataset.editP)))
    );
    el.querySelectorAll('[data-dup-p]').forEach((b) =>
      b.addEventListener('click', () => duplicateProduct(Number(b.dataset.dupP)))
    );
    el.querySelectorAll('[data-del-p]').forEach((b) =>
      b.addEventListener('click', () => deleteProduct(Number(b.dataset.delP)))
    );
  }

  function showList() {
    document.getElementById('storeListView')?.classList.remove('hidden');
    document.getElementById('storeEditView')?.classList.add('hidden');
    renderList();
  }

  function showEdit() {
    document.getElementById('storeListView')?.classList.add('hidden');
    document.getElementById('storeEditView')?.classList.remove('hidden');
  }

  function renderImgList() {
    const el = document.getElementById('pImgList');
    if (!el) return;
    if (!draftImgs.length) {
      el.innerHTML = '<p class="text-xs text-gray-400 font-mono">No images yet.</p>';
      return;
    }
    el.innerHTML = draftImgs
      .map(
        (src, i) => `
      <div class="flex items-center gap-2 border rounded-lg p-2 bg-gray-50">
        <img src="${global.AdminUI.escHtml(src)}" class="w-12 h-12 object-cover rounded border" onerror="this.classList.add('hidden')">
        <span class="flex-1 text-xs font-mono truncate">${global.AdminUI.escHtml(src)}</span>
        <button type="button" data-img-up="${i}" class="px-2 py-1 text-xs bg-white border rounded" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-img-down="${i}" class="px-2 py-1 text-xs bg-white border rounded" ${i === draftImgs.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-img-del="${i}" class="px-2 py-1 text-xs bg-red-50 text-red-500 rounded">✕</button>
      </div>`
      )
      .join('');
    el.querySelectorAll('[data-img-del]').forEach((b) =>
      b.addEventListener('click', () => {
        draftImgs.splice(Number(b.dataset.imgDel), 1);
        renderImgList();
      })
    );
    el.querySelectorAll('[data-img-up]').forEach((b) =>
      b.addEventListener('click', () => {
        const i = Number(b.dataset.imgUp);
        if (i <= 0) return;
        [draftImgs[i - 1], draftImgs[i]] = [draftImgs[i], draftImgs[i - 1]];
        renderImgList();
      })
    );
    el.querySelectorAll('[data-img-down]').forEach((b) =>
      b.addEventListener('click', () => {
        const i = Number(b.dataset.imgDown);
        if (i >= draftImgs.length - 1) return;
        [draftImgs[i], draftImgs[i + 1]] = [draftImgs[i + 1], draftImgs[i]];
        renderImgList();
      })
    );
  }

  function getCheckedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
  }

  function setCheckedValues(name, values) {
    const set = new Set(values || []);
    document.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      el.checked = set.has(el.value);
    });
  }

  function getLangToggles() {
    return {
      jp: document.getElementById('pLangOn-jp')?.checked !== false,
      en: document.getElementById('pLangOn-en')?.checked !== false,
      zh: document.getElementById('pLangOn-zh')?.checked !== false,
    };
  }

  function setLangToggles(langs) {
    for (const l of global.AdminState.LANGS) {
      const el = document.getElementById('pLangOn-' + l);
      if (el) el.checked = !!(langs && langs[l]);
    }
    updateLangFieldState();
  }

  function updateLangFieldState() {
    const toggles = getLangToggles();
    for (const l of global.AdminState.LANGS) {
      const panel = document.getElementById('p-panel-' + l);
      if (!panel) continue;
      panel.classList.toggle('opacity-50', !toggles[l]);
      const title = document.getElementById('pTitle-' + l);
      const desc = document.getElementById('pDesc-' + l);
      if (title) title.disabled = !toggles[l];
      if (desc) desc.disabled = !toggles[l];
    }
  }

  function switchLangTab(lang) {
    currentLangTab = lang;
    document.querySelectorAll('.store-lang-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.querySelectorAll('.store-lang-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById('p-panel-' + lang)?.classList.remove('hidden');
  }

  function newProduct() {
    editingId = null;
    document.getElementById('storeEditHeading').textContent = 'New product';
    setCheckedValues('pCat', ['featured']);
    setCheckedValues('pRegion', ['TW', 'HK']);
    document.getElementById('pPriceTW').value = 0;
    document.getElementById('pPriceHK').value = 0;
    document.getElementById('pLinkTW').value = '';
    document.getElementById('pLinkHK').value = '';
    document.getElementById('pIsNew').checked = true;
    document.getElementById('pIsSoldOut').checked = false;
    setLangToggles({ jp: false, en: true, zh: true });
    for (const l of global.AdminState.LANGS) {
      document.getElementById('pTitle-' + l).value = '';
      document.getElementById('pDesc-' + l).value = '';
    }
    draftImgs = [];
    renderImgList();
    showEdit();
    switchLangTab('zh');
  }

  function editProduct(id) {
    const p = global.AdminState.state.storeProducts.find((x) => x.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById('storeEditHeading').textContent = 'Edit product #' + id;
    setCheckedValues('pCat', p.category);
    setCheckedValues('pRegion', p.regions);
    document.getElementById('pPriceTW').value = p.priceTW ?? 0;
    document.getElementById('pPriceHK').value = p.priceHK ?? 0;
    document.getElementById('pLinkTW').value = p.linkTW || '';
    document.getElementById('pLinkHK').value = p.linkHK || '';
    document.getElementById('pIsNew').checked = !!p.isNew;
    document.getElementById('pIsSoldOut').checked = !!p.isSoldOut;
    setLangToggles(p.langs || { jp: false, en: true, zh: true });
    for (const l of global.AdminState.LANGS) {
      document.getElementById('pTitle-' + l).value = p.title[l] || '';
      document.getElementById('pDesc-' + l).value = p.desc[l] || '';
    }
    draftImgs = [...(p.imgs || [])];
    renderImgList();
    showEdit();
    switchLangTab(p.langs?.zh ? 'zh' : p.langs?.en ? 'en' : 'jp');
  }

  function collectProduct() {
    const langs = getLangToggles();
    if (!langs.jp && !langs.en && !langs.zh) {
      global.AdminUI.showToast('Enable at least one language.', 'error');
      return null;
    }
    const title = {};
    const desc = {};
    for (const l of global.AdminState.LANGS) {
      if (langs[l]) {
        title[l] = document.getElementById('pTitle-' + l).value.trim() || null;
        desc[l] = document.getElementById('pDesc-' + l).value.trim() || null;
      } else {
        title[l] = null;
        desc[l] = null;
      }
    }
    if (!Object.values(title).some(Boolean)) {
      global.AdminUI.showToast('Enter a title for at least one enabled language.', 'error');
      return null;
    }
    const existing =
      editingId !== null
        ? global.AdminState.state.storeProducts.find((p) => p.id === editingId)
        : null;
    return {
      ...(existing || {}),
      id: editingId !== null ? editingId : global.AdminState.nextProductId(),
      category: getCheckedValues('pCat'),
      regions: getCheckedValues('pRegion'),
      isNew: document.getElementById('pIsNew').checked,
      isSoldOut: document.getElementById('pIsSoldOut').checked,
      langs,
      title,
      desc,
      priceTW: Number(document.getElementById('pPriceTW').value) || 0,
      priceHK: Number(document.getElementById('pPriceHK').value) || 0,
      imgs: [...draftImgs],
      linkTW: document.getElementById('pLinkTW').value.trim() || null,
      linkHK: document.getElementById('pLinkHK').value.trim() || null,
    };
  }

  function saveProduct() {
    const product = collectProduct();
    if (!product) return;
    const list = global.AdminState.state.storeProducts;
    if (editingId !== null) {
      const idx = list.findIndex((p) => p.id === editingId);
      if (idx !== -1) list[idx] = product;
      global.AdminUI.showToast('Product updated — click Save all.');
    } else {
      list.push(product);
      global.AdminUI.showToast(`Product #${product.id} created — click Save all.`);
    }
    global.AdminState.markDirty();
    showList();
  }

  function duplicateProduct(id) {
    const src = global.AdminState.state.storeProducts.find((p) => p.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = global.AdminState.nextProductId();
    for (const l of global.AdminState.LANGS) {
      if (copy.title[l]) {
        const suffix = l === 'jp' ? ' (コピー)' : l === 'zh' ? '（複製）' : ' (copy)';
        copy.title[l] = copy.title[l] + suffix;
      }
    }
    global.AdminState.state.storeProducts.push(copy);
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast(`Duplicated as #${copy.id}.`);
  }

  function deleteProduct(id) {
    const p = global.AdminState.state.storeProducts.find((x) => x.id === id);
    const name = p ? global.AdminUI.displayTitle(p.title) : 'product';
    if (!global.AdminUI.confirmDialog(`Delete product #${id}: "${name}"?`)) return;
    global.AdminState.state.storeProducts = global.AdminState.state.storeProducts.filter(
      (x) => x.id !== id
    );
    global.AdminState.markDirty();
    renderList();
    global.AdminUI.showToast('Deleted — click Save all.');
  }

  async function addImage() {
    const id = editingId || 'new';
    const path = await global.ImagePicker.open({
      folder: `assets/store/${id}`,
      namePrefix: 'product',
      width: 800,
      height: 800,
    });
    if (!path) return;
    draftImgs.push(path);
    renderImgList();
  }

  let loadingShopForm = false;

  function updateShopStatusHint() {
    const hint = document.getElementById('shopOpenHint');
    const open = document.getElementById('shopIsOpen')?.checked;
    if (!hint) return;
    hint.textContent = open
      ? 'Storefront is OPEN — customers can buy when you Save all.'
      : 'Storefront is CLOSED — shows next-open message on the site.';
    hint.className =
      'text-xs font-mono mt-1 ' + (open ? 'text-green-700' : 'text-amber-700');
  }

  function loadShopSettings() {
    const cfg = global.AdminState.state.storeConfig;
    if (!cfg) return;
    loadingShopForm = true;
    document.getElementById('shopIsOpen').checked = !!cfg.shopStatus?.isOpen;
    document.getElementById('shopNextOpen').value = cfg.shopStatus?.nextOpenDate || '';
    document.getElementById('bannerImg').value = cfg.banner?.img || '';
    document.getElementById('bannerLink').value = cfg.banner?.link || '';
    document.getElementById('bannerText').value = cfg.banner?.text || '';
    loadingShopForm = false;
    updateShopStatusHint();
  }

  /** Copy shop form → in-memory storeConfig. Safe to call before Save all. */
  function flushShopSettings() {
    const cfg = global.AdminState.state.storeConfig;
    if (!cfg) return false;
    const isOpen = !!document.getElementById('shopIsOpen')?.checked;
    const nextOpenDate = (document.getElementById('shopNextOpen')?.value || '').trim();
    const img = (document.getElementById('bannerImg')?.value || '').trim();
    const link = (document.getElementById('bannerLink')?.value || '').trim() || '#';
    const text = (document.getElementById('bannerText')?.value || '').trim();

    const prevOpen = !!cfg.shopStatus?.isOpen;
    const prevNext = cfg.shopStatus?.nextOpenDate || '';
    const prevImg = cfg.banner?.img || '';
    const prevLink = cfg.banner?.link || '#';
    const prevText = cfg.banner?.text || '';

    cfg.shopStatus = { isOpen, nextOpenDate };
    cfg.banner = { img, link, text };

    const changed =
      prevOpen !== isOpen ||
      prevNext !== nextOpenDate ||
      prevImg !== img ||
      prevLink !== link ||
      prevText !== text;

    if (changed) global.AdminState.markDirty();
    updateShopStatusHint();
    return changed;
  }

  function onShopFieldChange() {
    if (loadingShopForm) return;
    flushShopSettings();
  }

  function saveShopSettings() {
    flushShopSettings();
    // Write to disk immediately (same as header Save all)
    if (typeof global.AdminApp?.saveAll === 'function') {
      global.AdminApp.saveAll();
    } else {
      global.AdminState.markDirty();
      global.AdminUI.showToast('Shop settings updated — click Save all.');
    }
  }

  async function pickBanner() {
    const path = await global.ImagePicker.open({
      folder: 'assets/coreimg',
      namePrefix: 'banner',
      width: 1600,
      height: 400,
    });
    if (!path) return;
    document.getElementById('bannerImg').value = path;
    flushShopSettings();
  }

  function renderCatCheckboxes() {
    const el = document.getElementById('pCatBoxes');
    if (!el) return;
    el.innerHTML = CAT_OPTIONS.map(
      (c) => `
      <label class="inline-flex items-center gap-1.5 text-xs font-mono bg-gray-50 border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100">
        <input type="checkbox" name="pCat" value="${c}" class="rounded"> ${c}
      </label>`
    ).join('');
  }

  function bind() {
    renderCatCheckboxes();
    document.getElementById('btnNewProduct')?.addEventListener('click', newProduct);
    document.getElementById('btnCancelProduct')?.addEventListener('click', showList);
    document.getElementById('btnCancelProduct2')?.addEventListener('click', showList);
    document.getElementById('btnSaveProduct')?.addEventListener('click', saveProduct);
    document.getElementById('btnAddProductImg')?.addEventListener('click', addImage);
    document.getElementById('btnSaveShop')?.addEventListener('click', saveShopSettings);
    document.getElementById('btnPickBanner')?.addEventListener('click', pickBanner);

    // Live-sync shop fields so toggle is never lost before Apply / Save all
    document.getElementById('shopIsOpen')?.addEventListener('change', onShopFieldChange);
    document.getElementById('shopNextOpen')?.addEventListener('input', onShopFieldChange);
    document.getElementById('bannerImg')?.addEventListener('input', onShopFieldChange);
    document.getElementById('bannerLink')?.addEventListener('input', onShopFieldChange);
    document.getElementById('bannerText')?.addEventListener('input', onShopFieldChange);

    document.querySelectorAll('.store-lang-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchLangTab(btn.dataset.lang));
    });
    for (const l of global.AdminState.LANGS) {
      document.getElementById('pLangOn-' + l)?.addEventListener('change', updateLangFieldState);
    }
  }

  function onSectionShow(section) {
    if (section === 'store') showList();
    if (section === 'shop') loadShopSettings();
  }

  global.AdminStore = {
    bind,
    renderList,
    showList,
    loadShopSettings,
    flushShopSettings,
    onSectionShow,
  };
})(window);
