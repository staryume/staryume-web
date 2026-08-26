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

## Seller: import (preferred)

Orders log: https://docs.google.com/spreadsheets/d/11WU4ZN4i1lfzEZfuVPTAb7OZh094N8YqWLiIqHyalxU/edit  
Official 匯入表: https://docs.google.com/spreadsheets/d/1c2Vf9_lX2CzLwkXx3tW5xwZzC_9GbF8l4yDUEA2NWfI/edit  

1. Paste latest `docs/hk-store-checkout-Code.gs` into the **orders** spreadsheet Apps Script and Save. (Web app **Deploy → New version** only if `doPost` changed; menu sync does not need a web-app deploy.)  
2. Reload the orders Sheet. Menu **賣貨便 → 同步到官方匯入表**. First run: allow access to the second spreadsheet.  
3. Check the official 訂單匯入 tab (new rows appended; existing Order IDs skipped).  
4. 賣貨便後台 → **訂單工具 → 訂單匯入** → upload that file / download xlsx from that Sheet.  
5. After 7-11 accepts the file, set those source rows’ **Status** to `imported`.

Column mapping: 姓名 / 手機 / 門市店號 / 常溫 / 商品×數量 / 訂單金額=本站合計 / 運費=`MYSHIP_SHIPPING_TWD` (default 60) / 日期 / 商品備註=訂單編號 / 其他資訊=SNS.

Optional leftover: **重建匯入表（本檔「賣貨便匯入」分頁）** still builds a line-item tab inside the orders file.

## Limits

- 賣貨便 **NT$ 20,000** per order (enforced on checkout)
- **R18 / 色情出版品** cannot go through 賣貨便
- 大量匯入 cannot use 折價券
- Same email: one new TW order per 24 hours

## Apps Script knobs

- `TW_MAIL_DEADLINE_ISO` — empty = open; set ISO to freeze new mail-orders
- `NEW_ORDER_COOLDOWN_HOURS` — default 24
- `MYSHIP_IMPORT_SPREADSHEET_ID` — official 訂單匯入 workbook
- `MYSHIP_SHIPPING_TWD` — default 60 (本島優惠)
