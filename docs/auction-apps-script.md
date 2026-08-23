# FF47 色紙競標 — Web form + Sheet + email

Fans bid on the shikishi from the FF47 post. Highest bid at close wins; pay cash at pickup.

| Page | URL |
|------|-----|
| Bid + public list | `https://staryu.me/auction.html` |
| Backend | this doc + `docs/auction-Code.gs` |
| Edge proxy | `/api/auction` |

## Rules (already in Config defaults)

- Start **NT$ 1000**, step **NT$ 100**
- Close **2026-08-23 15:00 +08** (if a bid lands in the last **30 seconds**, extend close by **1 minute**; cap +30 min from original)
- Pickup: 花博 S-27 / S-28 ありぃずこーひー；無法進場可花博入口交接
- One email = raise own bid (must beat current high)
- Public list: name / Discord / amount / time — **no email**

## 1. Google Sheet

1. Drive → New spreadsheet: `STARYUME Auction · FF47 色紙`
2. Extensions → Apps Script → paste **all of** `docs/auction-Code.gs`
3. Set `STAFF_NOTIFY_EMAIL` if needed (default `staryume@gmail.com`)
4. Save → run `testPublicConfig` once (authorize Sheets + Gmail)
5. Confirm tabs **Config**, **Bids**, **Result**
6. Deploy → New deployment → Web app  
   - Execute as: **Me**  
   - Who has access: **Anyone**
7. Copy the `/exec` URL

## 2. Wire Netlify

In `netlify/edge-functions/auction.js`, set `APPS_SCRIPT_URL` to that `/exec` URL.  
Redeploy the site.

Optional localhost: in `auction.html` set `SCRIPT_DIRECT` to the same URL.

## 3. Config sheet

| key | value |
|-----|--------|
| `endAt` | `2026-08-23T15:00:00+08:00` |
| `startBid` | `1000` |
| `step` | `100` |
| `accessKey` | leave empty for public blog link; or a Discord-only key |
| `staffKey` | random secret for booth bids (`auction.html?staff=KEY`) |

## 4. Trigger (winner email + bid backups)

Apps Script → Triggers → `autoCloseTick_` → Time-driven → **every 5 minutes**.

**Bid backups (do this once, today):** in the Apps Script editor, select `installBackupTriggers` → Run (authorize if asked). That creates a 1-minute trigger which:

- writes an append-only copy of every new bid to **BidsLog** (also happens on each bid)
- copies the full list to **Snapshots** + **SnapshotBids**
  - **hourly** until 14:00
  - **every minute** in the final hour (14:00–15:00, plus a short window after close)
- emails **staryume@gmail.com** a full bid-list copy:
  - **every hour** (inbox backup, even if nobody new bid)
  - in the last hour: still one mail per hour, plus extra mail if the high bid changes
  - one mail when you first run `installBackupTriggers` / `snapshotNow`
  - subject looks like `【色紙競標備份】3筆 · 最高 NT$1200 …`

If the live **Bids** tab is wiped or corrupted, recover from **BidsLog** (every accepted bid) or the latest **Snapshots** row.

You can also run `snapshotNow` in the editor for an immediate copy.

## 5. Share

- Fans: `https://staryu.me/auction.html`
- FF47 post 色紙 block already links here after deploy
- Booth bid: `https://staryu.me/auction.html?staff=YOUR_STAFF_KEY`

## Emails

| Event | Recipient |
|-------|-----------|
| Bid accepted | Bidder |
| Outbid | Previous leader |
| Hourly snapshot backup | you (`staryume@gmail.com`) — full list |
| Close | Winner + you (full table) |
