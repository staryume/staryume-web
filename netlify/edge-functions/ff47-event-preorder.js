/**
 * Proxy FF47 booth backorder POSTs to Apps Script so the page can read the serial.
 * Path: /api/ff47-event-preorder
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxqUNlWTjXB3CO4M6GpiAHg4SOPKeuZYFJmxsDz27M_OlFxgeJgyuTAC5Rh7gvxsuPu/exec";

const MAX_BODY_BYTES = 80_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20;

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const ip = clientIp(request);
  if (!allowRate(ip)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "bad_body" }, 400);
  }
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "body_too_large" }, 413);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  if (!data || typeof data !== "object") {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }
  if (!data.name || !data.email || !data.phone || !data.address) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return json({ ok: false, error: "missing_items" }, 400);
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
    });
    const text = await upstream.text();
    let parsed = null;
    try {
      if (text && text.trim().startsWith("{")) parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (parsed) return json(parsed, parsed.ok === false ? 200 : 200);
    if (upstream.ok) return json({ ok: true }, 200);
    return json({ ok: false, error: "upstream_error", status: upstream.status }, 502);
  } catch (err) {
    console.error("ff47-event-preorder proxy error:", err);
    return json({ ok: false, error: "proxy_failed" }, 502);
  }
};

export const config = {
  path: "/api/ff47-event-preorder",
};

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("client-ip") ||
    "unknown"
  );
}

function allowRate(ip) {
  const now = Date.now();
  const prev = hitsByIp.get(ip) || [];
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  if (hitsByIp.size > 5000) {
    const first = hitsByIp.keys().next().value;
    hitsByIp.delete(first);
  }
  return true;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://staryu.me",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}
