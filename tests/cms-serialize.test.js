/**
 * CMS Save all must patch catalog data without deleting checkout or runtime helpers.
 */
import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadStore } from "./load-store.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadSerialize() {
  const context = { console };
  vm.createContext(context);
  const code = fs.readFileSync(path.join(root, "admin/store-serialize.js"), "utf8");
  vm.runInContext(code, context);
  return context.AdminStoreSerialize;
}

describe("AdminStoreSerialize", () => {
  const S = loadSerialize();

  it("replaceTopLevelConst leaves code after the assignment", () => {
    const src =
      "// header\nconst storeConfig = { \"a\": 1 };\n\nfunction keepMe() { return 2; }\n";
    const out = S.replaceTopLevelConst(src, "storeConfig", { a: 9, b: true });
    expect(out).toContain('"a": 9');
    expect(out).toContain("function keepMe() { return 2; }");
    expect(out).toContain("// header");
  });

  it("strips helper tail so CMS cannot keep runtime in store.js", () => {
    const src =
      "const storeConfig = {};\nconst storeProducts = [{ \"id\": 1 }];\n// ── 裏 store unlock\nfunction getUraConfig() {}\n";
    expect(S.stripStoreRuntimeTail(src)).not.toContain("function getUraConfig");
  });

  it("mergeProtectedStoreConfig restores stripped checkout keys", () => {
    const prev = {
      shopStatus: { isOpen: true },
      hkCheckout: { enabled: true, currency: "HKD" },
      twCheckout: { enabled: false, currency: "TWD" },
      booth: { shopUrl: "https://staryume.booth.pm" },
      ura: { enabled: true, passcode: "x" },
    };
    const next = { shopStatus: { isOpen: false }, categories: [] };
    const merged = S.mergeProtectedStoreConfig(next, prev);
    expect(merged.shopStatus.isOpen).toBe(false);
    expect(merged.hkCheckout.currency).toBe("HKD");
    expect(merged.twCheckout.currency).toBe("TWD");
    expect(merged.booth.shopUrl).toContain("booth.pm");
    expect(merged.ura.passcode).toBe("x");
  });

  it("serializeStoreJs refuses an empty catalog", () => {
    expect(() => S.serializeStoreJs("", { shopStatus: { isOpen: true } }, [])).toThrow(
      /empty store catalog/
    );
  });

  it("save round-trip keeps checkout when CMS memory omitted it", () => {
    const existing = fs.readFileSync(path.join(root, "store.js"), "utf8");
    const stripped = {
      shopStatus: { isOpen: false, nextOpenDate: "" },
      banner: { img: "", link: "#", text: "" },
      categories: [{ id: "featured", name: { jp: "FEATURED", en: "FEATURED", zh: "精選" } }],
    };
    const parsed = new Function(existing + "\nreturn { storeConfig, storeProducts };")();
    const merged = S.mergeProtectedStoreConfig(stripped, parsed.storeConfig);
    const out = S.serializeStoreJs(existing, merged, parsed.storeProducts);
    expect(out).toContain("hkCheckout");
    expect(out).toContain("twCheckout");
    expect(out).toContain("passcode");
    expect(out).not.toContain("function getUraConfig");
    expect(out).toContain('"id": ' + parsed.storeProducts[0].id);
  });
});

describe("store-runtime fallbacks", () => {
  it("restores hkCheckout if store.js omitted it", () => {
    const localStorage = {
      _m: new Map(),
      getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
      setItem(k, v) { this._m.set(k, String(v)); },
      removeItem(k) { this._m.delete(k); },
      clear() { this._m.clear(); },
    };
    const context = {
      console, Math, Date, String, Number, Array, Object, Boolean, JSON,
      parseInt, parseFloat, isFinite, isNaN, Infinity, NaN, undefined,
      localStorage,
      sessionStorage: localStorage,
    };
    vm.createContext(context);
    vm.runInContext(
      'const storeConfig = { shopStatus: { isOpen: true } }; const storeProducts = [{ id: 1 }];',
      context
    );
    vm.runInContext(fs.readFileSync(path.join(root, "store-runtime.js"), "utf8"), context);
    const cfg = vm.runInContext("storeConfig", context);
    expect(cfg.hkCheckout.currency).toBe("HKD");
    expect(cfg.twCheckout.currency).toBe("TWD");
    expect(cfg.booth.shopUrl).toContain("booth.pm");
    expect(cfg.ura.enabled).toBe(true);
    expect(typeof vm.runInContext("normalizeStoreRegion", context)).toBe("function");
  });
});

describe("live catalog still loads", () => {
  beforeEach(() => {
    loadStore().resetStorage();
  });
  it("helpers and checkout exist after split", () => {
    const { api } = loadStore();
    expect(api.storeConfig.hkCheckout).toBeTruthy();
    expect(api.storeUsesBoothCheckout("JP")).toBe(true);
    expect(api.storeProducts.length).toBeGreaterThan(0);
  });
});
