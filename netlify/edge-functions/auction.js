/**
 * Proxy FF47 色紙 auction POSTs to Google Apps Script.
 * Path: /api/auction
 *
 * After deploying docs/auction-Code.gs, paste the /exec URL here
 * (or set Netlify env AUCTION_APPS_SCRIPT_URL).
 */
const APPS_SCRIPT_URL = Deno.env.get("AUCTION_APPS_SCRIPT_URL") || "";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

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

  const ip = clientIp(request);
  if (!allowRate(ip)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  if (request.method === "GET") {
    const u = new URL(APPS_SCRIPT_URL);
    const incoming = new URL(request.url);
    incoming.searchParams.forEach((v, k) => u.searchParams.set(k, v));
    if (!u.searchParams.get("action")) u.searchParams.set("action", "config");
    try {
      const upstream = await fetch(u.toString(), { method: "GET", redirect: "follow" });
      const text = await upstream.text();
      return jsonText(text, 200);
    } catch (err) {
      return json({ ok: false, error: "upstream", message: String(err) }, 502);
    }
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

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
    });
    const text = await upstream.text();
    return jsonText(text, 200);
  } catch (err) {
    return json({ ok: false, error: "upstream", message: String(err) }, 502);
  }
};

export const config = {
  path: "/api/auction",
};

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

function jsonText(text, status) {
  const body = text && text.trim().startsWith("{") ? text : JSON.stringify({ ok: false, error: "bad_upstream" });
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}
