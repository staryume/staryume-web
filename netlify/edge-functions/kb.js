/**
 * Private knowledge vault. Data in Netlify Blobs (not Git).
 * Path: /api/kb
 *
 * Env (Netlify UI → Environment variables):
 *   KB_PASS    — your unlock passphrase
 *   KB_SECRET  — random string for signing the session cookie (optional; defaults from KB_PASS)
 */
import { getStore } from "@netlify/blobs";

const COOKIE = "staryume_kb";
const COOKIE_PATH = "/api/kb";
const MAX_BODY = 4_500_000;
const SESSION_DAYS = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

const EMPTY_VAULT = {
  v: 1,
  initialized: false,
  folders: [
    "Travel",
    "Money",
    "賣貨便",
    "Events",
    "Suppliers",
    "Food",
    "Subscriptions",
    "FF SOP",
    "Other",
  ],
  pages: [],
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const ip = clientIp(request);
  const url = new URL(request.url);

  let data = {};
  if (request.method === "POST" || request.method === "PUT") {
    let raw;
    try {
      raw = await request.text();
    } catch {
      return json({ ok: false, error: "bad_body" }, 400);
    }
    if (raw && raw.length > MAX_BODY) return json({ ok: false, error: "body_too_large" }, 413);
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        return json({ ok: false, error: "invalid_json" }, 400);
      }
    }
  }

  const action = String(data.action || url.searchParams.get("action") || "vault").toLowerCase();

  const pass = env("KB_PASS");
  if (!pass) {
    return json({
      ok: false,
      error: "needs_setup",
      message: "Set KB_PASS in Netlify environment variables, then unlock at /kb.html",
    }, 503);
  }

  if (action === "unlock" && request.method === "POST") {
    if (!allowRate(ip, 8)) return json({ ok: false, error: "rate_limited" }, 429);
    const given = String(data.passphrase || "");
    if (!given || given !== pass) return json({ ok: false, error: "bad_pass" }, 401);
    const token = await makeSession(pass);
    const headers = corsHeaders();
    headers.append("Set-Cookie", cookieHeader(token, url.protocol === "https:"));
    return json({ ok: true }, 200, headers);
  }

  if (action === "logout") {
    const headers = corsHeaders();
    headers.append("Set-Cookie", `${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Lax`);
    return json({ ok: true }, 200, headers);
  }

  if (action === "share") {
    if (!allowRate(ip, 40)) return json({ ok: false, error: "rate_limited" }, 429);
    const token = String(data.token || url.searchParams.get("t") || "").trim();
    if (!token || token.length < 16) return json({ ok: false, error: "not_found" }, 404);
    const vault = await readVault();
    const page = (vault.pages || []).find((p) => p.shareToken && p.shareToken === token);
    if (!page) return json({ ok: false, error: "not_found" }, 404);
    return json({
      ok: true,
      page: {
        title: page.title,
        folder: page.folder,
        updatedAt: page.updatedAt,
        blocks: page.blocks || [],
      },
    });
  }

  if (!allowRate(ip, 180)) return json({ ok: false, error: "rate_limited" }, 429);

  const authed = await sessionOk(request, pass);
  if (!authed) return json({ ok: false, error: "unauthorized" }, 401);

  if (action === "vault" && request.method === "GET") {
    return json({ ok: true, vault: await readVault() });
  }

  if (action === "vault" && (request.method === "POST" || request.method === "PUT")) {
    const vault = sanitizeVault(data.vault);
    if (!vault) return json({ ok: false, error: "invalid_vault" }, 400);
    vault.initialized = true;
    await writeVault(vault);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_action" }, 400);
};

export const config = { path: "/api/kb" };

function env(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env && Netlify.env.get) return Netlify.env.get(name) || "";
  } catch { /* ignore */ }
  try {
    if (typeof Deno !== "undefined" && Deno.env && Deno.env.get) return Deno.env.get(name) || "";
  } catch { /* ignore */ }
  return "";
}

function store() {
  return getStore({ name: "staryume-kb", consistency: "strong" });
}

async function readVault() {
  try {
    const raw = await store().get("vault", { type: "json" });
    if (raw && typeof raw === "object") return sanitizeVault(raw) || structuredClone(EMPTY_VAULT);
  } catch { /* first run */ }
  return structuredClone(EMPTY_VAULT);
}

async function writeVault(vault) {
  await store().setJSON("vault", vault);
}

function sanitizeVault(raw) {
  if (!raw || typeof raw !== "object") return null;
  const folders = Array.isArray(raw.folders)
    ? raw.folders.map((f) => String(f || "").trim()).filter(Boolean).slice(0, 40)
    : EMPTY_VAULT.folders.slice();
  const pages = Array.isArray(raw.pages)
    ? raw.pages.map(sanitizePage).filter(Boolean).slice(0, 400)
    : [];
  return {
    v: 1,
    initialized: !!(raw.initialized || pages.length),
    folders: folders.length ? folders : EMPTY_VAULT.folders.slice(),
    pages,
  };
}

function sanitizePage(p) {
  if (!p || typeof p !== "object") return null;
  const id = String(p.id || "").slice(0, 80);
  if (!id) return null;
  let shareToken = p.shareToken == null || p.shareToken === "" ? null : String(p.shareToken);
  if (shareToken) {
    shareToken = shareToken.replace(/[^a-fA-F0-9]/g, "").slice(0, 64);
    if (shareToken.length < 16) shareToken = null;
  }
  return {
    id,
    title: String(p.title || "Untitled").slice(0, 200),
    folder: String(p.folder || "Other").slice(0, 80),
    updatedAt: String(p.updatedAt || "").slice(0, 40),
    shareToken,
    blocks: Array.isArray(p.blocks) ? p.blocks.slice(0, 100) : [],
  };
}

async function makeSession(pass) {
  const secret = env("KB_SECRET") || ("kb:" + pass);
  const exp = String(Date.now() + SESSION_DAYS * 86400000);
  const sig = await hmac(secret, exp);
  return exp + "." + sig;
}

async function sessionOk(request, pass) {
  const raw = cookie(request, COOKIE);
  if (!raw || !raw.includes(".")) return false;
  const secret = env("KB_SECRET") || ("kb:" + pass);
  const [exp, sig] = raw.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expect = await hmac(secret, exp);
  return timingSafeEqual(sig, expect);
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function cookie(request, name) {
  const h = request.headers.get("cookie") || "";
  const parts = h.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice(name.length + 1);
  }
  return "";
}

function cookieHeader(token, secure) {
  const sec = secure ? "Secure; " : "";
  return `${COOKIE}=${token}; Path=${COOKIE_PATH}; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; ${sec}SameSite=Lax`;
}

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function allowRate(ip, max) {
  const now = Date.now();
  const prev = hitsByIp.get(ip) || [];
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= max) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "https://staryu.me",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  });
}

function json(obj, status = 200, headers) {
  const h = headers || corsHeaders();
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  h.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(JSON.stringify(obj), { status, headers: h });
}
