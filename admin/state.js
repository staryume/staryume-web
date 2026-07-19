// In-memory CMS state + normalization helpers
(function (global) {
  'use strict';

  const LANGS = ['jp', 'en', 'zh'];

  const state = {
    dirHandle: null,
    siteData: null,
    storeConfig: null,
    storeProducts: null,
    eventCatalog: null,
    eventUiStrings: null,
    dirty: false,
    section: 'blog', // blog | gallery | store | shop | events
  };

  function markDirty() {
    state.dirty = true;
    if (global.AdminUI) global.AdminUI.updateDirtyBadge();
  }

  function markClean() {
    state.dirty = false;
    if (global.AdminUI) global.AdminUI.updateDirtyBadge();
  }

  function emptyLangMap() {
    return { jp: null, en: null, zh: null };
  }

  function defaultLangsFromTitle(title) {
    const langs = {};
    for (const l of LANGS) {
      langs[l] = !!(title && title[l] && String(title[l]).trim());
    }
    // If nothing set, enable all (new content default)
    if (!langs.jp && !langs.en && !langs.zh) {
      return { jp: true, en: true, zh: true };
    }
    return langs;
  }

  function normalizePost(post) {
    const title = {
      jp: post.title?.jp ?? null,
      en: post.title?.en ?? null,
      zh: post.title?.zh ?? null,
    };
    const content = {
      jp: post.content?.jp ?? null,
      en: post.content?.en ?? null,
      zh: post.content?.zh ?? null,
    };
    let langs = defaultLangsFromTitle(title);
    if (post.langs && typeof post.langs === 'object') {
      for (const l of LANGS) {
        if (typeof post.langs[l] === 'boolean') langs[l] = post.langs[l];
      }
    }

    return {
      ...post,
      id: post.id,
      tag: post.tag || 'NEWS',
      date: post.date || '',
      img: post.img || null,
      eventId: post.eventId ?? null,
      langs,
      title,
      content,
    };
  }

  function normalizeGalleryItem(item) {
    return {
      id: item.id,
      tag: item.tag || 'FANART',
      src: item.src || '',
    };
  }

  function normalizeProduct(p) {
    const title = {
      jp: p.title?.jp ?? null,
      en: p.title?.en ?? null,
      zh: p.title?.zh ?? null,
    };
    const desc = {
      jp: p.desc?.jp ?? null,
      en: p.desc?.en ?? null,
      zh: p.desc?.zh ?? null,
    };
    let langs;
    if (p.langs && typeof p.langs === 'object') {
      langs = {
        jp: typeof p.langs.jp === 'boolean' ? p.langs.jp : !!title.jp,
        en: typeof p.langs.en === 'boolean' ? p.langs.en : !!title.en,
        zh: typeof p.langs.zh === 'boolean' ? p.langs.zh : !!title.zh,
      };
    } else {
      langs = defaultLangsFromTitle(title);
    }

    return {
      ...p,
      id: p.id,
      category: Array.isArray(p.category) ? [...p.category] : [],
      regions: Array.isArray(p.regions) ? [...p.regions] : [],
      isNew: !!p.isNew,
      isSoldOut: !!p.isSoldOut,
      langs,
      title,
      desc,
      priceTW: p.priceTW ?? 0,
      priceHK: p.priceHK ?? 0,
      imgs: Array.isArray(p.imgs) ? [...p.imgs] : [],
      linkTW: p.linkTW || null,
      linkHK: p.linkHK || null,
    };
  }

  function normalizeSiteData(raw) {
    const data = {
      posts: (raw.posts || []).map(normalizePost),
      gallery: (raw.gallery || []).map(normalizeGalleryItem),
      translations: raw.translations || {},
    };
    return data;
  }

  function normalizeStoreConfig(raw) {
    const cfg = raw || {};
    const categories = (cfg.categories || []).map((c) => ({
      id: c.id,
      name: {
        jp: c.name?.jp ?? c.name?.en ?? c.id,
        en: c.name?.en ?? c.id,
        zh: c.name?.zh ?? c.name?.en ?? c.id,
      },
    }));
    return {
      shopStatus: {
        isOpen: !!(cfg.shopStatus && cfg.shopStatus.isOpen),
        nextOpenDate: (cfg.shopStatus && cfg.shopStatus.nextOpenDate) || '',
      },
      banner: {
        img: (cfg.banner && cfg.banner.img) || '',
        link: (cfg.banner && cfg.banner.link) || '#',
        text: (cfg.banner && cfg.banner.text) || '',
      },
      categories,
    };
  }

  function setLoaded({ siteData, storeConfig, storeProducts, eventCatalog, eventUiStrings }) {
    state.siteData = normalizeSiteData(siteData);
    state.storeConfig = normalizeStoreConfig(storeConfig);
    state.storeProducts = (storeProducts || []).map(normalizeProduct);
    state.eventCatalog = eventCatalog && typeof eventCatalog === 'object' ? eventCatalog : {};
    state.eventUiStrings =
      eventUiStrings && typeof eventUiStrings === 'object' ? eventUiStrings : {};
    markClean();
  }

  function eventIds() {
    return Object.keys(state.eventCatalog || {});
  }

  function nextPostId() {
    const posts = state.siteData?.posts || [];
    return posts.length ? Math.max(...posts.map((p) => p.id)) + 1 : 1;
  }

  function nextGalleryId() {
    const items = state.siteData?.gallery || [];
    return items.length ? Math.max(...items.map((g) => g.id)) + 1 : 1;
  }

  function nextProductId() {
    const items = state.storeProducts || [];
    return items.length ? Math.max(...items.map((p) => p.id)) + 1 : 101;
  }

  function isLangVisible(item, lang) {
    if (item.langs && typeof item.langs[lang] === 'boolean') return item.langs[lang];
    return !!(item.title && item.title[lang]);
  }

  global.AdminState = {
    LANGS,
    state,
    markDirty,
    markClean,
    emptyLangMap,
    normalizePost,
    normalizeProduct,
    normalizeGalleryItem,
    setLoaded,
    nextPostId,
    nextGalleryId,
    nextProductId,
    isLangVisible,
    defaultLangsFromTitle,
    eventIds,
  };
})(window);
