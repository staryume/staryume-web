# FF47 會場限定預購 → Google Sheets + Email

Form page: **`ff47-event-preorder.html`**  
Live URL: **`https://staryu.me/ff47-event-preorder.html`**  
Local: from `web/`, `python3 -m http.server 8000` → `http://localhost:8000/ff47-event-preorder.html`

Booth flow: cash at stall (goods + postage) → customer fills this form → Sheet assigns **FF47-001, FF47-002, …** in submit order → emails.

---

## Postage (also shown on the form)

- Flat **NT$200** per order (SF Express Hong Kong → Taiwan home delivery, ship mid-September 2026)
- **Free postage** if goods subtotal **≥ NT$2000**
- Catalog prices are recomputed server-side. Optional **其他品項** uses the name + NT$ amount typed on the form (what was already collected at the stall).

---

## A. Create the spreadsheet

1. [Google Sheets](https://sheets.google.com) as `staryume@gmail.com`
2. Blank spreadsheet → title: **`STARYUME FF47 Event Backorder`**
3. **You do not need to paste headers.** The script writes row 1 itself.

To write them immediately (optional): Apps Script editor → function dropdown **`setupSheet`** → **Run** (authorize).  
They also appear the first time you open the Web App `/exec` URL or receive a form submit.

---

## B. Install Apps Script

1. Spreadsheet → **Extensions → Apps Script**
2. Replace all of `Code.gs` with **`docs/ff47-event-preorder-Code.gs`**
3. Save. Project name e.g. `FF47 Event Preorder`
4. Optional: select function **`setupSheet`** → **Run** (writes the header row on the blank sheet)

### Deploy as Web App

1. **Deploy → New deployment** → type **Web app**
2. Execute as: **Me**
3. Who has access: **Anyone**
4. Deploy → authorize Sheet + Mail
5. Copy the `/exec` URL

Health check: open `/exec` in a browser →

```text
FF47 event preorder endpoint OK
```

---

## C. Wire the website

In **`ff47-event-preorder.html`**, set:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';
```

Redeploy / push the site. Until this is set, the form shows the amber “尚未連接” hint and will not submit.

---

## D. What happens on submit

1. Items priced from server catalog
2. Script lock → next serial `FF47-001`, `FF47-002`, … (ignore any client serial)
3. New row
4. Confirmation email to the customer (includes serial)
5. Notify email to `staryume@gmail.com`

Production posts to **`/api/ff47-event-preorder`** (Netlify edge → Apps Script) so the success page can show the auto serial. The Sheet remains the source of truth.

---

## E. Test

1. Submit → row with auto serial + two emails (customer + you)
2. Second submit → `FF47-002` (not a duplicate of 001)
3. Empty items / unknown product id → no row
4. `/exec` GET → health text

QR:

```text
https://staryu.me/ff47-event-preorder.html
```
