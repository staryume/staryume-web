// STORE CONFIGURATION & DATABASE

const storeConfig = {
    "shopStatus": {
        "isOpen": true,
        "nextOpenDate": ""
    },
    "banner": {
        "img": "",
        "link": "#",
        "text": ""
    },
    /**
     * Hong Kong on-site checkout (bag → checkout.html → Sheets + Drive).
     * Production posts to Netlify edge /api/hk-order (rate-limited proxy).
     * Localhost falls back to scriptUrlDirect (Apps Script) — see docs/hk-store-checkout-apps-script.md
     */
    "hkCheckout": {
        "enabled": true,
        "currency": "HKD",
        "scriptUrl": "/api/hk-order",
        "scriptUrlDirect": "https://script.google.com/macros/s/AKfycbzujFWTxCxOCkPSkxzQ7ykj6uwvbZbj7N053QY6QIydDmSsodN2_w-IFcCHI-RJt9QBgw/exec",
        "discordInvite": "https://discord.gg/staryume",
        "maxProofBytes": 6000000,
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
                "fields": ["phone", "sfCode"]
            },
            {
                "id": "event_pickup",
                "enabled": false,
                "label": {
                    "zh": "活動現場取貨",
                    "en": "Event on-site pickup"
                },
                "desc": {
                    "zh": "特定商品可於指定活動攤位領取（請留意活動公告）。",
                    "en": "Selected items may be picked up at the event booth (see event notice)."
                },
                "fields": []
            }
        ]
    },
    "categories": [
        {
            "id": "featured",
            "name": {
                "jp": "FEATURED",
                "en": "FEATURED",
                "zh": "精選"
            }
        },
        {
            "id": "set",
            "name": {
                "jp": "SETS",
                "en": "SETS",
                "zh": "套組"
            }
        },
        {
            "id": "books",
            "name": {
                "jp": "BOOKS",
                "en": "BOOKS",
                "zh": "刊物"
            }
        },
        {
            "id": "sleeves",
            "name": {
                "jp": "SLEEVES",
                "en": "SLEEVES",
                "zh": "卡套"
            }
        },
        {
            "id": "tcg",
            "name": {
                "jp": "TCG ACCESSORIES",
                "en": "TCG ACCESSORIES",
                "zh": "TCG 關連"
            }
        },
        {
            "id": "other",
            "name": {
                "jp": "OTHER",
                "en": "OTHER",
                "zh": "其他"
            }
        },
        {
            "id": "ura",
            "name": {
                "jp": "R18同人誌",
                "en": "R18 Doujin",
                "zh": "R18同人本"
            },
            "nameByRegion": {
                "HK": { "jp": "失物認領", "en": "Lost & Found", "zh": "失物認領" },
                "TW": { "jp": "R18商品", "en": "R18", "zh": "R18商品" }
            }
        },
        {
            "id": "ura-daki",
            "name": {
                "jp": "R18抱き枕カバー",
                "en": "R18 Dakimakura",
                "zh": "R18 抱枕套"
            }
        }
    ],
    /**
     * 裏 store (R18) — unlock via ??? + 通關密碼 (Discord).
     * Passcode is client-side only (obscurity for fans, not true secrecy).
     * Rotate passcode and redeploy when Discord announces a new code.
     */
    "ura": {
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
    }
};

const storeProducts = [
    {
        "id": 101,
        "category": [
            "featured",
            "set",
            "new"
        ],
        "regions": [
            "TW"
        ],
        "isNew": true,
        "isSoldOut": true,
        "title": {
            "jp": null,
            "en": "FF46 SET",
            "zh": "FF46 SET"
        },
        "priceTW": 400,
        "priceHK": 100,
        "imgs": [
            "./assets/store/ff46-set-01.jpg",
            "./blog/20260719/products/set-makeine/01.jpg",
            "./blog/20260719/products/set-makeine/02.jpg",
            "./blog/20260719/products/set-makeine/03.jpg",
            "./blog/20260719/products/set-makeine/04.jpg",
            "./blog/20260719/products/set-makeine/05.jpg",
            "./blog/20260719/products/set-makeine/06.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Includes New Artbook, Acrylic Stand, Badge, and Paper Bag.",
            "zh": "商品敘述:<br>1 - 新刊 - 敗北女角聖地巡禮插圖本（B5 20P全彩，日文）<br>2 - 透明扁平收納袋 （A4）<br>3 - 閃刀姫零衣本準備号<br>4 - 明信片2枚"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 102,
        "category": [
            "featured",
            "set"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "2025 遊戲王 SET",
            "zh": "2025 遊戲王 SET"
        },
        "priceTW": 400,
        "priceHK": 100,
        "imgs": [
            "./assets/store/ff45-yugioh-set-01.jpg",
            "./blog/20260719/products/set-yugioh-2025/01.jpg",
            "./blog/20260719/products/set-yugioh-2025/02.jpg",
            "./blog/20260719/products/set-yugioh-2025/03.jpg",
            "./blog/20260719/products/set-yugioh-2025/04.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "A4 Size, 32 Pages.",
            "zh": "商品敘述:<br>①新刊 Overlay Magic Color 3 <br>B5•20P•全彩插圖本<br>②文件夾 (A4尺寸) <br>③Omake折本 <br>A5•8P•全彩插圖本<br>④特典自製卡2枚組 金（UR）/白鑽（PSE）仕様隨機封入<br>連燙閃藍加工信封／真品証明書"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 201,
        "category": [
            "sleeves",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Card Sleeves - Killer Tunes Cue",
            "zh": "卡套 - 殺手旋律 綺悠"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./assets/store/sleeve-cue-01.png",
            "./blog/20260719/products/sleeve-legacy/04.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Mini Size.",
            "zh": "遊戲王尺寸卡套 - 殺手旋律 綺悠 <br/>日本製尺寸：遊戲王 mini 尺寸 (63×90mm )</br>一包含有 60 個卡套"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 202,
        "category": [
            "sleeves",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Card Sleeves",
            "zh": "卡套 - 珠之御巫狐里"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./assets/store/sleeve-furi-01.png",
            "./blog/20260719/products/sleeve-legacy/03.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Mini Size.",
            "zh": "遊戲王尺寸卡套 - 殺手旋律 綺悠 <br/>日本製尺寸：遊戲王 mini 尺寸 (63×90mm )</br>一包含有 60 個卡套"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 203,
        "category": [
            "sleeves",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Card Sleeves (Lunamaria)",
            "zh": "卡套 - 露娜瑪莉亞"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./assets/store/sleeve-lunamaria-01.png",
            "./blog/20260719/products/sleeve-legacy/05.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Standard",
            "zh": "標準尺寸 卡套 - 露娜瑪莉亞<br>日本製尺寸：MTG / PTCG 標準尺寸 (66×92mm )<br> 一包含有 60 個卡套"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 204,
        "category": [
            "sleeves",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Card Sleeves (Dreizehn)",
            "zh": "卡套 - 黛芮采"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./assets/store/sleeve-dreizehn-01.png",
            "./blog/20260719/products/sleeve-legacy/06.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Standard",
            "zh": "標準尺寸 卡套 - 黛芮采<br>日本製尺寸：MTG / PTCG 標準尺寸 (66×92mm )<br> 一包含有 60 個卡套"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 205,
        "category": [
            "sleeves",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Card Sleeves (Utopia)",
            "zh": "卡套 (霍普)"
        },
        "priceTW": 250,
        "priceHK": 60,
        "imgs": [
            "./blog/20260719/products/sleeve-legacy/02.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Standard",
            "zh": "標準"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 301,
        "category": [
            "tcg",
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": true,
        "title": {
            "jp": null,
            "en": "Playmat - Dark Magician Girl (2023 ver.)",
            "zh": "黑魔導女孩 遊戲墊 (2023 ver.)"
        },
        "priceTW": 600,
        "priceHK": 180,
        "imgs": [
            "./assets/store/mat-dmg-01.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Playmat - Dark Magician Girl",
            "zh": "牌墊"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 401,
        "category": [
            "goods"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "title": {
            "jp": null,
            "en": "Playmat - Dark Magician Girl (2023 ver.)",
            "zh": "黑魔導女孩 遊戲墊 (2023 ver.)"
        },
        "priceTW": 600,
        "priceHK": 180,
        "imgs": [
            "./assets/store/mat-dmg-01.jpg"
        ],
        "desc": {
            "jp": null,
            "en": "Playmat - Dark Magician Girl",
            "zh": "牌墊"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": false,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 500,
        "category": [
            "books"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "Too many Seichi!",
            "en": "Too many Seichi!",
            "zh": "Too many Seichi!"
        },
        "priceTW": 180,
        "priceHK": 70,
        "imgs": [
            "./blog/20260719/products/book-too-many-seichi/01.jpg",
            "./blog/20251224/products/book-too-many-seichi/01.jpg",
            "./blog/20251224/products/book-too-many-seichi/02.jpg",
            "./blog/20251224/products/book-too-many-seichi/03.jpg"
        ],
        "desc": {
            "jp": "フルカラーイラスト本。<br>20P / フルカラー",
            "en": "Full-color artbook.<br>20P / full color",
            "zh": "全彩插圖本。<br>20P / 全彩"
        },
        "linkTW": null,
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 501,
        "category": [
            "books"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "title": {
            "jp": "Overlay Magic Color 3",
            "en": "Overlay Magic Color 3",
            "zh": "Overlay Magic Color 3"
        },
        "priceTW": 150,
        "priceHK": 60,
        "imgs": [
            "./blog/20260719/products/book-omc3/01.jpg",
            "./blog/20251224/products/book-omc3/01.jpg",
            "./blog/20251224/products/book-omc3/02.jpg",
            "./blog/20251224/products/book-omc3/03.jpg",
            "./blog/20251224/products/book-omc3/04.jpg",
            "./blog/20251224/products/book-omc3/05.jpg"
        ],
        "desc": {
            "jp": "Overlay Magic Color シリーズ既刊。<br>B5・20P・フルカラー",
            "en": "Overlay Magic Color series catalog book.<br>B5, 20P, full color",
            "zh": "既刊 Overlay Magic Color 3。<br>B5・20P・全彩插圖本"
        },
        "linkTW": null,
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 502,
        "category": [
            "books"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "title": {
            "jp": "Overlay Magic GALA",
            "en": "Overlay Magic GALA",
            "zh": "Overlay Magic GALA"
        },
        "priceTW": 150,
        "priceHK": 60,
        "imgs": [
            "./blog/20260719/products/book-om-gala/01.jpg"
        ],
        "desc": {
            "jp": "Overlay Magic GALA 既刊。<br>フルカラー / 32P",
            "en": "Overlay Magic GALA catalog book.<br>Full color / 32P",
            "zh": "既刊 Overlay Magic GALA。<br>全彩 / 32P"
        },
        "linkTW": null,
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
    {
        "id": 603,
        "category": ["ura"],
        "regions": ["HK", "TW"],
        "hidden": true,
        "contentRating": "r18",
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "君はそこがダメなんだよ、ぬるま湯くん",
            "en": "That's What I Hate About You, Nukumizu-kun",
            "zh": "你就是這點不行啦，溫水君"
        },
        "priceTW": 150,
        "priceHK": 60,
        "imgs": [
            "./blog/20251224/products/book-nukumizu/01.jpg",
            "./blog/20251224/products/book-nukumizu/02.jpg",
            "./blog/20251224/products/book-nukumizu/03.jpg",
            "./blog/20251224/products/book-nukumizu/04.jpg",
            "./blog/20251224/products/book-nukumizu/05.jpg",
            "./blog/20251224/products/book-nukumizu/06.jpg"
        ],
        "desc": {
            "jp": "R18 同人誌。詳細は Discord 通關案内を参照。",
            "en": "R18 doujinshi. See Discord unlock guide for details.",
            "zh": "R18 同人誌。詳情請見 Discord 通關／失物認領公告。"
        },
        "linkTW": null,
        "langs": { "jp": true, "en": true, "zh": true },
        "linkHK": null
    },
    {
        "id": 601,
        "category": ["ura"],
        "regions": ["HK", "TW"],
        "hidden": true,
        "contentRating": "r18",
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "Overlay Magic 6",
            "en": "Overlay Magic 6",
            "zh": "Overlay Magic 6"
        },
        "priceTW": 150,
        "priceHK": 60,
        "imgs": [
            "./blog/20251224/products/book-om6/01.jpg",
            "./blog/20251224/products/book-om6/02.jpg",
            "./blog/20251224/products/book-om6/03.jpg",
            "./blog/20251224/products/book-om6/04.jpg",
            "./blog/20251224/products/book-om6/05.jpg",
            "./blog/20251224/products/book-om6/06.jpg"
        ],
        "desc": {
            "jp": "R18 既刊。詳細は Discord 失物認領の案内を参照。",
            "en": "R18 artbook. See Discord unlock guide for details.",
            "zh": "R18 既刊。詳情請見 Discord 通關／失物認領公告。"
        },
        "linkTW": null,
        "langs": { "jp": true, "en": true, "zh": true },
        "linkHK": null
    },
    {
        "id": 604,
        "category": ["ura"],
        "regions": ["HK", "TW"],
        "hidden": true,
        "contentRating": "r18",
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "Overlay Magic 総集編2",
            "en": "Overlay Magic Omnibus 2",
            "zh": "Overlay Magic 總集篇2"
        },
        "priceTW": 300,
        "priceHK": 120,
        "imgs": [
            "./blog/20251224/products/book-om-omnibus/01.jpg",
            "./blog/20251224/products/book-om-omnibus/02.jpg",
            "./blog/20251224/products/book-om-omnibus/03.jpg",
            "./blog/20251224/products/book-om-omnibus/04.jpg",
            "./blog/20251224/products/book-om-omnibus/05.jpg",
            "./blog/20251224/products/book-om-omnibus/06.jpg"
        ],
        "desc": {
            "jp": "R18 総集編。詳細は Discord 通關案内を参照。",
            "en": "R18 omnibus. See Discord unlock guide for details.",
            "zh": "R18 總集篇。詳情請見 Discord 通關／失物認領公告。"
        },
        "linkTW": null,
        "langs": { "jp": true, "en": true, "zh": true },
        "linkHK": null
    },
    {
        "id": 602,
        "category": ["ura-daki"],
        "regions": ["HK", "TW"],
        "hidden": true,
        "contentRating": "r18",
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "抱き枕カバー - ヴィヴィアン優衣",
            "en": "Dakimakura cover - Vivian Yui",
            "zh": "抱枕套 - 薇薇安優衣"
        },
        "priceTW": 2700,
        "priceHK": 680,
        "imgs": [
            "./blog/20251224/products/daki-vivian/01.jpg",
            "./blog/20251224/products/daki-vivian/02.jpg",
            "./blog/20251224/products/daki-vivian/03.jpg",
            "./blog/20251224/products/daki-vivian/04.jpg",
            "./blog/20251224/products/daki-vivian/05.jpg"
        ],
        "desc": {
            "jp": "R18 抱き枕カバー。詳細は Discord 通關案内を参照。",
            "en": "R18 dakimakura cover. See Discord unlock guide for details.",
            "zh": "R18 抱枕套。詳情請見 Discord 通關／失物認領公告。"
        },
        "linkTW": null,
        "langs": { "jp": true, "en": true, "zh": true },
        "linkHK": null
    },
    {
        "id": 605,
        "category": ["ura-daki"],
        "regions": ["HK", "TW"],
        "hidden": true,
        "contentRating": "r18",
        "isNew": true,
        "isSoldOut": false,
        "title": {
            "jp": "抱き枕カバー - 優衣（星辰）",
            "en": "Dakimakura cover - Yui (Star)",
            "zh": "抱枕套 - 優衣 (星辰)"
        },
        "priceTW": 2700,
        "priceHK": 680,
        "imgs": [
            "./blog/20251224/products/daki-yui-star/01.jpg",
            "./blog/20251224/products/daki-yui-star/02.jpg",
            "./blog/20251224/products/daki-yui-star/03.jpg",
            "./blog/20251224/products/daki-yui-star/04.jpg",
            "./blog/20251224/products/daki-yui-star/05.jpg"
        ],
        "desc": {
            "jp": "R18 抱き枕カバー。詳細は Discord 通關案内を参照。",
            "en": "R18 dakimakura cover. See Discord unlock guide for details.",
            "zh": "R18 抱枕套。詳情請見 Discord 通關／失物認領公告。"
        },
        "linkTW": null,
        "langs": { "jp": true, "en": true, "zh": true },
        "linkHK": null
    }
];

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

// ── HK bag (shared by store.html + checkout.html) ───────────────────────────
const HK_CART_STORAGE_KEY = "staryume_cart_hk";

function loadHkCart() {
    try {
        const raw = localStorage.getItem(HK_CART_STORAGE_KEY);
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

function saveHkCart(cart) {
    try {
        localStorage.setItem(HK_CART_STORAGE_KEY, JSON.stringify(cart || {}));
    } catch (e) { /* quota / private mode */ }
}

function clearHkCart() {
    saveHkCart({});
}

function getHkCartCount(cart) {
    return Object.keys(cart || {}).reduce((n, id) => n + (cart[id] || 0), 0);
}

function getHkCartTotal(cart, products) {
    const list = products || (typeof storeProducts !== "undefined" ? storeProducts : []);
    let total = 0;
    Object.keys(cart || {}).forEach((id) => {
        const item = list.find((p) => String(p.id) === String(id));
        if (item && typeof item.priceHK === "number") total += item.priceHK * cart[id];
    });
    return total;
}

function getHkCartLines(cart, products, lang) {
    const list = products || (typeof storeProducts !== "undefined" ? storeProducts : []);
    const L = lang || "zh";
    return Object.keys(cart || {}).map((id) => {
        const item = list.find((p) => String(p.id) === String(id));
        if (!item) return null;
        const qty = cart[id];
        const title = item.title[L] || item.title.zh || item.title.en || item.title.jp || ("#" + id);
        const thumb = (item.imgs && item.imgs[0]) || item.img || "";
        const unit = item.priceHK || 0;
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

/** Fulfillment methods allowed for every line in the cart (intersection). */
function getAvailableHkFulfillment(cart, products, config) {
    const hk = (config || storeConfig).hkCheckout;
    if (!hk || !hk.fulfillment) return [];
    const globalEnabled = hk.fulfillment.filter((f) => f.enabled);
    const lines = getHkCartLines(cart, products);
    if (!lines.length) return globalEnabled;

    return globalEnabled.filter((method) =>
        lines.every((line) => {
            const allowed = line.product.hkFulfillment;
            if (!allowed || !allowed.length) return true;
            return allowed.includes(method.id);
        })
    );
}

function generateHkOrderId() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "HK-" + y + m + day + "-" + rand;
}
