# INSTRUCTIONS.md — staryu.me (constraint-driven AI coding)

This document teaches humans **and** AI agents how to change this site safely.

**Core strategy (Uncle Bob style):** do not rely on reading every line an agent writes. Surround the agent with **extreme constraints**—specs, tests, invariants, security rules, QA checklists, and scope limits—so only code that survives the gauntlet is accepted. Confidence comes from green checks and clear contracts, not from skimming large diffs.

---

## 1. What this project is

**staryu.me** is a multi-language artist site: blog/news, gallery, event info, store, HK checkout, TW pre-order, and a local-only admin CMS.

| Layer | Reality |
|--------|---------|
| Hosting | Static site on **Netlify** |
| Frontend | Plain HTML + vanilla JS + Tailwind CDN |
| Content data | `data.js` (posts), `store.js` (products + store config), `events.js` (events) |
| Admin CMS | `admin.html` + `admin/*` — **not public** (404 via `_redirects`) |
| Server-ish logic | Netlify **edge functions** under `netlify/edge-functions/` |
| Orders backend | Google **Apps Script** → Sheets + Drive + email (see `docs/`) |

There is **no** `package.json` / bundler today. Prefer patterns that work without a build step unless a change explicitly introduces tooling.

---

## 2. Repository map (where things live)

```text
/
├── index.html, blog.html, post.html, gallery.html
├── store.html, checkout.html, preorder.html, hk-form.html
├── data.js                 # site posts / translations / global site data
├── store.js                # storeConfig, storeProducts, cart/checkout helpers
├── events.js               # event definitions
├── admin.html + admin/     # local CMS (blocked in production)
├── assets/                 # images (coreimg, gallery, store, blog assets)
├── blog/YYYYMMDD/          # per-post images & product photos
├── netlify.toml            # headers (CSP etc.) + edge routes
├── netlify/edge-functions/
│   ├── hk-order.js         # /api/hk-order — rate-limited order proxy
│   ├── geo.js              # /api/geo — HK/TW region hint
│   └── og-post.js          # /post.html — crawler Open Graph injection
├── _redirects              # hide /admin* and /docs*
├── docs/                   # ops & security docs (also blocked publicly)
│   ├── SECURITY.md
│   ├── hk-store-checkout-apps-script.md
│   ├── hk-store-checkout-Code.gs
│   └── ...
└── INSTRUCTIONS.md         # this file
```

### Critical paths (highest risk)

| Path | Why it matters |
|------|----------------|
| `store.js` (pricing, cart, region, ura) | Money, stock visibility, dual-region carts |
| `checkout.html` | Orders, payment proof, PII |
| `preorder.html` | TW order manage / cancel window |
| `netlify/edge-functions/hk-order.js` | Abuse control; production order path |
| `docs/hk-store-checkout-Code.gs` | Sheets/Drive/email truth for orders |
| `netlify.toml` CSP / headers | XSS and third-party allowlist |
| `_redirects` | Keeps admin + docs off the public internet |

### Content / marketing paths (lower risk, still careful)

| Path | Notes |
|------|--------|
| `data.js`, `events.js` | Trusted editor content; treat HTML in posts carefully |
| `blog/*`, `assets/*` | Media paths must stay consistent with references |
| `index.html`, `blog.html`, `post.html`, `gallery.html` | i18n + layout |
| `admin/*` | Local editing only; must not assume production filesystem APIs |

---

## 3. Product domains (speak this language in specs)

1. **Public site** — JP / EN / ZH via `siteLang` in `localStorage`; default often `jp`.
2. **Store catalog** — `storeProducts` + categories; sold-out flags; external links (BOOTH etc.) vs in-site cart.
3. **HK checkout** — bag → `checkout.html` → payment (FPS/PayMe) + proof upload → `/api/hk-order` (prod) or Apps Script direct (localhost).
4. **TW pre-order** — region `TW`, `twCheckout`, cart key separate from HK; manage via `preorder.html`.
5. **裏 (ura) store** — passcode gate in client `store.js`; **fan obscurity only** (see security).
6. **Events & blog** — posts in `data.js`, event linkage, OG images for social crawlers.
7. **Admin CMS** — local tooling to edit data; never exposed publicly.

When requesting work, name the **domain** so the agent loads the right files and risk rules.

---

## 4. Hard invariants (never violate without explicit human approval)

### 4.1 Security & privacy

- **Never** put real secrets in client JS (API keys, webhook secrets, private Drive IDs that should stay private, seller-only credentials).
- **Never** remove or weaken production protections without a written exception:
  - `_redirects` 404 for `/admin*` and `/docs*`
  - edge rate limit / body size / required fields on `/api/hk-order`
  - payment proof requirement for non-preorder creates
  - checkout `noindex` / robots disallow behavior
- **Ura passcode** in `store.js` is **not** strong security. Do not “harden” it by inventing fake server auth without a real backend design. Rotate via Discord + redeploy is the known process (`docs/SECURITY.md`).
- Follow **`docs/SECURITY.md`** for residual risks and operator duties.
- Prefer keeping **Apps Script URL** changes, Sheet schema, and email behavior aligned with `docs/hk-store-checkout-apps-script.md` and `Code.gs`.

### 4.2 Money, cart, and region

- **HK and TW carts are separate** (`staryume_cart_hk` / `staryume_cart_tw`). Do not merge them casually.
- Prices: `priceHK` vs `priceTW`; use `productUnitPrice(product, region)` / `formatStoreMoney`.
- Region normalize: only **`HK`** or **`TW`** (`normalizeStoreRegion`).
- Checkout config: `storeConfig.hkCheckout` vs `storeConfig.twCheckout`.
- Fulfillment availability can be limited per product (`hkFulfillment` / `twFulfillment`). Preserve intersection logic in `getAvailableRegionFulfillment`.
- Order IDs: prefixes **`HK-`** / **`TW-`** via `generateRegionOrderId`.
- Do not change currency labels, payment methods, or fulfillment IDs that Sheets/Discord ops already depend on unless the human updates ops docs and Sheets expectations in the same task.

### 4.3 Architecture & style

- Prefer **vanilla JS** matching existing files. No React/Vue/etc. unless the human explicitly asks for a migration.
- Prefer **pure functions** for pricing, cart math, validation, and visibility rules (easy to test later). Side effects (DOM, `localStorage`, `fetch`) stay at the edges.
- Preserve **HK back-compat aliases** (`loadHkCart`, `getHkCartTotal`, …) unless a dedicated cleanup task updates all callers.
- Match existing formatting and naming in the file you touch; do not reformat entire files.
- Do not expand scope: no drive-by refactors, no new globals, no dependency installs unless the task requests them.
- Large monolithic files (`store.js`, `checkout.html`, `events.js`) exist on purpose for a static site. Extract modules only when the task asks, or when extracting pure logic for tests.

### 4.4 Content & i18n

- Languages: **`jp` | `en` | `zh`**. Respect `post.langs` and title/content nulls.
- UI strings: prefer existing translation patterns (`siteData.translations` or inline maps). Do not leave half-translated user-facing errors on checkout.
- Product/post HTML is **trusted editor content**. Do not introduce arbitrary user-generated HTML rendering without sanitization discussion.
- Image paths are relative (`./blog/...`, `./assets/...`). Broken paths break production silently.

### 4.5 Netlify / edge / CSP

- Edge routes in `netlify.toml` must stay wired correctly if functions move.
- Changing **CSP** in `netlify.toml` is high risk (Tailwind CDN, GA, YouTube, Apps Script origins). Document why any allowlist change is required.
- Production order path should remain **`/api/hk-order`** (not raw Apps Script) so rate limits apply. Localhost may use `scriptUrlDirect`.

---

## 5. Risk tiers (how much human review is required)

| Tier | Examples | Agent duty | Human duty |
|------|----------|------------|------------|
| **R0 — Content** | Blog post, product image, copy, event date | Diff summary + link checks | Skim content in browser |
| **R1 — UI** | Layout, store cards, lang switch | No console errors; mobile glance | Visual QA |
| **R2 — Logic** | Cart totals, visibility, validation | Spec + tests or scenario table + proof | Spot-check scenarios |
| **R3 — Money / orders / PII** | checkout, preorder, edge proxy, Apps Script | Full gauntlet; no “done” without proof | Manual order smoke (demo or real test) |
| **R4 — Security surface** | redirects, CSP, admin exposure, rate limits | Explicit threat note; do not weaken | Approve before merge/deploy |

**Default:** treat checkout, edge order proxy, Apps Script, and payment/fulfillment changes as **R3+**.

---

## 6. How the human should assign work (prompt contract)

Every non-trivial task should include:

```text
Domain: [public | store | checkout | preorder | edge | admin | content | i18n]
Goal: …
In scope: …
Out of scope: …
Risk tier: R0–R4
Acceptance criteria (Given / When / Then): …
Files likely involved: …
Commands / checks that must pass: …
Do not: …
```

### 6.1 Preferred agent process

1. Restate the spec and list invariants that apply.
2. For **R2+**: write or update **acceptance scenarios** first (Gherkin is fine even without a runner).
3. Implement the **minimum** change that satisfies scenarios.
4. Run whatever automated checks exist; if none, produce a **scenario pass table** and residual risks.
5. Deliver **proof**, not a request to “please read the whole file”:
   - what changed (behavior)
   - which scenarios pass
   - residual manual QA
   - risk notes

### 6.2 Definition of Done (always)

A task is **done** only when:

- [ ] Acceptance criteria are met (listed and checked off)
- [ ] Out-of-scope areas were not modified
- [ ] Relevant invariants in §4 still hold
- [ ] No new secrets or public admin/docs exposure
- [ ] Agent reported residual risks + manual QA for the human
- [ ] For R3+: order/cart path smoke notes included (demo mode rules respected)

Demo mode: checkout `?demo=1` is **only** for localhost (`docs/SECURITY.md`). Do not enable demo behavior on production hosts.

---

## 7. Spec style: Gherkin for this site

Use Given/When/Then for store and checkout logic. Examples:

```gherkin
Feature: HK cart totals

  Scenario: Line total uses priceHK
    Given a product with priceHK 100 and priceTW 400
    And region is HK
    And the cart has quantity 2 of that product
    When the cart total is calculated
    Then the total is 200
    And money is formatted as HKD$ …

Feature: TW cart isolation

  Scenario: HK bag does not appear in TW bag
    Given items only in the HK cart storage key
    When the user opens the store in TW region
    Then the TW cart count is 0

Feature: Checkout cannot submit empty bag

  Scenario: Empty cart blocks submit
    Given the cart is empty
    When the user attempts checkout submit
    Then the order is not sent
    And an error is shown

Feature: Ura visibility

  Scenario: R18 product hidden when locked
    Given ura is locked
    And a product has contentRating "r18" or hidden true
    When the catalog is rendered
    Then that product is not visible
```

Agents should turn these into pure-function unit tests when a test runner exists; until then, keep scenarios as the contract and verify manually / via small Node one-offs if requested.

---

## 8. Testing & quality gauntlet (current → target)

### 8.1 Current state

- **Unit tests (Level 1):** Vitest loads classic `store.js` in a VM with fake storage.
- Quality also relies on: invariants in this file, careful diffs, browser QA, and ops checklists in `docs/`.

### 8.2 Minimum gauntlet (use on every R2+ change)

1. **`npm test`** — must pass when Node deps are installed (`npm install` once)  
2. **Scenario table** — each acceptance criterion → Pass/Fail + how verified  
3. **Console clean** on touched pages  
4. **Region check** — if store-related: HK and TW if either cart/config touched  
5. **Lang check** — if UI strings touched: jp / en / zh for the changed surface  
6. **Security skim** — no new client secrets; redirects/CSP untouched unless intentional  

### 8.3 Commands

```bash
npm install   # once
npm test      # vitest run — store.js pure helpers
npm run test:watch
```

### 8.4 Target gauntlet (next levels)

1. ~~Unit tests for pure helpers in `store.js`~~ **done** (`tests/store-pure.test.js`)  
2. **Lint** for JS (eslint) on `store.js`, edge functions, admin modules.  
3. **Playwright smoke**: open store → add to bag → checkout validation; preorder lookup form.  
4. **Coverage gate** on pure modules only.  
5. **Mutation testing** later on money/validation only.

Agents must not claim tests passed unless `npm test` was run and green.

### 8.4 Characterization before refactors

If refactoring cart/checkout without behavior change:

1. Capture current scenarios (or write characterization tests).  
2. Refactor.  
3. Prove scenarios still pass.  

No “cleanup” of `store.js` without this.

---

## 9. File-specific rules

### `store.js`

- Treat top `storeConfig` / `storeProducts` as **data + config**; function section at bottom is **logic**.
- Prefer extending `*Region*` helpers over duplicating HK-only code.
- Keep `maxProofBytes`, payment QR paths, and fulfillment `fields` consistent with `checkout.html`.
- Changing product schema (new required fields) requires admin (`admin/store-admin.js`) and any HTML that assumes shape.

### `checkout.html` / `preorder.html`

- Large inline page scripts; change surgically.
- Validate UX for mobile (primary audience at events / on phones).
- Do not bypass client validation **as the only** protection—edge + Apps Script must stay authoritative for accepts.
- Preserve honeypot / spam fields if present (edge ignores bot payloads).

### Edge: `hk-order.js`

- Keep rate limit (8 / 10 min / IP), max body, JSON checks, required fields, proof rules for non-preorder.
- Do not log full payment proof data URLs or PII to public places.
- CORS / method handling must stay correct for browser POSTs.

### `data.js` / `events.js`

- Preserve structure expected by pages and admin.
- New posts: id uniqueness, date format consistency, image paths, `langs` flags, optional `ogImage`.

### Admin (`admin/*`, `admin.html`)

- Local CMS; production users never hit it.
- File-system helpers assume local/dev workflows—do not “fix” by deploying admin publicly.

### Apps Script (`docs/hk-store-checkout-Code.gs`)

- Deploy is **Deploy → New version** after edits (human ops).
- Sheet headers and email behavior are operational contracts—document column changes.
- TW preorder deadline and rate rules live here; keep in sync with public copy on `preorder.html`.

---

## 10. Manual QA checklists (human-owned ring)

### Store / bag (R1–R2)

- [ ] Catalog loads; sold-out items behave correctly  
- [ ] Add / remove / qty; bag count badge updates  
- [ ] HK vs TW region: separate bags and prices  
- [ ] Ura lock/unlock: hidden products appear only when unlocked  
- [ ] Mobile layout of store grid and bag drawer  

### Checkout HK (R3)

- [ ] Empty cart cannot submit  
- [ ] Required fields (name, email, phone as applicable, fulfillment)  
- [ ] SF station method requires SF code when configured  
- [ ] Payment method + proof required for paid checkout  
- [ ] Success clears cart / shows order id  
- [ ] Localhost demo rules only with `?demo=1`  
- [ ] Production path hits `/api/hk-order` (network tab)  

### Preorder TW (R3)

- [ ] Create preorder path works with TW cart  
- [ ] Manage page: lookup by order id + email  
- [ ] Edit/cancel only within documented deadline  
- [ ] Copy matches deadline in Code.gs / docs  

### Content / i18n (R0–R1)

- [ ] jp / en / zh strings for changed UI  
- [ ] Posts honor `langs` visibility  
- [ ] Images load; OG image if social share matters  

### Deploy / security smoke

- [ ] `/admin.html` and `/docs/` are 404 on production  
- [ ] CSP not broken (console) after header changes  
- [ ] No secrets committed  

---

## 11. Copy-paste task templates

### Feature

```text
Read INSTRUCTIONS.md and docs/SECURITY.md.

Domain: …
Risk tier: …
Goal: …

Acceptance (Gherkin):
  Scenario: …
  Scenario: …

In scope: …
Out of scope: …
Invariants that apply: §4 …

Process:
1. Restate scenarios
2. Implement minimum change
3. Fill scenario pass table
4. List residual manual QA
5. Do not mark done without proof; I will not line-review the whole diff unless R3+ risk demands it
```

### Bugfix

```text
Read INSTRUCTIONS.md.

Bug: …
Expected: …
Repro: …
Risk tier: …

Process:
1. Add a failing scenario (or minimal repro steps)
2. Fix minimum code
3. Prove scenario passes; note regression surface
4. Root cause in ≤5 lines
```

### Safe refactor

```text
Read INSTRUCTIONS.md.

Refactor: …
Reason: …
Behavior must not change.

Process:
1. List characterization scenarios first
2. Refactor
3. Re-verify all scenarios
4. No public API / storage key / order field renames without explicit approval
```

---

## 12. What agents must NOT do

- Rewrite the site stack “for cleanliness”  
- Commit or invent production secrets  
- Expose admin or docs publicly  
- Change Apps Script / Sheet contracts silently  
- Merge HK/TW carts or currencies  
- Disable rate limits, proof checks, or honeypot handling to “make testing easier” on production code paths  
- Claim tests passed when no test runner ran  
- Expand scope beyond the ticket  
- Leave checkout/store half-translated  

---

## 13. Related docs (read when relevant)

| Doc | When |
|-----|------|
| `docs/SECURITY.md` | Any R3/R4, checkout, admin, headers |
| `docs/hk-store-checkout-apps-script.md` | Orders, Sheets, Drive, email ops |
| `docs/hk-store-checkout-Code.gs` | Backend order logic |
| `docs/hk-form-apps-script.md` | HK form (non-store) flows |
| `netlify.toml` | CSP, edge routes |
| `_redirects` | Public exposure rules |

---

## 14. Philosophy reminder

```text
Human  → owns intent, risk, constraints, final QA on R3+
Agent  → implements inside the gauntlet; proves with scenarios/checks
Both   → trust green constraints more than “the code looks fine”
```

**You design the arena. The agent plays inside it.**  
If constraints are missing, improve **this file** or the task prompt—not the amount of line-by-line reading.

---

## 15. Changelog

| Date | Note |
|------|------|
| 2026-07-27 | Initial INSTRUCTIONS.md for staryu.me (constraint-driven AI workflow, site map, invariants, QA). |
| 2026-07-27 | First gauntlet pass: ura cart region save, edge/Apps Script proof gates, checkout full re-validate, TW/HK copy, order-id entropy, robots/sitemap/favicon. |
| 2026-07-27 | Level 1 Vitest (`npm test`, 20 tests). Public pages R0–R1 fixes. R3 checklist: `docs/R3-QA-CHECKLIST.md`. |
