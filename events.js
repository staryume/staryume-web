// EVENT お品書き CATALOG
// Add new events as keys under eventCatalog. Link from a blog post via eventId.

const eventUiStrings = {
    "jp": {
        "hint": "画像の商品をタップ／クリックで詳細を表示",
        "listHeading": "商品一覧",
        "photos": "写真",
        "pages": "ページプレビュー",
        "specs": "仕様",
        "close": "閉じる",
        "booth": "ブース情報",
        "newBadge": "新作",
        "category": {
            "set": "セット",
            "book": "新刊・既刊",
            "sleeve": "スリーブ",
            "mat": "プレイマット",
            "goods": "グッズ",
            "other": "その他"
        }
    },
    "en": {
        "hint": "Tap / click a product on the image for details",
        "listHeading": "Product List",
        "photos": "Photos",
        "pages": "Page Preview",
        "specs": "Specs",
        "close": "Close",
        "booth": "Booth Info",
        "newBadge": "NEW",
        "category": {
            "set": "SET",
            "book": "BOOK",
            "sleeve": "SLEEVE",
            "mat": "PLAYMAT",
            "goods": "GOODS",
            "other": "OTHER"
        }
    },
    "zh": {
        "hint": "點擊圖上的商品查看詳細資訊",
        "listHeading": "商品一覽",
        "photos": "照片",
        "pages": "內頁預覽",
        "specs": "規格",
        "close": "關閉",
        "booth": "攤位資訊",
        "newBadge": "新作",
        "category": {
            "set": "套組",
            "book": "刊物",
            "sleeve": "卡套",
            "mat": "牌墊",
            "goods": "周邊",
            "other": "其他"
        }
    }
};

const eventCatalog = {
    "c107": {
        "id": "c107",
        "title": {
            "jp": "C107 お品書き",
            "en": "C107 Product Menu",
            "zh": "C107 販售物情報"
        },
        "meta": {
            "event": "COMIC MARKET C107",
            "booth": {
                "jp": "12/30 DAY1 東ア-33a ／ 12/31 DAY2 東C-37ab",
                "en": "12/30 DAY1 East A-33a / 12/31 DAY2 East C-37ab",
                "zh": "12/30 DAY1 東ア-33a ／ 12/31 DAY2 東C-37ab"
            },
            "dates": "2025/12/30–31"
        },
        "defaultCta": {
            "label": {
                "jp": "BOOTHで購入",
                "en": "Buy on BOOTH",
                "zh": "前往 BOOTH 購買"
            },
            "url": "https://staryume.booth.pm",
            "external": true
        },
        "menuImages": [
            {
                "id": "page1",
                "src": "./blog/20251224/c107pricelist01.jpg",
                "label": {
                    "jp": "新作",
                    "en": "New Releases",
                    "zh": "新作"
                },
                "hotspots": [
                    {
                        "productId": "winter-set",
                        "coords": [
                            2,
                            12.6,
                            95.4,
                            42.1
                        ]
                    },
                    {
                        "productId": "sleeve-cue",
                        "coords": [
                            1.9,
                            55.8,
                            23.5,
                            20.9
                        ]
                    },
                    {
                        "productId": "sleeve-furi",
                        "coords": [
                            25.4,
                            55.8,
                            23.4,
                            20.9
                        ]
                    },
                    {
                        "productId": "mat-annna",
                        "coords": [
                            50.6,
                            55.8,
                            46.9,
                            20.9
                        ]
                    },
                    {
                        "productId": "sleeve-lunamaria",
                        "coords": [
                            1.9,
                            77.8,
                            23.5,
                            21
                        ]
                    },
                    {
                        "productId": "sleeve-dreizehn",
                        "coords": [
                            25.4,
                            77.8,
                            23.4,
                            21
                        ]
                    },
                    {
                        "productId": "book-too-many-seichi",
                        "coords": [
                            50.6,
                            77.8,
                            46.9,
                            21
                        ]
                    }
                ]
            },
            {
                "id": "page2",
                "src": "./blog/20251224/c107pricelist02.jpg",
                "label": {
                    "jp": "既存",
                    "en": "Catalog",
                    "zh": "既存"
                },
                "hotspots": [
                    {
                        "productId": "set-c106-makein",
                        "coords": [
                            2,
                            1.5,
                            46.9,
                            48
                        ]
                    },
                    {
                        "productId": "set-c106-yugioh",
                        "coords": [
                            51.5,
                            1.5,
                            47.1,
                            48
                        ]
                    },
                    {
                        "productId": "sleeve-legacy-mini",
                        "coords": [
                            2,
                            50.6,
                            46.9,
                            30.2
                        ]
                    },
                    {
                        "productId": "mat-dark-magician-girl",
                        "coords": [
                            50.7,
                            50.6,
                            46.9,
                            15
                        ]
                    },
                    {
                        "productId": "goods-makein-akkey",
                        "coords": [
                            50.7,
                            66.5,
                            46.9,
                            14.3
                        ]
                    },
                    {
                        "productId": "book-om6",
                        "coords": [
                            2,
                            82.4,
                            30.8,
                            17
                        ]
                    },
                    {
                        "productId": "book-omc3",
                        "coords": [
                            34.3,
                            82.4,
                            30.8,
                            17
                        ]
                    },
                    {
                        "productId": "book-om-omnibus",
                        "coords": [
                            66.8,
                            82.4,
                            30.8,
                            17
                        ]
                    }
                ]
            }
        ],
        "productOrder": [
            "winter-set",
            "sleeve-cue",
            "sleeve-furi",
            "mat-annna",
            "sleeve-lunamaria",
            "sleeve-dreizehn",
            "book-too-many-seichi",
            "set-c106-makein",
            "set-c106-yugioh",
            "sleeve-legacy-mini",
            "mat-dark-magician-girl",
            "goods-makein-akkey",
            "book-om6",
            "book-omc3",
            "book-om-omnibus"
        ],
        "products": {
            "winter-set": {
                "id": "winter-set",
                "category": "set",
                "isNew": true,
                "title": {
                    "jp": "冬コミセット",
                    "en": "Winter Comiket Set",
                    "zh": "冬コミ套組"
                },
                "price": {
                    "jp": "¥1,500",
                    "en": "¥1,500",
                    "zh": "¥1,500"
                },
                "specs": {
                    "jp": "①新刊 ②フラットケース ③折り本 ④ポストカード2枚",
                    "en": "① New book ② Flat case ③ Booklet ④ 2 postcards",
                    "zh": "①新刊 ②扁平收納袋 ③折本 ④明信片2枚"
                },
                "desc": {
                    "jp": "C107新作セット。<br>① 新刊 - マケイン聖地巡礼イラスト本（B5 20P フルカラー）<br>② ブラマジガールフラットケース（A4サイズ）<br>③ 閃刀姫レイ準備号 折り本<br>④ ポストカード2枚",
                    "en": "C107 new release set.<br>① New artbook - Makeine pilgrimage (B5, 20P full color)<br>② Dark Magician Girl flat case (A4)<br>③ Sky Striker Ray prep booklet<br>④ 2 postcards",
                    "zh": "C107 新作套組。<br>① 新刊 - 敗北女角聖地巡禮插圖本（B5 20P 全彩）<br>② 黑魔導女孩扁平收納袋（A4）<br>③ 閃刀姫零衣準備號折本<br>④ 明信片2枚"
                },
                "gallery": [
                    "./blog/20251224/products/winter-set/01.jpg",
                    "./blog/20251224/products/winter-set/02.jpg",
                    "./blog/20251224/products/winter-set/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/winter-set/01.jpg",
                "cta": null
            },
            "sleeve-cue": {
                "id": "sleeve-cue",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ キラーチューン・キュー",
                    "en": "Sleeves - Killer Tune Cue",
                    "zh": "卡套 - 殺手旋律 綺悠"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ（63×90mm）／60枚入／日本製",
                    "en": "Mini size (63×90mm) / 60 pcs / Made in Japan",
                    "zh": "迷你尺寸（63×90mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。遊戯王ミニサイズ対応。",
                    "en": "New card sleeves. Yu-Gi-Oh! mini size.",
                    "zh": "新作卡套。對應遊戲王迷你尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030655488.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030655488.jpg",
                "cta": null
            },
            "sleeve-furi": {
                "id": "sleeve-furi",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ 珠の御巫フゥリ",
                    "en": "Sleeves - Shinobirds Furi",
                    "zh": "卡套 - 珠之御巫狐里"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ（63×90mm）／60枚入／日本製",
                    "en": "Mini size (63×90mm) / 60 pcs / Made in Japan",
                    "zh": "迷你尺寸（63×90mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。遊戯王ミニサイズ対応。",
                    "en": "New card sleeves. Yu-Gi-Oh! mini size.",
                    "zh": "新作卡套。對應遊戲王迷你尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030654315.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030654315.jpg",
                "cta": null
            },
            "mat-annna": {
                "id": "mat-annna",
                "category": "mat",
                "isNew": true,
                "title": {
                    "jp": "プレイマット 八奈見杏菜",
                    "en": "Playmat - Anna Yanami",
                    "zh": "牌墊 - 八奈見杏菜"
                },
                "price": {
                    "jp": "¥3,000",
                    "en": "¥3,000",
                    "zh": "¥3,000"
                },
                "specs": {
                    "jp": "新作プレイマット",
                    "en": "New playmat",
                    "zh": "新作牌墊"
                },
                "desc": {
                    "jp": "C107新作プレイマット。八奈見杏菜イラスト。",
                    "en": "C107 new playmat featuring Anna Yanami.",
                    "zh": "C107 新作牌墊，八奈見杏菜插圖。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist01.jpg",
                "cta": null
            },
            "sleeve-lunamaria": {
                "id": "sleeve-lunamaria",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ルナマリア",
                    "en": "Sleeves - Lunamaria",
                    "zh": "卡套 - 露娜瑪莉亞"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "スタンダードサイズ（66×92mm）／60枚入／日本製",
                    "en": "Standard size (66×92mm) / 60 pcs / Made in Japan",
                    "zh": "標準尺寸（66×92mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。MTG / PTCG 標準サイズ対応。",
                    "en": "New card sleeves. MTG / PTCG standard size.",
                    "zh": "新作卡套。對應 MTG / PTCG 標準尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030652984.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030652984.jpg",
                "cta": null
            },
            "sleeve-dreizehn": {
                "id": "sleeve-dreizehn",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ドライツェン",
                    "en": "Sleeves - Dreizehn",
                    "zh": "卡套 - 黛芮采"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "スタンダードサイズ（66×92mm）／60枚入／日本製",
                    "en": "Standard size (66×92mm) / 60 pcs / Made in Japan",
                    "zh": "標準尺寸（66×92mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。MTG / PTCG 標準サイズ対応。",
                    "en": "New card sleeves. MTG / PTCG standard size.",
                    "zh": "新作卡套。對應 MTG / PTCG 標準尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030650952.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030650952.jpg",
                "cta": null
            },
            "book-too-many-seichi": {
                "id": "book-too-many-seichi",
                "category": "book",
                "isNew": true,
                "title": {
                    "jp": "新刊 TOO MANY SEICHI!",
                    "en": "New Book: TOO MANY SEICHI!",
                    "zh": "新刊 TOO MANY SEICHI!"
                },
                "price": {
                    "jp": "¥700",
                    "en": "¥700",
                    "zh": "¥700"
                },
                "specs": {
                    "jp": "単品販売／フルカラーイラスト本",
                    "en": "Sold separately / Full-color artbook",
                    "zh": "單品販售／全彩插圖本"
                },
                "desc": {
                    "jp": "C107新刊。マケイン関連フルカラーイラスト本。セットにも含まれます。",
                    "en": "C107 new release. Makeine full-color artbook. Also included in the set.",
                    "zh": "C107 新刊。敗北女角相關全彩插圖本。套組亦有收錄。"
                },
                "gallery": [
                    "./blog/20251224/products/book-too-many-seichi/01.jpg",
                    "./blog/20251224/products/book-too-many-seichi/02.jpg",
                    "./blog/20251224/products/book-too-many-seichi/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-too-many-seichi/page-01.jpg",
                    "./blog/20251224/products/book-too-many-seichi/page-02.jpg",
                    "./blog/20251224/products/book-too-many-seichi/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-too-many-seichi/01.jpg",
                "cta": null
            },
            "set-c106-makein": {
                "id": "set-c106-makein",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "C106マケインセット",
                    "en": "C106 Makeine Set",
                    "zh": "C106 敗北女角套組"
                },
                "price": {
                    "jp": "¥2,000",
                    "en": "¥2,000",
                    "zh": "¥2,000"
                },
                "specs": {
                    "jp": "既刊セット／アクリルスタンド等含む",
                    "en": "Catalog set / includes acrylic stand etc.",
                    "zh": "既存套組／含壓克力立牌等"
                },
                "desc": {
                    "jp": "C106 マケイン関連セット商品。",
                    "en": "C106 Makeine-related set.",
                    "zh": "C106 敗北女角相關套組商品。"
                },
                "gallery": [
                    "./blog/20251224/products/set-c106-makein/01.jpg",
                    "./blog/20251224/products/set-c106-makein/02.jpg",
                    "./blog/20251224/products/set-c106-makein/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/set-c106-makein/01.jpg",
                "cta": null
            },
            "set-c106-yugioh": {
                "id": "set-c106-yugioh",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "C106遊戯王セット",
                    "en": "C106 Yu-Gi-Oh! Set",
                    "zh": "C106 遊戲王套組"
                },
                "price": {
                    "jp": "¥2,000",
                    "en": "¥2,000",
                    "zh": "¥2,000"
                },
                "specs": {
                    "jp": "既刊セット／特典カード等含む",
                    "en": "Catalog set / includes bonus cards etc.",
                    "zh": "既存套組／含特典卡等"
                },
                "desc": {
                    "jp": "C106 遊戯王関連セット商品。",
                    "en": "C106 Yu-Gi-Oh! related set.",
                    "zh": "C106 遊戲王相關套組商品。"
                },
                "gallery": [
                    "./blog/20251224/products/set-c106-yugioh/01.jpg",
                    "./blog/20251224/products/set-c106-yugioh/02.jpg",
                    "./blog/20251224/products/set-c106-yugioh/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/set-c106-yugioh/01.jpg",
                "cta": null
            },
            "sleeve-legacy-mini": {
                "id": "sleeve-legacy-mini",
                "category": "sleeve",
                "isNew": false,
                "title": {
                    "jp": "既存スリーブ（ミニ）各種",
                    "en": "Legacy Mini Sleeves (Various)",
                    "zh": "既存卡套（迷你）各種"
                },
                "price": {
                    "jp": "各 ¥1,200",
                    "en": "¥1,200 each",
                    "zh": "各 ¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ／60枚入／6種ラインナップ",
                    "en": "Mini size / 60 pcs / 6 designs",
                    "zh": "迷你尺寸／60枚／6款可選"
                },
                "desc": {
                    "jp": "既刊キャラクターのミニサイズスリーブ。各種ラインナップをご用意しています。",
                    "en": "Legacy character mini sleeves. Multiple designs available.",
                    "zh": "既存角色迷你尺寸卡套，多款可選。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist02.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist02.jpg",
                "cta": null
            },
            "mat-dark-magician-girl": {
                "id": "mat-dark-magician-girl",
                "category": "mat",
                "isNew": false,
                "title": {
                    "jp": "ブラマジガールプレイマット",
                    "en": "Dark Magician Girl Playmat",
                    "zh": "黑魔導女孩 牌墊"
                },
                "price": {
                    "jp": "¥3,000",
                    "en": "¥3,000",
                    "zh": "¥3,000"
                },
                "specs": {
                    "jp": "既存プレイマット",
                    "en": "Catalog playmat",
                    "zh": "既存牌墊"
                },
                "desc": {
                    "jp": "ブラック・マジシャン・ガール プレイマット。",
                    "en": "Dark Magician Girl playmat.",
                    "zh": "黑魔導女孩牌墊。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg",
                "cta": null
            },
            "goods-makein-akkey": {
                "id": "goods-makein-akkey",
                "category": "goods",
                "isNew": false,
                "title": {
                    "jp": "マケインアクキーホルダーセット",
                    "en": "Makeine Acrylic Keychain Set",
                    "zh": "敗北女角 壓克力吊飾套組"
                },
                "price": {
                    "jp": "¥1,000",
                    "en": "¥1,000",
                    "zh": "¥1,000"
                },
                "specs": {
                    "jp": "オマケポストカード付き",
                    "en": "Includes bonus postcard",
                    "zh": "附特典明信片"
                },
                "desc": {
                    "jp": "マケイン関連アクリルキーホルダーセット。オマケポストカード付き。",
                    "en": "Makeine acrylic keychain set with bonus postcard.",
                    "zh": "敗北女角壓克力吊飾套組，附特典明信片。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist02.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist02.jpg",
                "cta": null
            },
            "book-om6": {
                "id": "book-om6",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic 6",
                    "en": "Overlay Magic 6",
                    "zh": "既刊 Overlay Magic 6"
                },
                "price": {
                    "jp": "¥500",
                    "en": "¥500",
                    "zh": "¥500"
                },
                "specs": {
                    "jp": "既刊イラスト本",
                    "en": "Catalog artbook",
                    "zh": "既刊插圖本"
                },
                "desc": {
                    "jp": "Overlay Magic シリーズ既刊。",
                    "en": "Overlay Magic series catalog book.",
                    "zh": "Overlay Magic 系列既刊。"
                },
                "gallery": [
                    "./blog/20251224/products/book-om6/01.jpg",
                    "./blog/20251224/products/book-om6/02.jpg",
                    "./blog/20251224/products/book-om6/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-om6/page-01.jpg",
                    "./blog/20251224/products/book-om6/page-02.jpg",
                    "./blog/20251224/products/book-om6/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-om6/01.jpg",
                "cta": null
            },
            "book-omc3": {
                "id": "book-omc3",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic Color 3",
                    "en": "Overlay Magic Color 3",
                    "zh": "既刊 Overlay Magic Color 3"
                },
                "price": {
                    "jp": "¥500",
                    "en": "¥500",
                    "zh": "¥500"
                },
                "specs": {
                    "jp": "B5・20P・フルカラー",
                    "en": "B5, 20P, full color",
                    "zh": "B5・20P・全彩"
                },
                "desc": {
                    "jp": "Overlay Magic Color シリーズ既刊。",
                    "en": "Overlay Magic Color series catalog book.",
                    "zh": "Overlay Magic Color 系列既刊。"
                },
                "gallery": [
                    "./blog/20251224/products/book-omc3/01.jpg",
                    "./blog/20251224/products/book-omc3/02.jpg",
                    "./blog/20251224/products/book-omc3/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-omc3/page-01.jpg",
                    "./blog/20251224/products/book-omc3/page-02.jpg",
                    "./blog/20251224/products/book-omc3/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-omc3/01.jpg",
                "cta": null
            },
            "book-om-omnibus": {
                "id": "book-om-omnibus",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic 総集編",
                    "en": "Overlay Magic Omnibus",
                    "zh": "既刊 Overlay Magic 總集編"
                },
                "price": {
                    "jp": "¥1,000",
                    "en": "¥1,000",
                    "zh": "¥1,000"
                },
                "specs": {
                    "jp": "総集編",
                    "en": "Omnibus edition",
                    "zh": "總集編"
                },
                "desc": {
                    "jp": "Overlay Magic シリーズ総集編。",
                    "en": "Overlay Magic series omnibus.",
                    "zh": "Overlay Magic 系列總集編。"
                },
                "gallery": [
                    "./blog/20251224/products/book-om-omnibus/01.jpg",
                    "./blog/20251224/products/book-om-omnibus/02.jpg",
                    "./blog/20251224/products/book-om-omnibus/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-om-omnibus/page-01.jpg",
                    "./blog/20251224/products/book-om-omnibus/page-02.jpg",
                    "./blog/20251224/products/book-om-omnibus/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-om-omnibus/01.jpg",
                "cta": null
            }
        }
    },
    "acghk2026": {
        "id": "acghk2026",
        "title": {
            "jp": "ACGHK2026 お品書き",
            "en": "ACGHK2026 Product Menu",
            "zh": "ACGHK2026 販售物情報"
        },
        "meta": {
            "event": "ACGHK 2026",
            "booth": {
                "jp": "（ブース情報を更新）",
                "en": "(Update booth info)",
                "zh": "（請更新攤位資訊）"
            },
            "dates": "2026"
        },
        "defaultCta": {
            "label": {
                "jp": "BOOTHで購入",
                "en": "Buy on BOOTH",
                "zh": "前往 BOOTH 購買"
            },
            "url": "https://staryume.booth.pm",
            "external": true
        },
        "menuImages": [
            {
                "id": "page1",
                "src": "./blog/20251224/c107pricelist01.jpg",
                "label": {
                    "jp": "新作",
                    "en": "New Releases",
                    "zh": "新作"
                },
                "hotspots": [
                    {
                        "productId": "winter-set",
                        "coords": [
                            2,
                            12.6,
                            95.4,
                            42.1
                        ]
                    },
                    {
                        "productId": "sleeve-cue",
                        "coords": [
                            1.9,
                            55.8,
                            23.5,
                            20.9
                        ]
                    },
                    {
                        "productId": "sleeve-furi",
                        "coords": [
                            25.4,
                            55.8,
                            23.4,
                            20.9
                        ]
                    },
                    {
                        "productId": "mat-annna",
                        "coords": [
                            50.6,
                            55.8,
                            46.9,
                            20.9
                        ]
                    },
                    {
                        "productId": "sleeve-lunamaria",
                        "coords": [
                            1.9,
                            77.8,
                            23.5,
                            21
                        ]
                    },
                    {
                        "productId": "sleeve-dreizehn",
                        "coords": [
                            25.4,
                            77.8,
                            23.4,
                            21
                        ]
                    },
                    {
                        "productId": "book-too-many-seichi",
                        "coords": [
                            50.6,
                            77.8,
                            46.9,
                            21
                        ]
                    }
                ]
            },
            {
                "id": "page2",
                "src": "./blog/20251224/c107pricelist02.jpg",
                "label": {
                    "jp": "既存",
                    "en": "Catalog",
                    "zh": "既存"
                },
                "hotspots": [
                    {
                        "productId": "set-c106-makein",
                        "coords": [
                            2,
                            1.5,
                            46.9,
                            48
                        ]
                    },
                    {
                        "productId": "set-c106-yugioh",
                        "coords": [
                            51.5,
                            1.5,
                            47.1,
                            48
                        ]
                    },
                    {
                        "productId": "sleeve-legacy-mini",
                        "coords": [
                            2,
                            50.6,
                            46.9,
                            30.2
                        ]
                    },
                    {
                        "productId": "mat-dark-magician-girl",
                        "coords": [
                            50.7,
                            50.6,
                            46.9,
                            15
                        ]
                    },
                    {
                        "productId": "goods-makein-akkey",
                        "coords": [
                            50.7,
                            66.5,
                            46.9,
                            14.3
                        ]
                    },
                    {
                        "productId": "book-om6",
                        "coords": [
                            2,
                            82.4,
                            30.8,
                            17
                        ]
                    },
                    {
                        "productId": "book-omc3",
                        "coords": [
                            34.3,
                            82.4,
                            30.8,
                            17
                        ]
                    },
                    {
                        "productId": "book-om-omnibus",
                        "coords": [
                            66.8,
                            82.4,
                            30.8,
                            17
                        ]
                    }
                ]
            }
        ],
        "productOrder": [
            "winter-set",
            "sleeve-cue",
            "sleeve-furi",
            "mat-annna",
            "sleeve-lunamaria",
            "sleeve-dreizehn",
            "book-too-many-seichi",
            "set-c106-makein",
            "set-c106-yugioh",
            "sleeve-legacy-mini",
            "mat-dark-magician-girl",
            "goods-makein-akkey",
            "book-om6",
            "book-omc3",
            "book-om-omnibus"
        ],
        "products": {
            "winter-set": {
                "id": "winter-set",
                "category": "set",
                "isNew": true,
                "title": {
                    "jp": "冬コミセット",
                    "en": "Winter Comiket Set",
                    "zh": "冬コミ套組"
                },
                "price": {
                    "jp": "¥1,500",
                    "en": "¥1,500",
                    "zh": "¥1,500"
                },
                "specs": {
                    "jp": "①新刊 ②フラットケース ③折り本 ④ポストカード2枚",
                    "en": "① New book ② Flat case ③ Booklet ④ 2 postcards",
                    "zh": "①新刊 ②扁平收納袋 ③折本 ④明信片2枚"
                },
                "desc": {
                    "jp": "C107新作セット。<br>① 新刊 - マケイン聖地巡礼イラスト本（B5 20P フルカラー）<br>② ブラマジガールフラットケース（A4サイズ）<br>③ 閃刀姫レイ準備号 折り本<br>④ ポストカード2枚",
                    "en": "C107 new release set.<br>① New artbook - Makeine pilgrimage (B5, 20P full color)<br>② Dark Magician Girl flat case (A4)<br>③ Sky Striker Ray prep booklet<br>④ 2 postcards",
                    "zh": "C107 新作套組。<br>① 新刊 - 敗北女角聖地巡禮插圖本（B5 20P 全彩）<br>② 黑魔導女孩扁平收納袋（A4）<br>③ 閃刀姫零衣準備號折本<br>④ 明信片2枚"
                },
                "gallery": [
                    "./blog/20251224/products/winter-set/01.jpg",
                    "./blog/20251224/products/winter-set/02.jpg",
                    "./blog/20251224/products/winter-set/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/winter-set/01.jpg",
                "cta": null
            },
            "sleeve-cue": {
                "id": "sleeve-cue",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ キラーチューン・キュー",
                    "en": "Sleeves - Killer Tune Cue",
                    "zh": "卡套 - 殺手旋律 綺悠"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ（63×90mm）／60枚入／日本製",
                    "en": "Mini size (63×90mm) / 60 pcs / Made in Japan",
                    "zh": "迷你尺寸（63×90mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。遊戯王ミニサイズ対応。",
                    "en": "New card sleeves. Yu-Gi-Oh! mini size.",
                    "zh": "新作卡套。對應遊戲王迷你尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030655488.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030655488.jpg",
                "cta": null
            },
            "sleeve-furi": {
                "id": "sleeve-furi",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ 珠の御巫フゥリ",
                    "en": "Sleeves - Shinobirds Furi",
                    "zh": "卡套 - 珠之御巫狐里"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ（63×90mm）／60枚入／日本製",
                    "en": "Mini size (63×90mm) / 60 pcs / Made in Japan",
                    "zh": "迷你尺寸（63×90mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。遊戯王ミニサイズ対応。",
                    "en": "New card sleeves. Yu-Gi-Oh! mini size.",
                    "zh": "新作卡套。對應遊戲王迷你尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030654315.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030654315.jpg",
                "cta": null
            },
            "mat-annna": {
                "id": "mat-annna",
                "category": "mat",
                "isNew": true,
                "title": {
                    "jp": "プレイマット 八奈見杏菜",
                    "en": "Playmat - Anna Yanami",
                    "zh": "牌墊 - 八奈見杏菜"
                },
                "price": {
                    "jp": "¥3,000",
                    "en": "¥3,000",
                    "zh": "¥3,000"
                },
                "specs": {
                    "jp": "新作プレイマット",
                    "en": "New playmat",
                    "zh": "新作牌墊"
                },
                "desc": {
                    "jp": "C107新作プレイマット。八奈見杏菜イラスト。",
                    "en": "C107 new playmat featuring Anna Yanami.",
                    "zh": "C107 新作牌墊，八奈見杏菜插圖。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist01.jpg",
                "cta": null
            },
            "sleeve-lunamaria": {
                "id": "sleeve-lunamaria",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ルナマリア",
                    "en": "Sleeves - Lunamaria",
                    "zh": "卡套 - 露娜瑪莉亞"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "スタンダードサイズ（66×92mm）／60枚入／日本製",
                    "en": "Standard size (66×92mm) / 60 pcs / Made in Japan",
                    "zh": "標準尺寸（66×92mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。MTG / PTCG 標準サイズ対応。",
                    "en": "New card sleeves. MTG / PTCG standard size.",
                    "zh": "新作卡套。對應 MTG / PTCG 標準尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030652984.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030652984.jpg",
                "cta": null
            },
            "sleeve-dreizehn": {
                "id": "sleeve-dreizehn",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ドライツェン",
                    "en": "Sleeves - Dreizehn",
                    "zh": "卡套 - 黛芮采"
                },
                "price": {
                    "jp": "¥1,200",
                    "en": "¥1,200",
                    "zh": "¥1,200"
                },
                "specs": {
                    "jp": "スタンダードサイズ（66×92mm）／60枚入／日本製",
                    "en": "Standard size (66×92mm) / 60 pcs / Made in Japan",
                    "zh": "標準尺寸（66×92mm）／60枚／日本製"
                },
                "desc": {
                    "jp": "新作カードスリーブ。MTG / PTCG 標準サイズ対応。",
                    "en": "New card sleeves. MTG / PTCG standard size.",
                    "zh": "新作卡套。對應 MTG / PTCG 標準尺寸。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030650952.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2602091030650952.jpg",
                "cta": null
            },
            "book-too-many-seichi": {
                "id": "book-too-many-seichi",
                "category": "book",
                "isNew": true,
                "title": {
                    "jp": "新刊 TOO MANY SEICHI!",
                    "en": "New Book: TOO MANY SEICHI!",
                    "zh": "新刊 TOO MANY SEICHI!"
                },
                "price": {
                    "jp": "¥700",
                    "en": "¥700",
                    "zh": "¥700"
                },
                "specs": {
                    "jp": "単品販売／フルカラーイラスト本",
                    "en": "Sold separately / Full-color artbook",
                    "zh": "單品販售／全彩插圖本"
                },
                "desc": {
                    "jp": "C107新刊。マケイン関連フルカラーイラスト本。セットにも含まれます。",
                    "en": "C107 new release. Makeine full-color artbook. Also included in the set.",
                    "zh": "C107 新刊。敗北女角相關全彩插圖本。套組亦有收錄。"
                },
                "gallery": [
                    "./blog/20251224/products/book-too-many-seichi/01.jpg",
                    "./blog/20251224/products/book-too-many-seichi/02.jpg",
                    "./blog/20251224/products/book-too-many-seichi/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-too-many-seichi/page-01.jpg",
                    "./blog/20251224/products/book-too-many-seichi/page-02.jpg",
                    "./blog/20251224/products/book-too-many-seichi/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-too-many-seichi/01.jpg",
                "cta": null
            },
            "set-c106-makein": {
                "id": "set-c106-makein",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "C106マケインセット",
                    "en": "C106 Makeine Set",
                    "zh": "C106 敗北女角套組"
                },
                "price": {
                    "jp": "¥2,000",
                    "en": "¥2,000",
                    "zh": "¥2,000"
                },
                "specs": {
                    "jp": "既刊セット／アクリルスタンド等含む",
                    "en": "Catalog set / includes acrylic stand etc.",
                    "zh": "既存套組／含壓克力立牌等"
                },
                "desc": {
                    "jp": "C106 マケイン関連セット商品。",
                    "en": "C106 Makeine-related set.",
                    "zh": "C106 敗北女角相關套組商品。"
                },
                "gallery": [
                    "./blog/20251224/products/set-c106-makein/01.jpg",
                    "./blog/20251224/products/set-c106-makein/02.jpg",
                    "./blog/20251224/products/set-c106-makein/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/set-c106-makein/01.jpg",
                "cta": null
            },
            "set-c106-yugioh": {
                "id": "set-c106-yugioh",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "C106遊戯王セット",
                    "en": "C106 Yu-Gi-Oh! Set",
                    "zh": "C106 遊戲王套組"
                },
                "price": {
                    "jp": "¥2,000",
                    "en": "¥2,000",
                    "zh": "¥2,000"
                },
                "specs": {
                    "jp": "既刊セット／特典カード等含む",
                    "en": "Catalog set / includes bonus cards etc.",
                    "zh": "既存套組／含特典卡等"
                },
                "desc": {
                    "jp": "C106 遊戯王関連セット商品。",
                    "en": "C106 Yu-Gi-Oh! related set.",
                    "zh": "C106 遊戲王相關套組商品。"
                },
                "gallery": [
                    "./blog/20251224/products/set-c106-yugioh/01.jpg",
                    "./blog/20251224/products/set-c106-yugioh/02.jpg",
                    "./blog/20251224/products/set-c106-yugioh/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/products/set-c106-yugioh/01.jpg",
                "cta": null
            },
            "sleeve-legacy-mini": {
                "id": "sleeve-legacy-mini",
                "category": "sleeve",
                "isNew": false,
                "title": {
                    "jp": "既存スリーブ（ミニ）各種",
                    "en": "Legacy Mini Sleeves (Various)",
                    "zh": "既存卡套（迷你）各種"
                },
                "price": {
                    "jp": "各 ¥1,200",
                    "en": "¥1,200 each",
                    "zh": "各 ¥1,200"
                },
                "specs": {
                    "jp": "ミニサイズ／60枚入／6種ラインナップ",
                    "en": "Mini size / 60 pcs / 6 designs",
                    "zh": "迷你尺寸／60枚／6款可選"
                },
                "desc": {
                    "jp": "既刊キャラクターのミニサイズスリーブ。各種ラインナップをご用意しています。",
                    "en": "Legacy character mini sleeves. Multiple designs available.",
                    "zh": "既存角色迷你尺寸卡套，多款可選。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist02.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist02.jpg",
                "cta": null
            },
            "mat-dark-magician-girl": {
                "id": "mat-dark-magician-girl",
                "category": "mat",
                "isNew": false,
                "title": {
                    "jp": "ブラマジガールプレイマット",
                    "en": "Dark Magician Girl Playmat",
                    "zh": "黑魔導女孩 牌墊"
                },
                "price": {
                    "jp": "¥3,000",
                    "en": "¥3,000",
                    "zh": "¥3,000"
                },
                "specs": {
                    "jp": "既存プレイマット",
                    "en": "Catalog playmat",
                    "zh": "既存牌墊"
                },
                "desc": {
                    "jp": "ブラック・マジシャン・ガール プレイマット。",
                    "en": "Dark Magician Girl playmat.",
                    "zh": "黑魔導女孩牌墊。"
                },
                "gallery": [
                    "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg"
                ],
                "pages": [],
                "thumb": "https://myship.7-11.com.tw/i/cgdm/GM2403022207590/2508240784869452.jpg",
                "cta": null
            },
            "goods-makein-akkey": {
                "id": "goods-makein-akkey",
                "category": "goods",
                "isNew": false,
                "title": {
                    "jp": "マケインアクキーホルダーセット",
                    "en": "Makeine Acrylic Keychain Set",
                    "zh": "敗北女角 壓克力吊飾套組"
                },
                "price": {
                    "jp": "¥1,000",
                    "en": "¥1,000",
                    "zh": "¥1,000"
                },
                "specs": {
                    "jp": "オマケポストカード付き",
                    "en": "Includes bonus postcard",
                    "zh": "附特典明信片"
                },
                "desc": {
                    "jp": "マケイン関連アクリルキーホルダーセット。オマケポストカード付き。",
                    "en": "Makeine acrylic keychain set with bonus postcard.",
                    "zh": "敗北女角壓克力吊飾套組，附特典明信片。"
                },
                "gallery": [
                    "./blog/20251224/c107pricelist02.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20251224/c107pricelist02.jpg",
                "cta": null
            },
            "book-om6": {
                "id": "book-om6",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic 6",
                    "en": "Overlay Magic 6",
                    "zh": "既刊 Overlay Magic 6"
                },
                "price": {
                    "jp": "¥500",
                    "en": "¥500",
                    "zh": "¥500"
                },
                "specs": {
                    "jp": "既刊イラスト本",
                    "en": "Catalog artbook",
                    "zh": "既刊插圖本"
                },
                "desc": {
                    "jp": "Overlay Magic シリーズ既刊。",
                    "en": "Overlay Magic series catalog book.",
                    "zh": "Overlay Magic 系列既刊。"
                },
                "gallery": [
                    "./blog/20251224/products/book-om6/01.jpg",
                    "./blog/20251224/products/book-om6/02.jpg",
                    "./blog/20251224/products/book-om6/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-om6/page-01.jpg",
                    "./blog/20251224/products/book-om6/page-02.jpg",
                    "./blog/20251224/products/book-om6/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-om6/01.jpg",
                "cta": null
            },
            "book-omc3": {
                "id": "book-omc3",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic Color 3",
                    "en": "Overlay Magic Color 3",
                    "zh": "既刊 Overlay Magic Color 3"
                },
                "price": {
                    "jp": "¥500",
                    "en": "¥500",
                    "zh": "¥500"
                },
                "specs": {
                    "jp": "B5・20P・フルカラー",
                    "en": "B5, 20P, full color",
                    "zh": "B5・20P・全彩"
                },
                "desc": {
                    "jp": "Overlay Magic Color シリーズ既刊。",
                    "en": "Overlay Magic Color series catalog book.",
                    "zh": "Overlay Magic Color 系列既刊。"
                },
                "gallery": [
                    "./blog/20251224/products/book-omc3/01.jpg",
                    "./blog/20251224/products/book-omc3/02.jpg",
                    "./blog/20251224/products/book-omc3/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-omc3/page-01.jpg",
                    "./blog/20251224/products/book-omc3/page-02.jpg",
                    "./blog/20251224/products/book-omc3/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-omc3/01.jpg",
                "cta": null
            },
            "book-om-omnibus": {
                "id": "book-om-omnibus",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic 総集編",
                    "en": "Overlay Magic Omnibus",
                    "zh": "既刊 Overlay Magic 總集編"
                },
                "price": {
                    "jp": "¥1,000",
                    "en": "¥1,000",
                    "zh": "¥1,000"
                },
                "specs": {
                    "jp": "総集編",
                    "en": "Omnibus edition",
                    "zh": "總集編"
                },
                "desc": {
                    "jp": "Overlay Magic シリーズ総集編。",
                    "en": "Overlay Magic series omnibus.",
                    "zh": "Overlay Magic 系列總集編。"
                },
                "gallery": [
                    "./blog/20251224/products/book-om-omnibus/01.jpg",
                    "./blog/20251224/products/book-om-omnibus/02.jpg",
                    "./blog/20251224/products/book-om-omnibus/03.jpg"
                ],
                "pages": [
                    "./blog/20251224/products/book-om-omnibus/page-01.jpg",
                    "./blog/20251224/products/book-om-omnibus/page-02.jpg",
                    "./blog/20251224/products/book-om-omnibus/page-03.jpg"
                ],
                "thumb": "./blog/20251224/products/book-om-omnibus/01.jpg",
                "cta": null
            }
        }
    }
};
