// Image picker modal: upload | placeholder | external URL
(function (global) {
  'use strict';

  let resolvePick = null;
  let defaultFolder = 'assets/gallery';
  let defaultNamePrefix = 'img';

  function ensureModal() {
    if (document.getElementById('imagePickerModal')) return;
    const html = `
<div id="imagePickerModal" class="fixed inset-0 z-[200] hidden">
  <div class="absolute inset-0 bg-black/50" data-ip-close></div>
  <div class="relative mx-auto mt-10 mb-10 w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-mono font-bold text-lg">Insert image</h3>
      <button type="button" class="text-gray-400 hover:text-black text-xl leading-none" data-ip-close>&times;</button>
    </div>
    <div class="flex gap-2 mb-4 border-b border-gray-200 pb-2">
      <button type="button" data-ip-tab="upload" class="ip-tab px-3 py-1.5 text-sm font-mono rounded-t border-b-2 border-tech-black font-bold">Upload</button>
      <button type="button" data-ip-tab="placeholder" class="ip-tab px-3 py-1.5 text-sm font-mono rounded-t border-b-2 border-transparent text-gray-400">Placeholder</button>
      <button type="button" data-ip-tab="url" class="ip-tab px-3 py-1.5 text-sm font-mono rounded-t border-b-2 border-transparent text-gray-400">URL</button>
    </div>

    <div data-ip-panel="upload" class="space-y-3">
      <div id="ipDropzone" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:border-tech-purple hover:bg-purple-50 transition cursor-pointer">
        <p class="font-mono text-sm text-gray-600 mb-1">Drag & drop image here</p>
        <p class="text-xs text-gray-400">or click to choose file</p>
        <input type="file" id="ipFileInput" accept="image/*" class="hidden">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Save folder</label>
        <input id="ipFolder" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Filename (optional)</label>
        <input id="ipFilename" type="text" placeholder="auto from file" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <div id="ipUploadPreview" class="hidden">
        <img id="ipUploadPreviewImg" class="max-h-40 rounded border object-contain mx-auto" alt="preview">
      </div>
      <button type="button" id="ipUploadBtn" class="w-full py-2.5 bg-tech-black text-white rounded-lg font-mono text-sm hover:bg-gray-800 disabled:opacity-40" disabled>Use upload</button>
    </div>

    <div data-ip-panel="placeholder" class="hidden space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Width (px)</label>
          <input id="ipW" type="number" min="1" max="4000" value="800" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Height (px)</label>
          <input id="ipH" type="number" min="1" max="4000" value="600" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Label (optional)</label>
        <input id="ipLabel" type="text" placeholder="800 × 600" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Save folder</label>
        <input id="ipPhFolder" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Filename</label>
        <input id="ipPhName" type="text" value="placeholder.png" class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <canvas id="ipPhCanvas" class="w-full max-h-40 border rounded bg-gray-100 hidden"></canvas>
      <button type="button" id="ipPlaceholderBtn" class="w-full py-2.5 bg-tech-black text-white rounded-lg font-mono text-sm hover:bg-gray-800">Create placeholder</button>
    </div>

    <div data-ip-panel="url" class="hidden space-y-3">
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Image URL</label>
        <input id="ipUrl" type="url" placeholder="https://..." class="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50">
      </div>
      <div id="ipUrlPreview" class="hidden">
        <img id="ipUrlPreviewImg" class="max-h-40 rounded border object-contain mx-auto" alt="preview">
      </div>
      <button type="button" id="ipUrlBtn" class="w-full py-2.5 bg-tech-black text-white rounded-lg font-mono text-sm hover:bg-gray-800">Use URL</button>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    wireModal();
  }

  function wireModal() {
    const modal = document.getElementById('imagePickerModal');
    modal.querySelectorAll('[data-ip-close]').forEach((el) => {
      el.addEventListener('click', () => close(null));
    });

    modal.querySelectorAll('[data-ip-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.ipTab));
    });

    const drop = document.getElementById('ipDropzone');
    const fileInput = document.getElementById('ipFileInput');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('border-tech-purple', 'bg-purple-50');
    });
    drop.addEventListener('dragleave', () => {
      drop.classList.remove('border-tech-purple', 'bg-purple-50');
    });
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('border-tech-purple', 'bg-purple-50');
      const file = e.dataTransfer.files?.[0];
      if (file) setUploadFile(file);
    });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) setUploadFile(file);
    });

    document.getElementById('ipUploadBtn').addEventListener('click', onUploadConfirm);
    document.getElementById('ipPlaceholderBtn').addEventListener('click', onPlaceholderConfirm);
    document.getElementById('ipUrlBtn').addEventListener('click', onUrlConfirm);
    document.getElementById('ipUrl').addEventListener('input', () => {
      const url = document.getElementById('ipUrl').value.trim();
      const wrap = document.getElementById('ipUrlPreview');
      const img = document.getElementById('ipUrlPreviewImg');
      if (url) {
        img.src = url;
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
    });
  }

  let pendingFile = null;

  function setUploadFile(file) {
    if (!file.type.startsWith('image/')) {
      global.AdminUI.showToast('Please choose an image file.', 'error');
      return;
    }
    pendingFile = file;
    document.getElementById('ipFilename').value = file.name || '';
    const img = document.getElementById('ipUploadPreviewImg');
    img.src = URL.createObjectURL(file);
    document.getElementById('ipUploadPreview').classList.remove('hidden');
    document.getElementById('ipUploadBtn').disabled = false;
  }

  function switchTab(tab) {
    document.querySelectorAll('[data-ip-tab]').forEach((btn) => {
      const on = btn.dataset.ipTab === tab;
      btn.classList.toggle('border-tech-black', on);
      btn.classList.toggle('font-bold', on);
      btn.classList.toggle('text-gray-400', !on);
      btn.classList.toggle('border-transparent', !on);
    });
    document.querySelectorAll('[data-ip-panel]').forEach((p) => {
      p.classList.toggle('hidden', p.dataset.ipPanel !== tab);
    });
  }

  function open(options = {}) {
    ensureModal();
    defaultFolder = (options.folder || 'assets/gallery').replace(/^\.\//, '').replace(/\/?$/, '');
    defaultNamePrefix = options.namePrefix || 'img';
    pendingFile = null;
    document.getElementById('ipFolder').value = defaultFolder;
    document.getElementById('ipPhFolder').value = defaultFolder;
    document.getElementById('ipFilename').value = '';
    document.getElementById('ipPhName').value = `${defaultNamePrefix}-placeholder.png`;
    document.getElementById('ipUrl').value = '';
    document.getElementById('ipUploadPreview').classList.add('hidden');
    document.getElementById('ipUrlPreview').classList.add('hidden');
    document.getElementById('ipUploadBtn').disabled = true;
    document.getElementById('ipFileInput').value = '';
    document.getElementById('ipW').value = options.width || 800;
    document.getElementById('ipH').value = options.height || 600;
    switchTab('upload');
    document.getElementById('imagePickerModal').classList.remove('hidden');

    return new Promise((resolve) => {
      resolvePick = resolve;
    });
  }

  function close(result) {
    document.getElementById('imagePickerModal')?.classList.add('hidden');
    const r = resolvePick;
    resolvePick = null;
    if (r) r(result);
  }

  async function onUploadConfirm() {
    if (!pendingFile) return;
    const dir = global.AdminState.state.dirHandle;
    if (!dir) {
      global.AdminUI.showToast('Open project folder first.', 'error');
      return;
    }
    const folder = document.getElementById('ipFolder').value.trim().replace(/^\.\//, '');
    let name = document.getElementById('ipFilename').value.trim() || pendingFile.name;
    if (!/\.[a-z0-9]+$/i.test(name)) {
      name += '.' + global.AdminFS.extFromMime(pendingFile.type, 'jpg');
    }
    try {
      const path = await global.AdminFS.saveImageBlob(dir, folder, name, pendingFile);
      global.AdminState.markDirty();
      close(path);
    } catch (e) {
      global.AdminUI.showToast('Upload failed: ' + e.message, 'error');
    }
  }

  async function onPlaceholderConfirm() {
    const dir = global.AdminState.state.dirHandle;
    if (!dir) {
      global.AdminUI.showToast('Open project folder first.', 'error');
      return;
    }
    const w = Number(document.getElementById('ipW').value) || 800;
    const h = Number(document.getElementById('ipH').value) || 600;
    const label = document.getElementById('ipLabel').value.trim();
    const folder = document.getElementById('ipPhFolder').value.trim().replace(/^\.\//, '');
    let name = document.getElementById('ipPhName').value.trim() || 'placeholder.png';
    if (!/\.png$/i.test(name)) name += '.png';
    try {
      const blob = await global.AdminFS.createPlaceholderPng(w, h, label || null);
      const path = await global.AdminFS.saveImageBlob(dir, folder, name, blob);
      global.AdminState.markDirty();
      close(path);
    } catch (e) {
      global.AdminUI.showToast('Placeholder failed: ' + e.message, 'error');
    }
  }

  function onUrlConfirm() {
    const url = document.getElementById('ipUrl').value.trim();
    if (!url) {
      global.AdminUI.showToast('Enter a URL.', 'error');
      return;
    }
    close(url);
  }

  global.ImagePicker = { open, close };
})(window);
