# R3 QA checklist — store / checkout / orders

Use this after deploying **site + Netlify edge + Apps Script** (see § Deploy).  
Mark each box when verified. Risk tier: **R3** (money / PII / orders).

Related: `INSTRUCTIONS.md` §10, `docs/SECURITY.md`, `docs/hk-store-checkout-apps-script.md`.

---

## Deploy (do this first)

| Step | Owner | Done |
|------|--------|------|
| Deploy static site + edge (`hk-order.js`, etc.) to Netlify | Human | [ ] |
| Paste updated `docs/hk-store-checkout-Code.gs` into Apps Script | Human | [ ] |
| Apps Script → **Deploy → New version** (same web-app URL) | Human | [ ] |
| Confirm production order URL is `/api/hk-order` (not raw script in UI) | Human | [ ] |

### After deploy — automated probes (optional)

```bash
# Admin / docs stay hidden
curl -sS -o /dev/null -w "%{http_code}\n" https://staryu.me/admin.html   # expect 404
curl -sS -o /dev/null -w "%{http_code}\n" https://staryu.me/docs/        # expect 404

# Geo
curl -sS https://staryu.me/api/geo
# expect: {"ok":true,"country":"...","region":"HK"|"TW"}

# HK create claiming preorder WITHOUT proof must FAIL (missing_proof)
curl -sS -X POST https://staryu.me/api/hk-order \
  -H "Content-Type: application/json" \
  -d '{"orderId":"HK-PROBE-NOPROOF","email":"probe@example.com","name":"probe","total":10,"totalHkd":10,"region":"HK","orderType":"preorder","items":[{"id":1,"qty":1,"title":"t","unit":10,"lineTotal":10}]}'
# expect: ok:false, error missing_proof  (HTTP 400)

# Empty body
curl -sS -X POST https://staryu.me/api/hk-order \
  -H "Content-Type: application/json" -d '{}'
# expect: missing_fields
```

> **Do not** use real customer emails in probes. Delete any accidental Sheet rows.

---

## A. Store / bag (browser)

| # | Check | Pass |
|---|--------|------|
| A1 | Catalog loads (HK); sold-out shows correctly | [ ] |
| A2 | Add / remove / qty; bag count updates | [ ] |
| A3 | Switch **TW**: separate bag; prices show NT$ | [ ] |
| A4 | Switch back **HK**: previous HK bag still there | [ ] |
| A5 | Bag drawer title matches region (HK / Taiwan Pre-order) | [ ] |
| A6 | Ura unlock → hidden products appear; **lock** drops r18 from bag for **current** region only | [ ] |
| A7 | Mobile layout of grid + bag drawer | [ ] |

---

## B. HK checkout (browser)

Localhost tip: `checkout.html?demo=1` never hits backend (localhost only).

| # | Check | Pass |
|---|--------|------|
| B1 | Empty cart redirects to store | [ ] |
| B2 | Bag step blocks sold-out lines | [ ] |
| B3 | Contact: name, email, phone, SNS required | [ ] |
| B4 | SF station requires SF code when selected | [ ] |
| B5 | Payment method + screenshot + “paid” checkbox required | [ ] |
| B6 | Network tab: production POST goes to `/api/hk-order` | [ ] |
| B7 | Happy path (small real or test order): success UI, cart cleared, email if configured | [ ] |
| B8 | If proof fails / server `proof_upload_failed`: error shown, **cart kept** | [ ] |
| B9 | Summary note says HKD (not TWD) | [ ] |

---

## C. TW pre-order (browser)

| # | Check | Pass |
|---|--------|------|
| C1 | TW cart → checkout `?region=TW` | [ ] |
| C2 | Pay step is pledges (no proof required) | [ ] |
| C3 | Submit creates `TW-…` order; success shows manage link | [ ] |
| C4 | `preorder.html`: lookup by order id + email | [ ] |
| C5 | Edit / cancel only before deadline (2026/8/20 00:00 +08) | [ ] |
| C6 | Second create same email within 24h → cooldown | [ ] |

---

## D. Security smoke

| # | Check | Pass |
|---|--------|------|
| D1 | `https://staryu.me/admin.html` → 404 | [ ] |
| D2 | `https://staryu.me/docs/` → 404 | [ ] |
| D3 | No secrets in client (only obscurity passcode for ura — known residual) | [ ] |
| D4 | CSP console: no unexpected blocked critical assets on store/checkout | [ ] |
| D5 | HK POST with fake `orderType: preorder` and no proof → rejected | [ ] |

---

## E. Unit gauntlet (local)

```bash
npm install   # once
npm test      # expect 20+ tests green
```

| # | Check | Pass |
|---|--------|------|
| E1 | `npm test` green after pull | [ ] |

---

## Residual (accepted)

- Client-trusted line totals — always match Sheet vs payment screenshot.
- Public Apps Script URL — less useful after proof gate + deploy.
- Edge rate limit is in-memory per isolate.

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Operator | | | |
| Deploy commit / Netlify | | | |
| Apps Script version | | | |
