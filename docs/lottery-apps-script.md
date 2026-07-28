# 限定海報定價抽選 — Web Form + Dashboard

Simple lottery **without Discord bot**.  
Members open a link you post only in Discord → enroll on the website → get email → dashboard with countdown → **auto random draw** at end time → show winner + 3 runner-ups.

## Architecture: Option B (recommended)

**One Google Sheet + one Apps Script deployment per event.**  
Archives stay clean (ACGHK / C108 / FF47 never mix).  
Same website pages for all events; routing is by query string.

| Piece | Shared or per-event? |
|-------|----------------------|
| `lottery.html` / `lottery-status.html` | **Shared** |
| `lottery-config.js` | **Shared** registry of event → script URL |
| Google Sheet | **Per event** |
| Apps Script web app URL | **Per event** (paste into `lottery-config.js`) |
| Config / Entrants / Result data | **Per event sheet** |

| Page | URL (after deploy) |
|------|---------------------|
| Enroll | `https://staryu.me/lottery.html?event=acghk&k=YOUR_KEY` |
| Dashboard | `https://staryu.me/lottery-status.html?event=acghk` or `...&token=...` from email |
| Event registry | `lottery-config.js` |
| Backend code | `docs/lottery-Code.gs` (same file pasted into **each** sheet’s Apps Script) |

---

## What you need (per event)

1. Google account + **new Google Spreadsheet for that event**  
2. **Apps Script** web app on **that** sheet (paste `lottery-Code.gs`)  
3. Site pages already on Netlify: `lottery.html`, `lottery-status.html`, `lottery-config.js`  
4. Put that deployment URL into **`lottery-config.js`** under the event id  
5. Set **endAt** + **accessKey** in **that** Sheet’s Config  
6. Post Discord link with **both** `event=` and `k=`

### Suggested Sheet names

| Event | Sheet name | `event` id in URL / config |
|-------|------------|----------------------------|
| ACGHK | `STARYUME Lottery · ACGHK 2026` | `acghk` |
| Comic Market 108 | `STARYUME Lottery · C108` | `c108` |
| Fancy Frontier 47 | `STARYUME Lottery · FF47` | `ff47` |

Add more events anytime: new Sheet + new block in `lottery-config.js`.

---

## 1. Create the Spreadsheet (repeat for each event)

1. Google Drive → New → **Google Sheets**  
2. Name it e.g. `STARYUME Lottery · ACGHK 2026`  
3. Extensions → **Apps Script**  
4. Delete default code → paste **entire** contents of `docs/lottery-Code.gs`  
5. Edit at top of script:
   - `PUBLIC_SITE_ORIGIN` = `https://staryu.me` (or your domain)
   - `DEFAULT_ACCESS_KEY` = a random secret (e.g. `hk-poster-7x9k`)
   - Optional: `STAFF_NOTIFY_EMAIL` = your email  
6. **Save** project (name: e.g. `lottery-acghk`)

---

## 2. First run (create sheets)

In Apps Script editor:

1. Select function `testPublicConfig` → **Run**  
2. Authorize Google permissions (Sheets + Gmail)  
3. Back to the Spreadsheet — you should see sheets: **Config**, **Entrants**, **Result**

### Edit **Config** sheet (key | value)

| key | example | meaning |
|-----|---------|---------|
| `title` | 限定海報定價抽選 | Form title |
| `price` | HKD 80 | Fixed price text |
| `eventName` | ACGHK 攤位 | Event name |
| `pickup` | 18:00–20:00 | Pickup window |
| `endAt` | `2026-07-28T14:00:00+08:00` | **When auto-draw runs** (ISO + timezone) |
| `enrollOpen` | `TRUE` | Set `FALSE` to close early |
| `accessKey` | `hk-poster-7x9k` | Must match `?k=` in URL |
| `staffKey` | (optional random) | For force draw URL |
| `drawn` | `FALSE` | System sets `TRUE` after draw — don’t set manually unless reset |
| `showEntrantCount` | `TRUE` | Show count on form/dashboard |
| `booth` | ACGHK 2026 Creative Paradise… | Pickup location in emails |
| `eventSlug` | `acghk` | `?event=` in result-email dashboard links |

### Result emails (after auto-draw)

When the lottery runs, **every entrant** gets an email:

| Outcome | Subject style |
|---------|----------------|
| 得主 | 【當選通知】… 你是得主 |
| 第一／二／三候補 | 【候補當選通知】… |
| 其餘 | 【結果通知】… 未能當選 |

Gmail daily quota applies (usually enough for small events). Large lists may need a Workspace account.

**Important:** `endAt` must be a real ISO datetime with offset, e.g. Hong Kong afternoon:

```text
2026-07-28T14:00:00+08:00
```

---

## 3. Deploy as Web App

1. Apps Script → **Deploy** → **New deployment**  
2. Type: **Web app**  
3. Execute as: **Me**  
4. Who has access: **Anyone**  
5. Deploy → copy **Web app URL**  
   (`https://script.google.com/macros/s/..../exec`)

After every code change: **Manage deployments → Edit (pencil) → New version → Deploy**.

---

## 4. Wire the website (`lottery-config.js`)

Edit **`lottery-config.js`** (not the HTML files):

```js
acghk: {
  id: 'acghk',
  label: 'ACGHK',
  scriptUrl: 'https://script.google.com/macros/s/XXXX/exec', // ← paste deploy URL
  note: 'Hong Kong · 中文',
},
```

For C108 / FF47 later: create their Sheets, deploy, paste into `c108.scriptUrl` / `ff47.scriptUrl`.

Set `LOTTERY_DEFAULT_EVENT = 'acghk'` if you want `?event=` optional for the current main event.

Commit & deploy Netlify.

Optional: confirm `robots.txt` disallows lottery pages (already added).

---

## 5. Auto-draw trigger (recommended)

Apps Script → **Triggers** (clock icon) → **Add trigger**:

| Field | Value |
|-------|--------|
| Function | `autoDrawTick_` |
| Event source | Time-driven |
| Type | Minutes timer |
| Interval | Every **5 minutes** |

Also: any open of the **dashboard** after `endAt` will **lazy-draw** if not drawn yet (so results still appear without waiting for the trigger).

---

## 6. Discord message (copy)

```
【限定海報 · 定價抽選｜ACGHK】
請勿把連結傳到群外

報名：
https://staryu.me/lottery.html?event=acghk&k=你的accessKey

· 截止後系統自動抽選（得主 1 + 候補 3）
· 領取：當日 18:00–20:00 親臨香港攤位 · 定價現場付款
· 報名成功後請查收電郵（內有專屬儀表板連結）
· 儀表板可看倒數與結果：信內連結 或 報名頁底部「查看抽選儀表板」
```

For C108 later, only change `event=c108` and that sheet’s `k=`.

---

## 7. Rehearsal test (5 minutes)

1. Set `endAt` to **3 minutes from now** (ISO +08:00).  
2. Set `drawn` = `FALSE`, `enrollOpen` = `TRUE`.  
3. Open  
   `https://yoursite/lottery.html?event=acghk&k=YOUR_KEY`  
4. Enroll with **two different emails** (yours + secondary).  
5. Open dashboard from success link — countdown should tick.  
6. Wait past `endAt` → refresh dashboard → should show 得主 + 候補.  
7. For real event: clear **Entrants** rows (keep header), clear **Result** data row, run `testResetDrawnFlag` in Apps Script **or** set `drawn=FALSE` / `enrollOpen=TRUE` and clear Result. Set real `endAt` + price.

### Soft reset (staff)

In Apps Script, run `testResetDrawnFlag` then delete entrant rows manually if needed.  
Do **not** reset after a live public draw unless you intend to re-run.

### Force draw early

```
https://script.google.com/macros/s/XXX/exec?action=draw&staffKey=YOUR_STAFF_KEY
```

(Only if `staffKey` is set in Config.)

---

## 8. Booth day

1. After draw, open Sheet **Result** — winner + backups with names.  
2. Entrants sheet has email/phone if you need to contact.  
3. 18:00–20:00: confirmed winner pays fixed price, collects poster.  
4. No-show → 第一候補 → 第二 → 第三.

---

## API summary

| Call | Use |
|------|-----|
| `GET ?action=config` | Form loads title/price/endAt |
| `GET ?action=status&token=` | Dashboard + lazy draw |
| `POST` JSON `{ action: "enroll", ... }` | Enroll + email |

---

## Privacy / security note

- Link-in-Discord + `accessKey` is **not** military-grade security.  
- Anyone with the full URL can enroll.  
- One email = one entry; you can delete rows in the Sheet before draw.  
- Pages are `noindex`.

---

## New event checklist (Option B)

1. New Sheet named for the event  
2. Paste `lottery-Code.gs` → deploy web app → copy URL  
3. Add/fill entry in `lottery-config.js`  
4. Config sheet: title, price, pickup, endAt, accessKey  
5. Trigger `autoDrawTick_` on **that** project  
6. Deploy site if `lottery-config.js` changed  
7. Discord: `lottery.html?event=ID&k=KEY`  
8. After event: leave Sheet as archive; do not reuse for the next con  

## When to consider Option C later

- Two lotteries **open at the same time** and you hate managing many deploy URLs  
- You want one admin UI for all events / full JA+ZH+EN UI packs  

Until then, Option B is enough.

## Files

| File | Role |
|------|------|
| `lottery.html` | Enroll form + pledges |
| `lottery-status.html` | Countdown + results dashboard |
| `lottery-config.js` | **Event → Apps Script URL registry (Option B)** |
| `docs/lottery-Code.gs` | Backend (copy into each event’s script) |
| `docs/lottery-apps-script.md` | This guide |
