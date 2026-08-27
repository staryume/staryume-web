# Security notes (staryu.me)

## Controls in place

| Control | Implementation |
|---------|----------------|
| Admin CMS not public | `_redirects`: `/admin*` → 404 |
| Setup docs not public | `_redirects`: `/docs*` → 404 |
| Checkout demo mode | `?demo=1` only when host is localhost |
| Order spam / flood | Edge `/api/hk-order`: rate limit 8 / 10 min / IP, max body, require proof |
| Proof skip only for TW mail-order | Edge + Apps Script: payment proof required unless `region === TW` **and** (`myship` / `preorder`); client `orderType` alone cannot skip HK proof |
| Proof upload fail-closed | Apps Script rejects paid creates if proof missing/upload fails (`ok: false`); checkout keeps cart |
| Payment proofs | Apps Script does **not** set “anyone with link” |
| HTTP headers | CSP (+ base-uri, object-src, form-action, upgrade-insecure-requests), XFO, nosniff, HSTS (Netlify) |
| Checkout indexing | `noindex` + robots Disallow |
| FF47 booth backorder | `ff47-event-preorder.html`: serial unique, server-side prices, `noindex` + robots Disallow |

## Operator checklist

1. Review **STARYUME HK Store Orders** regularly; delete obvious spam.  
2. Keep Drive folder for payment proofs private to your Google account.  
3. After editing Apps Script: **Deploy → New version**.  
4. Prefer production testing on Netlify (edge proxy); localhost uses direct Apps Script URL.  
5. Full order / checkout regression: follow **`docs/R3-QA-CHECKLIST.md`** after each edge or Apps Script deploy.  
6. If Google is down, checkout tries **Netlify Forms** (`store-order-backup`) and optional env `DISCORD_ORDER_BACKUP_WEBHOOK`. Check **Netlify → Forms**. Download Store Orders xlsx weekly while Google still works.  

## Residual risk (accepted for this stack)

- Public “Anyone” Apps Script can still be called if URL is known — mitigated by edge rate limit on production path.  
- CSP still allows `'unsafe-inline'` scripts (Tailwind CDN / inline pages).  
- Product/post HTML in `data.js` / `store.js` is trusted editor content (XSS if repo is compromised).  
- **裏 store 通關密碼** lives in client `store.js` (`storeConfig.ura.passcode`). This is **fan obscurity**, not strong secrecy — anyone can read the JS. Rotate the code via Discord + redeploy when needed. Unlock uses `sessionStorage` only.  
- **Inventory / Event POS** (`pos.html`): staff passcode is checked **server-side** on every `/api/pos` call (Apps Script `POS_PASSCODE` / Script Property). The page URL is not secret — rotate the passcode via Script Property if leaked. `INVENTORY_SERVICE_KEY` must live only in Apps Script (order + POS), never in public JS. See `docs/pos-apps-script.md`.  
