/**
 * Proxy HK book form POSTs to Apps Script. Rejects missing 流水號 here
 * so a stale script cannot silently drop it. Path: /api/hk-form
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbylUcTL4YOQ4gm25J1CMb_fE8HZmecGg2UuuKZ7FtyWW_o7lJlveOod8TmWbt8Tm-_rmA/exec";

const MAX_BODY_BYTES = 40_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 12;

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
  if (data.website || data.hp || data._gotcha) {
    return json({ ok: true, serial: "IGNORED" }, 200);
  }

  const serial = String(data.serial || "").trim().replace(/\s+/g, "");
  if (!serial) {
    return json({ ok: false, error: "missing_serial" }, 400);
  }
  data.serial = serial;
  if (!data.name || !data.email || !data.method) {
    return json({ ok: false, error: "missing_fields" }, 400);
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
    if (parsed) {
      if (parsed.ok && !parsed.serial) parsed.serial = serial;
      return json(parsed, 200);
    }
    if (upstream.ok) return json({ ok: true, serial: serial }, 200);
    return json({ ok: false, error: "upstream_error", status: upstream.status }, 502);
  } catch (err) {
    console.error("hk-form proxy error:", err);
    return json({ ok: false, error: "proxy_failed" }, 502);
  }
};

export const config = {
  path: "/api/hk-form",
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
