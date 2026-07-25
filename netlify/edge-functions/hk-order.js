/**
 * Proxy HK checkout POSTs to Google Apps Script with basic abuse controls:
 * - Method POST only
 * - Max body size
 * - Per-IP rate limit (best-effort, per edge isolate)
 * - Honeypot field rejection
 * - Require order-shaped JSON + proof dataUrl
 *
 * Path: /api/hk-order
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzujFWTxCxOCkPSkxzQ7ykj6uwvbZbj7N053QY6QIydDmSsodN2_w-IFcCHI-RJt9QBgw/exec";

const MAX_BODY_BYTES = 3_500_000; // ~3.5MB after client compression
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 8; // max successful-looking attempts per IP per window

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
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

  // Honeypot (client may send website field)
  if (data && (data.website || data.hp || data._gotcha)) {
    // Fake success so bots think it worked
    return json({ ok: true, orderId: "HK-IGNORED" }, 200);
  }

  if (!data || typeof data !== "object") {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  const totalOk = data.totalHkd != null || data.total != null;
  if (!data.orderId || !data.email || !data.name || !totalOk) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }
  // Normalize total for Apps Script (legacy field totalHkd = amount in order currency)
  if (data.totalHkd == null && data.total != null) data.totalHkd = data.total;

  if (!data.proof || !data.proof.dataUrl || typeof data.proof.dataUrl !== "string") {
    return json({ ok: false, error: "missing_proof" }, 400);
  }

  if (!String(data.proof.dataUrl).startsWith("data:image/")) {
    return json({ ok: false, error: "invalid_proof_type" }, 400);
  }

  // Strip honeypot-ish keys before forward
  delete data.website;
  delete data.hp;
  delete data._gotcha;

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
      const status = parsed.ok === false ? 502 : 200;
      return json(parsed, status);
    }

    // Apps Script sometimes returns empty/opaque after redirect — treat 2xx as ok
    if (upstream.ok) {
      return json({ ok: true, orderId: data.orderId }, 200);
    }
    return json({ ok: false, error: "upstream_error", status: upstream.status }, 502);
  } catch (err) {
    console.error("hk-order proxy error:", err);
    return json({ ok: false, error: "proxy_failed" }, 502);
  }
};

export const config = {
  path: "/api/hk-order",
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
  // Bound map size
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
