// STORE CONFIGURATION & DATABASE

const storeConfig = {
    "shopStatus": {
        "isOpen": true,
        "nextOpenDate": "PRE-ORDER 準備中 · 稍後開放 / COMING SOON"
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
        },
        {
            "id": "ura",
            "name": {
                "jp": "R18同人誌",
                "en": "R18 Doujin",
                "zh": "R18同人本"
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
    ]
};

const storeProducts = [
{
        "id": 103,
        "category": [
            "featured",
            "set"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "isPreorder": true,
        "useTwCart": true,
        "thumbPosition": "left",
        "eventSource": "acghk2026",
        "title": {
            "jp": "星夢亭15周年記念SET",
            "en": "Hoshiyumetei 15th Anniversary SET",
            "zh": "星夢亭15週年紀念SET"
        },
        "priceTW": 960,
        "priceHK": 240,
        "imgs": [
            "./blog/20260719/products/anni-15-set/00.jpg",
            "./blog/20260719/products/anni-15-set/01.jpg",
            "./blog/20260719/products/anni-15-set/02.jpg",
            "./blog/20260719/products/anni-15-set/03.jpg",
            "./blog/20260719/products/anni-15-set/04.jpg",
            "./blog/20260719/products/anni-15-set/05.jpg",
            "./blog/20260719/products/anni-15-set/06.jpg",
            "./blog/20260719/products/anni-15-set/07.jpg",
            "./blog/20260719/products/anni-15-set/08.jpg",
            "./blog/20260719/products/anni-15-set/09.jpg",
            "./blog/20260719/products/anni-15-set/10.jpg"],
        "desc": {
            "jp": "星夢亭15周年記念セット。<br>① 新刊 Overlay Magic Color 4（B5 20P 全彩 / 封面燙金）<br>② 半透明磨砂手提袋（30×40×10 cm）<br>③ 大型儲物盒（21×33×8 cm）<br>④ 亞加力場地中心卡<br>⑤ 自製卡×2 + 收藏磨砂卡磚×2 + 收藏禮盒<br>⑥ 遊戲「Warp Machina」初回資料設定小冊子",
            "en": "15th anniversary set.<br>① New book Overlay Magic Color 4 (B5 20P full color / foil cover)<br>② Frosted tote bag<br>③ Large storage box<br>④ Acrylic field center card<br>⑤ Custom cards ×2 + cases ×2 + gift box<br>⑥ Warp Machina setting booklet",
            "zh": "星夢亭15週年紀念套組。<br>① 新刊 - Overlay Magic Color 4（B5 20P 全彩 / 封面燙金）<br>② 半透明磨砂手提袋（30×40×10 cm）<br>③ 大型儲物盒（21×33×8 cm）<br>④ 亞加力場地中心卡<br>⑤ 自製卡×2 + 收藏磨砂卡磚×2 + 收藏禮盒<br>⑥ 遊戲「Warp Machina」初回資料設定小冊子<br>（自製卡有不同稀有度：UR / PSE / GMR）"
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
        "id": 102,
        "category": [
            "set"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "thumbPosition": "top",
        "eventSource": "acghk2026",
        "title": {
            "jp": "2025遊戯王 SET",
            "en": "2025 Yu-Gi-Oh! SET",
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
            "jp": "2025 遊戯王関連セット商品。",
            "en": "2025 Yu-Gi-Oh! related catalog set.",
            "zh": "2025 遊戲王相關既有套組商品。<br>① Overlay Magic Color 3（B5•20P•全彩）<br>② 文件夾 (A4)<br>③ Omake折本<br>④ 特典自製卡2枚組"
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
        "id": 104,
        "category": [
            "set"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "負けヒロインが多すぎる！SET",
            "en": "Too Many Losing Heroines! SET",
            "zh": "敗北女角太多了!SET"
        },
        "priceTW": 600,
        "priceHK": 150,
        "imgs": [
            "./blog/20260719/products/set-makeine/01.jpg",
            "./blog/20260719/products/set-makeine/02.jpg",
            "./blog/20260719/products/set-makeine/03.jpg",
            "./blog/20260719/products/set-makeine/04.jpg",
            "./blog/20260719/products/set-makeine/05.jpg",
            "./blog/20260719/products/set-makeine/06.jpg"
        ],
        "desc": {
            "jp": "敗北ヒロイン関連セット商品。",
            "en": "Makeine-related catalog set.",
            "zh": "敗北女角相關既有套組商品。"
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
        "id": 101,
        "category": [
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
        "id": 206,
        "category": [
            "featured",
            "sleeves"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "isPreorder": true,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "スリーブ ガガガガール",
            "en": "Sleeves - Gagaga Girl",
            "zh": "新作卡套 我我我女孩"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./blog/20260719/products/sleeve-gagaga/01.jpg"
        ],
        "desc": {
            "jp": "新作カードスリーブ。我我我女孩。遊戯王サイズ / 60枚。",
            "en": "New card sleeves featuring Gagaga Girl. Yu-Gi-Oh! size / 60 pcs.",
            "zh": "遊戲王尺寸、每包含60個／預購"
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
        "id": 207,
        "category": [
            "featured",
            "sleeves"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "isPreorder": true,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "スリーブ ブラック・マジシャン・ガール (ver. 2026)",
            "en": "Sleeves - Dark Magician Girl (ver. 2026)",
            "zh": "新作卡套 黑魔導女孩 (ver. 2026)"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./blog/20260719/products/sleeve-dmg-2026/01.jpg"
        ],
        "desc": {
            "jp": "新作カードスリーブ。ブラック・マジシャン・ガール ver. 2026。遊戯王サイズ / 60枚。",
            "en": "New card sleeves featuring Dark Magician Girl (ver. 2026). Yu-Gi-Oh! size / 60 pcs.",
            "zh": "遊戲王尺寸、每包含60個／預購"
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
        "id": 302,
        "category": [
            "featured",
            "tcg"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "isPreorder": true,
        "useTwCart": true,
        "thumbPosition": "right",
        "eventSource": "acghk2026",
        "title": {
            "jp": "プレイマット ブラック・マジシャン・ガール (ver. 2026)",
            "en": "Playmat - Dark Magician Girl (ver. 2026)",
            "zh": "新作遊戲墊 黑魔導女孩 (ver. 2026)"
        },
        "priceTW": 720,
        "priceHK": 180,
        "imgs": [
            "./blog/20260719/products/mat-dmg-2026/01.jpg",
            "./blog/20260719/products/mat-dmg-2026/02.jpg"
        ],
        "desc": {
            "jp": "新作プレイマット。ブラック・マジシャン・ガール ver. 2026。",
            "en": "New playmat featuring Dark Magician Girl (ver. 2026).",
            "zh": "新作遊戲墊 - 黑魔導女孩 (ver. 2026)。"
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
        "id": 402,
        "category": [
            "featured",
            "tcg"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "isPreorder": true,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "レザーデッキケース",
            "en": "Leather Card Deck Box",
            "zh": "皮質卡片收納盒"
        },
        "priceTW": 880,
        "priceHK": 220,
        "imgs": [
            "./blog/20260719/products/goods-deckbox/01.jpg"
        ],
        "desc": {
            "jp": "レザー素材のデッキケース／カード収納箱。",
            "en": "Leather-style card deck box.",
            "zh": "皮質卡片收納盒。"
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
            "jp": "K9－17号 飯綱",
            "en": "K9－17 Izuna",
            "zh": "K9－17號 飯綱"
        },
        "priceTW": 250,
        "priceHK": 60,
        "imgs": [
            "./assets/store/sleeve-k9-17-izuna.jpg"
        ],
        "desc": {
            "jp": "カードスリーブ。K9－17号 飯綱。",
            "en": "Card sleeves — K9－17 Izuna.",
            "zh": "卡套 · K9－17號 飯綱"
        },
        "linkTW": "https://myship.7-11.com.tw/general/detail/GM2403022207590",
        "langs": {
            "jp": true,
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
        "id": 208,
        "category": [
            "sleeves"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "スリーブ ブラック・マジシャン・ガール 2025",
            "en": "Sleeves - Dark Magician Girl 2025",
            "zh": "卡套 黑魔導女孩 2025"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./blog/20260719/products/sleeve-legacy/01.jpg"
        ],
        "desc": {
            "jp": "既存スリーブ。ブラック・マジシャン・ガール 2025。遊戯王サイズ / 60枚。",
            "en": "Catalog sleeves — Dark Magician Girl 2025. Yu-Gi-Oh! size / 60 pcs.",
            "zh": "既存卡套 · 黑魔導女孩 2025。遊戲王尺寸、每包含60個。"
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
        "id": 209,
        "category": [
            "sleeves"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "スリーブ 閃刀姫－ゼロ",
            "en": "Sleeves - Sky Striker Ace - Zero",
            "zh": "卡套 閃刀姬 零"
        },
        "priceTW": 300,
        "priceHK": 80,
        "imgs": [
            "./blog/20260719/products/sleeve-legacy/02.jpg"
        ],
        "desc": {
            "jp": "既存スリーブ。閃刀姫－ゼロ。遊戯王サイズ / 60枚。",
            "en": "Catalog sleeves — Sky Striker Ace Zero. Yu-Gi-Oh! size / 60 pcs.",
            "zh": "既存卡套 · 閃刀姬 零。遊戲王尺寸、每包含60個。"
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
        "id": 303,
        "category": [
            "tcg"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "thumbPosition": "left",
        "eventSource": "acghk2026",
        "title": {
            "jp": "既存プレイマット（八奈見）",
            "en": "Legacy Playmat (Yanami)",
            "zh": "既作遊戲墊 (八奈見)"
        },
        "priceTW": 720,
        "priceHK": 180,
        "imgs": [
            "./blog/20260719/products/mat-legacy/01.jpg"
        ],
        "desc": {
            "jp": "既存プレイマット。八奈見杏菜。",
            "en": "Legacy playmat featuring Yanami.",
            "zh": "既作遊戲墊（八奈見）。"
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
        "id": 403,
        "category": [
            "tcg"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "収納箱 Dream Card Box 2025",
            "en": "Dream Card Box 2025",
            "zh": "收納盒 Dream Card Box 2025"
        },
        "priceTW": 200,
        "priceHK": 50,
        "imgs": [
            "./blog/20260719/products/goods-cardbox/01.jpg",
            "./blog/20260719/products/goods-cardbox/02.jpg",
            "./blog/20260719/products/goods-cardbox/03.jpg"
        ],
        "desc": {
            "jp": "Dream Card Box 2025 収納箱。",
            "en": "Dream Card Box 2025 storage box.",
            "zh": "Dream Card Box 2025 收納盒。"
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
        "id": 404,
        "category": [
            "other"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": false,
        "isSoldOut": false,
        "useTwCart": true,
        "eventSource": "acghk2026",
        "title": {
            "jp": "アクキー 天愛星 + 八奈見杏菜",
            "en": "Acrylic Keychains - Tenaisei + Yanami",
            "zh": "敗北女角!天愛星+八奈見 亞加力匙扣"
        },
        "priceTW": 200,
        "priceHK": 50,
        "imgs": [
            "./blog/20260719/products/goods-akkey/01.jpg"
        ],
        "desc": {
            "jp": "敗北ヒロイン関連アクリルキーホルダー。",
            "en": "Makeine acrylic keychain set.",
            "zh": "敗北女角太多了!<br>天愛星 + 八奈見 亞加力匙扣。"
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
        "id": 503,
        "category": [
            "books"
        ],
        "regions": [
            "TW",
            "HK"
        ],
        "isNew": true,
        "isSoldOut": false,
        "useTwCart": true,
        "thumbPosition": "top",
        "eventSource": "acghk2026",
        "title": {
            "jp": "Overlay Magic Color 4",
            "en": "Overlay Magic Color 4",
            "zh": "Overlay Magic Color 4"
        },
        "priceTW": 150,
        "priceHK": 60,
        "imgs": [
            "./blog/20260719/products/book-omc4/01.jpg"
        ],
        "desc": {
            "jp": "新刊 Overlay Magic Color 4。<br>B5・20P・フルカラー / カバー箔押し",
            "en": "New book Overlay Magic Color 4.<br>B5, 20P, full color / foil cover",
            "zh": "新刊 Overlay Magic Color 4。<br>B5・20P・全彩插圖本 / 封面燙金"
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
        "useTwCart": true,
        "thumbPosition": "top",
        "eventSource": "acghk2026",
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
        "useTwCart": true,
        "eventSource": "acghk2026",
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
        "useTwCart": true,
        "thumbPosition": "top",
        "eventSource": "acghk2026",
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
        "category": [
            "ura"
        ],
        "regions": [
            "HK",
            "TW"
        ],
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
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
{
        "id": 601,
        "category": [
            "ura"
        ],
        "regions": [
            "HK",
            "TW"
        ],
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
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
{
        "id": 604,
        "category": [
            "ura"
        ],
        "regions": [
            "HK",
            "TW"
        ],
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
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
{
        "id": 602,
        "category": [
            "ura-daki"
        ],
        "regions": [
            "HK",
            "TW"
        ],
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
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    },
{
        "id": 605,
        "category": [
            "ura-daki"
        ],
        "regions": [
            "HK",
            "TW"
        ],
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
        "langs": {
            "jp": true,
            "en": true,
            "zh": true
        },
        "linkHK": null
    }
];
