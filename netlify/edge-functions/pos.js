/**
 * Proxy staff POS / inventory POSTs to Google Apps Script with rate limits.
 * Path: /api/pos
 *
 * Set POS_APPS_SCRIPT_URL after you deploy docs/pos-Code.gs as a web app.
 * Localhost clients may also call scriptUrlDirect from pos.js config.
 */
const POS_APPS_SCRIPT_URL =
  Deno.env.get("POS_APPS_SCRIPT_URL") ||
  "https://script.google.com/macros/s/AKfycbx172jxXoEpAI0d2KwfoiHUtYTbddrMHyJCwZQh3CfbKOPhrMwf5FYhrDqO75AteddF/exec";

const MAX_BODY_BYTES = 2_000_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** Higher than store checkout — booth sales + SAVE ALL / inventory edits. */
const RATE_MAX = 200;

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!POS_APPS_SCRIPT_URL || POS_APPS_SCRIPT_URL.includes("REPLACE_WITH")) {
    return json(
      {
        ok: false,
        error: "not_configured",
        message: "POS Apps Script URL not set. See docs/pos-apps-script.md",
      },
      503
    );
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

  const action = String(data.action || "").toLowerCase();
  if (!action) {
    return json({ ok: false, error: "missing_action" }, 400);
  }

  // Staff actions need a passcode present (actual check is in Apps Script)
  const serviceActions = new Set(["web_deduct", "web_check"]);
  if (serviceActions.has(action)) {
    if (!data.serviceKey) {
      return json({ ok: false, error: "missing_service_key" }, 401);
    }
  } else if (!data.passcode && !data.password) {
    return json({ ok: false, error: "missing_passcode" }, 401);
  }

  try {
    const upstream = await fetch(POS_APPS_SCRIPT_URL, {
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
      return json(parsed, 200);
    }

    if (upstream.ok) {
      return json({ ok: true }, 200);
    }
    return json({ ok: false, error: "upstream_error", status: upstream.status }, 502);
  } catch (err) {
    console.error("pos proxy error:", err);
    return json({ ok: false, error: "proxy_failed" }, 502);
  }
};

export const config = {
  path: "/api/pos",
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
