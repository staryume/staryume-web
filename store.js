// STORE CONFIGURATION & DATABASE

const storeConfig = {
    "shopStatus": {
        "isOpen": false,
        "nextOpenDate": ""
    },
    "banner": {
        "img": "",
        "link": "#",
        "text": ""
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
        }
    ]
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
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030765104.jpg"
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
            "en": "FF45 遊戲王 SET",
            "zh": "FF45 遊戲王 SET"
        },
        "priceTW": 400,
        "priceHK": 100,
        "imgs": [
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784863807.jpg"
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
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030655488.jpg"
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
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030654315.jpg"
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
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030652984.jpg"
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
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030650952.jpg"
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
            "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600"
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
            "en": "Playmat - Dark Magician Girl",
            "zh": "黑魔導女孩 遊戲墊 （再販）"
        },
        "priceTW": 600,
        "priceHK": 180,
        "imgs": [
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg"
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
            "en": "Playmat - Dark Magician Girl",
            "zh": "黑魔導女孩 遊戲墊 （再販）"
        },
        "priceTW": 600,
        "priceHK": 180,
        "imgs": [
            "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg"
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
    }
];
