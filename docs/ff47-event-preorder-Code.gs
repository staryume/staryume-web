// ── STARYUME FF47 Event Backorder — paste entire file into Apps Script Code.gs ──
// Sheet title: STARYUME FF47 Event Backorder
// After edit: Deploy → Manage deployments → Edit → New version → Deploy

var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var SELLER_NOTIFY_EMAIL = 'staryume@gmail.com';
var STORE_NAME = 'staryume';
var SERIAL_COL = 2;
var POSTAGE_BASE = 300;
var POSTAGE_BULKY_EXTRA = 100;
var MAX_QTY_EACH = 9;

var PRODUCT_CATALOG = {
  'sleeve-dmg': { title: '新作卡套 黑魔導女孩 (ver. 2026)', price: 300, bulky: false },
  'sleeve-gogo': { title: '新作卡套 我我我女孩', price: 300, bulky: false },
  'leather-box': { title: '皮質卡片收納盒', price: 800, bulky: false },
  'mat-dmg': { title: '新作遊戲墊 黑魔導女孩 (ver. 2026)', price: 600, bulky: true },
  'scroll-dmg': { title: '新作掛軸 黑魔導女孩 (ver. 2026)', price: 600, bulky: true },
  'scroll-gogo': { title: '新作掛軸 我我我女孩', price: 600, bulky: true }
};

var SNS_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  discord: 'Discord',
  whatsapp: 'WhatsApp',
  other: '其他'
};

var HEADERS = [
  'Timestamp', 'Serial', 'Items', 'Goods TWD', 'Postage TWD', 'Total TWD',
  'Name', 'Email', 'Phone', 'SNS Type', 'SNS Contact', 'Address', 'Notes', 'Status'
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var data = JSON.parse(e.postData.contents);
    var sheet = orderSheet_();
    ensureHeaders_(sheet);

    var serial = String(data.serial || '').trim().replace(/\s+/g, '').toUpperCase();
    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim();
    var phone = String(data.phone || '').trim();
    var snsType = SNS_LABELS[data.snsType] || String(data.snsType || '').trim();
    var snsContact = String(data.snsContact || '').trim();
    var address = String(data.address || '').trim();
    var notes = String(data.notes || '').trim();

    if (!serial) return jsonOut_({ ok: false, error: 'missing_serial' });
    if (!name || !email || !phone || !address) {
      return jsonOut_({ ok: false, error: 'missing_fields' });
    }

    var priced = priceItems_(data.items);
    if (!priced.ok) return jsonOut_({ ok: false, error: priced.error });

    if (serialExists_(sheet, serial)) {
      if (email) {
        try { sendDuplicateEmail_({ email: email, name: name, serial: serial }); } catch (mailErr) {
          console.error('Duplicate mail failed: ' + mailErr);
        }
      }
      return jsonOut_({ ok: false, error: 'duplicate_serial' });
    }

    sheet.appendRow([
      new Date(),
      serial,
      priced.itemsText,
      priced.goods,
      priced.postage,
      priced.total,
      name,
      email,
      phone,
      snsType,
      snsContact,
      address,
      notes,
      'new'
    ]);

    var info = {
      serial: serial,
      name: name,
      email: email,
      phone: phone,
      snsType: snsType,
      snsContact: snsContact,
      address: address,
      notes: notes,
      itemsText: priced.itemsText,
      goods: priced.goods,
      postage: priced.postage,
      total: priced.total
    };
    try { sendConfirmationEmail_(info); } catch (mailErr) { console.error('Mail failed: ' + mailErr); }
    try { sendSellerNotifyEmail_(info); } catch (sellErr) { console.error('Seller mail failed: ' + sellErr); }

    return jsonOut_({ ok: true, serial: serial, total: priced.total });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet() {
  try { ensureHeaders_(orderSheet_()); } catch (e) { console.error(e); }
  return ContentService
    .createTextOutput('FF47 event preorder endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

/** Run once from the Apps Script editor (select setupSheet → Run) to write row-1 headers on a blank sheet. */
function setupSheet() {
  var sheet = orderSheet_();
  ensureHeaders_(sheet);
}

function priceItems_(rawItems) {
  if (!rawItems || !rawItems.length) return { ok: false, error: 'missing_items' };
  var lines = [];
  var goods = 0;
  var bulkyQty = 0;
  var seen = {};
  for (var i = 0; i < rawItems.length; i++) {
    var it = rawItems[i] || {};
    var id = String(it.id || '').trim();
    var catalog = PRODUCT_CATALOG[id];
    if (!catalog) return { ok: false, error: 'unknown_item' };
    if (seen[id]) return { ok: false, error: 'duplicate_item' };
    seen[id] = true;
    var qty = parseInt(it.qty, 10);
    if (!isFinite(qty) || qty < 1 || qty > MAX_QTY_EACH) {
      return { ok: false, error: 'invalid_qty' };
    }
    var line = catalog.price * qty;
    goods += line;
    if (catalog.bulky) bulkyQty += qty;
    lines.push(catalog.title + ' ×' + qty + ' @ NT$' + catalog.price + ' = NT$' + line);
  }
  var postage = POSTAGE_BASE + (bulkyQty >= 2 ? POSTAGE_BULKY_EXTRA : 0);
  return {
    ok: true,
    goods: goods,
    postage: postage,
    total: goods + postage,
    itemsText: lines.join('\n')
  };
}

function orderSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function ensureHeaders_(sheet) {
  var existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var empty = true;
  for (var i = 0; i < HEADERS.length; i++) {
    if (String(existing[i] || '').trim()) { empty = false; break; }
  }
  if (empty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    try {
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } catch (e) { /* ignore formatting */ }
  }
}

function serialExists_(sheet, serial) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, SERIAL_COL, lastRow - 1, 1).getValues();
  var target = String(serial).toLowerCase();
  for (var i = 0; i < values.length; i++) {
    var cell = String(values[i][0] || '').trim().replace(/\s+/g, '').toLowerCase();
    if (cell && cell === target) return true;
  }
  return false;
}

function sendConfirmationEmail_(info) {
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('感謝你在 FF47 攤位預購。我們已在現場收款，商品將於 2026 年 9 月中從香港以順豐宅配寄出。');
  lines.push('');
  lines.push('【流水號】 ' + info.serial);
  lines.push('【商品】');
  lines.push(info.itemsText || '(無)');
  lines.push('【商品小計】 NT$' + info.goods);
  lines.push('【郵資】 NT$' + info.postage);
  lines.push('【合計（現場已付）】 NT$' + info.total);
  lines.push('');
  lines.push('【收件人】 ' + info.name);
  lines.push('【手機】 ' + info.phone);
  lines.push('【宅配地址】 ' + info.address);
  lines.push('【SNS】 ' + info.snsType + ' / ' + info.snsContact);
  if (info.notes) lines.push('【備註】 ' + info.notes);
  lines.push('');
  lines.push('寄送：順豐快遞（香港 → 台灣宅配）');
  lines.push('若海關或順豐要求 EZ WAY 實名認證，請用本表的手機配合。');
  lines.push('');
  lines.push('如地址有誤，請盡快透過 Discord 聯絡我們：');
  lines.push(DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— ' + STORE_NAME);

  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】FF47 會場預購確認 · ' + info.serial,
    body: lines.join('\n')
  });
}

function sendDuplicateEmail_(info) {
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('你提交的流水號「' + info.serial + '」已經登記過，系統沒有建立重複預購。');
  lines.push('');
  lines.push('若要更改宅配地址，請透過 Discord 聯絡我們：');
  lines.push(DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— ' + STORE_NAME);
  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】流水號已登記 · ' + info.serial,
    body: lines.join('\n')
  });
}

function sendSellerNotifyEmail_(info) {
  if (!SELLER_NOTIFY_EMAIL) return;
  var lines = [];
  lines.push('【FF47 會場預購】新單');
  lines.push('');
  lines.push('【流水號】 ' + info.serial);
  lines.push('【合計】 NT$' + info.total + '（商品 NT$' + info.goods + ' + 郵資 NT$' + info.postage + '）');
  lines.push('');
  lines.push('【顧客】 ' + info.name);
  lines.push('【電郵】 ' + info.email);
  lines.push('【手機】 ' + info.phone);
  lines.push('【SNS】 ' + info.snsType + ' / ' + info.snsContact);
  lines.push('【地址】 ' + info.address);
  lines.push('');
  lines.push('【商品】');
  lines.push(info.itemsText || '(無)');
  if (info.notes) {
    lines.push('');
    lines.push('【備註】 ' + info.notes);
  }
  MailApp.sendEmail({
    to: SELLER_NOTIFY_EMAIL,
    subject: '【FF47 會場預購】' + info.serial + ' · NT$' + info.total,
    body: lines.join('\n')
  });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
