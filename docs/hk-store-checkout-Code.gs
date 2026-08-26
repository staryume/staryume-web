// ── STARYUME Store Checkout — paste entire file into Apps Script Code.gs ──
// Drive proofs: https://drive.google.com/open?id=1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X
// After edit: Deploy → Manage deployments → Edit → New version → Deploy
// Daily backup: Triggers → Add trigger → dailyOrderBackup_ → Day timer → 3–4am

var PROOF_FOLDER_ID = '1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X';
/** Optional fixed backup folder. Leave empty to auto-create "STARYUME Store Order Backups" next to the Sheet. */
var BACKUP_FOLDER_ID = '';
var BACKUP_RETENTION_DAYS = 90;
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var MAX_PROOF_BYTES = 6000000;
var STORE_NAME = 'staryume';
var SELLER_NOTIFY_EMAIL = 'staryume@gmail.com';

/**
 * Inventory POS linkage (docs/pos-Code.gs). Leave URL empty to skip stock checks.
 * After deploying POS web app: paste URL + same INVENTORY_SERVICE_KEY as POS Script Property.
 * Limited SKUs deduct regional pool (HK→stockHK, TW→stockTW); unlimited pre-order skips stock.
 */
var POS_INVENTORY_URL = '';
var INVENTORY_SERVICE_KEY = '';
/** HK paid limited: reject order if inventory pool insufficient. TW usually unlimited. */
var HARD_REJECT_HK_LIMITED = true;

/** Same email cannot place another TW order within this many hours. */
var NEW_ORDER_COOLDOWN_HOURS = 24;
/**
 * Legacy FF47 pre-order edit/create cutoff (already passed).
 * New 賣貨便 mail-order uses TW_MAIL_DEADLINE_ISO instead.
 */
var TW_PREORDER_DEADLINE_ISO = '2026-08-20T00:00:00+08:00';
/** Empty = no close date for 賣貨便 通販. Set ISO like 2026-09-30T23:59:00+08:00 to freeze. */
var TW_MAIL_DEADLINE_ISO = '';
var MYSHIP_EXPORT_SHEET = '賣貨便匯入';
/** Official 訂單匯入 Google Sheet (賣貨便 範本 columns). Same Google account must have access. */
var MYSHIP_IMPORT_SPREADSHEET_ID = '1c2Vf9_lX2CzLwkXx3tW5xwZzC_9GbF8l4yDUEA2NWfI';
var MYSHIP_IMPORT_TAB = '訂單匯入';
/** 本島服務優惠價. Change if your 賣貨便 運費 is not 60. */
var MYSHIP_SHIPPING_TWD = 60;

var HEADERS = [
  'Timestamp', 'Order ID', 'Items', 'Total', 'Name', 'Email', 'Phone',
  'SNS Type', 'SNS Contact', 'Fulfillment', 'SF Code', 'Payment', 'Proof URL',
  'Notes', 'Status', 'Region', 'OrderType', 'FulfillmentId', 'ItemsJson', 'UpdatedAt'
];

// ── Entry ───────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || 'create').toLowerCase();
    ensureHeaders_();

    if (action === 'get') return handleGet_(data);
    if (action === 'update') return handleUpdate_(data);
    if (action === 'cancel') return handleCancel_(data);
    if (action === 'check') return handleCheck_(data);
    return handleCreate_(data);
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService
    .createTextOutput('STARYUME store checkout endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── Create ──────────────────────────────────────────────────────────────────

function handleCreate_(data) {
  var sheet = orderSheet_();
  var orderId = String(data.orderId || '').trim() || ('HK-' + Date.now());
  var itemsText = data.itemsText || '';
  if (!itemsText && data.items && data.items.length) {
    itemsText = data.items.map(function (it) {
      return (it.title || it.id) + ' x' + it.qty + ' @ ' + it.unit;
    }).join('\n');
  }
  var total = data.totalHkd != null ? data.totalHkd : (data.total != null ? data.total : '');
  var region = String(data.region || 'HK').toUpperCase();
  var currency = String(data.currency || (region === 'TW' ? 'TWD' : 'HKD'));
  // Only Taiwan may create preorders (pay at pickup). Never trust client
  // orderType alone for HK — paid HK always requires payment proof.
  var orderType = String(data.orderType || '');
  if (region !== 'TW') {
    orderType = 'paid';
  } else if (
    data.paymentMethod === 'myship_cod' ||
    orderType === 'myship' ||
    data.fulfillmentId === 'myship_711'
  ) {
    orderType = 'myship';
  } else if (data.paymentMethod === 'preorder_on_site' || orderType === 'preorder') {
    orderType = 'preorder';
  } else {
    orderType = 'paid';
  }
  var isTwMyship = (region === 'TW' && orderType === 'myship');
  var isTwPreorder = (region === 'TW' && orderType === 'preorder');
  var isTwNoProof = isTwMyship || isTwPreorder;
  var name = data.name || '';
  var email = normalizeEmail_(data.email);
  var phone = data.phone || '';
  var snsType = data.snsType || '';
  var snsContact = data.snsContact || '';
  var fulfillmentId = data.fulfillmentId || '';
  var fulfillment = data.fulfillmentLabel || fulfillmentId || '';
  fulfillment = region + ' · ' + currency + (fulfillment ? (' · ' + fulfillment) : '');
  var storeId = String(data.storeId || data.sfCode || '').replace(/\D/g, '');
  var storeName = String(data.storeName || '').trim();
  var sfCode = isTwMyship ? storeId : (data.sfCode || '');
  var payment = data.paymentLabel || paymentLabel_(data.paymentMethod || '');
  if (isTwMyship && !payment) payment = '賣貨便·7-11取貨付款';
  if (isTwPreorder && !payment) payment = '預購·現場付款';
  var notes = data.notes || '';
  if (isTwMyship) {
    var storeTag = '[STORE] ' + storeId + (storeName ? (' ' + storeName) : '');
    notes = storeTag + (notes ? ('\n' + notes) : '');
  }
  if (isTwPreorder) {
    notes = (notes ? (notes + '\n') : '') + '[PREORDER] pay at pickup; pledge OK';
  }
  var itemsJson = '';
  try {
    if (data.items) itemsJson = JSON.stringify(data.items);
  } catch (e) { itemsJson = ''; }

  if (!name || !email) {
    return jsonOut_({ ok: false, error: 'missing_fields', message: '姓名與電郵為必填。' });
  }
  var totalNum = Number(total);
  if (!isFinite(totalNum) || totalNum <= 0) {
    return jsonOut_({ ok: false, error: 'invalid_total', message: '訂單金額無效。' });
  }
  if (!data.items || !data.items.length) {
    return jsonOut_({ ok: false, error: 'missing_items', message: '訂單沒有商品。' });
  }

  if (isTwMyship) {
    if (twMailDeadlinePassed_()) {
      return jsonOut_({
        ok: false,
        error: 'preorder_closed',
        message: '台灣通販目前暫停新訂單。'
      });
    }
    if (Number(totalNum) > 20000) {
      return jsonOut_({
        ok: false,
        error: 'invalid_total',
        message: '賣貨便單筆上限 NT$ 20000。'
      });
    }
    if (!storeId || storeId.length < 5) {
      return jsonOut_({
        ok: false,
        error: 'missing_fields',
        message: '請填寫 7-11 門市店號。'
      });
    }
  }

  // TW gates (cooldown applies to myship + leftover FF47 preorders)
  if (isTwNoProof) {
    if (isTwPreorder && twDeadlinePassed_()) {
      return jsonOut_({
        ok: false,
        error: 'preorder_closed',
        message: '台灣 FF47 預購已截止。'
      });
    }
    var cool = findRecentTwPreorderByEmail_(email);
    if (cool) {
      return jsonOut_({
        ok: false,
        error: 'preorder_cooldown',
        orderId: cool.orderId,
        message: '同一電郵 24 小時內只能建立一筆台灣訂單。請管理既有訂單：' + cool.orderId,
        manageHint: true
      });
    }
  }

  // Inventory hard-check for HK paid limited stock (before proof / write)
  if (POS_INVENTORY_URL && region === 'HK' && HARD_REJECT_HK_LIMITED) {
    var stockGate = inventoryWebCheck_(region, data.items, true);
    if (stockGate && stockGate.ok === false) {
      return jsonOut_(stockGate);
    }
    if (stockGate && stockGate.available === false) {
      return jsonOut_({
        ok: false,
        error: 'insufficient_stock',
        message: stockGate.message || '部分商品庫存不足，無法完成訂單。請減少數量或聯絡 Discord。',
        results: stockGate.results || null
      });
    }
  }

  // Paid orders (including any non-TW create): require valid proof before writing the row
  var proofUrl = '';
  if (!isTwNoProof) {
    if (!data.proof || !data.proof.dataUrl) {
      return jsonOut_({
        ok: false,
        error: 'missing_proof',
        message: '請上載付款截圖後再提交。'
      });
    }
    try {
      proofUrl = saveProof_(data.proof, orderId);
      if (!proofUrl) {
        return jsonOut_({
          ok: false,
          error: 'proof_upload_failed',
          message: '付款截圖上載失敗，請換圖或稍後再試。訂單尚未建立。'
        });
      }
    } catch (proofErr) {
      console.error('Proof upload failed: ' + proofErr);
      return jsonOut_({
        ok: false,
        error: 'proof_upload_failed',
        message: '付款截圖上載失敗，請換圖或稍後再試。訂單尚未建立。'
      });
    }
  } else if (data.proof && data.proof.dataUrl) {
    // Optional proof on preorder (ignore failures — not required)
    try {
      proofUrl = saveProof_(data.proof, orderId) || '';
    } catch (ePre) {
      console.error('Optional preorder proof failed: ' + ePre);
      proofUrl = '';
    }
  }

  var now = new Date();
  sheet.appendRow([
    now,
    orderId,
    itemsText,
    total,
    name,
    email,
    phone,
    snsType,
    snsContact,
    fulfillment,
    sfCode,
    payment,
    proofUrl || '',
    notes,
    'new',
    region,
    orderType,
    fulfillmentId,
    itemsJson,
    ''
  ]);
  var row = sheet.getLastRow();
  if (proofUrl) {
    try { sheet.getRange(row, col_('Proof URL')).setValue(proofUrl); } catch (ePu) { /* already in row */ }
  }

  var mailInfo = {
    email: email,
    name: name,
    orderId: orderId,
    itemsText: itemsText,
    total: total,
    currency: currency,
    region: region,
    fulfillment: fulfillment,
    fulfillmentId: fulfillmentId,
    sfCode: sfCode,
    payment: payment,
    phone: phone,
    snsType: snsType,
    snsContact: snsContact,
    notes: notes,
    proofUrl: proofUrl,
    orderType: orderType,
    storeId: storeId,
    storeName: storeName,
    event: 'create'
  };

  if (email) {
    try { sendOrderEmail_(mailInfo); } catch (mailErr) {
      console.error('Customer mail failed: ' + mailErr);
    }
  }
  try { sendSellerNotifyEmail_(mailInfo); } catch (sellerMailErr) {
    console.error('Seller notify mail failed: ' + sellerMailErr);
  }

  // Deduct limited inventory after order is written (unlimited / pre-order: no stock change)
  var inventoryResult = null;
  try {
    inventoryResult = inventoryWebDeduct_(region, currency, orderId, data.items);
  } catch (invErr) {
    console.error('Inventory deduct failed: ' + invErr);
    inventoryResult = { ok: false, error: String(invErr) };
  }

  return jsonOut_({
    ok: true,
    orderId: orderId,
    proofUrl: proofUrl || null,
    proofError: null,
    editableUntil: isTwMyship
      ? (twMailDeadlineDate_() ? twMailDeadlineDate_().toISOString() : null)
      : (isTwPreorder ? twDeadlineDate_().toISOString() : null),
    inventory: inventoryResult
  });
}

// ── Inventory POS bridge (optional) ─────────────────────────────────────────

function inventoryConfigured_() {
  return !!(POS_INVENTORY_URL && INVENTORY_SERVICE_KEY &&
    POS_INVENTORY_URL.indexOf('http') === 0 &&
    INVENTORY_SERVICE_KEY !== 'CHANGE_ME_SERVICE');
}

function inventoryWebCheck_(region, items, hardReject) {
  if (!inventoryConfigured_()) return { ok: true, available: true, skipped: true };
  var payload = {
    action: 'web_check',
    serviceKey: INVENTORY_SERVICE_KEY,
    region: region,
    items: items || [],
    hardReject: !!hardReject
  };
  return inventoryFetch_(payload);
}

function inventoryWebDeduct_(region, currency, orderId, items) {
  if (!inventoryConfigured_()) return { ok: true, skipped: true };
  var payload = {
    action: 'web_deduct',
    serviceKey: INVENTORY_SERVICE_KEY,
    region: region,
    currency: currency,
    orderId: orderId,
    items: items || [],
    hardReject: region === 'HK' && HARD_REJECT_HK_LIMITED,
    logUnlimited: true
  };
  return inventoryFetch_(payload);
}

function inventoryFetch_(payload) {
  var res = UrlFetchApp.fetch(POS_INVENTORY_URL, {
    method: 'post',
    contentType: 'text/plain;charset=utf-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true
  });
  var text = res.getContentText() || '';
  try {
    if (text && text.trim().charAt(0) === '{') return JSON.parse(text);
  } catch (e) { /* fall through */ }
  return { ok: false, error: 'inventory_upstream', status: res.getResponseCode(), body: text.slice(0, 200) };
}

// ── Get / Update / Cancel / Check ───────────────────────────────────────────

function handleGet_(data) {
  var found = findTwPreorder_(data.orderId, data.email);
  if (!found.ok) return jsonOut_(found);
  return jsonOut_({ ok: true, order: publicOrder_(found.row, found.values) });
}

function handleUpdate_(data) {
  var found = findTwPreorder_(data.orderId, data.email);
  if (!found.ok) return jsonOut_(found);
  if (!found.editable) {
    return jsonOut_({
      ok: false,
      error: 'edit_window_closed',
      message: '此訂單已無法線上修改（可能已匯入賣貨便）。請聯絡 Discord 客服。'
    });
  }
  if (found.values[col_('Status') - 1] === 'cancelled') {
    return jsonOut_({ ok: false, error: 'cancelled', message: '此訂單已取消。' });
  }
  if (isPickedStatus_(found.values[col_('Status') - 1])) {
    return jsonOut_({ ok: false, error: 'picked', message: '此訂單已出貨／領取，無法再修改。' });
  }

  var sheet = orderSheet_();
  var row = found.row;
  var name = String(data.name || '').trim();
  var phone = String(data.phone || '').trim();
  var snsType = String(data.snsType || '').trim();
  var snsContact = String(data.snsContact || '').trim();
  var fulfillmentId = String(data.fulfillmentId || '').trim();
  if (!name || !phone || !snsType || !snsContact || !fulfillmentId) {
    return jsonOut_({ ok: false, error: 'missing_fields', message: '請填寫完整聯絡資料與取貨方式。' });
  }
  var allowedFulfill = fulfillmentId === 'myship_711' || fulfillmentId === 'ff47_day1' || fulfillmentId === 'ff47_day2' || fulfillmentId === 'ff47_day3';
  if (!allowedFulfill) {
    return jsonOut_({ ok: false, error: 'invalid_fulfillment', message: '取貨方式無效。' });
  }
  var storeId = String(data.storeId || data.sfCode || '').replace(/\D/g, '');
  var storeName = String(data.storeName || '').trim();
  if (fulfillmentId === 'myship_711' && storeId.length < 5) {
    return jsonOut_({ ok: false, error: 'missing_fields', message: '請填寫 7-11 門市店號。' });
  }

  var fulfillmentLabel = data.fulfillmentLabel || fulfillmentId;
  var region = 'TW';
  var currency = 'TWD';
  var fulfillment = region + ' · ' + currency + ' · ' + fulfillmentLabel;

  sheet.getRange(row, col_('Name')).setValue(name);
  sheet.getRange(row, col_('Phone')).setValue(phone);
  sheet.getRange(row, col_('SNS Type')).setValue(snsType);
  sheet.getRange(row, col_('SNS Contact')).setValue(snsContact);
  sheet.getRange(row, col_('Fulfillment')).setValue(fulfillment);
  sheet.getRange(row, col_('FulfillmentId')).setValue(fulfillmentId);
  if (fulfillmentId === 'myship_711') {
    sheet.getRange(row, col_('SF Code')).setValue(storeId);
    var oldNotes = String(found.values[col_('Notes') - 1] || '');
    var stripped = oldNotes.replace(/^\[STORE\][^\n]*\n?/, '');
    var storeTag = '[STORE] ' + storeId + (storeName ? (' ' + storeName) : '');
    sheet.getRange(row, col_('Notes')).setValue(storeTag + (stripped ? ('\n' + stripped) : ''));
  }
  sheet.getRange(row, col_('UpdatedAt')).setValue(new Date());

  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var mailInfo = mailInfoFromRow_(values, 'update');
  try { sendSellerNotifyEmail_(mailInfo); } catch (e) { console.error(e); }
  if (mailInfo.email) {
    try { sendCustomerManageEmail_(mailInfo, 'update'); } catch (e2) { console.error(e2); }
  }

  return jsonOut_({ ok: true, order: publicOrder_(row, values) });
}

function handleCancel_(data) {
  var found = findTwPreorder_(data.orderId, data.email);
  if (!found.ok) return jsonOut_(found);
  if (!found.editable) {
    return jsonOut_({
      ok: false,
      error: 'edit_window_closed',
      message: '此訂單已無法取消（可能已匯入賣貨便）。請聯絡 Discord 客服。'
    });
  }
  if (found.values[col_('Status') - 1] === 'cancelled') {
    return jsonOut_({ ok: false, error: 'cancelled', message: '此訂單已取消。' });
  }
  if (isPickedStatus_(found.values[col_('Status') - 1])) {
    return jsonOut_({ ok: false, error: 'picked', message: '此訂單已出貨／領取，無法取消。' });
  }

  var sheet = orderSheet_();
  var row = found.row;
  sheet.getRange(row, col_('Status')).setValue('cancelled');
  sheet.getRange(row, col_('UpdatedAt')).setValue(new Date());
  var notes = String(found.values[col_('Notes') - 1] || '');
  sheet.getRange(row, col_('Notes')).setValue((notes ? notes + '\n' : '') + '[CANCELLED by customer]');

  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var mailInfo = mailInfoFromRow_(values, 'cancel');
  try { sendSellerNotifyEmail_(mailInfo); } catch (e) { console.error(e); }
  if (mailInfo.email) {
    try { sendCustomerManageEmail_(mailInfo, 'cancel'); } catch (e2) { console.error(e2); }
  }

  return jsonOut_({ ok: true, cancelled: true, orderId: mailInfo.orderId });
}

function handleCheck_(data) {
  var email = normalizeEmail_(data.email);
  if (!email) return jsonOut_({ ok: false, error: 'missing_fields' });
  if (twMailDeadlinePassed_()) {
    return jsonOut_({
      ok: true,
      canCreate: false,
      reason: 'preorder_closed',
      message: '台灣通販目前暫停新訂單。'
    });
  }
  var cool = findRecentTwPreorderByEmail_(email);
  if (cool) {
    return jsonOut_({
      ok: true,
      canCreate: false,
      reason: 'preorder_cooldown',
      orderId: cool.orderId,
      message: '24 小時內已有台灣訂單，請先管理既有訂單。'
    });
  }
  return jsonOut_({ ok: true, canCreate: true });
}

// ── Daily backup ────────────────────────────────────────────────────────────

/**
 * Install trigger once: function dailyOrderBackup_, time-driven, day timer, 3–4am.
 * Creates a full spreadsheet copy in Drive backup folder; purges copies older than retention.
 */
function dailyOrderBackup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd_HHmm');
  var name = 'STARYUME Store Orders backup ' + stamp;
  var folder = getBackupFolder_();
  var copy = ss.copy(name);
  var file = DriveApp.getFileById(copy.getId());
  folder.addFile(file);
  // Remove from Drive root if it landed there
  try {
    var parents = file.getParents();
    while (parents.hasNext()) {
      var p = parents.next();
      if (p.getId() !== folder.getId()) p.removeFile(file);
    }
  } catch (e) { /* ignore */ }

  // Retention
  var cutoff = new Date(Date.now() - BACKUP_RETENTION_DAYS * 24 * 3600 * 1000);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var fn = f.getName();
    if (fn.indexOf('STARYUME Store Orders backup') === 0 && f.getDateCreated() < cutoff) {
      try { f.setTrashed(true); } catch (e2) { /* ignore */ }
    }
  }
  return name;
}

// ── Sheet helpers ───────────────────────────────────────────────────────────

function orderSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function ensureHeaders_() {
  var sheet = orderSheet_();
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var needWrite = false;
  for (var i = 0; i < HEADERS.length; i++) {
    if (String(existing[i] || '') !== HEADERS[i]) {
      needWrite = true;
      break;
    }
  }
  if (needWrite && !String(existing[0] || '')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (needWrite) {
    // Extend missing headers only without wiping custom renames of Total HKD etc.
    for (var j = 0; j < HEADERS.length; j++) {
      if (!String(existing[j] || '').trim()) {
        sheet.getRange(1, j + 1).setValue(HEADERS[j]);
      }
    }
    // Ensure extended cols P–T exist
    for (var k = 15; k < HEADERS.length; k++) {
      if (String(sheet.getRange(1, k + 1).getValue() || '') !== HEADERS[k]) {
        sheet.getRange(1, k + 1).setValue(HEADERS[k]);
      }
    }
  }
}

function isPickedStatus_(raw) {
  var s = String(raw || '').toLowerCase();
  return s.indexOf('picked') >= 0 || s.indexOf('collected') >= 0 || s.indexOf('領取') >= 0 || s === 'done';
}

function col_(headerName) {
  for (var i = 0; i < HEADERS.length; i++) {
    if (HEADERS[i] === headerName) return i + 1;
  }
  // Legacy: Total HKD might be col 4
  if (headerName === 'Total') return 4;
  return 1;
}

function normalizeEmail_(e) {
  return String(e || '').trim().toLowerCase();
}

function twDeadlineDate_() {
  try {
    return new Date(TW_PREORDER_DEADLINE_ISO);
  } catch (e) {
    return new Date('2026-08-20T00:00:00+08:00');
  }
}

/** After this instant: no new TW FF47 pre-orders; no customer edit/cancel of those rows. */
function twDeadlinePassed_() {
  return new Date() >= twDeadlineDate_();
}

function twMailDeadlineDate_() {
  var raw = String(TW_MAIL_DEADLINE_ISO || '').trim();
  if (!raw) return null;
  var d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function twMailDeadlinePassed_() {
  var d = twMailDeadlineDate_();
  return !!(d && new Date() >= d);
}

function isImportedStatus_(raw) {
  var s = String(raw || '').toLowerCase();
  return s.indexOf('import') >= 0 || s.indexOf('匯入') >= 0 || s.indexOf('shipped') >= 0;
}

function parseStoreFromNotes_(notes, sfCode) {
  var storeId = String(sfCode || '').replace(/\D/g, '');
  var storeName = '';
  var m = String(notes || '').match(/\[STORE\]\s*(\d+)?\s*(.*)/);
  if (m) {
    if (m[1] && !storeId) storeId = m[1];
    storeName = String(m[2] || '').trim();
  }
  return { storeId: storeId, storeName: storeName };
}

function findRecentTwPreorderByEmail_(email) {
  email = normalizeEmail_(email);
  if (!email) return null;
  var sheet = orderSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var data = sheet.getRange(2, 1, last, width).getValues();
  var now = Date.now();
  var windowMs = NEW_ORDER_COOLDOWN_HOURS * 3600 * 1000;
  for (var i = data.length - 1; i >= 0; i--) {
    var row = data[i];
    var rowEmail = normalizeEmail_(row[col_('Email') - 1]);
    if (rowEmail !== email) continue;
    var region = String(row[col_('Region') - 1] || '').toUpperCase();
    var orderType = String(row[col_('OrderType') - 1] || '').toLowerCase();
    var status = String(row[col_('Status') - 1] || '').toLowerCase();
    var orderId = String(row[col_('Order ID') - 1] || '');
    // Infer TW preorder for older rows
    if (!region && String(orderId).indexOf('TW-') === 0) region = 'TW';
    if (!orderType && String(row[col_('Payment') - 1] || '').indexOf('預購') >= 0) orderType = 'preorder';
    if (region !== 'TW') continue;
    if (status.indexOf('cancel') >= 0) continue;
    var ts = row[col_('Timestamp') - 1];
    var t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
    if (!t || isNaN(t)) continue;
    if (now - t < windowMs) {
      return { orderId: orderId, row: i + 2 };
    }
  }
  return null;
}

function findTwPreorder_(orderId, email) {
  orderId = String(orderId || '').trim();
  email = normalizeEmail_(email);
  if (!orderId || !email) {
    return { ok: false, error: 'missing_fields', message: '請填寫訂單編號與電郵。' };
  }
  var sheet = orderSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return { ok: false, error: 'not_found', message: '找不到訂單。' };
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var data = sheet.getRange(2, 1, last, width).getValues();
  for (var i = 0; i < data.length; i++) {
    var rowVals = data[i];
    if (String(rowVals[col_('Order ID') - 1] || '').trim() !== orderId) continue;
    if (normalizeEmail_(rowVals[col_('Email') - 1]) !== email) {
      return { ok: false, error: 'not_found', message: '訂單編號與電郵不相符。' };
    }
    var region = String(rowVals[col_('Region') - 1] || '').toUpperCase();
    var orderType = String(rowVals[col_('OrderType') - 1] || '').toLowerCase();
    if (!region && orderId.indexOf('TW-') === 0) region = 'TW';
    if (!orderType && String(rowVals[col_('Payment') - 1] || '').indexOf('預購') >= 0) orderType = 'preorder';
    if (region !== 'TW') {
      return { ok: false, error: 'not_tw_preorder', message: '此功能僅適用於台灣訂單。' };
    }
    var status = String(rowVals[col_('Status') - 1] || '');
    var ts = rowVals[col_('Timestamp') - 1];
    var t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
    var cancelled = status.toLowerCase().indexOf('cancel') >= 0;
    var picked = isPickedStatus_(status);
    var imported = isImportedStatus_(status);
    var fulfillmentId = String(rowVals[col_('FulfillmentId') - 1] || '');
    var isMyship = orderType === 'myship' || fulfillmentId === 'myship_711';
    var deadlineHit = isMyship ? twMailDeadlinePassed_() : twDeadlinePassed_();
    var editable = !cancelled && !picked && !imported && !deadlineHit;
    var until = isMyship
      ? (twMailDeadlineDate_() ? twMailDeadlineDate_().toISOString() : null)
      : twDeadlineDate_().toISOString();
    return {
      ok: true,
      row: i + 2,
      values: rowVals,
      editable: editable,
      editableUntil: until
    };
  }
  return { ok: false, error: 'not_found', message: '找不到訂單。' };
}

function publicOrder_(row, values) {
  var ts = values[col_('Timestamp') - 1];
  var t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
  var status = String(values[col_('Status') - 1] || 'new');
  var cancelled = status.toLowerCase().indexOf('cancel') >= 0;
  var picked = isPickedStatus_(status);
  var imported = isImportedStatus_(status);
  var fulfillmentId = String(values[col_('FulfillmentId') - 1] || '');
  var orderType = String(values[col_('OrderType') - 1] || '').toLowerCase();
  var isMyship = orderType === 'myship' || fulfillmentId === 'myship_711';
  var deadlineHit = isMyship ? twMailDeadlinePassed_() : twDeadlinePassed_();
  var editable = !cancelled && !picked && !imported && !deadlineHit;
  var publicStatus = cancelled ? 'cancelled' : (picked ? 'picked' : (imported ? 'imported' : 'new'));
  var store = parseStoreFromNotes_(values[col_('Notes') - 1], values[col_('SF Code') - 1]);
  var until = isMyship
    ? (twMailDeadlineDate_() ? twMailDeadlineDate_().toISOString() : null)
    : twDeadlineDate_().toISOString();
  return {
    orderId: String(values[col_('Order ID') - 1] || ''),
    itemsText: String(values[col_('Items') - 1] || ''),
    total: values[col_('Total') - 1],
    name: String(values[col_('Name') - 1] || ''),
    email: String(values[col_('Email') - 1] || ''),
    phone: String(values[col_('Phone') - 1] || ''),
    snsType: String(values[col_('SNS Type') - 1] || ''),
    snsContact: String(values[col_('SNS Contact') - 1] || ''),
    fulfillment: String(values[col_('Fulfillment') - 1] || ''),
    fulfillmentId: fulfillmentId,
    sfCode: store.storeId,
    storeId: store.storeId,
    storeName: store.storeName,
    status: publicStatus,
    region: 'TW',
    orderType: isMyship ? 'myship' : 'preorder',
    createdAt: t ? new Date(t).toISOString() : null,
    editable: editable,
    editableUntil: until
  };
}

function mailInfoFromRow_(values, event) {
  return {
    email: String(values[col_('Email') - 1] || ''),
    name: String(values[col_('Name') - 1] || ''),
    orderId: String(values[col_('Order ID') - 1] || ''),
    itemsText: String(values[col_('Items') - 1] || ''),
    total: values[col_('Total') - 1],
    currency: 'TWD',
    region: 'TW',
    fulfillment: String(values[col_('Fulfillment') - 1] || ''),
    fulfillmentId: String(values[col_('FulfillmentId') - 1] || ''),
    sfCode: String(values[col_('SF Code') - 1] || ''),
    payment: String(values[col_('Payment') - 1] || ''),
    phone: String(values[col_('Phone') - 1] || ''),
    snsType: String(values[col_('SNS Type') - 1] || ''),
    snsContact: String(values[col_('SNS Contact') - 1] || ''),
    notes: String(values[col_('Notes') - 1] || ''),
    proofUrl: String(values[col_('Proof URL') - 1] || ''),
    orderType: String(values[col_('OrderType') - 1] || ''),
    event: event || 'update'
  };
}

function getBackupFolder_() {
  if (BACKUP_FOLDER_ID && String(BACKUP_FOLDER_ID).indexOf('PASTE_') !== 0 && String(BACKUP_FOLDER_ID).length > 5) {
    return DriveApp.getFolderById(BACKUP_FOLDER_ID);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var file = DriveApp.getFileById(ss.getId());
  var parents = file.getParents();
  var parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var name = 'STARYUME Store Order Backups';
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

// ── Mail / proof ────────────────────────────────────────────────────────────

function paymentLabel_(method) {
  var m = String(method || '').toLowerCase();
  if (m === 'fps') return 'FPS 轉數快';
  if (m === 'payme') return 'PayMe';
  if (m === 'myship_cod' || m === 'myship') return '賣貨便·7-11取貨付款';
  if (m === 'preorder_on_site' || m === 'preorder') return '預購·現場付款';
  return method || '';
}

function saveProof_(proof, orderId) {
  if (!PROOF_FOLDER_ID || PROOF_FOLDER_ID.indexOf('PASTE_') === 0) {
    throw new Error('PROOF_FOLDER_ID not set');
  }
  var dataUrl = String(proof.dataUrl || '');
  var mime = proof.mimeType || 'image/jpeg';
  var name = proof.name || (orderId + '-proof.jpg');
  var comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('invalid_proof_data');
  var b64 = dataUrl.substring(comma + 1);
  var bytes = Utilities.base64Decode(b64);
  if (bytes.length > MAX_PROOF_BYTES) throw new Error('proof_too_large');
  var blob = Utilities.newBlob(bytes, mime, sanitizeFileName_(name, orderId));
  var folder = DriveApp.getFolderById(PROOF_FOLDER_ID);
  var file = folder.createFile(blob);
  file.setName(orderId + '_' + sanitizeFileName_(name, orderId));
  return file.getUrl();
}

function sanitizeFileName_(name, orderId) {
  var base = String(name || 'proof.jpg').replace(/[^\w.\-()+\u4e00-\u9fff]/g, '_');
  if (!base) base = orderId + '.jpg';
  return base.substring(0, 80);
}

function sendOrderEmail_(info) {
  var region = String(info.region || 'HK').toUpperCase();
  var currency = String(info.currency || (region === 'TW' ? 'TWD' : 'HKD'));
  var moneyMark = currency === 'TWD' ? 'NT$' : 'HKD$';
  var orderType = String(info.orderType || '');
  var isMyship = orderType === 'myship' || String(info.fulfillmentId || '') === 'myship_711';
  var isPreorder = orderType === 'preorder';
  var regionLabel = region === 'TW' ? (isMyship ? '台灣通販（賣貨便）' : '台灣預購') : '香港商店';
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  if (isMyship && region === 'TW') {
    lines.push('感謝你在 staryu.me 完成台灣通販訂單。本站送出 = 下單完成。');
    lines.push('');
    lines.push('【請不要再開 7-11 賣貨便自己加購物車】');
    lines.push('以前是自己到賣貨便結帳；現在請只在 staryu.me 填一次。');
    lines.push('我們會把這筆訂單匯入賣貨便（代客下單）。');
    lines.push('之後你會收到賣貨便／OPEN POINT 通知，不是要你再選一次商品。');
    lines.push('我們寄出後，請到你填的 7-11 取貨並付款。本站不必轉帳。');
  } else if (isPreorder && region === 'TW') {
    lines.push('感謝你在 staryu.me 完成' + regionLabel + '登記。');
    lines.push('我們已收到你的預購；請依所選時段到場取貨並付款。');
    lines.push('管理頁：https://staryu.me/preorder.html?orderId=' + encodeURIComponent(info.orderId || ''));
  } else {
    lines.push('感謝你在 staryu.me 完成' + regionLabel + '訂單。');
    lines.push('我們已收到你的訂單與付款證明，核對後會安排出貨／取貨。');
  }
  lines.push('');
  lines.push('【訂單編號】 ' + info.orderId);
  lines.push('【地區】 ' + region);
  lines.push('【合計】 ' + moneyMark + ' ' + info.total);
  lines.push('【付款方式】 ' + info.payment);
  lines.push('【取貨方式】 ' + info.fulfillment);
  if (info.sfCode) lines.push('【門市／順豐】 ' + info.sfCode);
  if (info.phone) lines.push('【電話】 ' + info.phone);
  lines.push('');
  lines.push('【商品】');
  lines.push(info.itemsText || '(見訂單系統)');
  if (info.notes) {
    lines.push('');
    lines.push('【你想說的話】');
    lines.push(info.notes);
  }
  lines.push('');
  lines.push('如資料有誤或有任何問題，歡迎加入 Discord：');
  lines.push(DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— ' + STORE_NAME);

  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】' + regionLabel + '訂單確認 · ' + info.orderId,
    body: lines.join('\n')
  });
}

function sendCustomerManageEmail_(info, event) {
  if (!info.email) return;
  var title = event === 'cancel' ? '訂單已取消' : '訂單已更新';
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('你的台灣訂單（' + info.orderId + '）' + (event === 'cancel' ? '已取消。' : '已更新。'));
  if (event !== 'cancel') {
    lines.push('【取貨】 ' + (info.fulfillment || ''));
    lines.push('【門市】 ' + (info.sfCode || ''));
    lines.push('【電話】 ' + (info.phone || ''));
  }
  lines.push('');
  lines.push('管理頁：https://staryu.me/preorder.html?orderId=' + encodeURIComponent(info.orderId || ''));
  lines.push('Discord：' + DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— ' + STORE_NAME);
  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】' + title + ' · ' + info.orderId,
    body: lines.join('\n')
  });
}

function sendSellerNotifyEmail_(info) {
  if (!SELLER_NOTIFY_EMAIL) return;
  var region = String(info.region || 'HK').toUpperCase();
  var currency = String(info.currency || (region === 'TW' ? 'TWD' : 'HKD'));
  var moneyMark = currency === 'TWD' ? 'NT$' : 'HKD$';
  var isMyship = String(info.orderType || '') === 'myship' ||
    String(info.payment || '').indexOf('賣貨便') >= 0;
  var isPreorder = String(info.orderType || '') === 'preorder' ||
    String(info.payment || '').indexOf('預購') >= 0;
  var event = info.event || 'create';
  var kind = isMyship ? '賣貨便訂單' : (isPreorder ? '預購' : '訂單');
  var regionLabel = region === 'TW' ? (isMyship ? '台灣賣貨便' : '台灣') : '香港';
  var verb = event === 'cancel' ? '取消' : (event === 'update' ? '更新' : '新');

  var lines = [];
  lines.push('【' + verb + kind + '通知】staryu.me 商店');
  lines.push('');
  lines.push('【訂單編號】 ' + info.orderId);
  lines.push('【事件】 ' + event);
  lines.push('【類型】 ' + kind + ' · ' + regionLabel);
  lines.push('【地區】 ' + region + ' · ' + currency);
  lines.push('【合計】 ' + moneyMark + ' ' + info.total);
  lines.push('【付款】 ' + (info.payment || '—'));
  lines.push('【取貨】 ' + (info.fulfillment || '—'));
  if (info.sfCode) lines.push('【門市／順豐】 ' + info.sfCode);
  lines.push('');
  lines.push('【顧客】 ' + (info.name || '—'));
  lines.push('【電郵】 ' + (info.email || '—'));
  lines.push('【電話】 ' + (info.phone || '—'));
  lines.push('【SNS】 ' + (info.snsType || '—') + ' / ' + (info.snsContact || '—'));
  lines.push('');
  lines.push('【商品】');
  lines.push(info.itemsText || '(無)');
  if (info.notes) {
    lines.push('');
    lines.push('【備註】');
    lines.push(info.notes);
  }
  if (info.proofUrl) {
    lines.push('');
    lines.push('【付款截圖】 ' + info.proofUrl);
  }
  lines.push('');
  lines.push('（此信自動發送，請至 Google Sheet 訂單表核對。）');

  MailApp.sendEmail({
    to: SELLER_NOTIFY_EMAIL,
    subject: '【' + verb + kind + '】' + regionLabel + ' · ' + info.orderId + ' · ' + moneyMark + info.total,
    body: lines.join('\n')
  });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('賣貨便')
    .addItem('同步到官方匯入表', 'syncMyshipOrdersToImportSheet_')
    .addItem('重建匯入表（本檔「賣貨便匯入」分頁）', 'rebuildMyshipExportSheet_')
    .addToUi();
}

/**
 * Rebuilds sheet 「賣貨便匯入」: one row per line item for 訂單匯入.
 * File → Download → xlsx, then upload in 賣貨便後台. Rename headers if 範本 differs.
 * After a successful upload, set Status of those orders to imported so customers cannot edit.
 */
function rebuildMyshipExportSheet_() {
  ensureHeaders_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = orderSheet_();
  var last = src.getLastRow();
  var headers = [
    '收件人姓名', '收件人手機', 'Email', '門市店號', '門市名稱',
    '商品名稱', '規格', '單價', '數量', '訂單編號', '備註', 'SheetStatus'
  ];
  var out = ss.getSheetByName(MYSHIP_EXPORT_SHEET);
  if (!out) out = ss.insertSheet(MYSHIP_EXPORT_SHEET);
  out.clearContents();
  out.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (last < 2) {
    SpreadsheetApp.getUi().alert('沒有訂單列。');
    return;
  }
  var width = Math.max(src.getLastColumn(), HEADERS.length);
  var data = src.getRange(2, 1, last, width).getValues();
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var v = data[i];
    var region = String(v[col_('Region') - 1] || '').toUpperCase();
    var orderId = String(v[col_('Order ID') - 1] || '');
    if (!region && orderId.indexOf('TW-') === 0) region = 'TW';
    if (region !== 'TW') continue;
    var status = String(v[col_('Status') - 1] || '');
    if (status.toLowerCase().indexOf('cancel') >= 0) continue;
    var fulfillmentId = String(v[col_('FulfillmentId') - 1] || '');
    var orderType = String(v[col_('OrderType') - 1] || '').toLowerCase();
    if (orderType !== 'myship' && fulfillmentId !== 'myship_711') continue;
    var store = parseStoreFromNotes_(v[col_('Notes') - 1], v[col_('SF Code') - 1]);
    var items = [];
    try {
      items = JSON.parse(String(v[col_('ItemsJson') - 1] || '[]'));
    } catch (e) {
      items = [];
    }
    if (!items || !items.length) {
      items = [{ title: String(v[col_('Items') - 1] || ''), qty: 1, unit: v[col_('Total') - 1] }];
    }
    var note = String(v[col_('Notes') - 1] || '').replace(/^\[STORE\][^\n]*\n?/, '');
    for (var j = 0; j < items.length; j++) {
      var it = items[j] || {};
      rows.push([
        String(v[col_('Name') - 1] || ''),
        String(v[col_('Phone') - 1] || ''),
        String(v[col_('Email') - 1] || ''),
        store.storeId,
        store.storeName,
        String(it.title || it.name || ''),
        String(it.spec || ''),
        Number(it.unit != null ? it.unit : it.price) || 0,
        Number(it.qty) || 0,
        orderId,
        note,
        status
      ]);
    }
  }
  if (rows.length) {
    out.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  SpreadsheetApp.getUi().alert('已寫入 ' + rows.length + ' 列到「' + MYSHIP_EXPORT_SHEET + '」。請 File → Download，再於賣貨便「訂單匯入」上傳。');
}

/**
 * Copy TW 賣貨便 orders into the official import Google Sheet (one row per order).
 * Appends only; skips Order IDs already in dest 商品備註. HK / FF47 preorder ignored.
 */
function syncMyshipOrdersToImportSheet_() {
  try {
  ensureHeaders_();
  var destSs = SpreadsheetApp.openById(MYSHIP_IMPORT_SPREADSHEET_ID);
  var dest = destSs.getSheetByName(MYSHIP_IMPORT_TAB) || destSs.getSheets()[0];
  var layout = myshipImportLayout_(dest);
  var existing = myshipImportExistingIds_(dest, layout);

  var src = orderSheet_();
  var last = src.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getUi().alert('沒有訂單列。');
    return;
  }
  var width = Math.max(src.getLastColumn(), HEADERS.length);
  var data = src.getRange(2, 1, last, width).getValues();
  var out = [];
  var skipped = 0;
  var skippedDup = 0;
  for (var i = 0; i < data.length; i++) {
    var v = data[i];
    if (!isTwMyshipSourceRow_(v)) {
      skipped++;
      continue;
    }
    var orderId = String(v[col_('Order ID') - 1] || '').trim();
    if (!orderId) continue;
    if (existing[orderId.toLowerCase()]) {
      skippedDup++;
      continue;
    }
    var store = parseStoreFromNotes_(v[col_('Notes') - 1], v[col_('SF Code') - 1]);
    var items = [];
    try {
      items = JSON.parse(String(v[col_('ItemsJson') - 1] || '[]'));
    } catch (e) {
      items = [];
    }
    if (!items || !items.length) {
      items = [{ title: String(v[col_('Items') - 1] || ''), qty: 1 }];
    }
    var sns = [String(v[col_('SNS Type') - 1] || ''), String(v[col_('SNS Contact') - 1] || '')]
      .filter(function (s) { return s; })
      .join(' ');
    var row = [];
    row[layout.colName] = sanitizeMyshipName_(v[col_('Name') - 1]);
    row[layout.colPhone] = normalizeMyshipPhone_(v[col_('Phone') - 1]);
    row[layout.colStore] = String(store.storeId || '').replace(/\D/g, '');
    row[layout.colTemp] = '常溫';
    row[layout.colGoods] = formatMyshipGoods_(items).slice(0, 200);
    row[layout.colAmount] = String(Number(v[col_('Total') - 1]) || 0);
    row[layout.colShip] = String(MYSHIP_SHIPPING_TWD);
    row[layout.colDate] = formatMyshipDate_(v[col_('Timestamp') - 1]);
    row[layout.colRemark] = orderId;
    row[layout.colExtra] = sns.slice(0, 200);
    out.push(padMyshipRow_(row, layout.width));
    existing[orderId.toLowerCase()] = true;
  }

  if (out.length) {
    var rng = dest.getRange(layout.nextRow, 1, out.length, layout.width);
    rng.setNumberFormat('@');
    rng.setValues(out);
  }
  SpreadsheetApp.getUi().alert(
    '已同步到官方匯入表「' + dest.getName() + '」\n\n' +
    '新增：' + out.length + ' 筆\n' +
    '已存在（略過）：' + skippedDup + ' 筆\n' +
    '非賣貨便列略過：' + skipped + ' 筆\n\n' +
    '請核對姓名／門市後，到賣貨便後台「訂單匯入」上傳。成功後把來源表 Status 設為 imported。'
  );
  } catch (err) {
    SpreadsheetApp.getUi().alert('同步失敗：' + err);
  }
}

function isTwMyshipSourceRow_(v) {
  var region = String(v[col_('Region') - 1] || '').toUpperCase();
  var orderId = String(v[col_('Order ID') - 1] || '');
  if (!region && orderId.indexOf('TW-') === 0) region = 'TW';
  if (region !== 'TW') return false;
  var status = String(v[col_('Status') - 1] || '').toLowerCase();
  if (status.indexOf('cancel') >= 0) return false;
  var fulfillmentId = String(v[col_('FulfillmentId') - 1] || '');
  var orderType = String(v[col_('OrderType') - 1] || '').toLowerCase();
  return orderType === 'myship' || fulfillmentId === 'myship_711';
}

function myshipImportLayout_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 10);
  var scanRows = Math.min(10, Math.max(1, sheet.getLastRow()));
  var headerRow = 1;
  var found = false;
  var values = sheet.getRange(1, 1, scanRows, lastCol).getValues();
  for (var r = 0; r < values.length; r++) {
    var a = String(values[r][0] || '');
    if (a.indexOf('取件人姓名') >= 0) {
      headerRow = r + 1;
      found = true;
      break;
    }
  }
  if (!found) {
    throw new Error('找不到「取件人姓名」表頭。請確認分頁為官方 訂單匯入 格式。');
  }
  var headers = values[headerRow - 1];
  function idx(part) {
    for (var c = 0; c < headers.length; c++) {
      if (String(headers[c] || '').indexOf(part) >= 0) return c;
    }
    return -1;
  }
  var layout = {
    headerRow: headerRow,
    nextRow: Math.max(sheet.getLastRow() + 1, headerRow + 1),
    width: lastCol,
    colName: idx('取件人姓名'),
    colPhone: idx('取件人手機'),
    colStore: idx('取件門市'),
    colTemp: idx('溫層'),
    colGoods: idx('商品'),
    colAmount: idx('訂單金額'),
    colShip: idx('運費金額'),
    colDate: idx('買家下訂日期'),
    colRemark: idx('商品備註'),
    colExtra: idx('其他資訊')
  };
  if (layout.colName < 0 || layout.colPhone < 0 || layout.colStore < 0 || layout.colGoods < 0) {
    throw new Error('官方表頭欄位不完整（需要姓名／手機／門市／商品）。');
  }
  if (layout.colTemp < 0) layout.colTemp = 3;
  if (layout.colAmount < 0) layout.colAmount = 5;
  if (layout.colShip < 0) layout.colShip = 6;
  if (layout.colDate < 0) layout.colDate = 7;
  if (layout.colRemark < 0) layout.colRemark = 8;
  if (layout.colExtra < 0) layout.colExtra = 9;
  layout.width = Math.max(layout.width, 10);
  return layout;
}

function myshipImportExistingIds_(sheet, layout) {
  var map = {};
  var last = sheet.getLastRow();
  if (last <= layout.headerRow || layout.colRemark < 0) return map;
  var col = layout.colRemark + 1;
  var vals = sheet.getRange(layout.headerRow + 1, col, last - layout.headerRow, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    var id = String(vals[i][0] || '').trim();
    if (id) map[id.toLowerCase()] = true;
  }
  return map;
}

function padMyshipRow_(sparse, width) {
  var row = [];
  for (var i = 0; i < width; i++) row[i] = sparse[i] != null ? sparse[i] : '';
  return row;
}

function sanitizeMyshipName_(raw) {
  var s = String(raw || '');
  s = s.replace(/[0-9`~!@#$%^&*()\/\\|,.\s<>'"?;:_+\-=\[\]{}]/g, '');
  return s || String(raw || '').replace(/[0-9]/g, '').trim();
}

function normalizeMyshipPhone_(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.indexOf('886') === 0) d = d.slice(3);
  if (d.length === 9 && d.charAt(0) === '9') d = '0' + d;
  return d;
}

function formatMyshipGoods_(items) {
  var parts = [];
  (items || []).forEach(function (it) {
    if (!it) return;
    var title = String(it.title || it.name || '').trim();
    if (!title) return;
    var qty = Number(it.qty) || 1;
    parts.push(qty > 1 ? (title + '×' + qty) : title);
  });
  return parts.join('、') || '商品';
}

function formatMyshipDate_(ts) {
  var d = ts instanceof Date ? ts : (ts ? new Date(ts) : new Date());
  if (isNaN(d.getTime())) d = new Date();
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
}
