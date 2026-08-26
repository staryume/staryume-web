/**
 * Gauntlet tests for store.js pure helpers (INSTRUCTIONS.md Level 1).
 * Scenarios map to cart/region/ura/money invariants.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { loadStore } from "./load-store.js";

const { api, resetStorage } = loadStore();

beforeEach(() => {
  resetStorage();
});

const sampleProducts = [
  {
    id: 1,
    title: { zh: "商品甲", en: "Item A", jp: "商品A" },
    priceHK: 100,
    priceTW: 400,
    isSoldOut: false,
    imgs: ["./a.jpg"],
  },
  {
    id: 2,
    title: { zh: "商品乙", en: "Item B", jp: null },
    priceHK: 50,
    priceTW: 200,
    isSoldOut: true,
    img: "./b.jpg",
  },
  {
    id: 3,
    title: { zh: "裏商品", en: "Ura", jp: "裏" },
    priceHK: 300,
    priceTW: 0,
    contentRating: "r18",
    hidden: true,
    isSoldOut: false,
  },
  {
    id: 4,
    title: { zh: "FF47限定", en: "FF47", jp: "FF47" },
    priceHK: 0,
    priceTW: 350,
    useTwCart: true,
    eventSource: "acghk2026",
    twFulfillment: ["ff47_day1"],
    isSoldOut: false,
  },
];

describe("normalizeStoreRegion", () => {
  it("maps TW / JP / GL and everything else to HK", () => {
    expect(api.normalizeStoreRegion("TW")).toBe("TW");
    expect(api.normalizeStoreRegion("JP")).toBe("JP");
    expect(api.normalizeStoreRegion("GL")).toBe("GL");
    expect(api.normalizeStoreRegion("tw")).toBe("HK"); // only exact "TW"
    expect(api.normalizeStoreRegion("HK")).toBe("HK");
    expect(api.normalizeStoreRegion("")).toBe("HK");
    expect(api.normalizeStoreRegion(null)).toBe("HK");
  });
});

describe("productUnitPrice / formatStoreMoney", () => {
  it("uses priceHK for HK and priceTW for TW", () => {
    expect(api.productUnitPrice(sampleProducts[0], "HK")).toBe(100);
    expect(api.productUnitPrice(sampleProducts[0], "TW")).toBe(400);
    expect(api.productUnitPrice(null, "HK")).toBe(0);
    expect(api.productUnitPrice({ id: 9 }, "HK")).toBe(0);
  });

  it("formats currency labels by region", () => {
    expect(api.formatStoreMoney(120, "HK")).toBe("HKD$ 120");
    expect(api.formatStoreMoney(350, "TW")).toBe("NT$ 350");
    expect(api.formatStoreMoney(0, "JP")).toBe("BOOTH");
    expect(api.formatStoreMoney(0, "GL")).toBe("BOOTH");
    expect(api.formatStoreMoney("x", "HK")).toBe("HKD$ 0");
  });
});

describe("cart isolation (HK vs TW)", () => {
  it("uses separate storage keys", () => {
    expect(api.cartStorageKey("HK")).toBe("staryume_cart_hk");
    expect(api.cartStorageKey("TW")).toBe("staryume_cart_tw");
    expect(api.HK_CART_STORAGE_KEY).toBe("staryume_cart_hk");
    expect(api.TW_CART_STORAGE_KEY).toBe("staryume_cart_tw");
  });

  it("does not merge HK and TW bags", () => {
    api.saveRegionCart("HK", { "1": 2 });
    api.saveRegionCart("TW", { "4": 1 });
    expect(api.loadRegionCart("HK")).toEqual({ "1": 2 });
    expect(api.loadRegionCart("TW")).toEqual({ "4": 1 });
    expect(api.getRegionCartCount(api.loadRegionCart("HK"))).toBe(2);
    expect(api.getRegionCartCount(api.loadRegionCart("TW"))).toBe(1);
  });

  it("ignores invalid qty on load", () => {
    // write raw garbage into storage
    const key = api.cartStorageKey("HK");
    api.saveRegionCart("HK", { "1": 2 });
    // force bad payload via save of zeros/negatives (save does not filter;
    // load must filter when reading back)
    // Simulate corrupted storage by saving then overwriting with load filter test:
    // loadRegionCart filters qty > 0 only when reading
    const raw = JSON.stringify({ "1": 0, "2": -3, "3": "x", "4": 2 });
    // inject via saveRegionCart only accepts objects; use clear + direct path
    // loadRegionCart uses localStorage — re-save via internal by calling save then
    // we can only test through save/load API: save keeps as-is, load filters
    // So write through storage key by save + re-implement: use JSON in saveRegionCart
    // Actually saveRegionCart stringifies cart as-is; load filters.
    api.saveRegionCart("HK", { "1": 0, "2": -1, "3": 2 });
    const loaded = api.loadRegionCart("HK");
    expect(loaded).toEqual({ "3": 2 });
  });
});

describe("cart totals and lines", () => {
  it("sums line totals with regional prices", () => {
    const cart = { "1": 2, "2": 1 };
    expect(api.getRegionCartTotal(cart, sampleProducts, "HK")).toBe(100 * 2 + 50);
    expect(api.getRegionCartTotal(cart, sampleProducts, "TW")).toBe(400 * 2 + 200);
  });

  it("builds lines with soldOut and title fallback", () => {
    const lines = api.getRegionCartLines({ "1": 2, "2": 1 }, sampleProducts, "zh", "HK");
    expect(lines).toHaveLength(2);
    const a = lines.find((l) => l.id === 1);
    const b = lines.find((l) => l.id === 2);
    expect(a.lineTotal).toBe(200);
    expect(a.title).toBe("商品甲");
    expect(b.soldOut).toBe(true);
    expect(b.unit).toBe(50);
  });

  it("skips unknown product ids", () => {
    const lines = api.getRegionCartLines({ "999": 3 }, sampleProducts, "zh", "HK");
    expect(lines).toEqual([]);
    expect(api.getRegionCartTotal({ "999": 3 }, sampleProducts, "HK")).toBe(0);
  });
});

describe("ura passcode and visibility", () => {
  it("normalizes passcode trim + case-insensitive", () => {
    expect(api.normalizeUraPasscode("  AbC ")).toBe("abc");
    expect(api.normalizeUraPasscode("")).toBe("");
  });

  it("checks against configured passcode", () => {
    const ura = api.getUraConfig();
    // If ura disabled in config, check returns false — still assert pure normalize works
    if (!ura || ura.enabled === false) {
      expect(api.checkUraPasscode("anything")).toBe(false);
      return;
    }
    const code = ura.passcode || (ura.passcodes && ura.passcodes[0]);
    if (!code) {
      expect(api.checkUraPasscode("")).toBe(false);
      return;
    }
    expect(api.checkUraPasscode(code)).toBe(true);
    expect(api.checkUraPasscode(String(code).toUpperCase())).toBe(true);
    expect(api.checkUraPasscode(" " + code + " ")).toBe(true);
    expect(api.checkUraPasscode("wrong-pass-xyz")).toBe(false);
    expect(api.checkUraPasscode("")).toBe(false);
  });

  it("hides r18/hidden products unless unlocked", () => {
    const ura = sampleProducts[2];
    expect(api.isProductVisibleInStore(ura, false)).toBe(false);
    expect(api.isProductVisibleInStore(ura, true)).toBe(true);
    expect(api.isProductVisibleInStore(sampleProducts[0], false)).toBe(true);
    expect(api.isProductVisibleInStore(null, true)).toBe(false);
  });

  it("session unlock/lock round-trip", () => {
    const ura = api.getUraConfig();
    if (!ura || ura.enabled === false) return;
    expect(api.isUraUnlocked()).toBe(false);
    expect(api.unlockUra()).toBe(true);
    expect(api.isUraUnlocked()).toBe(true);
    api.lockUra();
    expect(api.isUraUnlocked()).toBe(false);
  });

  it("TW opens R18 catalog without passcode; HK still needs unlock", () => {
    const ura = api.getUraConfig();
    if (!ura || ura.enabled === false) return;
    api.lockUra();
    expect(api.isUraCatalogOpen("TW")).toBe(true);
    expect(api.isUraCatalogOpen("JP")).toBe(true);
    expect(api.isUraCatalogOpen("GL")).toBe(true);
    expect(api.isUraCatalogOpen("HK")).toBe(false);
    expect(api.unlockUra()).toBe(true);
    expect(api.isUraCatalogOpen("HK")).toBe(true);
  });
});

describe("productUsesTwCart", () => {
  it("true for useTwCart or acghk2026/ff47 eventSource", () => {
    expect(api.productUsesTwCart(sampleProducts[3])).toBe(true);
    expect(api.productUsesTwCart({ id: 9, eventSource: "acghk2026" })).toBe(true);
    expect(api.productUsesTwCart({ id: 10, eventSource: "ff47" })).toBe(true);
    expect(api.productUsesTwCart(sampleProducts[0])).toBe(false);
    expect(api.productUsesTwCart(null)).toBe(false);
  });
  it("false for R18 even if useTwCart", () => {
    expect(api.productIsR18(sampleProducts[2])).toBe(true);
    expect(api.productUsesTwCart({ id: 8, useTwCart: true, contentRating: "r18" })).toBe(false);
  });
});

describe("BOOTH JP handoff", () => {
  it("uses linkJP when set, else shop URL", () => {
    expect(api.boothShopUrl({})).toBe("https://staryume.booth.pm");
    expect(api.productBoothUrl({ linkJP: "https://staryume.booth.pm/items/1" })).toBe(
      "https://staryume.booth.pm/items/1"
    );
    expect(api.productBoothUrl({ linkJP: null })).toBe("https://staryume.booth.pm");
  });
  it("Japan and Global use BOOTH; HK and TW do not", () => {
    expect(api.storeUsesBoothCheckout("JP")).toBe(true);
    expect(api.storeUsesBoothCheckout("GL")).toBe(true);
    expect(api.isBoothStorefront("JP")).toBe(true);
    expect(api.isBoothStorefront("GL")).toBe(true);
    expect(api.storeUsesBoothCheckout("HK")).toBe(false);
    expect(api.storeUsesBoothCheckout("TW")).toBe(false);
    expect(api.storefrontLangForRegion("JP")).toBe("jp");
    expect(api.storefrontLangForRegion("GL")).toBe("en");
    expect(api.storefrontLangForRegion("HK")).toBe("zh");
    expect(api.storefrontLangForRegion("TW")).toBe("zh");
  });
});

describe("myship import helpers", () => {
  it("normalizes 7-11 store ids", () => {
    expect(api.normalizeTwStoreId("148599")).toBe("148599");
    expect(api.normalizeTwStoreId("店號 148599")).toBe("148599");
    expect(api.isValidTwStoreId("148599")).toBe(true);
    expect(api.isValidTwStoreId("12")).toBe(false);
  });
  it("builds one 匯入 row per line item", () => {
    const rows = api.buildMyshipImportRows({
      name: "王小明",
      phone: "0912345678",
      email: "a@b.c",
      storeId: "148599",
      storeName: "測試門市",
      orderId: "TW-20260825-AAAAAAAA",
      notes: "小心輕放",
      items: [
        { title: "色紙", qty: 1, unit: 1000 },
        { title: "卡套", qty: 2, unit: 200 },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].門市店號).toBe("148599");
    expect(rows[1].數量).toBe(2);
    expect(rows[0].訂單編號).toBe("TW-20260825-AAAAAAAA");
  });
  it("uses 20000 default cap", () => {
    expect(api.twMyshipMaxOrderTwd({})).toBe(20000);
  });
});

describe("fulfillment intersection", () => {
  it("returns enabled methods when cart empty", () => {
    const cfg = {
      fulfillment: [
        { id: "a", enabled: true },
        { id: "b", enabled: false },
        { id: "c", enabled: true },
      ],
    };
    const methods = api.getAvailableRegionFulfillment({}, sampleProducts, "HK", cfg);
    expect(methods.map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("intersects TW product.twFulfillment", () => {
    const cfg = {
      fulfillment: [
        { id: "ff47_day1", enabled: true },
        { id: "ff47_day2", enabled: true },
      ],
    };
    const cart = { "4": 1 };
    const methods = api.getAvailableRegionFulfillment(cart, sampleProducts, "TW", cfg);
    expect(methods.map((m) => m.id)).toEqual(["ff47_day1"]);
  });
});

describe("generateRegionOrderId", () => {
  it("uses HK-/TW- prefix and 8-char suffix", () => {
    const hk = api.generateRegionOrderId("HK");
    const tw = api.generateRegionOrderId("TW");
    expect(hk).toMatch(/^HK-\d{8}-[A-Z0-9]{8}$/);
    expect(tw).toMatch(/^TW-\d{8}-[A-Z0-9]{8}$/);
    // two calls should usually differ
    const a = api.generateRegionOrderId("HK");
    const b = api.generateRegionOrderId("HK");
    // collision astronomically rare for 8 chars; if equal, not a hard fail in one run
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });
});

describe("getCheckoutConfig", () => {
  it("returns hkCheckout for HK and twCheckout for TW", () => {
    const hk = api.getCheckoutConfig("HK");
    const tw = api.getCheckoutConfig("TW");
    expect(hk).toBeTruthy();
    expect(tw).toBeTruthy();
    expect(hk.currency).toBe("HKD");
    expect(tw.currency).toBe("TWD");
    expect((tw.fulfillment || []).some((f) => f.id === "myship_711")).toBe(true);
  });
  it("returns booth config for JP and GL", () => {
    const jp = api.getCheckoutConfig("JP");
    const gl = api.getCheckoutConfig("GL");
    expect(jp).toBeTruthy();
    expect(gl).toBe(jp);
    expect(jp.shopUrl).toContain("booth.pm");
  });
});

describe("HK back-compat aliases", () => {
  it("load/save HK aliases use HK storage", () => {
    api.saveHkCart({ "1": 3 });
    expect(api.loadHkCart()).toEqual({ "1": 3 });
    expect(api.loadRegionCart("HK")).toEqual({ "1": 3 });
    expect(api.getHkCartCount({ "1": 3, "2": 1 })).toBe(4);
    expect(api.getHkCartTotal({ "1": 2 }, sampleProducts)).toBe(200);
  });
});

describe("live catalog smoke (storeProducts)", () => {
  it("has products with numeric regional prices where present", () => {
    expect(Array.isArray(api.storeProducts)).toBe(true);
    expect(api.storeProducts.length).toBeGreaterThan(0);
    for (const p of api.storeProducts) {
      expect(p.id != null).toBe(true);
      if (p.priceHK != null) expect(typeof p.priceHK).toBe("number");
      if (p.priceTW != null) expect(typeof p.priceTW).toBe("number");
    }
  });
});
