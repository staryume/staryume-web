# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static multi-language portfolio site for illustrator/mangaka **staryume**. No build tools — pure vanilla HTML, CSS (Tailwind via CDN), and JavaScript.

## Local Development

```bash
python -m http.server 8000
# or
npx http-server
```

No build step, no package manager, no lint or test commands.

## Architecture

All pages share a common pattern: they pull data from `data.js` (or `store.js` for the store), apply translations based on the selected language, and render content dynamically via vanilla JS.

### Key Files

| File | Role |
|------|------|
| `data.js` | Master data: blog posts array, gallery images array, UI string translations (JP/EN/ZH) |
| `store.js` | Store config: shop open/close status, product catalog, regional pricing |
| `index.html` | Homepage |
| `blog.html` | Blog listing with tag filtering |
| `post.html` | Single post viewer — renders markdown via Marked.js CDN |
| `gallery.html` | Portfolio gallery with lightbox |
| `store.html` | E-commerce page with regional pricing |

### Multi-Language System

Three languages: `jp` (Japanese), `en` (English), `zh` (Chinese Traditional). Language state is stored in `localStorage`. All translatable strings live in `data.js` under a translations object, keyed by language code. Pages read the active language on load and re-render on language switch.

### Blog Post Data Structure

```javascript
// in data.js
{
  id: 1,
  tag: "NEWS",          // NEWS | NOTICE | DIARY
  date: "2025/12/24",
  img: "./blog/YYYYMMDD/thumb.jpg",
  title: { jp: "...", en: "...", zh: "..." },
  content: { jp: "markdown...", en: "markdown...", zh: "markdown..." }
}
```

Blog post images live in `./blog/YYYYMMDD/`.

### Product Data Structure

```javascript
// in store.js
{
  id: 101,
  category: ['featured', 'set'],   // featured | set | book | sleeve | tcg | other
  regions: ['TW', 'HK'],
  isNew: true,
  isSoldOut: false,
  title: { en: "...", zh: "..." },  // no JP for store
  priceTW: 400,
  priceHK: 100,
  imgs: ["url1", "url2"],
  desc: { en: "...", zh: "..." },
  linkTW: "https://..."             // external retailer link (7-Eleven MyShip, etc.)
}
```

### Design System

Custom Tailwind color tokens used throughout:
- `tech-purple: #D8B4FE` — accent/primary
- `tech-gray: #f2f2f2` — background
- `tech-black: #0a0a0a` — text

Font stack: Inter (body), Rajdhani (display), Montserrat (nav), Noto Sans JP/TC (CJK fallback).

Layout: desktop sidebar navigation, mobile hamburger menu. Tailwind config is inlined in each HTML file's `<script>` block.

### Assets

- `assets/coreimg/` — logo, favicon, hero images, social icons
- `assets/gallery/` — portfolio images
