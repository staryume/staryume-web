// HK book form → Google Sheet + confirmation email
// Paste into: HK Book Form Responses → Extensions → Apps Script
// Deploy → Manage deployments → Edit → New version
//
// Column B must be Serial. doPost inserts that column if it is missing.

var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var SERIAL_COL = 2;

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureSerialColumn_(sheet);

    var data = JSON.parse(e.postData.contents);

    var methodLabels = {
      palette_ring: '9月 Palette Ring 現場領取',
      mail: '郵寄（順豐快運 · 順豐站）'
    };
    var snsLabels = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      discord: 'Discord',
      other: '其他'
    };

    var method = methodLabels[data.method] || data.method || '';
    var snsType = snsLabels[data.snsType] || data.snsType || '';
    var serial = String(data.serial || '').trim().replace(/\s+/g, '');
    var name = data.name || '';
    var email = (data.email || '').trim();
    var snsContact = data.snsContact || '';
    var phone = data.phone || '';
    var address = data.address || '';
    var notes = data.notes || '';

    if (!serial) {
      return jsonOut_({ ok: false, error: 'missing_serial' });
    }

    if (serialExists_(sheet, serial)) {
      if (email) {
        try {
          sendDuplicateEmail_({ email: email, name: name, serial: serial });
        } catch (mailErr) {
          console.error('Duplicate mail failed: ' + mailErr);
        }
      }
      return jsonOut_({ ok: false, error: 'duplicate_serial', serial: serial });
    }

    sheet.appendRow([
      new Date(),
      serial,
      method,
      name,
      email,
      snsType,
      snsContact,
      phone,
      address,
      notes
    ]);

    var info = {
      email: email,
      name: name,
      serial: serial,
      method: method,
      snsType: snsType,
      snsContact: snsContact,
      phone: phone,
      address: address,
      notes: notes
    };

    if (email) {
      try {
        sendConfirmationEmail_(info);
      } catch (mailErr) {
        console.error('Mail failed: ' + mailErr);
      }
    }
    try {
      notifySeller_(info);
    } catch (sellerErr) {
      console.error('Seller mail failed: ' + sellerErr);
    }

    return jsonOut_({ ok: true, serial: serial });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/** If column B is Method (old sheet), insert Serial so 流水號 is never written into Method. */
function ensureSerialColumn_(sheet) {
  var headerB = String(sheet.getRange(1, 2).getValue() || '').trim().toLowerCase();
  if (headerB === 'serial' || headerB.indexOf('流水') >= 0) return;
  sheet.insertColumnBefore(2);
  sheet.getRange(1, 2).setValue('Serial');
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
  lines.push('感謝你提交香港領取登記。以下是你剛才填寫的資料摘要：');
  lines.push('');
  lines.push('【流水號】 ' + info.serial);
  lines.push('【領取方式】 ' + info.method);
  lines.push('【姓名】 ' + info.name);
  lines.push('【電郵】 ' + info.email);
  lines.push('【SNS】 ' + info.snsType + ' / ' + info.snsContact);
  if (info.phone) lines.push('【電話】 ' + info.phone);
  if (info.address) lines.push('【順豐站代碼】 ' + info.address);
  if (info.notes) lines.push('【其他備註】 ' + info.notes);
  lines.push('');
  lines.push('如資料有誤，或之後有任何問題，歡迎加入 Discord 查詢：');
  lines.push(DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— staryume');

  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】香港領取登記確認 · ' + info.serial,
    body: lines.join('\n')
  });
}

function sendDuplicateEmail_(info) {
  var lines = [];
  lines.push(info.name ? (info.name + ' 你好，') : '你好，');
  lines.push('');
  lines.push('你提交的流水號「' + info.serial + '」已經登記過，系統沒有建立重複預約。');
  lines.push('');
  lines.push('若你需要更改資料，請透過 Discord 聯絡我們：');
  lines.push(DISCORD_INVITE_URL);
  lines.push('');
  lines.push('— staryume');

  MailApp.sendEmail({
    to: info.email,
    subject: '【staryume】流水號已登記 · ' + info.serial,
    body: lines.join('\n')
  });
}

function notifySeller_(info) {
  var me = '';
  try {
    me = Session.getEffectiveUser().getEmail() || '';
  } catch (e) {
    me = '';
  }
  if (!me) return;
  var lines = [];
  lines.push('HK book form 新登記');
  lines.push('');
  lines.push('【流水號】 ' + info.serial);
  lines.push('【領取方式】 ' + info.method);
  lines.push('【姓名】 ' + info.name);
  lines.push('【電郵】 ' + info.email);
  lines.push('【SNS】 ' + info.snsType + ' / ' + info.snsContact);
  if (info.phone) lines.push('【電話】 ' + info.phone);
  if (info.address) lines.push('【順豐站代碼】 ' + info.address);
  if (info.notes) lines.push('【其他備註】 ' + info.notes);
  MailApp.sendEmail({
    to: me,
    subject: '【HK form】' + info.serial + ' · ' + (info.name || ''),
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
    .createTextOutput('HK form endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
