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

/** Same email cannot place another TW pre-order within this many hours. */
var NEW_ORDER_COOLDOWN_HOURS = 24;
/**
 * Deadline for BOTH:
 *  - creating NEW Taiwan FF47 pre-orders
 *  - customer edit / cancel of existing TW pre-orders
 * = 24 hours before FF47 Day 1 (2026-08-21) → 2026-08-20 00:00 Taipei (+08)
 */
var TW_PREORDER_DEADLINE_ISO = '2026-08-20T00:00:00+08:00';

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
  var orderType = String(data.orderType || (data.paymentMethod === 'preorder_on_site' ? 'preorder' : 'paid'));
  if (region !== 'TW') {
    orderType = 'paid';
  } else if (data.paymentMethod === 'preorder_on_site' || orderType === 'preorder') {
    orderType = 'preorder';
  } else {
    orderType = 'paid';
  }
  var isTwPreorder = (region === 'TW' && orderType === 'preorder');
  var name = data.name || '';
  var email = normalizeEmail_(data.email);
  var phone = data.phone || '';
  var snsType = data.snsType || '';
  var snsContact = data.snsContact || '';
  var fulfillmentId = data.fulfillmentId || '';
  var fulfillment = data.fulfillmentLabel || fulfillmentId || '';
  fulfillment = region + ' · ' + currency + (fulfillment ? (' · ' + fulfillment) : '');
  var sfCode = data.sfCode || '';
  var payment = data.paymentLabel || paymentLabel_(data.paymentMethod || '');
  if (isTwPreorder && !payment) payment = '預購·現場付款';
  var notes = data.notes || '';
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

  // TW pre-order gates
  if (isTwPreorder) {
    var closed = twDeadlinePassed_();
    if (closed) {
      return jsonOut_({
        ok: false,
        error: 'preorder_closed',
        message: '台灣 FF47 預購已截止（活動前 24 小時起），無法再建立新預購。如已有訂單且仍在期限內，請至管理頁修改／取消。'
      });
    }
    var cool = findRecentTwPreorderByEmail_(email);
    if (cool) {
      return jsonOut_({
        ok: false,
        error: 'preorder_cooldown',
        orderId: cool.orderId,
        message: '同一電郵 24 小時內只能建立一筆預購。請管理既有訂單：' + cool.orderId,
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
  if (!isTwPreorder) {
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
    editableUntil: isTwPreorder
      ? twDeadlineDate_().toISOString()
      : null,
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
      message: '已超過可修改期限（Fancy Frontier 47 開始前 24 小時截止）。請聯絡 Discord 客服。'
    });
  }
  if (found.values[col_('Status') - 1] === 'cancelled') {
    return jsonOut_({ ok: false, error: 'cancelled', message: '此預購已取消。' });
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
  if (fulfillmentId !== 'ff47_day1' && fulfillmentId !== 'ff47_day2') {
    return jsonOut_({ ok: false, error: 'invalid_fulfillment', message: '取貨方式無效。' });
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
      message: '已超過可取消期限（Fancy Frontier 47 開始前 24 小時截止）。請聯絡 Discord 客服。'
    });
  }
  if (found.values[col_('Status') - 1] === 'cancelled') {
    return jsonOut_({ ok: false, error: 'cancelled', message: '此預購已取消。' });
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
  if (twDeadlinePassed_()) {
    return jsonOut_({
      ok: true,
      canCreate: false,
      reason: 'preorder_closed',
      message: '台灣 FF47 預購已截止（活動前 24 小時起）。'
    });
  }
  var cool = findRecentTwPreorderByEmail_(email);
  if (cool) {
    return jsonOut_({
      ok: true,
      canCreate: false,
      reason: 'preorder_cooldown',
      orderId: cool.orderId,
      message: '24 小時內已有預購，請先管理既有訂單。'
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

/** After this instant: no new TW pre-orders; no customer edit/cancel. */
function twDeadlinePassed_() {
  return new Date() >= twDeadlineDate_();
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
    if (orderType && orderType !== 'preorder') continue;
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
    if (region !== 'TW' || (orderType && orderType !== 'preorder' && orderId.indexOf('TW-') !== 0)) {
      return { ok: false, error: 'not_tw_preorder', message: '此功能僅適用於台灣 FF47 預購。' };
    }
    var status = String(rowVals[col_('Status') - 1] || '');
    var ts = rowVals[col_('Timestamp') - 1];
    var t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
    var cancelled = status.toLowerCase().indexOf('cancel') >= 0;
    var editable = !cancelled && !twDeadlinePassed_();
    return {
      ok: true,
      row: i + 2,
      values: rowVals,
      editable: editable,
      editableUntil: twDeadlineDate_().toISOString()
    };
  }
  return { ok: false, error: 'not_found', message: '找不到訂單。' };
}

function publicOrder_(row, values) {
  var ts = values[col_('Timestamp') - 1];
  var t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
  var status = String(values[col_('Status') - 1] || 'new');
  var cancelled = status.toLowerCase().indexOf('cancel') >= 0;
  var editable = !cancelled && !twDeadlinePassed_();
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
    fulfillmentId: String(values[col_('FulfillmentId') - 1] || ''),
    status: cancelled ? 'cancelled' : 'new',
    region: 'TW',
    orderType: 'preorder',
    createdAt: t ? new Date(t).toISOString() : null,
    editable: editable,
    editableUntil: twDeadlineDate_().toISOString()
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
    orderType: 'preorder',
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
  var isPreorder = String(info.orderType || '') === 'preorder' || region === 'TW';
  var regionLabel = region === 'TW' ? '台灣預購（FF47）' : '香港商店';
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  if (isPreorder && region === 'TW') {
    lines.push('感謝你在 staryu.me 完成' + regionLabel + '登記。');
    lines.push('我們已收到你的預購；請依所選時段到場取貨並付款。');
    lines.push('');
    lines.push('【重要】可修改取貨日／聯絡資料或取消預購，截止時間：');
    lines.push('Fancy Frontier 47 開始前 24 小時（2026/8/20 00:00 台北時間）為止。');
    lines.push('管理頁（訂單編號 + 下單電郵）：');
    lines.push('https://staryu.me/preorder.html?orderId=' + encodeURIComponent(info.orderId || ''));
    lines.push('或從商店台灣頁「管理訂單」進入。');
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
  if (info.sfCode) lines.push('【順豐取貨資料】 ' + info.sfCode);
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
  var title = event === 'cancel' ? '預購已取消' : '預購已更新';
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('你的 FF47 預購（' + info.orderId + '）' + (event === 'cancel' ? '已取消。' : '已更新。'));
  if (event !== 'cancel') {
    lines.push('【取貨】 ' + (info.fulfillment || ''));
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
  var isPreorder = String(info.orderType || '') === 'preorder' ||
    String(info.payment || '').indexOf('預購') >= 0;
  var event = info.event || 'create';
  var kind = isPreorder ? '預購' : '訂單';
  var regionLabel = region === 'TW' ? '台灣 FF47' : '香港';
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
  if (info.sfCode) lines.push('【順豐】 ' + info.sfCode);
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
