// ── STARYUME HK Store Checkout — paste entire file into Apps Script Code.gs ──
// Drive folder: https://drive.google.com/open?id=1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X
// After edit: Deploy → Manage deployments → Edit → New version → Deploy

var PROOF_FOLDER_ID = '1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X';
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var MAX_PROOF_BYTES = 6000000;
var STORE_NAME = 'staryume';

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
    var total = data.totalHkd != null ? data.totalHkd : '';
    var name = data.name || '';
    var email = (data.email || '').trim();
    var phone = data.phone || '';
    var snsType = data.snsType || '';
    var snsContact = data.snsContact || '';
    var fulfillment = data.fulfillmentLabel || data.fulfillmentId || '';
    var sfCode = data.sfCode || '';
    var payment = paymentLabel_(data.paymentMethod || '');
    var notes = data.notes || '';

    // Sheet FIRST — order is never lost if Drive fails
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

    if (email) {
      try {
        sendOrderEmail_({
          email: email,
          name: name,
          orderId: orderId,
          itemsText: itemsText,
          total: total,
          fulfillment: fulfillment,
          sfCode: sfCode,
          payment: payment,
          phone: phone,
          notes: notes
        });
      } catch (mailErr) {
        console.error('Mail failed: ' + mailErr);
      }
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
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    console.error('Share failed: ' + shareErr);
  }
  return file.getUrl();
}

function sanitizeFileName_(name, orderId) {
  var base = String(name || 'proof.jpg').replace(/[^\w.\-()+\u4e00-\u9fff]/g, '_');
  if (!base) base = orderId + '.jpg';
  return base.substring(0, 80);
}

function sendOrderEmail_(info) {
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('感謝你在 staryu.me 完成香港商店訂單。');
  lines.push('我們已收到你的訂單與付款證明，核對後會安排出貨／取貨。');
  lines.push('');
  lines.push('【訂單編號】 ' + info.orderId);
  lines.push('【合計】 HKD$ ' + info.total);
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
    subject: '【staryume】香港商店訂單確認 · ' + info.orderId,
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
