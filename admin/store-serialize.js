/**
 * Pure CMS serialize helpers (no File System Access).
 * Save all must patch catalog data only — never drop store-runtime.js or checkout keys.
 */
(function (global) {
  "use strict";

  const PROTECTED_STORE_CONFIG_KEYS = ["hkCheckout", "twCheckout", "booth", "ura"];

  function skipWs(src, i) {
    while (i < src.length && /[\s\uFEFF]/.test(src[i])) i++;
    return i;
  }

  /**
   * Replace `const NAME = <object|array>;` in a classic JS file.
   * Leaves any code before/after that assignment untouched.
   */
  function replaceTopLevelConst(source, name, value) {
    const src = String(source || "");
    const json = JSON.stringify(value, null, 4);
    const token = "const " + name + " =";
    const start = src.indexOf(token);
    if (start < 0) {
      const prefix = src && !src.endsWith("\n") ? src + "\n\n" : src || "";
      return prefix + token + " " + json + ";\n";
    }
    let i = skipWs(src, start + token.length);
    const open = src[i];
    if (open !== "{" && open !== "[") {
      throw new Error("const " + name + " is not an object/array assignment");
    }
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inStr = false;
    let quote = "";
    let escape = false;
    for (let j = i; j < src.length; j++) {
      const ch = src[j];
      if (inStr) {
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === quote) inStr = false;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = true;
        quote = ch;
        continue;
      }
      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          let k = skipWs(src, j + 1);
          if (src[k] !== ";") {
            throw new Error("const " + name + " is missing a closing semicolon");
          }
          return src.slice(0, start) + token + " " + json + ";" + src.slice(k + 1);
        }
      }
    }
    throw new Error("const " + name + " assignment is unclosed");
  }

  function mergeProtectedStoreConfig(nextCfg, prevCfg) {
    const next = nextCfg && typeof nextCfg === "object" ? { ...nextCfg } : {};
    const prev = prevCfg && typeof prevCfg === "object" ? prevCfg : {};
    for (const key of PROTECTED_STORE_CONFIG_KEYS) {
      const missing =
        next[key] == null ||
        (typeof next[key] === "object" && !Object.keys(next[key]).length);
      if (missing && prev[key] != null) next[key] = prev[key];
    }
    return next;
  }

  /** Drop helper functions if an old store.js still had them. Runtime lives in store-runtime.js. */
  function stripStoreRuntimeTail(source) {
    const src = String(source || "");
    const marked = src.search(/\n\/\/ ── 裏 store unlock/);
    if (marked >= 0) return src.slice(0, marked).replace(/[ \t]*$/m, "") + "\n";
    const fnAt = src.search(/\nfunction getUraConfig\s*\(/);
    if (fnAt >= 0) return src.slice(0, fnAt).replace(/[ \t]*$/m, "") + "\n";
    return src;
  }

  function serializeStoreJs(existingText, storeConfig, storeProducts) {
    if (!Array.isArray(storeProducts) || storeProducts.length === 0) {
      throw new Error("Refusing to save an empty store catalog");
    }
    let text = existingText && String(existingText).trim()
      ? stripStoreRuntimeTail(existingText)
      : "// STORE CONFIGURATION & DATABASE\n\nconst storeConfig = {};\n\nconst storeProducts = [];\n";
    text = replaceTopLevelConst(text, "storeConfig", storeConfig);
    text = replaceTopLevelConst(text, "storeProducts", storeProducts);
    if (!text.endsWith("\n")) text += "\n";
    return text;
  }

  function serializeDataJs(existingText, siteData) {
    if (!siteData || !Array.isArray(siteData.posts) || siteData.posts.length === 0) {
      throw new Error("Refusing to save empty site posts");
    }
    let text = existingText && String(existingText).trim()
      ? String(existingText)
      : "// GLOBAL SITE DATA\nconst siteData = {};\n";
    text = replaceTopLevelConst(text, "siteData", siteData);
    if (!text.endsWith("\n")) text += "\n";
    return text;
  }

  function serializeEventsJs(existingText, eventCatalog, eventUiStrings) {
    let text = existingText && String(existingText).trim()
      ? String(existingText)
      : "// EVENT お品書き CATALOG\n\nconst eventUiStrings = {};\n\nconst eventCatalog = {};\n";
    text = replaceTopLevelConst(text, "eventUiStrings", eventUiStrings || {});
    text = replaceTopLevelConst(text, "eventCatalog", eventCatalog || {});
    if (!text.endsWith("\n")) text += "\n";
    return text;
  }

  global.AdminStoreSerialize = {
    PROTECTED_STORE_CONFIG_KEYS,
    replaceTopLevelConst,
    mergeProtectedStoreConfig,
    stripStoreRuntimeTail,
    serializeStoreJs,
    serializeDataJs,
    serializeEventsJs,
  };
})(typeof window !== "undefined" ? window : globalThis);
