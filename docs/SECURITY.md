# Security notes (staryu.me)

## Controls in place

| Control | Implementation |
|---------|----------------|
| Admin CMS not public | `_redirects`: `/admin*` → 404 |
| Setup docs not public | `_redirects`: `/docs*` → 404 |
| Checkout demo mode | `?demo=1` only when host is localhost |
| Order spam / flood | Edge `/api/hk-order`: rate limit 8 / 10 min / IP, max body, require proof |
| Payment proofs | Apps Script does **not** set “anyone with link” |
| HTTP headers | CSP (+ base-uri, object-src, form-action, upgrade-insecure-requests), XFO, nosniff, HSTS (Netlify) |
| Checkout indexing | `noindex` + robots Disallow |

## Operator checklist

1. Review **STARYUME HK Store Orders** regularly; delete obvious spam.  
2. Keep Drive proof folder private to your Google account.  
3. After editing Apps Script: **Deploy → New version**.  
4. Prefer production testing on Netlify (edge proxy); localhost uses direct Apps Script URL.  

## Residual risk (accepted for this stack)

- Public “Anyone” Apps Script can still be called if URL is known — mitigated by edge rate limit on production path.  
- CSP still allows `'unsafe-inline'` scripts (Tailwind CDN / inline pages).  
- Product/post HTML in `data.js` / `store.js` is trusted editor content (XSS if repo is compromised).  
- **裏 store 通關密碼** lives in client `store.js` (`storeConfig.ura.passcode`). This is **fan obscurity**, not strong secrecy — anyone can read the JS. Rotate the code via Discord + redeploy when needed. Unlock uses `sessionStorage` only.  
