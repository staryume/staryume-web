# Hong Kong Form → Google Sheets + Confirmation Email

The form page is: **`hk-form.html`**  
Live URL after deploy: **`https://staryu.me/hk-form.html`**  
Local test URL: **`http://localhost:8000/hk-form.html`**  
(From the `web` folder: `python3 -m http.server 8000`)

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

If you already have an older sheet without **Serial** (Timestamp | Method | Name | …):

1. Insert a new column **B** named `Serial` (Method shifts to C). Do not type over Method.
2. Paste the updated Apps Script below and **Deploy → Manage deployments → Edit → New version** so **new** rows keep 流水號.
3. **Recover old rows** (try Gmail first): paste `docs/hk-form-recover-serial.gs` into the same Apps Script project (below `doPost` is fine). Run **RecoverSerialsFromGmail**. Allow Gmail + Sheets. It fills empty Serial cells from Sent mail `【staryume】香港領取登記確認 · …`. Results go to a **RecoverLog** tab.

If RecoverLog says **Gmail hits: 0**, the old script never put 流水號 in the confirmation email either. The website does not keep a backup. Ask fans on Discord for name + 流水號, or match from the list you used when handing out numbers.

---

## 2. Apps Script (full replace) — required for 流水號

The live form posts to **`/api/hk-form`**, which **rejects missing serial** and forwards to Apps Script. The Sheet still only keeps 流水號 if this script is deployed.

1. Spreadsheet → **Extensions → Apps Script**.
2. Replace **all** code with **`docs/hk-form-Code.gs`**.
3. Set your Discord invite in `DISCORD_INVITE_URL` if needed.
4. **Save** → **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.

The script **inserts column B = Serial** if the old layout is still Timestamp | Method | …. It writes 流水號 there, puts it in the customer confirmation email, and emails **you** a copy (`【HK form】流水號 · 姓名`).

Paste **`docs/hk-form-Code.gs`** in full (do not use an older snippet that omitted Serial).

---

## 3. Website form (`hk-form.html`)

Posts to **`/api/hk-form`** (Netlify edge). Missing 流水號 is rejected before Google. Already sends:

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

---

## 6. Recover missing 流水號 on old rows

The July 2026 sheet was written by an Apps Script that **ignored** `serial`. Those numbers are not in the xlsx and not on the website.

1. Insert column **B** = `Serial` (or run `EnsureSerialColumn_` / `RecoverSerialsFromGmail`, which inserts it).
2. Paste [hk-form-recover-serial.gs](./hk-form-recover-serial.gs) into Apps Script.
3. Run **RecoverSerialsFromGmail**.
4. Read **RecoverLog**. If Gmail hits are 0, confirmation mail never included 流水號 — collect numbers from Discord or your original assignment list.
