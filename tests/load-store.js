/**
 * Load classic-script store.js into a sandboxed VM with fake Web Storage.
 * Exports the pure/helper functions tests need — production files unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makeStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(String(key)) ? map.get(String(key)) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
    key(i) {
      return [...map.keys()][i] ?? null;
    },
    get length() {
      return map.size;
    },
    _map: map,
  };
}

/**
 * @returns {{ api: object, localStorage: object, sessionStorage: object, resetStorage: () => void }}
 */
export function loadStore() {
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const context = {
    console,
    Math,
    Date,
    String,
    Number,
    Array,
    Object,
    Boolean,
    JSON,
    parseInt,
    parseFloat,
    isFinite,
    isNaN,
    Infinity,
    NaN,
    undefined,
    localStorage,
    sessionStorage,
  };
  vm.createContext(context);

  const storeData = fs.readFileSync(path.join(root, "store.js"), "utf8");
  const storeRuntime = fs.readFileSync(path.join(root, "store-runtime.js"), "utf8");
  vm.runInContext(storeData, context);
  vm.runInContext(storeRuntime, context);

  const api = vm.runInContext(
    `({
      storeConfig,
      storeProducts,
      getUraConfig,
      isUraUnlocked,
      isUraCatalogOpen,
      unlockUra,
      lockUra,
      normalizeUraPasscode,
      checkUraPasscode,
      isProductVisibleInStore,
      normalizeStoreRegion,
      isBoothStorefront,
      storefrontLangForRegion,
      cartStorageKey,
      getCheckoutConfig,
      productUnitPrice,
      formatStoreMoney,
      productUsesTwCart,
      boothShopUrl,
      productBoothUrl,
      storeUsesBoothCheckout,
      productIsR18,
      productIsSoldOutInRegion,
      twMyshipMaxOrderTwd,
      normalizeTwStoreId,
      isValidTwStoreId,
      buildMyshipImportRows,
      loadRegionCart,
      saveRegionCart,
      clearRegionCart,
      getRegionCartCount,
      getRegionCartTotal,
      getRegionCartLines,
      resolveCheckoutConfig,
      getAvailableRegionFulfillment,
      generateRegionOrderId,
      loadHkCart,
      saveHkCart,
      clearHkCart,
      getHkCartCount,
      getHkCartTotal,
      getHkCartLines,
      getAvailableHkFulfillment,
      generateHkOrderId,
      HK_CART_STORAGE_KEY,
      TW_CART_STORAGE_KEY,
    })`,
    context
  );

  return {
    api,
    localStorage,
    sessionStorage,
    resetStorage() {
      localStorage.clear();
      sessionStorage.clear();
    },
  };
}
