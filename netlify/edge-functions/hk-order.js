/**
 * Proxy store order POSTs to Google Apps Script with abuse controls.
 * Actions: create (default) | get | update | cancel | check
 * Path: /api/hk-order
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzujFWTxCxOCkPSkxzQ7ykj6uwvbZbj7N053QY6QIydDmSsodN2_w-IFcCHI-RJt9QBgw/exec";

const MAX_BODY_BYTES = 3_500_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;

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

  if (data && (data.website || data.hp || data._gotcha)) {
    return json({ ok: true, orderId: "HK-IGNORED" }, 200);
  }

  if (!data || typeof data !== "object") {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  const action = String(data.action || "create").toLowerCase();

  if (action === "get" || action === "update" || action === "cancel") {
    if (!data.orderId || !data.email) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }
  } else if (action === "check") {
    if (!data.email) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }
  } else {
    // create
    const totalOk = data.totalHkd != null || data.total != null;
    if (!data.orderId || !data.email || !data.name || !totalOk) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }
    if (data.totalHkd == null && data.total != null) data.totalHkd = data.total;

    const totalNum = Number(data.totalHkd != null ? data.totalHkd : data.total);
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      return json({ ok: false, error: "invalid_total" }, 400);
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return json({ ok: false, error: "missing_items" }, 400);
    }

    // Only Taiwan pre-order may skip payment proof. Never trust client
    // orderType/paymentMethod alone — HK paid orders always need a screenshot.
    const region = String(data.region || "HK").toUpperCase();
    const claimsPreorder =
      data.orderType === "preorder" || data.paymentMethod === "preorder_on_site";
    const isPreorder = region === "TW" && claimsPreorder;

    if (region !== "TW" && claimsPreorder) {
      data.orderType = "paid";
      if (data.paymentMethod === "preorder_on_site") data.paymentMethod = "";
    }

    if (!isPreorder) {
      if (!data.proof || !data.proof.dataUrl || typeof data.proof.dataUrl !== "string") {
        return json({ ok: false, error: "missing_proof" }, 400);
      }
      if (!String(data.proof.dataUrl).startsWith("data:image/")) {
        return json({ ok: false, error: "invalid_proof_type" }, 400);
      }
    } else if (data.proof && !data.proof.dataUrl) {
      data.proof = null;
    }
  }

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
      // Business errors (cooldown, closed) still return 200 with ok:false from script
      const status =
        parsed.ok === false && isHardProxyError(parsed.error) ? 502 : 200;
      return json(parsed, status);
    }

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

function isHardProxyError(code) {
  return code === "proxy_failed" || code === "upstream_error";
}

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
