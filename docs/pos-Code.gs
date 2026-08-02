// ── STARYUME Inventory + Event POS — paste into Apps Script bound to the Inventory sheet ──
// Setup: docs/pos-apps-script.md
// Deploy as Web App: Execute as Me · Anyone can access
// Script Properties (recommended): POS_PASSCODE, INVENTORY_SERVICE_KEY
// Or set defaults below (rotate after first deploy).

var POS_PASSCODE = 'CHANGE_ME';
/** Shared secret for web-store order script to deduct limited stock (not staff passcode). */
var INVENTORY_SERVICE_KEY = 'CHANGE_ME_SERVICE';
/** When true, HK paid limited lines hard-reject if pool stock is insufficient. */
var HARD_REJECT_HK_LIMITED = true;
/** Allow stock to go negative on soft-accept paths (web TW / service deduct). */
var ALLOW_NEGATIVE_STOCK = false;
/**
 * Optional but strongly recommended: paste the spreadsheet ID from the Sheet URL
 *   https://docs.google.com/spreadsheets/d/THIS_PART/edit
 * Web apps sometimes cannot use getActiveSpreadsheet(); openById is reliable.
 * Script Property SPREADSHEET_ID overrides this value.
 */
var SPREADSHEET_ID = '';

var POOLS = ['HK', 'TW', 'JP', 'BOOTH', 'HOME'];
var CURRENCIES = { HK: 'HKD', TW: 'TWD', JP: 'JPY', BOOTH: 'JPY', HOME: 'HKD' };

/** Append-only new columns so existing sheet data columns do not shift. */
var PRODUCT_HEADERS = [
  'sku', 'source', 'storeId', 'stockMode',
  'nameZh', 'nameEn', 'nameJp',
  'priceHKD', 'priceTWD', 'priceJPY',
  'stockHK', 'stockTW', 'stockJP', 'stockBOOTH', 'stockHOME',
  'category', 'thumbUrl', 'active', 'notes', 'updatedAt',
  'productCreateDate', 'parentSku', 'productKind', 'sortOrder'
];

/** Default placeholder sub-products created under each set. */
var SET_PLACEHOLDER_COUNT = 6;

var EVENT_HEADERS = [
  'eventId', 'name', 'region', 'currency', 'status',
  'startDate', 'endDate', 'activeDay', 'notes', 'updatedAt'
];

var SALE_HEADERS = [
  'saleId', 'eventId', 'day', 'region', 'channel',
  'sku', 'name', 'qty', 'unitPrice', 'lineTotal', 'currency',
  'soldAt', 'device', 'voided', 'orderId', 'notes'
];

// ── Entry ───────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var data = JSON.parse(e.postData.contents);
    ensureSheets_();

    var action = String(data.action || '').toLowerCase();

    // Service key path (web store order deduct / check only)
    if (action === 'web_deduct' || action === 'web_check') {
      if (!authService_(data)) {
        return jsonOut_({ ok: false, error: 'unauthorized', message: 'Invalid service key.' });
      }
      if (action === 'web_check') return handleWebCheck_(data);
      return handleWebDeduct_(data);
    }

    // Staff passcode required for everything else
    if (!authStaff_(data)) {
      return jsonOut_({ ok: false, error: 'unauthorized', message: '通關密碼錯誤。' });
    }

    if (action === 'ping') return jsonOut_({ ok: true, pong: true, ts: new Date().toISOString() });
    if (action === 'list_products') return handleListProducts_(data);
    if (action === 'upsert_product') return handleUpsertProduct_(data);
    if (action === 'delete_product') return handleDeleteProduct_(data);
    if (action === 'set_stock') return handleSetStock_(data);
    if (action === 'import_store') return handleImportStore_(data);
    if (action === 'ensure_set_components') return handleEnsureSetComponents_(data);
    if (action === 'list_events') return handleListEvents_(data);
    if (action === 'upsert_event') return handleUpsertEvent_(data);
    if (action === 'set_event_status') return handleSetEventStatus_(data);
    if (action === 'record_sale') return handleRecordSale_(data);
    if (action === 'void_sale') return handleVoidSale_(data);
    if (action === 'list_sales') return handleListSales_(data);
    if (action === 'daily_summary') return handleDailySummary_(data);
    if (action === 'bootstrap') return handleBootstrap_(data);

    return jsonOut_({ ok: false, error: 'unknown_action', message: 'Unknown action: ' + action });
  } catch (err) {
    console.error(String(err) + '\n' + (err.stack || ''));
    return jsonOut_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function doGet() {
  return ContentService
    .createTextOutput('STARYUME Inventory POS endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── Auth ────────────────────────────────────────────────────────────────────

function authStaff_(data) {
  var expected = scriptProp_('POS_PASSCODE', POS_PASSCODE);
  var got = String(data.passcode || data.password || '');
  return expected && got && got === expected;
}

function authService_(data) {
  var expected = scriptProp_('INVENTORY_SERVICE_KEY', INVENTORY_SERVICE_KEY);
  var got = String(data.serviceKey || '');
  return expected && got && got === expected && expected !== 'CHANGE_ME_SERVICE';
}

function scriptProp_(key, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(key);
    if (v != null && String(v).length) return String(v);
  } catch (e) { /* ignore */ }
  return fallback;
}

// ── Sheets ──────────────────────────────────────────────────────────────────

function ss_() {
  var id = scriptProp_('SPREADSHEET_ID', SPREADSHEET_ID);
  if (id && String(id).length > 10) {
    return SpreadsheetApp.openById(String(id).trim());
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(
    'No spreadsheet bound. Set SPREADSHEET_ID in Script Properties ' +
    '(Sheet URL …/d/SPREADSHEET_ID/edit) and redeploy the web app.'
  );
}

function sheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureSheets_() {
  ensureHeader_(sheet_('Products'), PRODUCT_HEADERS);
  ensureHeader_(sheet_('Events'), EVENT_HEADERS);
  ensureHeader_(sheet_('Sales'), SALE_HEADERS);
  ensureHeader_(sheet_('StockLog'), [
    'timestamp', 'sku', 'pool', 'fromQty', 'toQty', 'source', 'note'
  ]);
}

function ensureHeader_(sh, headers) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    return;
  }
  var existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  var need = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(existing[i] || '') !== headers[i]) { need = true; break; }
  }
  if (need) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
}

function colIndex_(headers, name) {
  var i = headers.indexOf(name);
  return i >= 0 ? i : -1;
}

// ── Products ────────────────────────────────────────────────────────────────

function productRows_() {
  var sh = sheet_('Products');
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last, PRODUCT_HEADERS.length).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (!row[0]) continue;
    out.push(rowToProduct_(row, r + 2));
  }
  return out;
}

function rowToProduct_(row, sheetRow) {
  var updatedAt = row[19] ? String(row[19]) : '';
  var createDate = row[20] ? String(row[20]) : '';
  if (!createDate && updatedAt) createDate = updatedAt;
  var kind = String(row[22] || '').toLowerCase();
  if (kind !== 'set' && kind !== 'component' && kind !== 'standalone') {
    kind = row[21] ? 'component' : (String(row[15] || '') === 'set' ? 'set' : 'standalone');
  }
  return {
    sku: String(row[0] || ''),
    source: String(row[1] || 'pos_only'),
    storeId: row[2] !== '' && row[2] != null ? Number(row[2]) || String(row[2]) : '',
    stockMode: String(row[3] || 'limited').toLowerCase() === 'unlimited' ? 'unlimited' : 'limited',
    nameZh: String(row[4] || ''),
    nameEn: String(row[5] || ''),
    nameJp: String(row[6] || ''),
    priceHKD: num_(row[7]),
    priceTWD: num_(row[8]),
    priceJPY: num_(row[9]),
    stockHK: int_(row[10]),
    stockTW: int_(row[11]),
    stockJP: int_(row[12]),
    stockBOOTH: int_(row[13]),
    stockHOME: int_(row[14]),
    category: String(row[15] || ''),
    thumbUrl: String(row[16] || ''),
    active: row[17] === false || row[17] === 'FALSE' || row[17] === 'false' || row[17] === 0 ? false : true,
    notes: String(row[18] || ''),
    updatedAt: updatedAt,
    productCreateDate: createDate,
    parentSku: String(row[21] || ''),
    productKind: kind,
    sortOrder: int_(row[23]),
    _row: sheetRow
  };
}

function productToRow_(p) {
  var kind = p.productKind || 'standalone';
  if (kind !== 'set' && kind !== 'component' && kind !== 'standalone') kind = 'standalone';
  return [
    p.sku,
    p.source || 'pos_only',
    p.storeId != null ? p.storeId : '',
    p.stockMode === 'unlimited' ? 'unlimited' : 'limited',
    p.nameZh || '',
    p.nameEn || '',
    p.nameJp || '',
    num_(p.priceHKD),
    num_(p.priceTWD),
    num_(p.priceJPY),
    int_(p.stockHK),
    int_(p.stockTW),
    int_(p.stockJP),
    int_(p.stockBOOTH),
    int_(p.stockHOME),
    p.category || '',
    p.thumbUrl || '',
    p.active === false ? false : true,
    p.notes || '',
    p.updatedAt || new Date().toISOString(),
    p.productCreateDate || p.updatedAt || new Date().toISOString(),
    p.parentSku || '',
    kind,
    int_(p.sortOrder)
  ];
}

function sortProductsNewestFirst_(products) {
  return products.slice().sort(function (a, b) {
    var da = String(a.productCreateDate || a.updatedAt || '');
    var db = String(b.productCreateDate || b.updatedAt || '');
    if (da !== db) return db.localeCompare(da);
    return String(a.sku || '').localeCompare(String(b.sku || ''));
  });
}

function publicProduct_(p) {
  var c = Object.assign({}, p);
  delete c._row;
  return c;
}

/**
 * Create Sub 1…N placeholders under a set if it has no components yet.
 * Returns { created, skipped }.
 */
function ensureSetPlaceholders_(parentSku, count) {
  parentSku = String(parentSku || '');
  count = count > 0 ? int_(count) : SET_PLACEHOLDER_COUNT;
  if (!parentSku) return { created: 0, skipped: true };

  var all = productRows_();
  var hasChild = false;
  for (var i = 0; i < all.length; i++) {
    if (all[i].parentSku === parentSku) {
      hasChild = true;
      break;
    }
  }
  if (hasChild) return { created: 0, skipped: true };

  var parent = null;
  for (var j = 0; j < all.length; j++) {
    if (all[j].sku === parentSku) {
      parent = all[j];
      break;
    }
  }
  if (!parent) return { created: 0, skipped: true, error: 'parent_not_found' };

  var sh = sheet_('Products');
  var now = new Date().toISOString();
  var created = 0;
  for (var n = 1; n <= count; n++) {
    var sku = parentSku + '__c' + n;
    var exists = false;
    for (var k = 0; k < all.length; k++) {
      if (all[k].sku === sku) {
        exists = true;
        break;
      }
    }
    if (exists) continue;
    var p = {
      sku: sku,
      source: 'set_component',
      storeId: '',
      stockMode: 'limited',
      nameZh: '（內容 ' + n + '）',
      nameEn: 'Content ' + n,
      nameJp: '（内容 ' + n + '）',
      priceHKD: 0,
      priceTWD: 0,
      priceJPY: 0,
      stockHK: 0,
      stockTW: 0,
      stockJP: 0,
      stockBOOTH: 0,
      stockHOME: 0,
      category: 'component',
      thumbUrl: parent.thumbUrl || '',
      active: true,
      notes: 'placeholder',
      updatedAt: now,
      productCreateDate: now,
      parentSku: parentSku,
      productKind: 'component',
      sortOrder: n
    };
    sh.appendRow(productToRow_(p));
    created++;
  }
  return { created: created, skipped: false };
}

function findProductBySku_(sku) {
  sku = String(sku || '');
  if (!sku) return null;
  var products = productRows_();
  for (var i = 0; i < products.length; i++) {
    if (products[i].sku === sku) return products[i];
  }
  return null;
}

function findProductByStoreId_(storeId) {
  if (storeId === '' || storeId == null) return null;
  var sid = String(storeId);
  var products = productRows_();
  for (var i = 0; i < products.length; i++) {
    if (String(products[i].storeId) === sid) return products[i];
  }
  // also match sku store-<id>
  var alt = 'store-' + sid;
  for (var j = 0; j < products.length; j++) {
    if (products[j].sku === alt) return products[j];
  }
  return null;
}

function stockKey_(pool) {
  pool = String(pool || '').toUpperCase();
  return 'stock' + pool;
}

function getPoolStock_(product, pool) {
  var k = stockKey_(pool);
  return int_(product[k]);
}

function setPoolStockOnProduct_(product, pool, qty) {
  product[stockKey_(pool)] = int_(qty);
}

function handleListProducts_(data) {
  var products = productRows_();
  if (data.activeOnly) {
    products = products.filter(function (p) { return p.active; });
  }
  products = sortProductsNewestFirst_(products).map(publicProduct_);
  return jsonOut_({ ok: true, products: products });
}

function handleUpsertProduct_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var p = data.product || data;
    if (!p || !p.sku) {
      return jsonOut_({ ok: false, error: 'missing_sku', message: 'sku is required.' });
    }
    p.sku = String(p.sku).trim();
    p.updatedAt = new Date().toISOString();
    if (p.stockMode !== 'unlimited') p.stockMode = 'limited';
    if (p.source !== 'store' && p.source !== 'set_component') {
      p.source = p.source || 'pos_only';
    }

    var existing = findProductBySku_(p.sku);
    var sh = sheet_('Products');
    if (existing) {
      var merged = Object.assign({}, existing, p);
      delete merged._row;
      if (p.stockHK == null) merged.stockHK = existing.stockHK;
      if (p.stockTW == null) merged.stockTW = existing.stockTW;
      if (p.stockJP == null) merged.stockJP = existing.stockJP;
      if (p.stockBOOTH == null) merged.stockBOOTH = existing.stockBOOTH;
      if (p.stockHOME == null) merged.stockHOME = existing.stockHOME;
      // never overwrite create date once set
      merged.productCreateDate = existing.productCreateDate || merged.productCreateDate || existing.updatedAt || p.updatedAt;
      if (p.parentSku === undefined) merged.parentSku = existing.parentSku;
      if (p.productKind === undefined) merged.productKind = existing.productKind;
      if (p.sortOrder == null) merged.sortOrder = existing.sortOrder;
      sh.getRange(existing._row, 1, 1, PRODUCT_HEADERS.length).setValues([productToRow_(merged)]);
      return jsonOut_({ ok: true, product: publicProduct_(merged), created: false });
    }

    p.productCreateDate = p.productCreateDate || new Date().toISOString();
    if (!p.productKind) {
      if (p.parentSku) p.productKind = 'component';
      else if (String(p.category || '') === 'set') p.productKind = 'set';
      else p.productKind = 'standalone';
    }
    p.parentSku = p.parentSku || '';
    p.sortOrder = int_(p.sortOrder);
    sh.appendRow(productToRow_(p));
    return jsonOut_({ ok: true, product: publicProduct_(p), created: true });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteProduct_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sku = String(data.sku || '');
    var existing = findProductBySku_(sku);
    if (!existing) return jsonOut_({ ok: false, error: 'not_found' });
    if (!data.force) {
      var kids = productRows_().filter(function (p) { return p.parentSku === sku; });
      if (kids.length) {
        return jsonOut_({
          ok: false,
          error: 'has_children',
          message: '此套組尚有 ' + kids.length + ' 個子項目。請先刪除子項目，或 force 刪除。',
          childCount: kids.length
        });
      }
    }
    sheet_('Products').deleteRow(existing._row);
    return jsonOut_({ ok: true, deleted: sku });
  } finally {
    lock.releaseLock();
  }
}

function handleSetStock_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sku = String(data.sku || '');
    var existing = findProductBySku_(sku);
    if (!existing) {
      return jsonOut_({
        ok: false,
        error: 'not_found',
        message: 'Product not found: ' + sku
      });
    }

    var pools = data.stocks || {};
    // also accept single pool + qty
    if (data.pool != null && data.qty != null) {
      pools[String(data.pool).toUpperCase()] = data.qty;
    }

    // Accept lowercase keys from clients
    var normalized = {};
    for (var k in pools) {
      if (pools.hasOwnProperty(k) && pools[k] != null && pools[k] !== '') {
        normalized[String(k).toUpperCase()] = pools[k];
      }
    }

    var changed = [];
    var anyPool = false;
    POOLS.forEach(function (pool) {
      if (normalized[pool] == null) return;
      anyPool = true;
      var fromQty = getPoolStock_(existing, pool);
      var toQty = int_(normalized[pool]);
      setPoolStockOnProduct_(existing, pool, toQty);
      if (fromQty !== toQty) {
        changed.push({ pool: pool, from: fromQty, to: toQty });
        logStockChange_(sku, pool, fromQty, toQty, 'set_stock', data.note || '');
      }
    });

    if (!anyPool) {
      return jsonOut_({
        ok: false,
        error: 'no_stocks',
        message: 'No stock values received. Try SAVE again.'
      });
    }

    if (data.stockMode === 'limited' || data.stockMode === 'unlimited') {
      existing.stockMode = data.stockMode;
    }
    existing.updatedAt = new Date().toISOString();
    sheet_('Products').getRange(existing._row, 1, 1, PRODUCT_HEADERS.length)
      .setValues([productToRow_(existing)]);
    SpreadsheetApp.flush();

    // Re-read row to confirm persistence
    var sh = sheet_('Products');
    var confirmRow = sh.getRange(existing._row, 1, 1, PRODUCT_HEADERS.length).getValues()[0];
    var confirmed = rowToProduct_(confirmRow, existing._row);
    var out = Object.assign({}, confirmed);
    delete out._row;

    var ss = ss_();
    return jsonOut_({
      ok: true,
      product: out,
      changed: changed,
      spreadsheet: { id: ss.getId(), name: ss.getName() }
    });
  } finally {
    lock.releaseLock();
  }
}

function logStockChange_(sku, pool, fromQty, toQty, source, note) {
  try {
    sheet_('StockLog').appendRow([
      new Date().toISOString(),
      sku,
      pool,
      fromQty,
      toQty,
      source || '',
      note || ''
    ]);
  } catch (e) {
    console.error('StockLog write failed: ' + e);
  }
}

/**
 * Import products from client-sent storeProducts snapshot.
 * data.products: [{ id, title:{zh,en,jp}, priceHK, priceTW, priceJP?, category, imgs, isPreorder, isSoldOut }]
 * data.preserveStock: true (default) — keep existing pool qty + stockMode
 */
function handleImportStore_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var list = data.products || [];
    if (!list.length) return jsonOut_({ ok: false, error: 'empty_import' });
    var preserve = data.preserveStock !== false;
    var created = 0;
    var updated = 0;
    var sh = sheet_('Products');

    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var storeId = s.id != null ? s.id : s.storeId;
      if (storeId == null || storeId === '') continue;
      var sku = 'store-' + storeId;
      var existing = findProductBySku_(sku);
      var title = s.title || {};
      var rawCat = s.category;
      var isSet = false;
      var cat = '';
      if (Array.isArray(rawCat)) {
        isSet = rawCat.indexOf('set') >= 0;
        cat = rawCat.filter(function (c) { return c !== 'featured' && c !== 'new'; })[0] || rawCat[0] || '';
      } else {
        cat = String(rawCat || '');
        isSet = cat === 'set';
      }
      var thumb = '';
      if (s.imgs && s.imgs.length) thumb = s.imgs[0];
      else if (s.thumbUrl) thumb = s.thumbUrl;

      var stockMode = s.stockMode;
      if (!stockMode) {
        stockMode = (s.isPreorder === true) ? 'unlimited' : 'limited';
      }

      var nowIso = new Date().toISOString();
      var p = {
        sku: sku,
        source: 'store',
        storeId: storeId,
        stockMode: stockMode,
        nameZh: title.zh || s.nameZh || '',
        nameEn: title.en || s.nameEn || '',
        nameJp: title.jp || s.nameJp || '',
        priceHKD: s.priceHK != null ? s.priceHK : (s.priceHKD != null ? s.priceHKD : 0),
        priceTWD: s.priceTW != null ? s.priceTW : (s.priceTWD != null ? s.priceTWD : 0),
        priceJPY: s.priceJP != null ? s.priceJP : (s.priceJPY != null ? s.priceJPY : 0),
        stockHK: 0,
        stockTW: 0,
        stockJP: 0,
        stockBOOTH: 0,
        stockHOME: 0,
        category: cat || '',
        thumbUrl: thumb || '',
        active: s.active === false ? false : true,
        notes: s.notes || '',
        updatedAt: nowIso,
        productCreateDate: nowIso,
        parentSku: '',
        productKind: isSet ? 'set' : 'standalone',
        sortOrder: 0
      };

      if (existing) {
        if (preserve) {
          p.stockHK = existing.stockHK;
          p.stockTW = existing.stockTW;
          p.stockJP = existing.stockJP;
          p.stockBOOTH = existing.stockBOOTH;
          p.stockHOME = existing.stockHOME;
          if (!data.forceStockMode) p.stockMode = existing.stockMode;
        }
        p.productCreateDate = existing.productCreateDate || existing.updatedAt || nowIso;
        // keep parent/kind for non-set unless reclassifying as set
        if (existing.productKind === 'component') {
          p.productKind = 'component';
          p.parentSku = existing.parentSku;
          p.sortOrder = existing.sortOrder;
        } else if (isSet) {
          p.productKind = 'set';
          p.parentSku = '';
        } else {
          p.productKind = existing.productKind === 'set' ? 'set' : (existing.productKind || 'standalone');
          p.parentSku = existing.parentSku || '';
          p.sortOrder = existing.sortOrder || 0;
        }
        sh.getRange(existing._row, 1, 1, PRODUCT_HEADERS.length).setValues([productToRow_(p)]);
        updated++;
      } else {
        sh.appendRow(productToRow_(p));
        created++;
      }

      if (isSet || p.productKind === 'set') {
        ensureSetPlaceholders_(sku, SET_PLACEHOLDER_COUNT);
      }
    }
    return jsonOut_({ ok: true, created: created, updated: updated, total: created + updated });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Seed placeholder components for one set or all sets.
 * data.sku optional; data.count default 6
 */
function handleEnsureSetComponents_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var count = data.count != null ? int_(data.count) : SET_PLACEHOLDER_COUNT;
    var products = productRows_();
    var targets = [];
    if (data.sku) {
      targets.push(String(data.sku));
    } else {
      for (var i = 0; i < products.length; i++) {
        var p = products[i];
        if (p.productKind === 'set' || p.category === 'set') targets.push(p.sku);
      }
    }
    var totalCreated = 0;
    var processed = 0;
    for (var t = 0; t < targets.length; t++) {
      var res = ensureSetPlaceholders_(targets[t], count);
      processed++;
      totalCreated += res.created || 0;
    }
    return jsonOut_({
      ok: true,
      processed: processed,
      placeholdersCreated: totalCreated
    });
  } finally {
    lock.releaseLock();
  }
}

// ── Events ──────────────────────────────────────────────────────────────────

function eventRows_() {
  var sh = sheet_('Events');
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last, EVENT_HEADERS.length).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (!row[0]) continue;
    out.push({
      eventId: String(row[0]),
      name: String(row[1] || ''),
      region: String(row[2] || 'HK').toUpperCase(),
      currency: String(row[3] || 'HKD'),
      status: String(row[4] || 'planned'),
      startDate: row[5] ? String(row[5]).slice(0, 10) : '',
      endDate: row[6] ? String(row[6]).slice(0, 10) : '',
      activeDay: row[7] ? String(row[7]).slice(0, 10) : '',
      notes: String(row[8] || ''),
      updatedAt: row[9] ? String(row[9]) : '',
      _row: r + 2
    });
  }
  return out;
}

function findEvent_(eventId) {
  eventId = String(eventId || '');
  var events = eventRows_();
  for (var i = 0; i < events.length; i++) {
    if (events[i].eventId === eventId) return events[i];
  }
  return null;
}

function handleListEvents_() {
  var events = eventRows_().map(function (e) {
    var c = Object.assign({}, e);
    delete c._row;
    return c;
  });
  var active = null;
  for (var i = 0; i < events.length; i++) {
    if (events[i].status === 'active') { active = events[i]; break; }
  }
  return jsonOut_({ ok: true, events: events, activeEvent: active });
}

function handleUpsertEvent_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var e = data.event || data;
    if (!e.eventId) {
      e.eventId = slug_(e.name || 'event') + '-' + Utilities.formatDate(new Date(), 'Asia/Hong_Kong', 'yyyyMMdd-HHmmss');
    }
    e.eventId = String(e.eventId).trim();
    e.region = String(e.region || 'HK').toUpperCase();
    if (POOLS.indexOf(e.region) < 0) e.region = 'HK';
    e.currency = e.currency || CURRENCIES[e.region] || 'HKD';
    e.status = e.status || 'planned';
    e.updatedAt = new Date().toISOString();

    var existing = findEvent_(e.eventId);
    var sh = sheet_('Events');
    var row = [
      e.eventId, e.name || '', e.region, e.currency, e.status,
      e.startDate || '', e.endDate || '', e.activeDay || '',
      e.notes || '', e.updatedAt
    ];
    if (existing) {
      sh.getRange(existing._row, 1, 1, EVENT_HEADERS.length).setValues([row]);
      return jsonOut_({ ok: true, event: Object.assign({}, e), created: false });
    }
    sh.appendRow(row);
    return jsonOut_({ ok: true, event: Object.assign({}, e), created: true });
  } finally {
    lock.releaseLock();
  }
}

/**
 * status: planned | active | closed
 * Only one active event at a time — activating X closes other actives.
 */
function handleSetEventStatus_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var eventId = String(data.eventId || '');
    var status = String(data.status || '').toLowerCase();
    if (['planned', 'active', 'closed'].indexOf(status) < 0) {
      return jsonOut_({ ok: false, error: 'invalid_status' });
    }
    var existing = findEvent_(eventId);
    if (!existing) return jsonOut_({ ok: false, error: 'not_found' });

    var sh = sheet_('Events');
    if (status === 'active') {
      // deactivate others
      var all = eventRows_();
      for (var i = 0; i < all.length; i++) {
        if (all[i].eventId !== eventId && all[i].status === 'active') {
          sh.getRange(all[i]._row, 5).setValue('closed');
          sh.getRange(all[i]._row, 10).setValue(new Date().toISOString());
        }
      }
      if (data.activeDay) {
        sh.getRange(existing._row, 8).setValue(String(data.activeDay).slice(0, 10));
      } else if (!existing.activeDay) {
        sh.getRange(existing._row, 8).setValue(Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'));
      }
    }
    if (data.activeDay) {
      sh.getRange(existing._row, 8).setValue(String(data.activeDay).slice(0, 10));
    }
    sh.getRange(existing._row, 5).setValue(status);
    sh.getRange(existing._row, 10).setValue(new Date().toISOString());

    var updated = findEvent_(eventId);
    var out = Object.assign({}, updated);
    delete out._row;
    return jsonOut_({ ok: true, event: out });
  } finally {
    lock.releaseLock();
  }
}

// ── Sales (POS) ─────────────────────────────────────────────────────────────

function handleRecordSale_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sku = String(data.sku || '');
    var qty = int_(data.qty);
    if (!sku || qty <= 0) {
      return jsonOut_({ ok: false, error: 'invalid_sale', message: 'sku and qty required.' });
    }

    var product = findProductBySku_(sku);
    if (!product) return jsonOut_({ ok: false, error: 'not_found', message: 'Product not found.' });
    if (!product.active) return jsonOut_({ ok: false, error: 'inactive', message: 'Product is inactive.' });

    var event = null;
    if (data.eventId) event = findEvent_(data.eventId);
    if (!event) {
      // fallback to current active
      var events = eventRows_();
      for (var i = 0; i < events.length; i++) {
        if (events[i].status === 'active') { event = events[i]; break; }
      }
    }
    if (!event || event.status !== 'active') {
      return jsonOut_({ ok: false, error: 'no_active_event', message: '請先開啟活動日（Start event day）。' });
    }

    var region = event.region;
    var currency = event.currency || CURRENCIES[region] || 'HKD';
    var day = data.day || event.activeDay || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    day = String(day).slice(0, 10);

    var unitPrice = data.unitPrice != null ? num_(data.unitPrice) : priceForCurrency_(product, currency);
    var lineTotal = Math.round(unitPrice * qty * 100) / 100;

    // stock deduct for limited
    if (product.stockMode === 'limited') {
      var stock = getPoolStock_(product, region);
      if (stock < qty) {
        return jsonOut_({
          ok: false,
          error: 'insufficient_stock',
          message: region + ' 庫存不足（剩 ' + stock + '）',
          stock: stock,
          requested: qty
        });
      }
      setPoolStockOnProduct_(product, region, stock - qty);
      product.updatedAt = new Date().toISOString();
      sheet_('Products').getRange(product._row, 1, 1, PRODUCT_HEADERS.length)
        .setValues([productToRow_(product)]);
    }

    var saleId = 'S-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    var soldAt = new Date().toISOString();
    var name = product.nameZh || product.nameEn || product.nameJp || sku;
    sheet_('Sales').appendRow([
      saleId,
      event.eventId,
      day,
      region,
      'pos',
      sku,
      name,
      qty,
      unitPrice,
      lineTotal,
      currency,
      soldAt,
      data.device || '',
      false,
      '',
      data.notes || ''
    ]);

    var remaining = product.stockMode === 'unlimited' ? null : getPoolStock_(product, region);
    return jsonOut_({
      ok: true,
      sale: {
        saleId: saleId,
        eventId: event.eventId,
        day: day,
        region: region,
        sku: sku,
        name: name,
        qty: qty,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
        currency: currency,
        soldAt: soldAt,
        stockMode: product.stockMode,
        remainingStock: remaining
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleVoidSale_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var saleId = String(data.saleId || '');
    if (!saleId) return jsonOut_({ ok: false, error: 'missing_saleId' });

    var sh = sheet_('Sales');
    var last = sh.getLastRow();
    if (last < 2) return jsonOut_({ ok: false, error: 'not_found' });
    var values = sh.getRange(2, 1, last, SALE_HEADERS.length).getValues();
    var foundRow = -1;
    var row = null;
    for (var r = 0; r < values.length; r++) {
      if (String(values[r][0]) === saleId) {
        foundRow = r + 2;
        row = values[r];
        break;
      }
    }
    if (foundRow < 0) return jsonOut_({ ok: false, error: 'not_found' });

    var voided = row[13] === true || row[13] === 'TRUE' || row[13] === 'true';
    if (voided) return jsonOut_({ ok: false, error: 'already_voided' });

    var channel = String(row[4] || 'pos');
    var sku = String(row[5] || '');
    var qty = int_(row[7]);
    var region = String(row[3] || '');

    // restore stock for limited POS sales
    if (channel === 'pos' || channel === 'web') {
      var product = findProductBySku_(sku);
      if (product && product.stockMode === 'limited' && region) {
        var stock = getPoolStock_(product, region);
        setPoolStockOnProduct_(product, region, stock + qty);
        product.updatedAt = new Date().toISOString();
        sheet_('Products').getRange(product._row, 1, 1, PRODUCT_HEADERS.length)
          .setValues([productToRow_(product)]);
      }
    }

    sh.getRange(foundRow, 14).setValue(true); // voided
    return jsonOut_({ ok: true, saleId: saleId, voided: true });
  } finally {
    lock.releaseLock();
  }
}

function handleListSales_(data) {
  var eventId = data.eventId ? String(data.eventId) : '';
  var day = data.day ? String(data.day).slice(0, 10) : '';
  var includeVoided = !!data.includeVoided;

  var sh = sheet_('Sales');
  var last = sh.getLastRow();
  if (last < 2) return jsonOut_({ ok: true, sales: [] });
  var values = sh.getRange(2, 1, last, SALE_HEADERS.length).getValues();
  var sales = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (!row[0]) continue;
    var voided = row[13] === true || row[13] === 'TRUE' || row[13] === 'true';
    if (!includeVoided && voided) continue;
    var s = {
      saleId: String(row[0]),
      eventId: String(row[1] || ''),
      day: String(row[2] || '').slice(0, 10),
      region: String(row[3] || ''),
      channel: String(row[4] || ''),
      sku: String(row[5] || ''),
      name: String(row[6] || ''),
      qty: int_(row[7]),
      unitPrice: num_(row[8]),
      lineTotal: num_(row[9]),
      currency: String(row[10] || ''),
      soldAt: row[11] ? String(row[11]) : '',
      device: String(row[12] || ''),
      voided: voided,
      orderId: String(row[14] || ''),
      notes: String(row[15] || '')
    };
    if (eventId && s.eventId !== eventId) continue;
    if (day && s.day !== day) continue;
    sales.push(s);
  }
  // newest first
  sales.sort(function (a, b) {
    return String(b.soldAt).localeCompare(String(a.soldAt));
  });
  return jsonOut_({ ok: true, sales: sales });
}

function handleDailySummary_(data) {
  var eventId = String(data.eventId || '');
  var day = String(data.day || '').slice(0, 10);
  if (!eventId || !day) {
    return jsonOut_({ ok: false, error: 'missing_fields', message: 'eventId and day required.' });
  }

  var listRes = handleListSales_({ eventId: eventId, day: day, includeVoided: false });
  // handleListSales_ returns a TextOutput — parse via direct logic instead
  var sh = sheet_('Sales');
  var last = sh.getLastRow();
  var bySku = {};
  var gross = 0;
  var totalQty = 0;
  var currency = '';
  var saleCount = 0;

  if (last >= 2) {
    var values = sh.getRange(2, 1, last, SALE_HEADERS.length).getValues();
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      var voided = row[13] === true || row[13] === 'TRUE' || row[13] === 'true';
      if (voided) continue;
      if (String(row[1] || '') !== eventId) continue;
      if (String(row[2] || '').slice(0, 10) !== day) continue;
      var sku = String(row[5] || '');
      var qty = int_(row[7]);
      var line = num_(row[9]);
      currency = String(row[10] || currency);
      if (!bySku[sku]) {
        bySku[sku] = { sku: sku, name: String(row[6] || ''), qty: 0, revenue: 0 };
      }
      bySku[sku].qty += qty;
      bySku[sku].revenue += line;
      gross += line;
      totalQty += qty;
      saleCount++;
    }
  }

  var lines = [];
  for (var k in bySku) {
    if (bySku.hasOwnProperty(k)) {
      bySku[k].revenue = Math.round(bySku[k].revenue * 100) / 100;
      lines.push(bySku[k]);
    }
  }
  lines.sort(function (a, b) { return b.revenue - a.revenue; });

  var event = findEvent_(eventId);
  var products = productRows_().map(function (p) {
    return {
      sku: p.sku,
      nameZh: p.nameZh,
      nameEn: p.nameEn,
      stockMode: p.stockMode,
      stockHK: p.stockHK,
      stockTW: p.stockTW,
      stockJP: p.stockJP,
      stockBOOTH: p.stockBOOTH,
      stockHOME: p.stockHOME,
      regionStock: event ? getPoolStock_(p, event.region) : null
    };
  });

  return jsonOut_({
    ok: true,
    summary: {
      eventId: eventId,
      eventName: event ? event.name : '',
      region: event ? event.region : '',
      day: day,
      currency: currency || (event ? event.currency : ''),
      saleCount: saleCount,
      totalQty: totalQty,
      gross: Math.round(gross * 100) / 100,
      bySku: lines,
      stockSnapshot: products
    }
  });
}

// ── Web store linkage ───────────────────────────────────────────────────────

/**
 * data: { region, items: [{ id|storeId|sku, qty }], orderId?, hardReject? }
 * Returns availability for limited SKUs; unlimited always ok.
 */
function handleWebCheck_(data) {
  var region = String(data.region || 'HK').toUpperCase();
  if (region !== 'HK' && region !== 'TW') region = 'HK';
  var items = data.items || [];
  var hardReject = data.hardReject != null
    ? !!data.hardReject
    : (region === 'HK' && HARD_REJECT_HK_LIMITED);

  var results = [];
  var allOk = true;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var qty = int_(it.qty);
    if (qty <= 0) continue;
    var product = resolveWebProduct_(it);
    if (!product) {
      // unknown SKU — do not block (catalog may not be imported yet)
      results.push({ sku: it.sku || it.id, ok: true, stockMode: 'unknown', skipped: true });
      continue;
    }
    if (product.stockMode === 'unlimited') {
      results.push({ sku: product.sku, ok: true, stockMode: 'unlimited' });
      continue;
    }
    var stock = getPoolStock_(product, region);
    var ok = stock >= qty;
    if (!ok) allOk = false;
    results.push({
      sku: product.sku,
      ok: ok,
      stockMode: 'limited',
      stock: stock,
      requested: qty
    });
  }

  return jsonOut_({
    ok: true,
    available: hardReject ? allOk : true,
    hardReject: hardReject,
    allLimitedOk: allOk,
    results: results
  });
}

/**
 * Deduct limited stock for a successful web order.
 * Unlimited lines: optional sales log only (channel=web, no stock change).
 */
function handleWebDeduct_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var region = String(data.region || 'HK').toUpperCase();
    if (region !== 'HK' && region !== 'TW') region = 'HK';
    var items = data.items || [];
    var orderId = String(data.orderId || '');
    var hardReject = data.hardReject != null
      ? !!data.hardReject
      : (region === 'HK' && HARD_REJECT_HK_LIMITED);
    var logUnlimited = data.logUnlimited !== false;
    var currency = data.currency || (region === 'TW' ? 'TWD' : 'HKD');
    var day = data.day || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    day = String(day).slice(0, 10);

    // Pre-check limited lines
    var checks = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var qty = int_(it.qty);
      if (qty <= 0) continue;
      var product = resolveWebProduct_(it);
      if (!product) {
        checks.push({ it: it, product: null, qty: qty });
        continue;
      }
      if (product.stockMode === 'limited') {
        var stock = getPoolStock_(product, region);
        if (stock < qty && hardReject) {
          return jsonOut_({
            ok: false,
            error: 'insufficient_stock',
            message: product.sku + ' ' + region + ' stock ' + stock + ' < ' + qty,
            sku: product.sku,
            stock: stock,
            requested: qty
          });
        }
      }
      checks.push({ it: it, product: product, qty: qty });
    }

    var deducted = [];
    var logged = [];
    var warnings = [];
    var salesSh = sheet_('Sales');
    var soldAt = new Date().toISOString();

    for (var j = 0; j < checks.length; j++) {
      var c = checks[j];
      var p = c.product;
      var q = c.qty;
      if (!p) {
        warnings.push({ item: c.it, reason: 'product_not_in_inventory' });
        continue;
      }

      if (p.stockMode === 'limited') {
        var before = getPoolStock_(p, region);
        var after = before - q;
        if (after < 0 && !ALLOW_NEGATIVE_STOCK) after = 0;
        setPoolStockOnProduct_(p, region, after);
        p.updatedAt = new Date().toISOString();
        sheet_('Products').getRange(p._row, 1, 1, PRODUCT_HEADERS.length)
          .setValues([productToRow_(p)]);
        if (before < q) {
          warnings.push({ sku: p.sku, reason: 'oversell', before: before, qty: q, after: after });
        }
        deducted.push({ sku: p.sku, qty: q, before: before, after: after, region: region });
      }

      if (p.stockMode === 'limited' || logUnlimited) {
        var unitPrice = c.it.unit != null ? num_(c.it.unit) : priceForCurrency_(p, currency);
        var lineTotal = Math.round(unitPrice * q * 100) / 100;
        var saleId = 'W-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
        var name = p.nameZh || p.nameEn || p.nameJp || p.sku;
        salesSh.appendRow([
          saleId,
          data.eventId || ('web-' + region.toLowerCase()),
          day,
          region,
          'web',
          p.sku,
          name,
          q,
          unitPrice,
          lineTotal,
          currency,
          soldAt,
          'web-order',
          false,
          orderId,
          p.stockMode === 'unlimited' ? 'unlimited_no_stock_change' : ''
        ]);
        logged.push(saleId);
      }
    }

    return jsonOut_({
      ok: true,
      orderId: orderId,
      region: region,
      deducted: deducted,
      logged: logged,
      warnings: warnings
    });
  } finally {
    lock.releaseLock();
  }
}

function resolveWebProduct_(it) {
  if (!it) return null;
  if (it.sku) {
    var bySku = findProductBySku_(String(it.sku));
    if (bySku) return bySku;
  }
  var sid = it.storeId != null ? it.storeId : it.id;
  if (sid != null && sid !== '') {
    return findProductByStoreId_(sid);
  }
  return null;
}

// ── Bootstrap (one call for POS home) ───────────────────────────────────────

function handleBootstrap_(data) {
  var productsRes = productRows_();
  if (data.activeOnly !== false) {
    productsRes = productsRes.filter(function (p) { return p.active; });
  }
  var products = sortProductsNewestFirst_(productsRes).map(publicProduct_);
  var events = eventRows_().map(function (e) {
    var c = Object.assign({}, e);
    delete c._row;
    return c;
  });
  var active = null;
  for (var i = 0; i < events.length; i++) {
    if (events[i].status === 'active') { active = events[i]; break; }
  }
  var todaySales = [];
  if (active && active.activeDay) {
    var listPayload = { eventId: active.eventId, day: active.activeDay, includeVoided: false };
    // inline list
    var sh = sheet_('Sales');
    var last = sh.getLastRow();
    if (last >= 2) {
      var values = sh.getRange(2, 1, last, SALE_HEADERS.length).getValues();
      for (var r = 0; r < values.length; r++) {
        var row = values[r];
        var voided = row[13] === true || row[13] === 'TRUE' || row[13] === 'true';
        if (voided) continue;
        if (String(row[1]) !== active.eventId) continue;
        if (String(row[2] || '').slice(0, 10) !== String(active.activeDay).slice(0, 10)) continue;
        if (String(row[4]) !== 'pos') continue;
        todaySales.push({
          saleId: String(row[0]),
          sku: String(row[5]),
          name: String(row[6]),
          qty: int_(row[7]),
          unitPrice: num_(row[8]),
          lineTotal: num_(row[9]),
          currency: String(row[10]),
          soldAt: String(row[11] || '')
        });
      }
    }
    todaySales.sort(function (a, b) {
      return String(b.soldAt).localeCompare(String(a.soldAt));
    });
  }
  var ssMeta = null;
  try {
    var ss = ss_();
    ssMeta = { id: ss.getId(), name: ss.getName() };
  } catch (eMeta) {
    ssMeta = { error: String(eMeta) };
  }
  return jsonOut_({
    ok: true,
    products: products,
    events: events,
    activeEvent: active,
    todaySales: todaySales,
    pools: POOLS,
    spreadsheet: ssMeta
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function priceForCurrency_(product, currency) {
  currency = String(currency || 'HKD').toUpperCase();
  if (currency === 'TWD') return num_(product.priceTWD);
  if (currency === 'JPY') return num_(product.priceJPY);
  return num_(product.priceHKD);
}

function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

function int_(v) {
  var n = parseInt(v, 10);
  return isFinite(n) ? n : 0;
}

function slug_(s) {
  return String(s || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'event';
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
