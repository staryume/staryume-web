# Hong Kong Store Checkout → Google Sheets + Drive + Email

On-site checkout: **`checkout.html`**  
Config: **`store.js`** → `storeConfig.hkCheckout.scriptUrl`

Orders do **not** use Google Forms. Flow:

1. Customer submits on staryu.me  
2. Apps Script writes a **Sheet row**  
3. Payment screenshot goes into a **Drive folder**  
4. Customer gets a **confirmation email** (from your Google account)  
5. You also get a **seller alert** at `staryume@gmail.com` (see `SELLER_NOTIFY_EMAIL` in Code.gs)  

---

## A. Create the Google Sheet (order log)

1. Open [Google Sheets](https://sheets.google.com) while logged into the Gmail you want orders under (e.g. staryume@gmail.com).
2. **Blank spreadsheet** → rename title to:  
   `STARYUME HK Store Orders`
3. On **Sheet1**, set **row 1** (headers) exactly like this (copy-paste into A1):

```text
Timestamp	Order ID	Items	Total	Name	Email	Phone	SNS Type	SNS Contact	Fulfillment	SF Code	Payment	Proof URL	Notes	Status	Region	OrderType	FulfillmentId	ItemsJson	UpdatedAt
```

(Or type one header per column A→T. Older sheets with `Total HKD` still work; script adds P–T columns as needed.)

4. Keep this tab as the **first** sheet (the script always uses the first sheet).

### Daily backups (recommended)

1. After pasting the new `Code.gs`, run once: select function **`dailyOrderBackup_`** → Run (authorize Drive).  
2. **Triggers** (clock icon) → Add trigger:  
   - Function: `dailyOrderBackup_`  
   - Event: Time-driven → Day timer → 3am–4am  
3. Backups appear in Drive folder **`STARYUME Store Order Backups`** next to the spreadsheet (or set `BACKUP_FOLDER_ID` in Code.gs).  
4. Retention: 90 days (configurable via `BACKUP_RETENTION_DAYS`).

Google Sheet **File → Version history** is also available for accidental undos.

### TW 賣貨便 mail-order

- Customer page: **`https://staryu.me/preorder.html`** (also linked from Taiwan store bar + checkout success)  
- Lookup: Order ID + email (`?orderId=TW-…`)  
- Checkout collects 7-11 **店號 + 店名**; pay at pickup (no FPS proof)  
- **Edit / cancel** until Status is `imported` / `picked` / `cancelled` (`TW_MAIL_DEADLINE_ISO` empty = no calendar freeze)  
- Same email cannot create another TW order within **24 hours**  
- After 訂單匯入, set Status **`imported`**. See **`docs/myship-order-import.md`**.  
- Staff Sheet menu: **賣貨便 → 重建匯入表**

### Inventory POS linkage (optional)

After you deploy **Inventory + Event POS** (`docs/pos-apps-script.md`):

1. In this order `Code.gs`, set:
   - `POS_INVENTORY_URL` = POS web app URL  
   - `INVENTORY_SERVICE_KEY` = same secret as POS Script Property  
2. Redeploy the **order** web app (new version).  
3. Behavior on successful create:
   - **`limited`** products → deduct `stockHK` or `stockTW` by order region  
   - **`unlimited`** (pre-order import) → no stock change  
   - **HK limited** with `HARD_REJECT_HK_LIMITED = true` → reject checkout if not enough stock  

---

## B. Create the Google Drive folder (payment screenshots)

1. Open [Google Drive](https://drive.google.com) (same Google account).
2. **New → New folder** → name:  
   `STARYUME HK Payment Proofs`
3. Open the folder. Look at the browser URL:

```text
https://drive.google.com/drive/folders/1AbCxxxxxxxxxxxxxxxxxxxxx
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         THIS is the FOLDER ID
```

4. Copy that folder ID and keep it for step C.

---

## C. Install Apps Script (backend)

1. In the **orders spreadsheet**: menu **Extensions → Apps Script**.
2. Delete any default code in `Code.gs`.
3. Paste **all** of the script in section **F** below.
4. Edit the top CONFIG:

```javascript
var PROOF_FOLDER_ID = '1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X';  // STARYUME HK Payment Proofs
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
```

5. Click **Save** (disk icon). Project name e.g. `HK Store Checkout`.

### Deploy as Web App (critical)

1. Top right: **Deploy → New deployment**.
2. Gear icon ⚙️ → choose **Web app**.
3. Settings:
   - **Description:** `HK store v1`
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**  
     (Required so the public website can POST. The script only appends rows; it does not expose your Sheet UI.)
4. **Deploy**.
5. Google may ask you to **Authorize access**:
   - Choose your account  
   - Advanced → Go to … (unsafe) → Allow  
   - (Needed for Sheet, Drive, Mail)
6. Copy the **Web app URL** ending in `/exec`  
   Example: `https://script.google.com/macros/s/AKfycb…/exec`

### Quick health check

Open that `/exec` URL in a browser tab. You should see plain text:

```text
HK store checkout endpoint OK
```

If you edit the script later: **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.

---

## D. Connect the website

**Production** posts to the Netlify edge proxy (rate-limited):

```js
"scriptUrl": "/api/hk-order",
"scriptUrlDirect": "https://script.google.com/macros/s/YOUR_ID/exec",
```

- `scriptUrl` → used on staryu.me (`/api/hk-order` → Apps Script)  
- `scriptUrlDirect` → used only on **localhost** (python server has no edge functions)

Also: **Deploy → New version** after any Apps Script edit.

### Security / ops

- Watch the Sheet for spam rows; delete junk; Status column can mark `spam`.  
- Payment screenshots stay **private** in Drive (no public link sharing).  
- `/docs/*` and `/admin*` return 404 on Netlify.  
- `?demo=1` works **only on localhost**.

---

## E. Test a real order

1. Store (HK) → add a product → checkout.  
2. Use **your own email** on the contact step.  
3. Complete payment steps (small test screenshot is fine).  
4. Submit.  

Expect:

| Check | Where |
|--------|--------|
| New row | `STARYUME HK Store Orders` Sheet |
| Screenshot file | `STARYUME HK Payment Proofs` Drive folder |
| Email | Inbox of the email filled on checkout (also check spam) |
| From | The Google account that owns the Apps Script |

**Note:** The site uses `fetch` with `no-cors` (same as `hk-form.html`). The browser always shows success after the request is sent; the **Sheet is the source of truth**. If no new row appears, the script URL/auth/folder ID is wrong.

---

## F. Apps Script (full code)

```javascript
// ── CONFIG ──────────────────────────────────────────────────────────
// Drive folder: https://drive.google.com/open?id=1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X
var PROOF_FOLDER_ID = '1bO9aLtiSkPhXENL1lgwae2deQGdi_i6X';
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var MAX_PROOF_BYTES = 6000000; // ~6MB
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

    // 1) Write Sheet FIRST so order is never lost if Drive fails
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
      '', // Proof URL filled below if upload works
      notes,
      'new'
    ]);
    var row = sheet.getLastRow();

    // 2) Payment proof → Drive (non-fatal)
    var proofUrl = '';
    var proofError = '';
    if (data.proof && data.proof.dataUrl) {
      try {
        proofUrl = saveProof_(data.proof, orderId);
        if (proofUrl) {
          sheet.getRange(row, 13).setValue(proofUrl); // column M = Proof URL
        }
      } catch (proofErr) {
        proofError = String(proofErr);
        console.error('Proof upload failed: ' + proofError);
        sheet.getRange(row, 15).setValue('new; proof_failed'); // Status
      }
    }

    // 3) Confirmation email (non-fatal)
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
  // Keep proofs private (owner / shared folder only). No "anyone with the link".
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
```

---

## G. Troubleshooting

| Problem | Fix |
|---------|-----|
| `/exec` page errors / blank | Re-deploy Web app; authorize again |
| Sheet empty after submit | Wrong `scriptUrl`; or “Who has access” not **Anyone** |
| Drive empty | Wrong `PROOF_FOLDER_ID`; or Drive not authorized |
| No email | Customer email blank/wrong; check spam; MailApp daily quota |
| Email works only for you | Normal for first tests; other addresses should also receive once MailApp is authorized |
| Updated script but site still old | Deploy **New version** of the Web app, not only Save |

---

## H. What you send me next

After deploy, paste only the **Web app `/exec` URL** (not your Google password).  
I can put it into `store.js` for you so local + Netlify checkout use the live backend.
