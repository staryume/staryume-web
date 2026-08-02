/**
 * STARYUME Inventory + Event POS client
 * UI: pos.html · Backend: docs/pos-Code.gs · Proxy: /api/pos
 */
const POS_CONFIG = {
  /** Production: Netlify edge proxy */
  scriptUrl: "/api/pos",
  /**
   * Localhost fallback — paste your POS Apps Script web app URL after deploy.
   * Same pattern as store.js hkCheckout.scriptUrlDirect.
   */
  scriptUrlDirect: "",
  /**
   * Optional full Google Sheet URL if bootstrap does not return spreadsheet.id
   * e.g. https://docs.google.com/spreadsheets/d/XXXX/edit
   */
  sheetUrl: "",
  sessionKey: "staryume_pos_passcode",
  deviceKey: "staryume_pos_device",
  pools: ["HK", "TW", "JP", "BOOTH", "HOME"],
  currencyByRegion: { HK: "HKD", TW: "TWD", JP: "JPY", BOOTH: "JPY", HOME: "HKD" },
};

// ── State ───────────────────────────────────────────────────────────────────

const state = {
  passcode: "",
  products: [],
  events: [],
  activeEvent: null,
  todaySales: [],
  spreadsheet: null,
  tab: "pos",
  busy: false,
  search: "",
  sellQty: 1,
  selectedSku: null,
  summary: null,
};

// ── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const saved = sessionStorage.getItem(POS_CONFIG.sessionKey);
  if (saved) {
    state.passcode = saved;
    showApp();
    bootstrap();
  } else {
    showLogin();
  }
  bindLogin();
  bindTabs();
  bindGlobal();
});

function showLogin() {
  el("login-screen")?.classList.remove("hidden");
  el("app-shell")?.classList.add("hidden");
}

function showApp() {
  el("login-screen")?.classList.add("hidden");
  el("app-shell")?.classList.remove("hidden");
}

function bindLogin() {
  const form = el("login-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = el("login-passcode");
    const code = (input?.value || "").trim();
    if (!code) return;
    setLoginError("");
    setLoginBusy(true);
    try {
      const res = await api({ action: "ping", passcode: code });
      if (!res.ok) {
        setLoginError(res.message || "通關密碼錯誤");
        return;
      }
      state.passcode = code;
      sessionStorage.setItem(POS_CONFIG.sessionKey, code);
      showApp();
      await bootstrap();
    } catch (err) {
      setLoginError(String(err.message || err));
    } finally {
      setLoginBusy(false);
    }
  });
}

function setLoginError(msg) {
  const n = el("login-error");
  if (n) n.textContent = msg || "";
}

function setLoginBusy(on) {
  const btn = el("login-submit");
  if (btn) {
    btn.disabled = !!on;
    btn.textContent = on ? "…" : "進入";
  }
}

function bindTabs() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.getAttribute("data-tab");
      document.querySelectorAll("[data-tab]").forEach((b) => {
        b.classList.toggle("tab-active", b === btn);
      });
      document.querySelectorAll("[data-panel]").forEach((p) => {
        p.classList.toggle("hidden", p.getAttribute("data-panel") !== state.tab);
      });
      if (state.tab === "inventory") renderInventory();
      if (state.tab === "products") renderProducts();
      if (state.tab === "events") renderEvents();
      if (state.tab === "summary") renderSummaryForm();
      if (state.tab === "pos") renderPos();
    });
  });
}

function bindGlobal() {
  el("btn-logout")?.addEventListener("click", () => {
    sessionStorage.removeItem(POS_CONFIG.sessionKey);
    state.passcode = "";
    location.reload();
  });
  el("btn-refresh")?.addEventListener("click", () => bootstrap());
  el("pos-search")?.addEventListener("input", (e) => {
    state.search = e.target.value || "";
    renderPosGrid();
  });
  el("btn-import-store")?.addEventListener("click", importFromStore);
  el("btn-ensure-set-components")?.addEventListener("click", ensureSetComponents);
  el("btn-save-all-stock")?.addEventListener("click", saveAllStock);
  el("btn-add-product")?.addEventListener("click", () => openProductModal(null));
  el("btn-open-sheet")?.addEventListener("click", openGoogleSheet);
  el("btn-open-sheet-inv")?.addEventListener("click", openGoogleSheet);
  el("btn-create-event")?.addEventListener("click", () => openEventModal(null));
  el("btn-start-day")?.addEventListener("click", startEventDay);
  el("btn-end-day")?.addEventListener("click", endEventDay);
  el("btn-load-summary")?.addEventListener("click", loadSummary);
  el("btn-copy-summary")?.addEventListener("click", copySummary);
  el("sell-modal-close")?.addEventListener("click", closeSellModal);
  el("sell-confirm")?.addEventListener("click", confirmSale);
  el("sell-qty-minus")?.addEventListener("click", () => {
    state.sellQty = Math.max(1, state.sellQty - 1);
    updateSellModalQty();
  });
  el("sell-qty-plus")?.addEventListener("click", () => {
    state.sellQty += 1;
    updateSellModalQty();
  });
  el("product-modal-close")?.addEventListener("click", () => el("product-modal")?.classList.add("hidden"));
  el("product-form")?.addEventListener("submit", saveProductForm);
  el("event-modal-close")?.addEventListener("click", () => el("event-modal")?.classList.add("hidden"));
  el("event-form")?.addEventListener("submit", saveEventForm);
  el("sell-modal")?.addEventListener("click", (e) => {
    if (e.target === el("sell-modal")) closeSellModal();
  });
}

// ── API ─────────────────────────────────────────────────────────────────────

function endpoint() {
  const host = location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (isLocal && POS_CONFIG.scriptUrlDirect) return POS_CONFIG.scriptUrlDirect;
  return POS_CONFIG.scriptUrl;
}

async function api(payload) {
  const body = Object.assign({ passcode: state.passcode }, payload);
  const url = endpoint();
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (isLocal && (!POS_CONFIG.scriptUrlDirect || url === "/api/pos")) {
    throw new Error("本機請在 pos.js 設定 POS_CONFIG.scriptUrlDirect（Apps Script URL）");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("伺服器回應無效（" + res.status + "）");
  }
  return data;
}

function deviceLabel() {
  let d = localStorage.getItem(POS_CONFIG.deviceKey);
  if (!d) {
    d = "dev-" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(POS_CONFIG.deviceKey, d);
  }
  return d;
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  setStatus("同步中…");
  try {
    const res = await api({ action: "bootstrap" });
    if (!res.ok) {
      if (res.error === "unauthorized") {
        sessionStorage.removeItem(POS_CONFIG.sessionKey);
        showLogin();
        setLoginError("通關密碼已失效，請重新輸入");
        return;
      }
      setStatus(res.message || res.error || "同步失敗");
      return;
    }
    state.products = res.products || [];
    state.events = res.events || [];
    state.activeEvent = res.activeEvent || null;
    state.todaySales = res.todaySales || [];
    state.spreadsheet = res.spreadsheet || null;

    // Auto-seed missing set contents once if any set has zero children
    const setsMissingKids = (state.products || []).filter((p) => {
      if (!isSetProduct(p)) return false;
      return !(state.products || []).some(
        (c) => String(c.parentSku || "") === p.sku
      );
    });
    if (setsMissingKids.length && !state._seededComponents) {
      try {
        const seed = await api({ action: "ensure_set_components", count: 6 });
        state._seededComponents = true;
        if (seed.ok && (seed.placeholdersCreated || 0) > 0) {
          const again = await api({ action: "bootstrap" });
          if (again.ok) {
            state.products = again.products || state.products;
            state.events = again.events || state.events;
            state.activeEvent = again.activeEvent || state.activeEvent;
            state.todaySales = again.todaySales || state.todaySales;
            state.spreadsheet = again.spreadsheet || state.spreadsheet;
          }
          toast(`已自動產生套組子項目 ×${seed.placeholdersCreated}`);
        }
      } catch {
        /* user can press 產生套組子項目 */
      }
    }

    renderEventBanner();
    renderSheetLink();
    renderPos();
    renderInventory();
    renderProducts();
    renderEvents();
    renderTodayStrip();
    const sheetHint = res.spreadsheet?.name
      ? ` · Sheet: ${res.spreadsheet.name}`
      : res.spreadsheet?.error
        ? ` · Sheet error: ${res.spreadsheet.error}`
        : "";
    setStatus("已同步 " + new Date().toLocaleTimeString() + sheetHint);
  } catch (err) {
    setStatus(String(err.message || err));
  }
}

function setStatus(msg) {
  const n = el("status-bar");
  if (n) n.textContent = msg || "";
}

function sheetUrlFromState() {
  if (POS_CONFIG.sheetUrl) return POS_CONFIG.sheetUrl;
  const id = state.spreadsheet?.id;
  if (id) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  return "";
}

function renderSheetLink() {
  const btn = el("btn-open-sheet");
  if (!btn) return;
  const url = sheetUrlFromState();
  if (url) {
    btn.classList.remove("opacity-40", "pointer-events-none");
    btn.title = state.spreadsheet?.name || "Google Sheet";
    btn.dataset.url = url;
  } else {
    btn.classList.add("opacity-40");
    btn.title = "尚未取得試算表 ID（請設定 SPREADSHEET_ID）";
    btn.dataset.url = "";
  }
}

function openGoogleSheet() {
  const url = sheetUrlFromState() || el("btn-open-sheet")?.dataset?.url;
  if (!url) {
    toast("沒有試算表連結。請在 Apps Script 設定 SPREADSHEET_ID 後同步。");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Release/create date → ms for sort (newest first). */
function releaseTimeMs(p) {
  let s = String(p?.productCreateDate || p?.updatedAt || "").trim();
  if (!s) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s = s + "T12:00:00";
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function releaseDateOnly(p) {
  const s = String(p?.productCreateDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (!s) return "";
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Flat list: parents newest release→oldest, each followed by children sortOrder ASC */
function productsDisplayOrder(products) {
  const list = products || [];
  const bySku = new Map(list.map((p) => [p.sku, p]));
  const childrenOf = new Map();
  list.forEach((p) => {
    const parent = String(p.parentSku || "").trim();
    if (parent && bySku.has(parent)) {
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(p);
    }
  });
  childrenOf.forEach((arr) => {
    arr.sort(
      (a, b) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
        String(a.sku).localeCompare(String(b.sku))
    );
  });

  const roots = list.filter((p) => {
    const parent = String(p.parentSku || "").trim();
    return !parent || !bySku.has(parent);
  });
  roots.sort((a, b) => {
    const ta = releaseTimeMs(a);
    const tb = releaseTimeMs(b);
    if (ta !== tb) return tb - ta;
    const ida = Number(a.storeId) || 0;
    const idb = Number(b.storeId) || 0;
    if (ida !== idb) return idb - ida;
    return String(a.sku).localeCompare(String(b.sku));
  });

  const out = [];
  const seen = new Set();
  roots.forEach((r) => {
    out.push(r);
    seen.add(r.sku);
    (childrenOf.get(r.sku) || []).forEach((c) => {
      out.push(c);
      seen.add(c.sku);
    });
  });
  list.forEach((p) => {
    if (!seen.has(p.sku)) out.push(p);
  });
  return out;
}

function isComponent(p) {
  if (!p) return false;
  if (p.productKind === "component") return true;
  const parent = String(p.parentSku || "").trim();
  return parent.length > 0;
}

function isSetProduct(p) {
  if (!p || isComponent(p)) return false;
  return (
    p.productKind === "set" ||
    p.category === "set" ||
    String(p.category || "").includes("set")
  );
}

function thumbHtml(p, sizeClass) {
  const cls = sizeClass || "w-10 h-10";
  if (p?.thumbUrl) {
    return `<img src="${escAttr(p.thumbUrl)}" alt="" class="${cls} object-cover rounded-md bg-gray-100 shrink-0" loading="lazy" onerror="this.style.visibility='hidden'">`;
  }
  return `<div class="${cls} rounded-md bg-gray-100 shrink-0 border border-gray-200"></div>`;
}

// ── Event banner / day ──────────────────────────────────────────────────────

function renderEventBanner() {
  const banner = el("event-banner");
  if (!banner) return;
  const ev = state.activeEvent;
  if (!ev) {
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <span class="text-sm font-bold text-amber-800">尚未開啟活動日 — 請到「活動」建立並 Start</span>
        <button type="button" data-tab-jump="events" class="text-xs font-bold underline">前往活動設定</button>
      </div>`;
    banner.className = "bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3";
    banner.querySelector("[data-tab-jump]")?.addEventListener("click", () => {
      document.querySelector('[data-tab="events"]')?.click();
    });
    return;
  }
  banner.className = "bg-black text-white rounded-lg px-3 py-2 mb-3";
  banner.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
      <div>
        <div class="text-[10px] uppercase tracking-widest text-tech-purple font-bold">Active event</div>
        <div class="font-bold text-sm sm:text-base">${esc(ev.name)} · <span class="text-tech-purple">${esc(ev.region)}</span> · ${esc(ev.currency)} · ${esc(ev.activeDay || "—")}</div>
      </div>
      <div class="flex gap-2">
        <button type="button" id="banner-end" class="text-xs font-bold px-3 py-1.5 border border-white/40 rounded hover:bg-white/10">結束活動</button>
      </div>
    </div>`;
  el("banner-end")?.addEventListener("click", endEventDay);
}

async function startEventDay() {
  const sel = el("start-event-select");
  const dayInput = el("start-event-day");
  const eventId = sel?.value;
  const day = dayInput?.value || todayIso();
  if (!eventId) {
    toast("請選擇活動");
    return;
  }
  if (!confirm("確認開啟活動日？\n銷售將鎖定該活動區域庫存。")) return;
  setBusy(true);
  try {
    const res = await api({
      action: "set_event_status",
      eventId,
      status: "active",
      activeDay: day,
    });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast("活動已開啟");
    await bootstrap();
    document.querySelector('[data-tab="pos"]')?.click();
  } finally {
    setBusy(false);
  }
}

async function endEventDay() {
  if (!state.activeEvent) return;
  if (!confirm("結束目前活動鎖定？之後仍可查看各區庫存與當日摘要。")) return;
  setBusy(true);
  try {
    const res = await api({
      action: "set_event_status",
      eventId: state.activeEvent.eventId,
      status: "closed",
    });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast("活動已結束");
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

// ── POS ─────────────────────────────────────────────────────────────────────

function renderPos() {
  renderEventBanner();
  renderPosGrid();
  renderTodayStrip();
}

function renderPosGrid() {
  const grid = el("pos-grid");
  if (!grid) return;
  const region = state.activeEvent?.region || "HK";
  const currency = state.activeEvent?.currency || POS_CONFIG.currencyByRegion[region] || "HKD";
  const q = (state.search || "").trim().toLowerCase();

  // v1: components are inventory-only, not sold as separate POS tiles
  let list = productsDisplayOrder(state.products).filter(
    (p) => p.active !== false && !isComponent(p)
  );
  if (q) {
    list = list.filter((p) => {
      const blob = [p.sku, p.nameZh, p.nameEn, p.nameJp, p.category].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }

  if (!list.length) {
    grid.innerHTML = `<p class="col-span-full text-center text-gray-500 text-sm py-12">沒有商品。請到「商品」匯入 store 或新增。</p>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const price = priceFor(p, currency);
      const stock = p.stockMode === "unlimited" ? "∞" : poolStock(p, region);
      const stockClass =
        p.stockMode === "unlimited"
          ? "text-emerald-600"
          : stock <= 0
            ? "text-red-600"
            : stock <= 3
              ? "text-amber-600"
              : "text-gray-700";
      const disabled = !state.activeEvent || (p.stockMode === "limited" && stock <= 0);
      const thumb = p.thumbUrl
        ? `<img src="${escAttr(p.thumbUrl)}" alt="" class="w-full aspect-square object-cover bg-gray-100" loading="lazy" onerror="this.style.visibility='hidden'">`
        : `<div class="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-xs">NO IMG</div>`;
      const kindBadge = p.productKind === "set" ? " · set" : "";
      return `
        <button type="button" data-sell-sku="${escAttr(p.sku)}"
          class="pos-tile text-left border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm active:scale-[0.98] transition
            ${disabled ? "opacity-50" : "hover:border-tech-purple"}"
          ${disabled ? "disabled" : ""}>
          ${thumb}
          <div class="p-2.5 space-y-1">
            <div class="text-xs font-bold leading-snug line-clamp-2 min-h-[2.5rem]">${esc(displayName(p))}</div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-sm font-bold text-tech-black">${esc(currency)} ${esc(String(price))}</span>
              <span class="text-xs font-mono font-bold ${stockClass}">${esc(String(stock))}</span>
            </div>
            <div class="text-[10px] text-gray-400 font-mono">${esc(p.stockMode)}${kindBadge} · ${esc(p.sku)}</div>
          </div>
        </button>`;
    })
    .join("");

  grid.querySelectorAll("[data-sell-sku]").forEach((btn) => {
    btn.addEventListener("click", () => openSellModal(btn.getAttribute("data-sell-sku")));
  });
}

function openSellModal(sku) {
  if (!state.activeEvent) {
    toast("請先開啟活動日");
    return;
  }
  const p = state.products.find((x) => x.sku === sku);
  if (!p) return;
  state.selectedSku = sku;
  state.sellQty = 1;
  const currency = state.activeEvent.currency;
  const price = priceFor(p, currency);
  el("sell-title").textContent = displayName(p);
  el("sell-meta").textContent = `${p.sku} · ${p.stockMode} · ${state.activeEvent.region}`;
  el("sell-price").textContent = `${currency} ${price}`;
  updateSellModalQty();
  el("sell-modal")?.classList.remove("hidden");
}

function updateSellModalQty() {
  const n = el("sell-qty");
  if (n) n.textContent = String(state.sellQty);
  const p = state.products.find((x) => x.sku === state.selectedSku);
  if (!p || !state.activeEvent) return;
  const currency = state.activeEvent.currency;
  const total = priceFor(p, currency) * state.sellQty;
  const t = el("sell-total");
  if (t) t.textContent = `${currency} ${total}`;
}

function closeSellModal() {
  el("sell-modal")?.classList.add("hidden");
  state.selectedSku = null;
}

async function confirmSale() {
  if (!state.selectedSku || state.busy) return;
  const btn = el("sell-confirm");
  setBusy(true);
  if (btn) btn.disabled = true;
  try {
    const res = await api({
      action: "record_sale",
      sku: state.selectedSku,
      qty: state.sellQty,
      eventId: state.activeEvent?.eventId,
      device: deviceLabel(),
    });
    if (!res.ok) {
      toast(res.message || res.error || "銷售失敗");
      return;
    }
    toast(`已售 ×${state.sellQty}`);
    closeSellModal();
    // optimistic patch
    if (res.sale && res.sale.remainingStock != null) {
      const p = state.products.find((x) => x.sku === res.sale.sku);
      if (p && state.activeEvent) {
        p[stockKey(state.activeEvent.region)] = res.sale.remainingStock;
      }
    }
    state.todaySales.unshift(res.sale);
    renderPosGrid();
    renderTodayStrip();
  } catch (err) {
    toast(String(err.message || err));
  } finally {
    setBusy(false);
    if (btn) btn.disabled = false;
  }
}

function renderTodayStrip() {
  const box = el("today-sales");
  const totalEl = el("today-total");
  if (!box) return;
  const sales = state.todaySales || [];
  const currency = state.activeEvent?.currency || "";
  let gross = 0;
  sales.forEach((s) => {
    gross += Number(s.lineTotal) || 0;
  });
  if (totalEl) totalEl.textContent = sales.length ? `${currency} ${round2(gross)} · ${sales.length} 筆` : "今日尚無銷售";

  box.innerHTML = sales
    .slice(0, 40)
    .map(
      (s) => `
    <div class="flex items-center justify-between gap-2 py-2 border-b border-gray-100 text-sm">
      <div class="min-w-0">
        <div class="font-bold truncate">${esc(s.name || s.sku)} ×${esc(String(s.qty))}</div>
        <div class="text-[10px] text-gray-400 font-mono">${esc(s.saleId || "")}</div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="font-mono text-xs">${esc(String(s.lineTotal))}</span>
        <button type="button" data-void="${escAttr(s.saleId)}" class="text-[10px] font-bold text-red-600 px-2 py-1 border border-red-200 rounded">作廢</button>
      </div>
    </div>`
    )
    .join("") || `<p class="text-xs text-gray-400 py-4 text-center">點商品開始銷售</p>`;

  box.querySelectorAll("[data-void]").forEach((btn) => {
    btn.addEventListener("click", () => voidSale(btn.getAttribute("data-void")));
  });
}

async function voidSale(saleId) {
  if (!saleId || !confirm("作廢此筆銷售並還原庫存？")) return;
  setBusy(true);
  try {
    const res = await api({ action: "void_sale", saleId });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast("已作廢");
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

// ── Inventory ───────────────────────────────────────────────────────────────

function renderInventory() {
  const table = el("inventory-body");
  if (!table) return;
  const ordered = productsDisplayOrder(state.products);
  if (!ordered.length) {
    table.innerHTML = `<tr><td colspan="10" class="text-center text-gray-400 py-8 text-sm">尚無商品</td></tr>`;
    return;
  }
  table.innerHTML = ordered
    .map((p) => {
      const child = isComponent(p);
      const pools = POS_CONFIG.pools
        .map(
          (pool) => `
        <td class="px-1 py-1">
          <input type="number" min="0" step="1" data-stock-sku="${escAttr(p.sku)}" data-pool="${pool}"
            value="${poolStock(p, pool)}"
            class="w-14 sm:w-16 text-center text-xs font-mono border border-gray-200 rounded py-1 ${p.stockMode === "unlimited" ? "bg-gray-50 text-gray-400" : ""}"
            ${p.stockMode === "unlimited" ? 'title="unlimited 不扣庫存"' : ""}>
        </td>`
        )
        .join("");
      const kindLabel = p.productKind || (child ? "component" : p.category === "set" ? "set" : "—");
      const rel = releaseDateOnly(p);
      return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 ${child ? "bg-gray-50/80" : ""}">
        <td class="px-2 py-1.5">
          <div class="flex items-center gap-2 ${child ? "pl-4" : ""}">
            ${thumbHtml(p, "w-9 h-9")}
            <div class="min-w-0">
              <div class="text-xs font-bold truncate max-w-[10rem] sm:max-w-[14rem]" title="${escAttr(displayName(p))}">${child ? "↳ " : ""}${esc(displayName(p))}</div>
              <div class="text-[9px] font-mono text-gray-400 truncate">${esc(p.sku)}</div>
            </div>
          </div>
        </td>
        <td class="px-1 py-2 text-[10px] font-mono text-gray-500">${esc(kindLabel)}<br><span class="text-gray-400">${esc(p.stockMode)}</span></td>
        <td class="px-1 py-1">
          <input type="date" data-release-sku="${escAttr(p.sku)}" value="${escAttr(rel)}"
            class="w-[7.5rem] text-[10px] font-mono border border-gray-200 rounded py-1 px-1"
            title="發售日 / 排序用（愈新愈上）">
        </td>
        ${pools}
        <td class="px-1 py-1">
          <button type="button" data-save-stock="${escAttr(p.sku)}" class="text-[10px] font-bold px-2 py-1 bg-black text-white rounded">SAVE</button>
        </td>
      </tr>`;
    })
    .join("");

  table.querySelectorAll("[data-save-stock]").forEach((btn) => {
    btn.addEventListener("click", () => saveStockRow(btn.getAttribute("data-save-stock")));
  });
}

async function saveStockRow(sku) {
  const inputs = Array.from(document.querySelectorAll("[data-stock-sku]")).filter(
    (inp) => inp.getAttribute("data-stock-sku") === sku
  );
  const stocks = {};
  inputs.forEach((inp) => {
    const pool = (inp.getAttribute("data-pool") || "").toUpperCase();
    if (!pool) return;
    const raw = String(inp.value ?? "").trim();
    stocks[pool] = raw === "" ? 0 : parseInt(raw, 10) || 0;
  });
  if (!Object.keys(stocks).length) {
    toast("No stock fields found — open 庫存 tab and try again");
    return;
  }
  const releaseInp = document.querySelector(`[data-release-sku="${cssAttrEscape(sku)}"]`);
  // fallback without CSS escape issues
  const releaseEl =
    releaseInp ||
    Array.from(document.querySelectorAll("[data-release-sku]")).find(
      (n) => n.getAttribute("data-release-sku") === sku
    );
  const releaseDate = releaseEl?.value || "";

  setBusy(true);
  try {
    const res = await api({ action: "set_stock", sku, stocks });
    if (!res.ok) {
      toast(res.message || res.error || "SAVE failed");
      return;
    }
    let product = res.product;
    if (releaseDate) {
      const up = await api({
        action: "upsert_product",
        product: { sku, productCreateDate: releaseDate },
      });
      if (up.ok && up.product) product = up.product;
      else if (!up.ok) toast(up.message || "發售日儲存失敗");
    }
    const idx = state.products.findIndex((p) => p.sku === sku);
    if (idx >= 0 && product) state.products[idx] = { ...state.products[idx], ...product };
    const p = product || {};
    const bits = POS_CONFIG.pools.map((pool) => {
      const sent = stocks[pool];
      const got = Number(p["stock" + pool]);
      return `${pool}:${got}${sent !== got ? "≠" + sent : ""}`;
    });
    const sheetName = res.spreadsheet?.name ? ` → ${res.spreadsheet.name}` : "";
    toast(`SAVED ${releaseDate ? releaseDate + " · " : ""}${bits.join(" ")}${sheetName}`);
    renderPosGrid();
    renderInventory();
    renderProducts();
  } finally {
    setBusy(false);
  }
}

function cssAttrEscape(s) {
  // minimal escape for querySelector attribute
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function saveAllStock() {
  if (!confirm("Save stock for ALL products currently shown?")) return;
  const skus = [...new Set(
    Array.from(document.querySelectorAll("[data-stock-sku]")).map((i) =>
      i.getAttribute("data-stock-sku")
    )
  )].filter(Boolean);
  if (!skus.length) {
    toast("No rows to save");
    return;
  }
  setBusy(true);
  let ok = 0;
  let fail = 0;
  try {
    for (const sku of skus) {
      const inputs = Array.from(document.querySelectorAll("[data-stock-sku]")).filter(
        (inp) => inp.getAttribute("data-stock-sku") === sku
      );
      const stocks = {};
      inputs.forEach((inp) => {
        const pool = (inp.getAttribute("data-pool") || "").toUpperCase();
        if (!pool) return;
        const raw = String(inp.value ?? "").trim();
        stocks[pool] = raw === "" ? 0 : parseInt(raw, 10) || 0;
      });
      try {
        const res = await api({ action: "set_stock", sku, stocks });
        if (res.ok) {
          ok++;
          let product = res.product;
          const releaseEl = Array.from(document.querySelectorAll("[data-release-sku]")).find(
            (n) => n.getAttribute("data-release-sku") === sku
          );
          if (releaseEl?.value) {
            const up = await api({
              action: "upsert_product",
              product: { sku, productCreateDate: releaseEl.value },
            });
            if (up.ok && up.product) product = up.product;
          }
          const idx = state.products.findIndex((p) => p.sku === sku);
          if (idx >= 0 && product) state.products[idx] = { ...state.products[idx], ...product };
        } else fail++;
      } catch {
        fail++;
      }
    }
    toast(`Save all: ${ok} ok · ${fail} failed`);
    renderInventory();
    renderPosGrid();
  } finally {
    setBusy(false);
  }
}

// ── Products ────────────────────────────────────────────────────────────────

function renderProducts() {
  const list = el("products-list");
  if (!list) return;
  const ordered = productsDisplayOrder(state.products);
  list.innerHTML = ordered
    .map((p) => {
      const child = isComponent(p);
      const created = (p.productCreateDate || "").slice(0, 10);
      return `
    <div class="border border-gray-200 rounded-lg p-3 flex gap-3 items-start bg-white ${child ? "ml-4 border-l-2 border-l-tech-purple" : ""}">
      ${thumbHtml(p, "w-12 h-12")}
      <div class="min-w-0 flex-1">
        <div class="font-bold text-sm truncate">${child ? "↳ " : ""}${esc(displayName(p))}</div>
        <div class="text-[10px] font-mono text-gray-400">${esc(p.sku)} · ${esc(p.productKind || "—")} · ${esc(p.stockMode)}${created ? " · " + esc(created) : ""}</div>
        <div class="text-xs text-gray-600 mt-0.5">HKD ${esc(String(p.priceHKD || 0))} · TWD ${esc(String(p.priceTWD || 0))} · JPY ${esc(String(p.priceJPY || 0))}</div>
        <div class="flex flex-wrap gap-2 mt-2">
          <button type="button" data-edit-p="${escAttr(p.sku)}" class="text-[10px] font-bold px-2 py-1 border border-black rounded">編輯</button>
          ${
            isSetProduct(p)
              ? `<button type="button" data-ensure-one="${escAttr(p.sku)}" class="text-[10px] font-bold px-2 py-1 border border-tech-purple rounded text-purple-800">子項目×6</button>`
              : ""
          }
          <button type="button" data-del-p="${escAttr(p.sku)}" class="text-[10px] font-bold px-2 py-1 border border-red-300 text-red-600 rounded">刪除</button>
        </div>
      </div>
    </div>`;
    })
    .join("") || `<p class="text-sm text-gray-400 text-center py-8">尚無商品</p>`;

  list.querySelectorAll("[data-edit-p]").forEach((b) => {
    b.addEventListener("click", () => openProductModal(b.getAttribute("data-edit-p")));
  });
  list.querySelectorAll("[data-del-p]").forEach((b) => {
    b.addEventListener("click", () => deleteProduct(b.getAttribute("data-del-p")));
  });
  list.querySelectorAll("[data-ensure-one]").forEach((b) => {
    b.addEventListener("click", () => ensureSetComponents(b.getAttribute("data-ensure-one")));
  });
}

function openProductModal(sku) {
  const modal = el("product-modal");
  const p = sku ? state.products.find((x) => x.sku === sku) : null;
  el("product-modal-title").textContent = p ? "編輯商品" : "新增 POS 商品";
  el("pf-sku").value = p?.sku || "";
  el("pf-sku").readOnly = !!p;
  el("pf-nameZh").value = p?.nameZh || "";
  el("pf-nameEn").value = p?.nameEn || "";
  el("pf-nameJp").value = p?.nameJp || "";
  el("pf-priceHKD").value = p?.priceHKD ?? 0;
  el("pf-priceTWD").value = p?.priceTWD ?? 0;
  el("pf-priceJPY").value = p?.priceJPY ?? 0;
  el("pf-stockMode").value = p?.stockMode || "limited";
  el("pf-category").value = p?.category || "";
  el("pf-thumbUrl").value = p?.thumbUrl || "";
  el("pf-notes").value = p?.notes || "";
  el("pf-active").checked = p ? p.active !== false : true;
  el("pf-source").value = p?.source || "pos_only";
  if (el("pf-productKind")) el("pf-productKind").value = p?.productKind || "standalone";
  if (el("pf-parentSku")) el("pf-parentSku").value = p?.parentSku || "";
  if (el("pf-sortOrder")) el("pf-sortOrder").value = p?.sortOrder ?? 0;
  if (el("pf-createDate")) {
    el("pf-createDate").value = releaseDateOnly(p) || "";
    el("pf-createDate").readOnly = false;
  }
  // parent options: non-components
  const parentSel = el("pf-parentSku");
  if (parentSel && parentSel.tagName === "SELECT") {
    const roots = state.products.filter((x) => !isComponent(x) && x.sku !== p?.sku);
    parentSel.innerHTML =
      `<option value="">— 無（主商品）—</option>` +
      roots
        .map(
          (x) =>
            `<option value="${escAttr(x.sku)}" ${p?.parentSku === x.sku ? "selected" : ""}>${esc(displayName(x))} (${esc(x.sku)})</option>`
        )
        .join("");
  }
  modal?.classList.remove("hidden");
}

async function saveProductForm(e) {
  e.preventDefault();
  const sku = el("pf-sku").value.trim();
  if (!sku) {
    toast("需要 SKU");
    return;
  }
  const productKind = el("pf-productKind")?.value || "standalone";
  const parentSku = el("pf-parentSku")?.value?.trim() || "";
  const product = {
    sku,
    source: el("pf-source").value || "pos_only",
    stockMode: el("pf-stockMode").value,
    nameZh: el("pf-nameZh").value.trim(),
    nameEn: el("pf-nameEn").value.trim(),
    nameJp: el("pf-nameJp").value.trim(),
    priceHKD: Number(el("pf-priceHKD").value) || 0,
    priceTWD: Number(el("pf-priceTWD").value) || 0,
    priceJPY: Number(el("pf-priceJPY").value) || 0,
    category: el("pf-category").value.trim(),
    thumbUrl: el("pf-thumbUrl").value.trim(),
    notes: el("pf-notes").value.trim(),
    active: el("pf-active").checked,
    productKind: parentSku ? "component" : productKind,
    parentSku: parentSku,
    sortOrder: Number(el("pf-sortOrder")?.value) || 0,
    productCreateDate: el("pf-createDate")?.value || undefined,
  };
  setBusy(true);
  try {
    const res = await api({ action: "upsert_product", product });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    el("product-modal")?.classList.add("hidden");
    toast("已儲存");
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

async function ensureSetComponents(skuOrEvent) {
  const sku = typeof skuOrEvent === "string" ? skuOrEvent : null;
  const msg = sku
    ? `為 ${sku} 產生最多 6 個空白子項目（若已有子項目則略過）？`
    : "為所有套組產生空白子項目（已有子項目的套組會略過）？";
  if (!confirm(msg)) return;
  setBusy(true);
  try {
    const payload = { action: "ensure_set_components", count: 6 };
    if (sku) payload.sku = sku;
    const res = await api(payload);
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast(`子項目：新增 ${res.placeholdersCreated || 0}（處理 ${res.processed || 0} 套）`);
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

async function deleteProduct(sku) {
  if (!confirm("刪除商品 " + sku + "？")) return;
  setBusy(true);
  try {
    const res = await api({ action: "delete_product", sku });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast("已刪除");
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

async function importFromStore() {
  if (typeof storeProducts === "undefined" || !Array.isArray(storeProducts)) {
    toast("找不到 storeProducts（請確認已載入 store.js）");
    return;
  }
  if (!confirm(`從網店匯入 ${storeProducts.length} 件商品？\n已存在的庫存數字會保留。`)) return;
  setBusy(true);
  try {
    const products = storeProducts.map((s) => ({
      id: s.id,
      title: s.title,
      priceHK: s.priceHK,
      priceTW: s.priceTW,
      priceJP: s.priceJP,
      category: s.category,
      imgs: s.imgs,
      isPreorder: !!s.isPreorder,
      isSoldOut: !!s.isSoldOut,
    }));
    const res = await api({ action: "import_store", products, preserveStock: true });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    toast(`匯入完成：新增 ${res.created} · 更新 ${res.updated}`);
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

// ── Events ──────────────────────────────────────────────────────────────────

function renderEvents() {
  const list = el("events-list");
  const sel = el("start-event-select");
  if (sel) {
    sel.innerHTML =
      `<option value="">— 選擇活動 —</option>` +
      state.events
        .map((e) => `<option value="${escAttr(e.eventId)}">${esc(e.name)} (${esc(e.region)}) · ${esc(e.status)}</option>`)
        .join("");
  }
  const day = el("start-event-day");
  if (day && !day.value) day.value = todayIso();

  if (!list) return;
  list.innerHTML = state.events
    .map(
      (e) => `
    <div class="border border-gray-200 rounded-lg p-3 bg-white">
      <div class="flex justify-between gap-2 items-start">
        <div>
          <div class="font-bold">${esc(e.name)}</div>
          <div class="text-[10px] font-mono text-gray-400">${esc(e.eventId)}</div>
          <div class="text-xs mt-1">${esc(e.region)} · ${esc(e.currency)} · <span class="font-bold ${e.status === "active" ? "text-emerald-600" : ""}">${esc(e.status)}</span></div>
          <div class="text-[10px] text-gray-500">${esc(e.startDate || "")} → ${esc(e.endDate || "")} · day ${esc(e.activeDay || "—")}</div>
        </div>
        <button type="button" data-edit-e="${escAttr(e.eventId)}" class="text-[10px] font-bold px-2 py-1 border rounded">編輯</button>
      </div>
    </div>`
    )
    .join("") || `<p class="text-sm text-gray-400 text-center py-6">尚未建立活動</p>`;

  list.querySelectorAll("[data-edit-e]").forEach((b) => {
    b.addEventListener("click", () => openEventModal(b.getAttribute("data-edit-e")));
  });
}

function openEventModal(eventId) {
  const e = eventId ? state.events.find((x) => x.eventId === eventId) : null;
  el("event-modal-title").textContent = e ? "編輯活動" : "新建活動";
  el("ef-eventId").value = e?.eventId || "";
  el("ef-name").value = e?.name || "";
  el("ef-region").value = e?.region || "TW";
  el("ef-currency").value = e?.currency || "TWD";
  el("ef-startDate").value = (e?.startDate || "").slice(0, 10);
  el("ef-endDate").value = (e?.endDate || "").slice(0, 10);
  el("ef-notes").value = e?.notes || "";
  el("event-modal")?.classList.remove("hidden");
}

async function saveEventForm(ev) {
  ev.preventDefault();
  const region = el("ef-region").value;
  const event = {
    eventId: el("ef-eventId").value.trim() || undefined,
    name: el("ef-name").value.trim(),
    region,
    currency: el("ef-currency").value || POS_CONFIG.currencyByRegion[region] || "HKD",
    startDate: el("ef-startDate").value,
    endDate: el("ef-endDate").value,
    notes: el("ef-notes").value.trim(),
    status: "planned",
  };
  if (!event.name) {
    toast("需要活動名稱");
    return;
  }
  setBusy(true);
  try {
    const res = await api({ action: "upsert_event", event });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    el("event-modal")?.classList.add("hidden");
    toast("活動已儲存");
    await bootstrap();
  } finally {
    setBusy(false);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

function renderSummaryForm() {
  const sel = el("summary-event");
  if (!sel) return;
  sel.innerHTML =
    state.events
      .map((e) => `<option value="${escAttr(e.eventId)}">${esc(e.name)} (${esc(e.region)})</option>`)
      .join("") || `<option value="">—</option>`;
  if (state.activeEvent) sel.value = state.activeEvent.eventId;
  const day = el("summary-day");
  if (day && !day.value) day.value = state.activeEvent?.activeDay || todayIso();
}

async function loadSummary() {
  const eventId = el("summary-event")?.value;
  const day = el("summary-day")?.value;
  if (!eventId || !day) {
    toast("選擇活動與日期");
    return;
  }
  setBusy(true);
  try {
    const res = await api({ action: "daily_summary", eventId, day });
    if (!res.ok) {
      toast(res.message || res.error);
      return;
    }
    state.summary = res.summary;
    renderSummaryResult();
  } finally {
    setBusy(false);
  }
}

function renderSummaryResult() {
  const box = el("summary-result");
  const s = state.summary;
  if (!box || !s) return;
  const lines = (s.bySku || [])
    .map(
      (l) =>
        `<tr class="border-b border-gray-100">
          <td class="py-1.5 pr-2 text-sm">${esc(l.name)}</td>
          <td class="py-1.5 text-right font-mono text-xs">${esc(String(l.qty))}</td>
          <td class="py-1.5 text-right font-mono text-xs">${esc(String(l.revenue))}</td>
        </tr>`
    )
    .join("");
  box.innerHTML = `
    <div class="bg-black text-white rounded-xl p-4 mb-4">
      <div class="text-[10px] uppercase tracking-widest text-tech-purple font-bold">Daily summary</div>
      <div class="font-bold text-lg mt-1">${esc(s.eventName)} · ${esc(s.day)}</div>
      <div class="text-sm text-gray-300 mt-1">${esc(s.region)} · ${esc(s.currency)}</div>
      <div class="grid grid-cols-3 gap-2 mt-4 text-center">
        <div><div class="text-2xl font-bold text-tech-purple">${esc(String(s.gross))}</div><div class="text-[10px] text-gray-400">營收</div></div>
        <div><div class="text-2xl font-bold">${esc(String(s.totalQty))}</div><div class="text-[10px] text-gray-400">件數</div></div>
        <div><div class="text-2xl font-bold">${esc(String(s.saleCount))}</div><div class="text-[10px] text-gray-400">筆數</div></div>
      </div>
    </div>
    <table class="w-full text-left mb-4">
      <thead><tr class="text-[10px] text-gray-400 uppercase">
        <th class="py-1">商品</th><th class="py-1 text-right">qty</th><th class="py-1 text-right">revenue</th>
      </tr></thead>
      <tbody>${lines || `<tr><td colspan="3" class="text-center text-gray-400 py-4 text-sm">當日無銷售</td></tr>`}</tbody>
    </table>`;
}

function copySummary() {
  const s = state.summary;
  if (!s) {
    toast("先載入摘要");
    return;
  }
  const lines = (s.bySku || []).map((l) => `${l.name}\t${l.qty}\t${l.revenue}`).join("\n");
  const text = [
    `${s.eventName} · ${s.day} · ${s.region} · ${s.currency}`,
    `Gross: ${s.gross} · Qty: ${s.totalQty} · Sales: ${s.saleCount}`,
    "",
    "Name\tQty\tRevenue",
    lines,
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => toast("已複製"),
    () => toast("複製失敗")
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function displayName(p) {
  return p.nameZh || p.nameEn || p.nameJp || p.sku;
}

function priceFor(p, currency) {
  const c = String(currency || "HKD").toUpperCase();
  if (c === "TWD") return Number(p.priceTWD) || 0;
  if (c === "JPY") return Number(p.priceJPY) || 0;
  return Number(p.priceHKD) || 0;
}

function poolStock(p, pool) {
  return Number(p[stockKey(pool)]) || 0;
}

function stockKey(pool) {
  return "stock" + String(pool || "").toUpperCase();
}

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function el(id) {
  return document.getElementById(id);
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s) {
  return esc(s).replace(/'/g, "&#39;");
}

function setBusy(on) {
  state.busy = !!on;
  document.body.classList.toggle("is-busy", !!on);
}

function toast(msg) {
  const t = el("toast");
  if (!t) {
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.classList.remove("opacity-0", "pointer-events-none");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    t.classList.add("opacity-0", "pointer-events-none");
  }, 2600);
}
