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
            "external": true,
            "boothUrl": "https://staryume.booth.pm",
            "storeUrl": "store.html",
            "storeRegion": "TW"
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
                    "./blog/20260719/products/sleeve-legacy/04.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-legacy/04.jpg",
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
                    "./blog/20260719/products/sleeve-legacy/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-legacy/03.jpg",
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
                    "./blog/20260719/products/sleeve-legacy/05.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-legacy/05.jpg",
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
                    "./blog/20260719/products/sleeve-legacy/06.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-legacy/06.jpg",
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
                    "./blog/20260719/products/mat-dmg-2026/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/mat-dmg-2026/01.jpg",
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
            "jp": "C108 お品書き",
            "en": "Comic Market 108 Merchs",
            "zh": "ACGHK2026 販售物情報"
        },
        "meta": {
            "event": "CREATIVE PARADISE ACGHK 2026",
            "booth": {
                "jp": "CA-30",
                "en": "CA-30",
                "zh": "CA-30"
            },
            "dates": "2026"
        },
        "defaultCta": {
            "label": {
                "jp": "BOOTHで購入",
                "en": "Buy on BOOTH",
                "zh": "前往網店預購"
            },
            "url": "https://staryume.booth.pm",
            "external": true,
            "boothUrl": "https://staryume.booth.pm",
            "storeUrl": "store.html",
            "storeRegion": "HK"
        },
        "menuImages": [
            {
                "id": "page1",
                "src": "./blog/20260719/acghk2026pricelist1.jpg",
                "label": {
                    "jp": "新作",
                    "en": "New Releases",
                    "zh": "新作"
                },
                "hotspots": [
                    {
                        "productId": "anni-15-set",
                        "coords": [
                            1.9,
                            12.6,
                            95.6,
                            42.1
                        ]
                    },
                    {
                        "productId": "sleeve-gagaga",
                        "coords": [
                            1.9,
                            55.8,
                            23.5,
                            20.9
                        ]
                    },
                    {
                        "productId": "sleeve-dmg-2026",
                        "coords": [
                            25.4,
                            55.8,
                            23.5,
                            20.9
                        ]
                    },
                    {
                        "productId": "mat-dmg-2026",
                        "coords": [
                            50.7,
                            55.8,
                            46.9,
                            20.9
                        ]
                    },
                    {
                        "productId": "goods-deckbox",
                        "coords": [
                            1.9,
                            77.8,
                            47,
                            20.9
                        ]
                    },
                    {
                        "productId": "goods-cardbox",
                        "coords": [
                            50.7,
                            77.8,
                            46.9,
                            20.9
                        ]
                    }
                ]
            },
            {
                "id": "page2",
                "src": "./blog/20260719/acghk2026pricelist2.jpg",
                "label": {
                    "jp": "既存商品",
                    "en": "Catalog",
                    "zh": "既有商品"
                },
                "hotspots": [
                    {
                        "productId": "set-makeine",
                        "coords": [
                            1.9,
                            12.5,
                            47,
                            37
                        ]
                    },
                    {
                        "productId": "set-yugioh-2025",
                        "coords": [
                            51.7,
                            2,
                            46.9,
                            47.5
                        ]
                    },
                    {
                        "productId": "goods-akkey",
                        "coords": [
                            1.9,
                            50.6,
                            47,
                            14.5
                        ]
                    },
                    {
                        "productId": "mat-legacy",
                        "coords": [
                            1.9,
                            66,
                            47,
                            14.5
                        ]
                    },
                    {
                        "productId": "sleeve-legacy",
                        "coords": [
                            50.7,
                            50.6,
                            46.9,
                            30.2
                        ]
                    },
                    {
                        "productId": "book-too-many-seichi",
                        "coords": [
                            2.2,
                            82.2,
                            30.8,
                            17.2
                        ]
                    },
                    {
                        "productId": "book-omc3",
                        "coords": [
                            34.7,
                            82.2,
                            30.8,
                            17.2
                        ]
                    },
                    {
                        "productId": "book-om-gala",
                        "coords": [
                            66.8,
                            82.2,
                            30.8,
                            17.2
                        ]
                    }
                ]
            }
        ],
        "productOrder": [
            "anni-15-set",
            "sleeve-gagaga",
            "sleeve-dmg-2026",
            "mat-dmg-2026",
            "goods-deckbox",
            "goods-cardbox",
            "set-makeine",
            "set-yugioh-2025",
            "goods-akkey",
            "mat-legacy",
            "sleeve-legacy",
            "book-too-many-seichi",
            "book-omc3",
            "book-om-gala"
        ],
        "products": {
            "anni-15-set": {
                "id": "anni-15-set",
                "category": "set",
                "isNew": true,
                "title": {
                    "jp": "星夢亭15周年記念SET",
                    "en": "Hoshiyumetei 15th Anniversary SET",
                    "zh": "星夢亭15週年紀念SET"
                },
                "price": {
                    "jp": "$240",
                    "en": "$240",
                    "zh": "$240"
                },
                "specs": {
                    "jp": null,
                    "en": null,
                    "zh": null
                },
                "desc": {
                    "jp": "星夢亭15周年記念セット。<br>① 新刊 Overlay Magic Color 4（B5 20P 全彩 / 封面燙金）<br>② 半透明磨砂手提袋（30×40×10 cm）<br>③ 大型儲物盒（21×33×8 cm）<br>④ 亞加力場地中心卡<br>⑤ 自製卡×2 + 收藏磨砂卡磚×2 + 收藏禮盒<br>⑥ 遊戲「Warp Machina」初回資料設定小冊子",
                    "en": "15th anniversary set.<br>① New book Overlay Magic Color 4 (B5 20P full color / foil cover)<br>② Frosted tote bag (30×40×10 cm)<br>③ Large storage box (21×33×8 cm)<br>④ Acrylic field center card<br>⑤ Custom cards ×2 + cases ×2 + gift box<br>⑥ Warp Machina setting booklet",
                    "zh": "星夢亭15週年紀念套組。<br>① 新刊 - Overlay Magic Color 4（B5 20P 全彩 / 封面燙金）<br>② 半透明磨砂手提袋（30×40×10 cm）<br>③ 大型儲物盒（21×33×8 cm）<br>④ 亞加力場地中心卡<br>⑤ 自製卡×2 + 收藏磨砂卡磚×2 + 收藏禮盒<br>⑥ 遊戲「Warp Machina」初回資料設定小冊子<br>（自製卡有不同稀有度：UR / PSE / GMR）"
                },
                "gallery": [
                    "./blog/20260719/products/anni-15-set/01.jpg",
                    "./blog/20260719/products/anni-15-set/02.jpg",
                    "./blog/20260719/products/anni-15-set/03.jpg",
                    "./blog/20260719/products/anni-15-set/04.jpg",
                    "./blog/20260719/products/anni-15-set/05.jpg",
                    "./blog/20260719/products/anni-15-set/06.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/anni-15-set/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "sleeve-gagaga": {
                "id": "sleeve-gagaga",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ガガガガール",
                    "en": "Sleeves - Gagaga Girl",
                    "zh": "新作卡套 我我我女孩"
                },
                "price": {
                    "jp": "$80",
                    "en": "$80",
                    "zh": "$80"
                },
                "specs": {
                    "jp": "遊戯王サイズ / 60枚 / 予約",
                    "en": "Yu-Gi-Oh! size / 60 pcs / pre-order",
                    "zh": null
                },
                "desc": {
                    "jp": "新作カードスリーブ。我我我女孩。",
                    "en": "New card sleeves featuring Gagaga Girl.",
                    "zh": "遊戲王尺寸、每包含60個／預購"
                },
                "gallery": [
                    "./blog/20260719/products/sleeve-gagaga/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-gagaga/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "sleeve-dmg-2026": {
                "id": "sleeve-dmg-2026",
                "category": "sleeve",
                "isNew": true,
                "title": {
                    "jp": "スリーブ ブラック・マジシャン・ガール (ver. 2026)",
                    "en": "Sleeves - Dark Magician Girl (ver. 2026)",
                    "zh": "新作卡套 黑魔導女孩 (ver. 2026)"
                },
                "price": {
                    "jp": "$80",
                    "en": "$80",
                    "zh": "$80"
                },
                "specs": {
                    "jp": "遊戯王サイズ / 60枚 / 予約",
                    "en": "Yu-Gi-Oh! size / 60 pcs / pre-order",
                    "zh": null
                },
                "desc": {
                    "jp": "新作カードスリーブ。ブラック・マジシャン・ガール ver. 2026。",
                    "en": "New card sleeves featuring Dark Magician Girl (ver. 2026).",
                    "zh": "遊戲王尺寸、每包含60個／預購"
                },
                "gallery": [
                    "./blog/20260719/products/sleeve-dmg-2026/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-dmg-2026/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "mat-dmg-2026": {
                "id": "mat-dmg-2026",
                "category": "mat",
                "isNew": true,
                "title": {
                    "jp": "プレイマット ブラック・マジシャン・ガール (ver. 2026)",
                    "en": "Playmat - Dark Magician Girl (ver. 2026)",
                    "zh": "新作遊戲墊 黑魔導女孩 (ver. 2026)"
                },
                "price": {
                    "jp": "$180",
                    "en": "$180",
                    "zh": "$180"
                },
                "specs": {
                    "jp": "新作プレイマット",
                    "en": "New playmat",
                    "zh": null
                },
                "desc": {
                    "jp": "新作プレイマット。ブラック・マジシャン・ガール ver. 2026。",
                    "en": "New playmat featuring Dark Magician Girl (ver. 2026).",
                    "zh": "新作遊戲墊 - 黑魔導女孩 (ver. 2026)。"
                },
                "gallery": [
                    "./blog/20260719/products/mat-dmg-2026/01.jpg",
                    "./blog/20260719/products/mat-dmg-2026/02.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/mat-dmg-2026/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "goods-deckbox": {
                "id": "goods-deckbox",
                "category": "goods",
                "isNew": false,
                "title": {
                    "jp": "レザーデッキケース",
                    "en": "Leather Card Deck Box",
                    "zh": "皮質卡片收納盒"
                },
                "price": {
                    "jp": "$220",
                    "en": "$220",
                    "zh": "$220"
                },
                "specs": {
                    "jp": "レザーデッキケース",
                    "en": "Leather deck box",
                    "zh": "皮質卡片收納盒"
                },
                "desc": {
                    "jp": "レザー素材のデッキケース／カード収納箱。",
                    "en": "Leather-style card deck box.",
                    "zh": "皮質卡片收納盒。"
                },
                "gallery": [
                    "./blog/20260719/products/goods-deckbox/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/goods-deckbox/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "set-makeine": {
                "id": "set-makeine",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "負けヒロインが多すぎる！SET",
                    "en": "Too Many Losing Heroines! SET",
                    "zh": "敗北女角太多了!SET"
                },
                "price": {
                    "jp": "$150",
                    "en": "$150",
                    "zh": "$150"
                },
                "specs": {
                    "jp": "既存セット",
                    "en": "Catalog set",
                    "zh": null
                },
                "desc": {
                    "jp": "敗北ヒロイン関連セット商品。",
                    "en": "Makeine-related catalog set.",
                    "zh": "敗北女角相關既有套組商品。"
                },
                "gallery": [
                    "./blog/20260719/products/set-makeine/01.jpg",
                    "./blog/20260719/products/set-makeine/02.jpg",
                    "./blog/20260719/products/set-makeine/03.jpg",
                    "./blog/20260719/products/set-makeine/04.jpg",
                    "./blog/20260719/products/set-makeine/05.jpg",
                    "./blog/20260719/products/set-makeine/06.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/set-makeine/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "set-yugioh-2025": {
                "id": "set-yugioh-2025",
                "category": "set",
                "isNew": false,
                "title": {
                    "jp": "2025遊戯王 SET",
                    "en": "2025 Yu-Gi-Oh! SET",
                    "zh": "2025遊戲王 SET"
                },
                "price": {
                    "jp": "$100",
                    "en": "$100",
                    "zh": "$100"
                },
                "specs": {
                    "jp": "既存セット",
                    "en": "Catalog set",
                    "zh": null
                },
                "desc": {
                    "jp": "2025 遊戯王関連セット商品。",
                    "en": "2025 Yu-Gi-Oh! related catalog set.",
                    "zh": "2025 遊戲王相關既有套組商品。"
                },
                "gallery": [
                    "./blog/20260719/products/set-yugioh-2025/01.jpg",
                    "./blog/20260719/products/set-yugioh-2025/02.jpg",
                    "./blog/20260719/products/set-yugioh-2025/03.jpg",
                    "./blog/20260719/products/set-yugioh-2025/04.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/set-yugioh-2025/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "sleeve-legacy": {
                "id": "sleeve-legacy",
                "category": "sleeve",
                "isNew": false,
                "title": {
                    "jp": "既存スリーブ（各種）",
                    "en": "Legacy Sleeves (Various)",
                    "zh": "既存卡套（各種）"
                },
                "price": {
                    "jp": "各 $80",
                    "en": "$80 each",
                    "zh": "各 $80"
                },
                "specs": {
                    "jp": "6種ラインナップ／各 $80",
                    "en": "6 designs / $80 each",
                    "zh": "6款可選／各 $80"
                },
                "desc": {
                    "jp": "既存キャラクタースリーブ。各種ラインナップ。モーダル内のギャラリーで各柄を確認できます。",
                    "en": "Legacy character sleeves. Multiple designs — swipe the gallery to preview each design.",
                    "zh": "既存角色卡套，多款可選。"
                },
                "gallery": [
                    "./blog/20260719/products/sleeve-legacy/01.jpg",
                    "./blog/20260719/products/sleeve-legacy/02.jpg",
                    "./blog/20260719/products/sleeve-legacy/03.jpg",
                    "./blog/20260719/products/sleeve-legacy/04.jpg",
                    "./blog/20260719/products/sleeve-legacy/05.jpg",
                    "./blog/20260719/products/sleeve-legacy/06.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/sleeve-legacy/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "goods-akkey": {
                "id": "goods-akkey",
                "category": "goods",
                "isNew": false,
                "title": {
                    "jp": "アクキー 天愛星 + 八奈見杏菜",
                    "en": "Acrylic Keychains - Tenaisei + Yanami",
                    "zh": "敗北女角!天愛星+八奈見亞 加力匙扣"
                },
                "price": {
                    "jp": "$50",
                    "en": "$50",
                    "zh": "$50"
                },
                "specs": {
                    "jp": "アクリルキーホルダー",
                    "en": "Acrylic keychains",
                    "zh": null
                },
                "desc": {
                    "jp": "敗北ヒロイン関連アクリルキーホルダー。",
                    "en": "Makeine acrylic keychain set.",
                    "zh": "敗北女角太多了! \n天愛星 + 八奈見亞 亞加力匙扣。"
                },
                "gallery": [
                    "./blog/20260719/products/goods-akkey/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/goods-akkey/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "mat-legacy": {
                "id": "mat-legacy",
                "category": "mat",
                "isNew": false,
                "title": {
                    "jp": "既存プレイマット",
                    "en": "Legacy Playmat",
                    "zh": "既作遊戲墊"
                },
                "price": {
                    "jp": "$180",
                    "en": "$180",
                    "zh": "$180"
                },
                "specs": {
                    "jp": "既存プレイマット",
                    "en": "Catalog playmat",
                    "zh": "既作遊戲墊"
                },
                "desc": {
                    "jp": "既存プレイマット商品。",
                    "en": "Legacy playmat.",
                    "zh": "既作遊戲墊。"
                },
                "gallery": [
                    "./blog/20260719/products/mat-legacy/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/mat-legacy/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "goods-cardbox": {
                "id": "goods-cardbox",
                "category": "goods",
                "isNew": false,
                "title": {
                    "jp": "収納箱 Dream Card Box 2025",
                    "en": "Dream Card Box 2025",
                    "zh": "收納盒 Dream Card Box 2025"
                },
                "price": {
                    "jp": "$50",
                    "en": "$50",
                    "zh": "$50"
                },
                "specs": {
                    "jp": "カード収納ボックス",
                    "en": "Card storage box",
                    "zh": null
                },
                "desc": {
                    "jp": "Dream Card Box 2025 収納箱。",
                    "en": "Dream Card Box 2025 storage box.",
                    "zh": "Dream Card Box 2025 收納盒"
                },
                "gallery": [
                    "./blog/20260719/products/goods-cardbox/01.jpg",
                    "./blog/20260719/products/goods-cardbox/02.jpg",
                    "./blog/20260719/products/goods-cardbox/03.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/goods-cardbox/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "book-too-many-seichi": {
                "id": "book-too-many-seichi",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 TOO MANY SEICHI!",
                    "en": "TOO MANY SEICHI!",
                    "zh": "既刊 TOO MANY SEICHI!"
                },
                "price": {
                    "jp": "$70",
                    "en": "$70",
                    "zh": "$70"
                },
                "specs": {
                    "jp": "既刊イラスト本",
                    "en": "Catalog artbook",
                    "zh": null
                },
                "desc": {
                    "jp": "既刊 TOO MANY SEICHI! フルカラーイラスト本。",
                    "en": "Catalog full-color artbook TOO MANY SEICHI!",
                    "zh": "既刊 TOO MANY SEICHI! 插圖本\n20P / 全彩"
                },
                "gallery": [
                    "./blog/20260719/products/book-too-many-seichi/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/book-too-many-seichi/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
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
                    "jp": "$60",
                    "en": "$60",
                    "zh": "$60"
                },
                "specs": {
                    "jp": "既刊イラスト本",
                    "en": "Catalog artbook",
                    "zh": null
                },
                "desc": {
                    "jp": "Overlay Magic Color 3 既刊。",
                    "en": "Overlay Magic Color 3 catalog book.",
                    "zh": "既刊 Overlay Magic Color 3。\n全彩 / 16P"
                },
                "gallery": [
                    "./blog/20260719/products/book-omc3/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/book-omc3/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            },
            "book-om-gala": {
                "id": "book-om-gala",
                "category": "book",
                "isNew": false,
                "title": {
                    "jp": "既刊 Overlay Magic GALA",
                    "en": "Overlay Magic GALA",
                    "zh": "既刊 Overlay Magic GALA"
                },
                "price": {
                    "jp": "$60",
                    "en": "$60",
                    "zh": "$60"
                },
                "specs": {
                    "jp": "既刊イラスト本",
                    "en": "Catalog artbook",
                    "zh": null
                },
                "desc": {
                    "jp": "Overlay Magic GALA 既刊。",
                    "en": "Overlay Magic GALA catalog book.",
                    "zh": "既刊 Overlay Magic GALA。\n全彩 / 32P"
                },
                "gallery": [
                    "./blog/20260719/products/book-om-gala/01.jpg"
                ],
                "pages": [],
                "thumb": "./blog/20260719/products/book-om-gala/01.jpg",
                "cta": {
                    "enabled": false,
                    "urlOverride": null,
                    "label": null
                }
            }
        }
    }
};
