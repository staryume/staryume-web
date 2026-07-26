// ── STARYUME HK Store Checkout — paste entire file into Apps Script Code.gs ──
// Drive folder: https://drive.google.com/open?id=1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X
// After edit: Deploy → Manage deployments → Edit → New version → Deploy

var PROOF_FOLDER_ID = '1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X';
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var MAX_PROOF_BYTES = 6000000;
var STORE_NAME = 'staryume';
/** New order / pre-order alerts (you). Customer still gets their own confirmation. */
var SELLER_NOTIFY_EMAIL = 'staryume@gmail.com';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);

    var orderId = String(data.orderId || '').trim() || ('HK-' + Date.now());
    var itemsText = data.itemsText || '';
    if (!itemsText && data.items && data.items.length) {
      itemsText = data.items.map(function (it) {
        return (it.title || it.id) + ' x' + it.qty + ' @ HKD$' + it.unit;
      }).join('\n');
    }
    var total = data.totalHkd != null ? data.totalHkd : (data.total != null ? data.total : '');
    var region = String(data.region || 'HK').toUpperCase();
    var currency = String(data.currency || (region === 'TW' ? 'TWD' : 'HKD'));
    var name = data.name || '';
    var email = (data.email || '').trim();
    var phone = data.phone || '';
    var snsType = data.snsType || '';
    var snsContact = data.snsContact || '';
    var fulfillment = data.fulfillmentLabel || data.fulfillmentId || '';
    fulfillment = region + ' · ' + currency + (fulfillment ? (' · ' + fulfillment) : '');
    var sfCode = data.sfCode || '';
    var payment = data.paymentLabel || paymentLabel_(data.paymentMethod || '');
    if (data.orderType === 'preorder' && !payment) payment = '預購·現場付款';
    var notes = data.notes || '';
    if (data.orderType === 'preorder') {
      notes = (notes ? (notes + '\n') : '') + '[PREORDER] pay at pickup; pledge OK';
    }

    // Sheet FIRST — order is never lost if Drive fails
    // Columns: Timestamp, Order ID, Items, Total, Name, Email, Phone, SNS Type, SNS Contact, Fulfillment(+region), SF Code, Payment, Proof URL, Notes, Status
    sheet.appendRow([
      new Date(),
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
      '',
      notes,
      'new'
    ]);
    var row = sheet.getLastRow();

    var proofUrl = '';
    var proofError = '';
    if (data.proof && data.proof.dataUrl) {
      try {
        proofUrl = saveProof_(data.proof, orderId);
        if (proofUrl) sheet.getRange(row, 13).setValue(proofUrl);
      } catch (proofErr) {
        proofError = String(proofErr);
        console.error('Proof upload failed: ' + proofError);
        sheet.getRange(row, 15).setValue('new; proof_failed');
      }
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
      sfCode: sfCode,
      payment: payment,
      phone: phone,
      snsType: snsType,
      snsContact: snsContact,
      notes: notes,
      proofUrl: proofUrl,
      orderType: data.orderType || ''
    };

    if (email) {
      try {
        sendOrderEmail_(mailInfo);
      } catch (mailErr) {
        console.error('Customer mail failed: ' + mailErr);
      }
    }

    // Always notify seller (HK paid orders + TW FF47 pre-orders)
    try {
      sendSellerNotifyEmail_(mailInfo);
    } catch (sellerMailErr) {
      console.error('Seller notify mail failed: ' + sellerMailErr);
    }

    return jsonOut_({
      ok: true,
      orderId: orderId,
      proofUrl: proofUrl || null,
      proofError: proofError || null
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

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
  if (bytes.length > MAX_PROOF_BYTES) {
    throw new Error('proof_too_large');
  }

  var blob = Utilities.newBlob(bytes, mime, sanitizeFileName_(name, orderId));
  var folder = DriveApp.getFolderById(PROOF_FOLDER_ID);
  var file = folder.createFile(blob);
  file.setName(orderId + '_' + sanitizeFileName_(name, orderId));
  // Keep proofs private (owner / shared folder only). Do not set "anyone with the link".
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

/** Notify shop owner of every new order / pre-order. */
function sendSellerNotifyEmail_(info) {
  if (!SELLER_NOTIFY_EMAIL) return;
  var region = String(info.region || 'HK').toUpperCase();
  var currency = String(info.currency || (region === 'TW' ? 'TWD' : 'HKD'));
  var moneyMark = currency === 'TWD' ? 'NT$' : 'HKD$';
  var isPreorder = String(info.orderType || '') === 'preorder' ||
    String(info.payment || '').indexOf('預購') >= 0;
  var kind = isPreorder ? '預購' : '訂單';
  var regionLabel = region === 'TW' ? '台灣 FF47' : '香港';

  var lines = [];
  lines.push('【新' + kind + '通知】staryu.me 商店');
  lines.push('');
  lines.push('【訂單編號】 ' + info.orderId);
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
    subject: '【新' + kind + '】' + regionLabel + ' · ' + info.orderId + ' · ' + moneyMark + info.total,
    body: lines.join('\n')
  });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('HK store checkout endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
