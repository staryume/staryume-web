# Hong Kong Form → Google Sheets + Confirmation Email

The form page is: **`hk-form.html`**  
Live URL after deploy: **`https://staryu.me/hk-form.html`**  
Local test URL: **`http://localhost:8010/hk-form.html`**  
(Use any free port; if Starpedia is on 8000, use e.g. `python3 -m http.server 8010`)

---

## What happens on submit

1. Server checks **流水號** is not empty and **not already used** in the sheet.
2. If new: row is written to Google Spreadsheet.
3. A **confirmation email** is sent with a summary of answers (including 流水號).
4. The email (and success page) include a **Discord invite** for later enquiries.

Emails are sent from **your Google account** (the one that owns the Apps Script).

---

## 1. Spreadsheet headers

In row 1, set headers (left to right):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Serial | Method | Name | Email | SNS Type | SNS Contact | Phone | SF Station (順豐站代碼) | Notes |

> **Address column:** stores the customer’s **順豐站代碼** (not a street address). Mail is SF Express → SF station only.

If you already have an older sheet without **Serial**:

1. Insert a new column **B** named `Serial`.
2. Shift the old columns right (Method becomes C, etc.).
3. Paste the updated Apps Script below and **Deploy → Manage deployments → Edit → New version**.

---

## 2. Apps Script (full replace)

1. Spreadsheet → **Extensions → Apps Script**.
2. Replace **all** code with the script below.
3. Set your Discord invite in `DISCORD_INVITE_URL`.
4. **Save** → **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.

```javascript
// ── CONFIG ──────────────────────────────────────────────────────────
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
// Column B = Serial (1-based index 2)
var SERIAL_COL = 2;

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
      // Do not write a second row — prevents repeated reservations
      if (email) {
        try {
          sendDuplicateEmail_({ email: email, name: name, serial: serial });
        } catch (mailErr) {
          console.error('Duplicate mail failed: ' + mailErr);
        }
      }
      return jsonOut_({ ok: false, error: 'duplicate_serial' });
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

    if (email) {
      try {
        sendConfirmationEmail_({
          email: email,
          name: name,
          serial: serial,
          method: method,
          snsType: snsType,
          snsContact: snsContact,
          phone: phone,
          address: address,
          notes: notes
        });
      } catch (mailErr) {
        console.error('Mail failed: ' + mailErr);
      }
    }

    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function serialExists_(sheet, serial) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, SERIAL_COL, lastRow, SERIAL_COL).getValues();
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
```

---

## 3. Website form (`hk-form.html`)

Already sends:

```json
{
  "method": "palette_ring | mail",
  "serial": "流水號",
  "name": "...",
  "email": "...",
  "snsType": "...",
  "snsContact": "...",
  "phone": "",
  "address": "<順豐站代碼 when method is mail>",
  "notes": ""
}
```

Mail option is **SF Express to SF station only**. `address` holds the station code (look up: https://hk.sf-express.com/hk/tc/store).


`SCRIPT_URL` must still point at your Web App `/exec` URL.

---

## 4. Test checklist

1. Submit with a **new** 流水號 → new sheet row + confirmation email includes 流水號.  
2. Submit **again** with the **same** 流水號 → **no second row**; if email was filled, “已登記” mail may arrive.  
3. Open Web App URL in browser → `HK form endpoint OK` after deploy.

**Note:** The public form uses `no-cors` fetch, so the **browser always shows “提交成功”** even if the server rejected a duplicate. The **Sheet is the source of truth** (only one row per 流水號). Customers who re-submit get the duplicate email if they used the same email.

---

## 5. QR / live URL

```text
https://staryu.me/hk-form.html
```

Remember to **git push** after updating `hk-form.html`.
