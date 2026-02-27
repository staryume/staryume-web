// GLOBAL SITE DATA
const siteData = {
    // 1. BLOG POSTS
    posts: [
        { 
            id: 1, 
            tag: "NEWS", 
            date: "2025/12/24", 
            img: "./blog/20251224/20251224thumb.jpg", 
            title: { 
                jp: "C107お品書き", 
                en: "C107 Product Details", 
                zh: "C107 販售物情報" 
            }, 
            content: { 
                jp: `
## C107のお品書き

お久しぶりです!C107のお品書きを公開いたします。
<br>
イベント当日お待ちしております!
<br>
![Image 01](./blog/20251224/c107pricelist01.jpg)
![Image 02](./blog/20251224/c107pricelist02.jpg)
                `, 
                en: `
## C107 Product Info

Sorry for the wait! Here comes the C107 products info。
<br>
See you at Comic Market 107!
<br>
![Image 01](./blog/20251224/c107pricelist01.jpg)
![Image 02](./blog/20251224/c107pricelist02.jpg)
                `, 
                zh: `
## C107 販售物情報

讓大家久等了! 現在終於可以公布 C107 的販售物情報。
<br>
期待 C107 活動當天見面!
<br>
![Image 01](./blog/20251224/c107pricelist01.jpg)
![Image 02](./blog/20251224/c107pricelist02.jpg)
                ` 
            } 
        },
        { 
            id: 2, 
            tag: "NOTICE", 
            date: "2026/01/02", 
            img: "./blog/20260102/20260102thumb.jpg", 
            title: { 
                jp: "C107通販開始!",                      
                en: "C107 Products Online Purchase available!",                
                zh: null             
            }, 
            content: { 
                jp: `
## C107 販售物情報

お待たせいたしました！
C107 BOOTHにて通販を開始しました。

冬コミセット、新作カードスリーブ、抱き枕カバーなどを取り扱っております。
各商品で納期が異なる場合がございますので、まとめてご購入の際はご確認ください！

👉https://staryume.booth.pm
`, 
                en: `
## C107 Products Online Purchase available!

Here is the link！

👉https://staryume.booth.pm
`, 
                zh: null
            }
        },
        { 
            id: 3, 
            tag: "NEWS", 
            date: "2025/12/24", 
            img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600", 
            title: { 
                jp: null, 
                en: null, 
                zh: null 
            }, 
            content: {
                jp: null,
                en: null,
                zh: "詳情..." 
            } 
        },
        { 
            id: 4, 
            tag: "DIARY", 
            date: "2026/02/17", 
            img: "./blog/20260217/20260217thumb.jpg", 
            title: { 
                // FIXED: Added quotes around these strings
                jp: null,
                en: null, 
                zh: "馬年快樂!"
            }, 
            content: {
                jp: null,
                en: null,
                zh: `
## 馬年快樂!

新年快樂!2026馬年祝大家身體健康，龍馬精神!
<br>
馬年就當然是要畫馬娘，畫了我最喜歡的小鑽~
<br>
![Image 01](./blog/20260217/20260217satonoSNS.jpg)
<br>
然後就一個香港人限定的東西：<br>
第一次試試看用 Payme 向各位朋友派一下開運利是
<br>
希望大家今年都能夠橫財就手!!!
![Image 02](./blog/20260217/payme01.jpg)
<br>
假如想支持我今年有更多創作的話，也歡迎新年給利是我給我更多動力，收得到越多的話今年定當會更努力為大家畫多一些作品!!! :
<br> (以下是 Payme 的「逗利是」用助養連結 w) 
![Image 03](./blog/20260217/payme02.jpg)
                ` 
            } 
        }
    ],

    // 2. GALLERY IMAGES
    gallery: [
        { id: 1, tag: "FANART", src: "./assets/gallery/g20250705.jpg" },
        { id: 2, tag: "FANART", src: "./assets/gallery/g20241212.jpg" },
        { id: 3, tag: "FANART", src: "./assets/gallery/g20240611.jpg" },
        { id: 4, tag: "FANART", src: "./assets/gallery/g20240219.jpg" },
        { id: 5, tag: "FANART", src: "./assets/gallery/g20240119.jpg" },
        { id: 6, tag: "FANART", src: "./assets/gallery/g20230323.jpg" },
        { id: 7, tag: "FANART", src: "./assets/gallery/g20221212.jpg" },
        { id: 8, tag: "FANART", src: "./assets/gallery/g20220623.jpg" },
        { id: 9, tag: "FANART", src: "./assets/gallery/g20190708.jpg" }
    ],

    // 3. UI TRANSLATIONS
    translations: {
        jp: { hero_sub: "漫画家・イラストレーター", status_text: "東京 - COMIC1☆28 申込完了", profile_desc: "星遥ゆめ<br><br>漫画家・イラストレーター。<br>同人サークル「星夢亭」主催。" },
        en: { hero_sub: "MANGAKA / ILLUSTRATOR", status_text: "Tokyo - COMIC1☆28 Enrolled", profile_desc: "staryume<br><br>Mangaka & Illustrator. <br> Opreating Doujin Circle 'Hoshiyumetei'." },
        zh: { hero_sub: "漫畫家 / 插畫家", status_text: "東京 - COMIC1☆28 已報名", profile_desc: "星遙<br><br>漫畫家・插畫家. <br>同人社團「星夢亭」的幕後打雜。" }
    }
};