/**
 * Return visitor country for store region default.
 * Netlify provides geo on the edge context (no third-party IP API).
 *
 * Path: /api/geo
 */
export default async (request, context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const country = visitorCountry(request, context);
  // Taiwan → TW, Japan → JP, everyone else → HK
  const region =
    country === "TW" || country === "TWN" ? "TW" :
    country === "JP" || country === "JPN" ? "JP" :
    "HK";

  return json(
    {
      ok: true,
      country: country || null,
      region,
    },
    200
  );
};

export const config = {
  path: "/api/geo",
};

function visitorCountry(request, context) {
  const geo = context?.geo || {};
  const countryObj = geo.country;
  const fromGeo =
    (typeof countryObj === "string" && countryObj) ||
    (countryObj && countryObj.code) ||
    geo.countryCode ||
    "";
  const headers = request.headers;
  const fromHeader =
    headers.get("x-nf-country") ||
    headers.get("x-country") ||
    headers.get("cf-ipcountry") ||
    "";
  return String(fromGeo || fromHeader || "").trim().toUpperCase();
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
