/**
 * Proxy summer questionnaire POSTs to Apps Script.
 * Path: /api/survey
 *
 * Set SURVEY_APPS_SCRIPT_URL after you deploy docs/survey-Code.gs as a web app.
 * Localhost clients may also call SCRIPT_URL_DIRECT from survey.html.
 */
const APPS_SCRIPT_URL =
  Deno.env.get("SURVEY_APPS_SCRIPT_URL") ||
  "https://script.google.com/macros/s/AKfycbxGpA6yDeUDhHnLNeuDWAW_O4po6So7pf-QLKrdniSK7aQMjeNGxcJ2I27yZQj74vLI/exec";

const MAX_BODY_BYTES = 40_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_SUBMIT = 12;
const RATE_MAX_STAFF = 80;

/** @type {Map<string, number[]>} */
const hitsByIp = new Map();

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("REPLACE_WITH")) {
    return json(
      {
        ok: false,
        error: "not_configured",
        message: "Survey Apps Script URL not set. See docs/survey-apps-script.md",
      },
      503
    );
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

  const action = String(data.action || "submit").toLowerCase();
  const ip = clientIp(request);
  const staff = action !== "submit";
  if (!allowRate(ip, staff ? RATE_MAX_STAFF : RATE_MAX_SUBMIT)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  if (action === "submit") {
    if (data.website || data.hp || data._gotcha) {
      return json({ ok: true, serial: "IGNORED" }, 200);
    }
    const email = String(data.email || "").trim();
    if (!email) return json({ ok: false, error: "bad_email", field: "email" }, 400);
    const lang = String(data.lang || "").trim().toLowerCase();
    if (lang !== "jp" && lang !== "zh" && lang !== "ja") {
      return json({ ok: false, error: "bad_lang", field: "lang" }, 400);
    }
    const event = String(data.event || "").trim().toLowerCase();
    if (lang === "zh" || lang === "zh-hant") {
      const okEvent = event === "acghk" || event === "acghk2026" || event === "ff47" || event === "ff";
      if (!okEvent) return json({ ok: false, error: "bad_event", field: "event" }, 400);
    }
    const q2 = scaleValue(data.q2);
    const q3 = scaleValue(data.q3);
    const q4 = scaleValue(data.q4);
    const q7 = scaleValue(data.q7);
    if (!q2) return json({ ok: false, error: "missing_score", field: "q2" }, 400);
    if (!q3) return json({ ok: false, error: "missing_score", field: "q3" }, 400);
    if (!q4) return json({ ok: false, error: "missing_score", field: "q4" }, 400);
    if (!q7) return json({ ok: false, error: "missing_score", field: "q7" }, 400);
    const isFf47 = event === "ff47" || event === "ff";
    if (isFf47 && !scaleValue(data.q1)) {
      return json({ ok: false, error: "missing_score", field: "q1" }, 400);
    }
  } else if (!data.passcode && !data.password) {
    return json({ ok: false, error: "unauthorized" }, 401);
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
    if (parsed) return json(parsed, 200);
    if (upstream.ok) return json({ ok: true }, 200);
    return json({ ok: false, error: "upstream_error", status: upstream.status }, 502);
  } catch (err) {
    console.error("survey proxy error:", err);
    return json({ ok: false, error: "proxy_failed" }, 502);
  }
};

export const config = {
  path: "/api/survey",
};

function scaleValue(v) {
  if (v && typeof v === "object") v = v.score;
  const s = String(v == null ? "" : v).trim().toLowerCase();
  if (s === "na" || s === "1" || s === "2" || s === "3" || s === "4" || s === "5") return s;
  return "";
}

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("client-ip") ||
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
