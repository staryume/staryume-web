# Taiwan 賣貨便 訂單匯入

Customers order on **staryu.me** (`store.html?region=TW` → `checkout.html?region=TW`).  
You import those rows into 7-11 賣貨便 so they **pay at 7-11 pickup**. They do not rebuild the cart.

Storefront: https://myship.7-11.com.tw/general/detail/GM2608255230612

## Customer path

1. Bag on staryu.me (all-ages only; R18 is blocked)
2. Name / email / phone / SNS
3. 7-11 **店號 + 店名** (ibon 門市查詢 link)
4. Confirm 取貨付款
5. Order lands in **STARYUME HK Store Orders** (`region=TW`, `orderType=myship`, `FulfillmentId=myship_711`)
6. After you 匯入, they get 賣貨便 mail / OPEN POINT notice and pay at the store

Manage: https://staryu.me/preorder.html (edit store/contact until Status is `imported`).  
The storefront purple bar is gated by `storeConfig.twCheckout.showOrderManageBar` (currently `false`; set `true` next Fancy Frontier).

## Seller: import

1. Open the orders spreadsheet → Extensions → Apps Script  
2. Paste latest `docs/hk-store-checkout-Code.gs` and **Deploy → New version** (once)  
3. Reload the Sheet. Menu **賣貨便 → 重建匯入表（賣貨便匯入分頁）**  
4. Open tab **賣貨便匯入** → File → Download → xlsx (or csv)  
5. 賣貨便後台 → **訂單工具 → 訂單匯入** → download their **official 範本** once  
6. If their header row differs, rename **our** headers to match, then upload  
7. Set imported orders’ **Status** to `imported` so customers cannot edit

Typical columns we write:

`收件人姓名, 收件人手機, Email, 門市店號, 門市名稱, 商品名稱, 規格, 單價, 數量, 訂單編號, 備註`

## Limits

- 賣貨便 **NT$ 20,000** per order (enforced on checkout)
- **R18 / 色情出版品** cannot go through 賣貨便
- 大量匯入 cannot use 折價券
- Same email: one new TW order per 24 hours

## Apps Script knobs

- `TW_MAIL_DEADLINE_ISO` — empty = open; set ISO to freeze new mail-orders
- `NEW_ORDER_COOLDOWN_HOURS` — default 24
