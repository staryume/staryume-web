// File System Access API helpers for project-root directory
(function (global) {
  'use strict';

  const IDB_NAME = 'staryume-admin';
  const IDB_STORE = 'handles';
  const IDB_KEY = 'projectDir';

  function supportsFS() {
    return typeof window.showDirectoryPicker === 'function';
  }

  function openIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveDirHandle(handle) {
    try {
      const db = await openIdb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (_) {
      /* optional */
    }
  }

  async function loadDirHandle() {
    try {
      const db = await openIdb();
      const handle = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return handle || null;
    } catch (_) {
      return null;
    }
  }

  async function verifyPermission(handle, mode = 'readwrite') {
    if (!handle) return false;
    const opts = { mode };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if ((await handle.requestPermission(opts)) === 'granted') return true;
    return false;
  }

  async function pickDirectory() {
    if (!supportsFS()) {
      throw new Error('File System Access API not supported. Use Chrome or Edge.');
    }
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await saveDirHandle(handle);
    return handle;
  }

  async function reopenLastDirectory() {
    const handle = await loadDirHandle();
    if (!handle) return null;
    if (!(await verifyPermission(handle, 'readwrite'))) return null;
    return handle;
  }

  async function readTextFile(dirHandle, relativePath) {
    const fileHandle = await getFileHandleByPath(dirHandle, relativePath, false);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async function writeTextFile(dirHandle, relativePath, text) {
    const fileHandle = await getFileHandleByPath(dirHandle, relativePath, true);
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function writeBinaryFile(dirHandle, relativePath, blob) {
    const fileHandle = await getFileHandleByPath(dirHandle, relativePath, true);
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  function splitPath(relativePath) {
    return relativePath
      .replace(/^\.\//, '')
      .split('/')
      .filter(Boolean);
  }

  async function getFileHandleByPath(dirHandle, relativePath, create) {
    const parts = splitPath(relativePath);
    if (!parts.length) throw new Error('Invalid path');
    let dir = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: !!create });
    }
    return dir.getFileHandle(parts[parts.length - 1], { create: !!create });
  }

  function parseDataJs(text) {
    const fn = new Function(text + '\nreturn siteData;');
    return fn();
  }

  let storeJsRuntimeTail = '\n';

  function extractStoreJsTail(text) {
    const src = String(text || '');
    const marked = src.search(/\n\/\/ ── 裏 store unlock/);
    if (marked >= 0) return src.slice(marked);
    const fnAt = src.search(/\nfunction getUraConfig\s*\(/);
    if (fnAt >= 0) return src.slice(fnAt);
    return '';
  }

  function parseStoreJs(text) {
    const tail = extractStoreJsTail(text);
    if (tail && tail.trim()) {
      storeJsRuntimeTail = tail.startsWith('\n') ? tail : '\n' + tail;
    }
    const fn = new Function(text + '\nreturn { storeConfig, storeProducts };');
    return fn();
  }

  function parseEventsJs(text) {
    const fn = new Function(text + '\nreturn { eventCatalog, eventUiStrings };');
    return fn();
  }

  function serializeDataJs(siteData) {
    return '// GLOBAL SITE DATA\nconst siteData = ' + JSON.stringify(siteData, null, 4) + ';\n';
  }

  function serializeStoreJs(storeConfig, storeProducts) {
    const tail = storeJsRuntimeTail && storeJsRuntimeTail.trim()
      ? (storeJsRuntimeTail.startsWith('\n') ? storeJsRuntimeTail : '\n' + storeJsRuntimeTail)
      : '\n';
    return (
      '// STORE CONFIGURATION & DATABASE\n\n' +
      'const storeConfig = ' +
      JSON.stringify(storeConfig, null, 4) +
      ';\n\n' +
      'const storeProducts = ' +
      JSON.stringify(storeProducts, null, 4) +
      ';' +
      (tail.endsWith('\n') ? tail : tail + '\n')
    );
  }

  function serializeEventsJs(eventCatalog, eventUiStrings) {
    return (
      '// EVENT お品書き CATALOG\n' +
      '// Add new events as keys under eventCatalog. Link from a blog post via eventId.\n\n' +
      'const eventUiStrings = ' +
      JSON.stringify(eventUiStrings || {}, null, 4) +
      ';\n\n' +
      'const eventCatalog = ' +
      JSON.stringify(eventCatalog || {}, null, 4) +
      ';\n'
    );
  }

  async function fetchText(relativePath) {
    const res = await fetch('./' + String(relativePath).replace(/^\.\//, ''), { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load ' + relativePath + ' (' + res.status + ')');
    return res.text();
  }

  async function parseProjectTexts(dataText, storeText, eventsText) {
    const siteData = parseDataJs(dataText);
    const { storeConfig, storeProducts } = parseStoreJs(storeText);
    let eventCatalog = {};
    let eventUiStrings = {};
    if (eventsText) {
      try {
        const parsed = parseEventsJs(eventsText);
        eventCatalog = parsed.eventCatalog || {};
        eventUiStrings = parsed.eventUiStrings || {};
      } catch (e) {
        console.warn('events.js not parsed:', e.message);
      }
    }
    return { siteData, storeConfig, storeProducts, eventCatalog, eventUiStrings };
  }

  async function loadProjectFromHttp() {
    const dataText = await fetchText('data.js');
    const storeText = await fetchText('store.js');
    let eventsText = '';
    try {
      eventsText = await fetchText('event-catalog.js');
    } catch (e) {
      try {
        eventsText = await fetchText('events.js');
      } catch (e2) {
        console.warn('event-catalog.js not loaded:', e.message);
      }
    }
    return parseProjectTexts(dataText, storeText, eventsText);
  }

  async function loadProject(dirHandle) {
    const dataText = await readTextFile(dirHandle, 'data.js');
    const storeText = await readTextFile(dirHandle, 'store.js');
    let eventsText = '';
    try {
      eventsText = await readTextFile(dirHandle, 'event-catalog.js');
    } catch (e) {
      try {
        eventsText = await readTextFile(dirHandle, 'events.js');
      } catch (e2) {
        console.warn('event-catalog.js not loaded:', e.message);
      }
    }
    return parseProjectTexts(dataText, storeText, eventsText);
  }

  async function saveProject(
    dirHandle,
    { siteData, storeConfig, storeProducts, eventCatalog, eventUiStrings }
  ) {
    await writeTextFile(dirHandle, 'data.js', serializeDataJs(siteData));
    await writeTextFile(dirHandle, 'store.js', serializeStoreJs(storeConfig, storeProducts));
    if (eventCatalog && typeof eventCatalog === 'object') {
      await writeTextFile(
        dirHandle,
        'event-catalog.js',
        serializeEventsJs(eventCatalog, eventUiStrings)
      );
    }
  }

  function sanitizeFilename(name) {
    return String(name || 'image')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .slice(0, 120) || 'image';
  }

  function extFromMime(mime, fallback = 'png') {
    const map = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };
    return map[mime] || fallback;
  }

  /**
   * Write an image blob under project root.
   * @returns relative web path starting with ./
   */
  async function saveImageBlob(dirHandle, folderPath, filename, blob) {
    const safeName = sanitizeFilename(filename);
    const rel = folderPath.replace(/\/?$/, '/') + safeName;
    const webPath = './' + rel.replace(/^\.\//, '');
    await writeBinaryFile(dirHandle, rel.replace(/^\.\//, ''), blob);
    return webPath;
  }

  async function createPlaceholderPng(width, height, label) {
    const w = Math.max(1, Math.min(4000, Number(width) || 800));
    const h = Math.max(1, Math.min(4000, Number(height) || 600));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.01);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    ctx.fillStyle = '#6b7280';
    const fontSize = Math.max(14, Math.min(w, h) * 0.06);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = label || `${w} × ${h}`;
    ctx.fillText(text, w / 2, h / 2);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create placeholder'))),
        'image/png'
      );
    });
  }

  global.AdminFS = {
    supportsFS,
    pickDirectory,
    reopenLastDirectory,
    verifyPermission,
    loadProject,
    loadProjectFromHttp,
    saveProject,
    saveImageBlob,
    createPlaceholderPng,
    sanitizeFilename,
    extFromMime,
    readTextFile,
    writeTextFile,
    writeBinaryFile,
  };
})(window);
