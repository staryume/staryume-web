# Inventory + Event POS — setup

Browser staff tool: **inventory** (HK / TW / JP / BOOTH / HOME) + **event POS** + daily summaries.  
Stock lives in a Google Spreadsheet; the public site stays static.

## 1. Create the spreadsheet

1. Google Drive → **New → Google Sheets**  
2. Name: `STARYUME Inventory POS`  
3. Leave the first sheet as-is (the script creates `Products`, `Events`, `Sales` with headers)

## 2. Bind Apps Script

1. Extensions → **Apps Script**  
2. Delete default code; paste entire **`docs/pos-Code.gs`**  
3. **Project Settings → Script properties** (recommended):

| Property | Value |
|----------|--------|
| `POS_PASSCODE` | Staff passcode (e.g. same as 裏 or a stronger one) |
| `INVENTORY_SERVICE_KEY` | Long random secret for web-store stock deduct only |
| `SPREADSHEET_ID` | **Required for reliable saves.** From Sheet URL: `https://docs.google.com/spreadsheets/d/`**`THIS_ID`**`/edit` |

Or edit the defaults at the top of `pos-Code.gs` then redeploy.

**Why `SPREADSHEET_ID`?** Web app calls sometimes cannot use “active spreadsheet”. Without the ID, stock SAVE may not write where you expect (version history stays empty).

### Products sheet columns (extra)

After redeploying latest `pos-Code.gs`, headers gain (appended):

`productCreateDate` · `parentSku` · `productKind` · `sortOrder`

| Field | Meaning |
|--------|---------|
| `productCreateDate` | ISO time when row was first created; UI sorts **newest first** |
| `productKind` | `standalone` \| `set` \| `component` |
| `parentSku` | Set SKU for component rows (e.g. `store-103`) |
| `sortOrder` | Order of contents under a set |

**Set sub-products:** import marks category `set` as `productKind=set` and seeds 6 placeholders `（內容 1）`… if none exist. Or use POS **產生套組子項目**. Components have their own stock columns but are **not** sold as separate POS tiles (v1).

**Open Sheet from POS:** header **試算表** uses `spreadsheet.id` from bootstrap (needs `SPREADSHEET_ID`).

4. Save → **Deploy → New deployment → Web app**  
   - Execute as: **Me**  
   - Who has access: **Anyone**  
5. Copy the **Web app URL** (`…/macros/s/…/exec`)

## 3. Wire the website

### Edge proxy (`/api/pos`)

1. Put the web app URL into Netlify env **`POS_APPS_SCRIPT_URL`**  
   (or temporarily hardcode it in `netlify/edge-functions/pos.js` like the order proxy)  
2. Redeploy the site so `/api/pos` is live  

### Client (`pos.js`)

1. Open `pos.js` → `POS_CONFIG.scriptUrlDirect`  
2. Paste the same web app URL for **localhost** testing  
3. Production uses `/api/pos` automatically  

## 4. Seed products from the web store

1. Open `https://staryu.me/pos.html` (or localhost)  
2. Enter passcode  
3. **Products** tab → **Import from store**  
4. Pre-order SKUs (`isPreorder: true` in `store.js`) import as **`unlimited`** (no stock deduct)  
5. Other SKUs import as **`limited`** — set pool quantities under **Inventory**  

## 5. Before an event

1. **Inventory** — set `stockTW` (etc.) for limited goods you bring  
2. **Events** — create e.g. `FF47`, region `TW`, currency `TWD`  
3. **Start event day** — locks POS sales to that pool + date  
4. **POS** tab — tap to sell; limited stock decrements that region only  

## 6. Link web-store orders (limited stock)

Order script (`docs/hk-store-checkout-Code.gs`) can deduct inventory after a successful create.

1. In the **order** Apps Script, set:

```javascript
var POS_INVENTORY_URL = 'https://script.google.com/macros/s/YOUR_POS_DEPLOYMENT/exec';
var INVENTORY_SERVICE_KEY = 'same-as-POS-INVENTORY_SERVICE_KEY';
```

2. Redeploy the **order** web app (new version)  
3. On create: limited lines for region HK/TW call `web_deduct`  
   - **`unlimited`** (pre-order): sale may be logged; **no** stock change  
   - **HK limited** default: **hard reject** if pool stock insufficient  
   - Unknown SKUs (not imported yet): skipped, order still succeeds  

## 7. Daily summary

**Summary** tab → pick event + day → revenue, qty by SKU, stock snapshot.  
Multi-day events: each calendar day is a separate summary (`activeDay` / sale `day`).

## 8. Security notes

- Passcode is checked **server-side** on every staff action (not only in the browser).  
- URL of `pos.html` is not secret; treat passcode like a booth password and rotate via Script Property.  
- `INVENTORY_SERVICE_KEY` must stay out of public JS — only in Apps Script.  
- See `docs/SECURITY.md`.

## API actions (staff, need `passcode`)

| action | purpose |
|--------|---------|
| `ping` | health |
| `bootstrap` | products + events + active + today’s POS sales |
| `list_products` / `upsert_product` / `delete_product` / `set_stock` | catalog |
| `import_store` | bulk from storeProducts snapshot |
| `list_events` / `upsert_event` / `set_event_status` | events |
| `record_sale` / `void_sale` / `list_sales` / `daily_summary` | POS |

## API actions (service key only)

| action | purpose |
|--------|---------|
| `web_check` | pre-flight limited stock |
| `web_deduct` | after successful web order |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `not_configured` | Set `POS_APPS_SCRIPT_URL` / redeploy Netlify |
| `unauthorized` | Wrong passcode or Script Property not set |
| `no_active_event` | Events → Start event day |
| `insufficient_stock` | Restock that region pool or mark unlimited |
| Localhost works, production fails | Edge URL wrong; check Netlify env / function logs |
