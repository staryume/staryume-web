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

  const country = String(context?.geo?.country?.code || "").toUpperCase();
  // Taiwan → TW store; Hong Kong and everyone else → HK
  const region = country === "TW" ? "TW" : "HK";

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
