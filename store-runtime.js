// Store runtime — cart, checkout helpers, BOOTH/ura.
// Admin CMS never writes this file. Save all only updates store.js data.

(function applyStoreCheckoutFallbacks() {
    if (typeof storeConfig === "undefined" || !storeConfig) return;
    if (!storeConfig.hkCheckout) storeConfig.hkCheckout = {
        "enabled": true,
        "currency": "HKD",
        "scriptUrl": "/api/hk-order",
        "scriptUrlDirect": "https://script.google.com/macros/s/AKfycbzujFWTxCxOCkPSkxzQ7ykj6uwvbZbj7N053QY6QIydDmSsodN2_w-IFcCHI-RJt9QBgw/exec",
        "discordInvite": "https://discord.gg/staryume",
        "maxProofBytes": 3500000,
        "payment": {
            "fps": {
                "enabled": true,
                "accountName": "",
                "accountId": "5979018",
                "qrImage": "./assets/store/fps-qr.jpg"
            },
            "payme": {
                "enabled": true,
                "linkOrPhone": "https://payme.hsbc/staryume",
                "qrImage": "./assets/store/payme-qr.jpg"
            }
        },
        "fulfillment": [
            {
                "id": "sf_station",
                "enabled": true,
                "label": {
                    "zh": "順豐站自取（運費到付）",
                    "en": "SF Station pickup (freight COD)"
                },
                "desc": {
                    "zh": "只限在順豐站 / 順豐自助櫃 / 順豐合作點取貨；需填寫電話及順豐站代碼。",
                    "en": "Pickup only at SF Station / SF Locker / SF partner points. Phone and station code required."
                },
                "fields": [
                    "phone",
                    "sfCode"
                ]
            },
            {
                "id": "palette_ring_11",
                "enabled": true,
                "label": {
                    "zh": "同人活動 Palette Ring 11 現場取貨",
                    "en": "Event pickup — Palette Ring 11"
                },
                "desc": {
                    "zh": "於 9/19-9/20 <a href=\"https://www.palette-ring.com\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-bold underline decoration-tech-purple underline-offset-2 hover:text-black\">Palette Ring 11</a> 攤位現場領取（詳情留意 Discord／活動公告）。",
                    "en": "Pickup at the booth on 9/19–9/20 at <a href=\"https://www.palette-ring.com\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-bold underline decoration-tech-purple underline-offset-2 hover:text-black\">Palette Ring 11</a> (details via Discord / event notice)."
                },
                "fields": []
            }
        ]
    };
    if (!storeConfig.twCheckout) storeConfig.twCheckout = {
        "enabled": false,
        "currency": "TWD",
        "scriptUrl": "/api/hk-order",
        "scriptUrlDirect": "https://script.google.com/macros/s/AKfycbzujFWTxCxOCkPSkxzQ7ykj6uwvbZbj7N053QY6QIydDmSsodN2_w-IFcCHI-RJt9QBgw/exec",
        "discordInvite": "https://discord.gg/staryume",
        "maxProofBytes": 3500000,
        "showOrderManageBar": false,
        "myship": {
            "storefrontUrl": "https://myship.7-11.com.tw/general/detail/GM2608255230612",
            "storeLookupUrl": "https://www.ibon.com.tw/retail_inquiry.aspx",
            "maxOrderTwd": 20000
        },
        "payment": {
            "fps": {
                "enabled": false
            },
            "payme": {
                "enabled": false
            }
        },
        "fulfillment": [
            {
                "id": "myship_711",
                "enabled": true,
                "label": {
                    "zh": "7-11 賣貨便店到店（取貨付款）",
                    "en": "7-11 MyShip store pickup (pay on collection)"
                },
                "desc": {
                    "zh": "在本站填門市並送出即完成下單，不必再開賣貨便自己選商品。我們匯入後，你到指定 7-11 取貨付款。",
                    "en": "Choose a 7-11 store. We import the order into MyShip; pay when you pick up."
                },
                "fields": [
                    "storeId",
                    "storeName"
                ]
            }
        ]
    };
    if (!storeConfig.booth) storeConfig.booth = {
        "shopUrl": "https://staryume.booth.pm"
    };
    if (!storeConfig.ura) storeConfig.ura = {
        "enabled": true,
        "passcode": "STARYUME15TH",
        "sessionKey": "staryume_ura_unlocked",
        "modalTitle": {
            "zh": "通關密碼",
            "en": "Passcode",
            "jp": "パスコード"
        },
        "modalHint": {
            "zh": "輸入通關密碼以繼續。",
            "en": "Enter the passcode to continue.",
            "jp": "パスコードを入力してください。"
        }
    };
})();

// ── 裏 store unlock (session only) ──────────────────────────────────────────
function getUraConfig() {
    return (typeof storeConfig !== "undefined" && storeConfig.ura) || null;
}

function isUraUnlocked() {
    const ura = getUraConfig();
    if (!ura || ura.enabled === false) return false;
    try {
        return sessionStorage.getItem(ura.sessionKey || "staryume_ura_unlocked") === "1";
    } catch (e) {
        return false;
    }
}

/** TW: R18 catalog is public (no passcode). HK: session unlock only. */
function isUraCatalogOpen(region) {
    const ura = getUraConfig();
    if (!ura || ura.enabled === false) return false;
    const r = normalizeStoreRegion(region);
    if (r === "TW" || r === "JP" || r === "GL") return true;
    return isUraUnlocked();
}

function unlockUra() {
    const ura = getUraConfig();
    if (!ura) return false;
    try {
        sessionStorage.setItem(ura.sessionKey || "staryume_ura_unlocked", "1");
        return true;
    } catch (e) {
        return false;
    }
}

function lockUra() {
    const ura = getUraConfig();
    if (!ura) return;
    try {
        sessionStorage.removeItem(ura.sessionKey || "staryume_ura_unlocked");
    } catch (e) { /* ignore */ }
}

/** Normalize passcode for compare (trim, case-insensitive). */
function normalizeUraPasscode(s) {
    return String(s || "").trim().toLowerCase();
}

function checkUraPasscode(input) {
    const ura = getUraConfig();
    if (!ura || ura.enabled === false) return false;
    const got = normalizeUraPasscode(input);
    if (!got) return false;
    if (ura.passcode && normalizeUraPasscode(ura.passcode) === got) return true;
    if (Array.isArray(ura.passcodes)) {
        return ura.passcodes.some((c) => normalizeUraPasscode(c) === got);
    }
    return false;
}

/** Whether a product may appear in the current catalog view. */
function isProductVisibleInStore(product, unlocked) {
    if (!product) return false;
    if (product.hidden || product.contentRating === "r18") {
        return !!unlocked;
    }
    return true;
}

// ── Regional bag (HK + TW) shared by store.html + checkout.html ─────────────
const HK_CART_STORAGE_KEY = "staryume_cart_hk";
const TW_CART_STORAGE_KEY = "staryume_cart_tw";

function normalizeStoreRegion(region) {
    if (region === "TW") return "TW";
    if (region === "JP") return "JP";
    if (region === "GL") return "GL";
    return "HK";
}

/** JP and GLOBAL are the same BOOTH catalog; HK/TW are in-site checkout. */
function isBoothStorefront(region) {
    const r = normalizeStoreRegion(region);
    return r === "JP" || r === "GL";
}

function storefrontLangForRegion(region) {
    const r = normalizeStoreRegion(region);
    if (r === "JP") return "jp";
    if (r === "GL") return "en";
    return "zh";
}

function cartStorageKey(region) {
    const r = normalizeStoreRegion(region);
    if (r === "TW") return TW_CART_STORAGE_KEY;
    if (r === "JP" || r === "GL") return "staryume_cart_jp";
    return HK_CART_STORAGE_KEY;
}

function getCheckoutConfig(region) {
    const r = normalizeStoreRegion(region);
    if (r === "TW") return (storeConfig && storeConfig.twCheckout) || null;
    if (r === "JP" || r === "GL") return (storeConfig && storeConfig.booth) || null;
    return (storeConfig && storeConfig.hkCheckout) || null;
}

function productUnitPrice(product, region) {
    if (!product) return 0;
    const r = normalizeStoreRegion(region);
    if (r === "TW") return typeof product.priceTW === "number" ? product.priceTW : 0;
    if (r === "JP" || r === "GL") return 0;
    return typeof product.priceHK === "number" ? product.priceHK : 0;
}

function formatStoreMoney(amount, region) {
    const r = normalizeStoreRegion(region);
    if (r === "JP" || r === "GL") return "BOOTH";
    const n = Number(amount) || 0;
    return r === "TW" ? ("NT$ " + n) : ("HKD$ " + n);
}

function boothShopUrl(config) {
    const cfg = config || (typeof storeConfig !== "undefined" ? storeConfig : null);
    const u = cfg && cfg.booth && cfg.booth.shopUrl;
    return (u && String(u).trim()) || "https://staryume.booth.pm";
}

/** Per-item BOOTH URL, or the shop if that product has no linkJP yet. */
function productBoothUrl(product, config) {
    const u = product && product.linkJP;
    if (u && String(u).trim()) return String(u).trim();
    return boothShopUrl(config);
}

/** Japan and Global storefronts buy on BOOTH. HK cart and TW 賣貨便 are separate. */
function storeUsesBoothCheckout(region) {
    return isBoothStorefront(region);
}

function productIsR18(product) {
    return !!(product && (product.hidden || product.contentRating === "r18"));
}

/** TW catalog SKUs go through the staryu.me bag → 賣貨便 訂單匯入. */
function productUsesTwCart(product) {
    if (!product) return false;
    if (product.useTwCart === true) return true;
    if (product.eventSource === "acghk2026" || product.eventSource === "ff47") return true;
    return false;
}

function twMyshipMaxOrderTwd(config) {
    const tw = (config && config.twCheckout) || (typeof storeConfig !== "undefined" && storeConfig.twCheckout) || {};
    const n = Number(tw.myship && tw.myship.maxOrderTwd);
    return Number.isFinite(n) && n > 0 ? n : 20000;
}

function normalizeTwStoreId(raw) {
    return String(raw || "").replace(/\D/g, "");
}

function isValidTwStoreId(raw) {
    const id = normalizeTwStoreId(raw);
    return id.length >= 5 && id.length <= 7;
}

/**
 * One row per line item for 賣貨便 訂單匯入.
 * Paste into their official 範本 if header names differ.
 */
function buildMyshipImportRows(order) {
    const items = (order && order.items) || [];
    const storeId = normalizeTwStoreId(order && order.storeId);
    const storeName = String((order && order.storeName) || "").trim();
    const name = String((order && order.name) || "").trim();
    const phone = String((order && order.phone) || "").trim();
    const email = String((order && order.email) || "").trim();
    const orderId = String((order && order.orderId) || "").trim();
    const note = String((order && order.notes) || "").trim();
    return items.map((it) => ({
        收件人姓名: name,
        收件人手機: phone,
        Email: email,
        門市店號: storeId,
        門市名稱: storeName,
        商品名稱: String((it && (it.title || it.name)) || "").trim(),
        規格: String((it && it.spec) || "").trim(),
        單價: Number((it && (it.unit != null ? it.unit : it.price)) || 0),
        數量: Number((it && it.qty) || 0) || 0,
        訂單編號: orderId,
        備註: note,
    }));
}

function loadRegionCart(region) {
    try {
        const raw = localStorage.getItem(cartStorageKey(region));
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return {};
        const out = {};
        Object.keys(parsed).forEach((id) => {
            const qty = parseInt(parsed[id], 10);
            if (qty > 0 && Number.isFinite(qty)) out[String(id)] = qty;
        });
        return out;
    } catch (e) {
        return {};
    }
}

function saveRegionCart(region, cart) {
    try {
        localStorage.setItem(cartStorageKey(region), JSON.stringify(cart || {}));
    } catch (e) { /* quota / private mode */ }
}

function clearRegionCart(region) {
    saveRegionCart(region, {});
}

function getRegionCartCount(cart) {
    return Object.keys(cart || {}).reduce((n, id) => n + (cart[id] || 0), 0);
}

function getRegionCartTotal(cart, products, region) {
    const list = products || (typeof storeProducts !== "undefined" ? storeProducts : []);
    let total = 0;
    Object.keys(cart || {}).forEach((id) => {
        const item = list.find((p) => String(p.id) === String(id));
        if (item) total += productUnitPrice(item, region) * cart[id];
    });
    return total;
}

function getRegionCartLines(cart, products, lang, region) {
    const list = products || (typeof storeProducts !== "undefined" ? storeProducts : []);
    const L = lang || "zh";
    const r = normalizeStoreRegion(region);
    return Object.keys(cart || {}).map((id) => {
        const item = list.find((p) => String(p.id) === String(id));
        if (!item) return null;
        const qty = cart[id];
        const title = item.title[L] || item.title.zh || item.title.en || item.title.jp || ("#" + id);
        const thumb = (item.imgs && item.imgs[0]) || item.img || "";
        const unit = productUnitPrice(item, r);
        return {
            id: item.id,
            qty,
            title,
            thumb,
            unit,
            lineTotal: unit * qty,
            soldOut: !!item.isSoldOut,
            product: item
        };
    }).filter(Boolean);
}

/**
 * Fulfillment methods for a region, filtered by cart intersection.
 * product.hkFulfillment still limits HK methods when set; TW uses product.twFulfillment.
 */
function resolveCheckoutConfig(region, config) {
    const r = normalizeStoreRegion(region);
    if (config && Array.isArray(config.fulfillment)) return config;
    if (config && r === "TW" && config.twCheckout) return config.twCheckout;
    if (config && r === "HK" && config.hkCheckout) return config.hkCheckout;
    return getCheckoutConfig(r) || {};
}

function getAvailableRegionFulfillment(cart, products, region, config) {
    const r = normalizeStoreRegion(region);
    const cfg = resolveCheckoutConfig(r, config);
    if (!cfg.fulfillment) return [];
    const globalEnabled = cfg.fulfillment.filter((f) => f.enabled);
    const lines = getRegionCartLines(cart, products, "zh", r);
    if (!lines.length) return globalEnabled;

    return globalEnabled.filter((method) =>
        lines.every((line) => {
            const allowed = r === "TW"
                ? (line.product.twFulfillment || line.product.hkFulfillment)
                : line.product.hkFulfillment;
            if (!allowed || !allowed.length) return true;
            return allowed.includes(method.id);
        })
    );
}

function generateRegionOrderId(region) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    // 8 base36 chars (~2.8e12) to reduce same-day collision risk
    const rand = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
        .slice(0, 8)
        .toUpperCase();
    const prefix = normalizeStoreRegion(region) === "TW" ? "TW" : "HK";
    return prefix + "-" + y + m + day + "-" + rand;
}

// ── Back-compat aliases (HK) ────────────────────────────────────────────────
function loadHkCart() { return loadRegionCart("HK"); }
function saveHkCart(cart) { saveRegionCart("HK", cart); }
function clearHkCart() { clearRegionCart("HK"); }
function getHkCartCount(cart) { return getRegionCartCount(cart); }
function getHkCartTotal(cart, products) { return getRegionCartTotal(cart, products, "HK"); }
function getHkCartLines(cart, products, lang) { return getRegionCartLines(cart, products, lang, "HK"); }
function getAvailableHkFulfillment(cart, products, config) {
    return getAvailableRegionFulfillment(cart, products, "HK", config || storeConfig);
}
function generateHkOrderId() { return generateRegionOrderId("HK"); }
