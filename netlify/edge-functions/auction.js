/**
 * Proxy FF47 色紙 auction POSTs to Google Apps Script.
 * Path: /api/auction
 *
 * After deploying docs/auction-Code.gs, paste the /exec URL here
 * (or set Netlify env AUCTION_APPS_SCRIPT_URL).
 *
 * Config/status reads are not rate-limited (the page polls them).
 * Bid / staff_bid / close are rate-limited per IP.
 */
const APPS_SCRIPT_URL =
  Deno.env.get("AUCTION_APPS_SCRIPT_URL") ||
  "https://script.google.com/macros/s/AKfycbxfD2ufRNgLyEieH4htuZK63acboxz4SSBgu0p_rCZRAj2YzZO9QJMQwFJTlmvjq_RtLg/exec";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20;
const STALE_CACHE_MS = 120 * 1000;
const FALLBACK_END_MS = Date.parse("2026-08-23T15:00:00+08:00");

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

/** Isolate-local cache so many open tabs share one Apps Script round-trip. */
let configCache = { body: "", expires: 0, stored: 0 };
let lastEndAtMs = FALLBACK_END_MS;

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!APPS_SCRIPT_URL) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  if (request.method === "GET") {
    return proxyConfigGet(request);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "bad_body" }, 400);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (data && (data.website || data.hp || data._gotcha)) {
    return json({ ok: true, ignored: true }, 200);
  }

  const action = String((data && data.action) || "bid").toLowerCase();
  if (action === "config" || action === "status") {
    return proxyConfigPost();
  }

  const ip = clientIp(request);
  if (action !== "staff_bid" && !allowRate(ip)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
    });
    const text = await upstream.text();
    if (looksOk(text)) invalidateConfigCache();
    return jsonText(text, 200, { "Cache-Control": "no-store" });
  } catch (err) {
    return json({ ok: false, error: "upstream", message: String(err) }, 502);
  }
};

export const config = {
  path: "/api/auction",
};

async function proxyConfigGet(request) {
  const fresh = serveFreshCache();
  if (fresh) return fresh;

  const u = new URL(APPS_SCRIPT_URL);
  const incoming = new URL(request.url);
  incoming.searchParams.forEach((v, k) => u.searchParams.set(k, v));
  if (!u.searchParams.get("action")) u.searchParams.set("action", "config");
  try {
    const upstream = await fetch(u.toString(), { method: "GET", redirect: "follow" });
    const text = await upstream.text();
    rememberConfig(text);
    return jsonText(text, 200, cacheHeaders());
  } catch (err) {
    const stale = serveStaleCache();
    if (stale) return stale;
    return json({ ok: false, error: "upstream", message: String(err) }, 502);
  }
}

async function proxyConfigPost() {
  const fresh = serveFreshCache();
  if (fresh) return fresh;
  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "config" }),
      redirect: "follow",
    });
    const text = await upstream.text();
    rememberConfig(text);
    return jsonText(text, 200, cacheHeaders());
  } catch (err) {
    const stale = serveStaleCache();
    if (stale) return stale;
    return json({ ok: false, error: "upstream", message: String(err) }, 502);
  }
}

function looksOk(text) {
  if (!text || !text.trim().startsWith("{")) return false;
  try {
    const obj = JSON.parse(text);
    return !!(obj && obj.ok);
  } catch {
    return false;
  }
}

function msLeft() {
  return lastEndAtMs - Date.now();
}

/** Collapse duplicate polls, but stay tight in the final minutes. Never CDN-cache. */
function configCacheMs() {
  const left = msLeft();
  if (left <= 2 * 60 * 1000) return 0;
  if (left <= 15 * 60 * 1000) return 1000;
  if (left <= 60 * 60 * 1000) return 2500;
  return 5000;
}

function rememberConfig(text) {
  if (!looksOk(text)) return;
  try {
    const obj = JSON.parse(text);
    if (obj && obj.endAtMs) lastEndAtMs = obj.endAtMs;
  } catch {
    /* keep lastEndAtMs */
  }
  const now = Date.now();
  const ttl = configCacheMs();
  configCache = {
    body: text,
    expires: ttl > 0 ? now + ttl : 0,
    stored: now,
  };
}

function invalidateConfigCache() {
  configCache = { body: "", expires: 0, stored: 0 };
}

function serveFreshCache() {
  if (configCache.body && configCache.expires && Date.now() < configCache.expires) {
    return jsonText(configCache.body, 200, cacheHeaders());
  }
  return null;
}

function serveStaleCache() {
  if (configCache.body && Date.now() - configCache.stored < STALE_CACHE_MS) {
    return jsonText(configCache.body, 200, cacheHeaders());
  }
  return null;
}

function cacheHeaders() {
  return {
    "Cache-Control": "no-store",
    "Netlify-CDN-Cache-Control": "no-store",
  };
}

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function allowRate(ip) {
  const now = Date.now();
  const prev = (hitsByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX) {
    hitsByIp.set(ip, prev);
    return false;
  }
  prev.push(now);
  hitsByIp.set(ip, prev);
  return true;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function jsonText(text, status, extra) {
  const body = text && text.trim().startsWith("{") ? text : JSON.stringify({ ok: false, error: "bad_upstream" });
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...(extra || {}),
    },
  });
}
