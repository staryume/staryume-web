/**
 * Inject per-post Open Graph / Twitter meta for Facebook & crawlers.
 * Crawlers do not run client JS, so static post.html always looked generic.
 *
 * Path: /post.html?id=N
 */
export default async (request, context) => {
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const response = await context.next();

  if (!idParam) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html;
  try {
    html = await response.text();
  } catch {
    return response;
  }

  try {
    const dataRes = await fetch(new URL("/data.js", url.origin).toString(), {
      headers: { Accept: "text/javascript,application/javascript,text/plain,*/*" },
    });
    if (!dataRes.ok) return htmlResponse(html, response);

    const dataText = await dataRes.text();
    // data.js defines: const siteData = { ... };
    const siteData = new Function(`${dataText}\nreturn siteData;`)();
    const post = (siteData.posts || []).find((p) => String(p.id) === String(idParam));
    if (!post) return htmlResponse(html, response);

    const title =
      pickLang(post.title, ["zh", "jp", "en"]) || `Post #${idParam}`;
    const raw =
      pickLang(post.content, ["zh", "jp", "en"]) || "";
    const description = toPlainText(raw).slice(0, 180) || "STARYUME WEB Blog";
    // Prefer dedicated 1200×630 ogImage for large Facebook/Messenger cards
    const imagePath = post.ogImage || post.img;
    const image =
      toAbsoluteUrl(imagePath, url.origin) || `${url.origin}/assets/coreimg/logo.png`;
    const imageWidth = Number(post.ogImageWidth) || (post.ogImage ? 1200 : 0);
    const imageHeight = Number(post.ogImageHeight) || (post.ogImage ? 630 : 0);
    const pageUrl = `${url.origin}/post.html?id=${encodeURIComponent(idParam)}`;
    const fullTitle = `${title} | STARYUME WEB`;

    const meta = buildMetaTags({
      fullTitle,
      title,
      description,
      image,
      imageWidth,
      imageHeight,
      pageUrl,
      tag: post.tag || "article",
    });

    html = injectMeta(html, meta, fullTitle);
    return htmlResponse(html, response);
  } catch (err) {
    console.error("og-post edge error:", err);
    return htmlResponse(html, response);
  }
};

export const config = {
  path: "/post.html",
};

function pickLang(obj, order) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  for (const k of order) {
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]);
  }
  return "";
}

function toPlainText(md) {
  return String(md)
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteUrl(path, origin) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\.\//, "").replace(/^\//, "");
  return `${origin.replace(/\/$/, "")}/${clean}`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags({
  fullTitle,
  title,
  description,
  image,
  imageWidth,
  imageHeight,
  pageUrl,
  tag,
}) {
  const t = escapeAttr(title);
  const ft = escapeAttr(fullTitle);
  const d = escapeAttr(description);
  const img = escapeAttr(image);
  const u = escapeAttr(pageUrl);
  const sizeTags =
    imageWidth > 0 && imageHeight > 0
      ? `
    <meta property="og:image:width" content="${imageWidth}">
    <meta property="og:image:height" content="${imageHeight}">
    <meta property="og:image:type" content="image/jpeg">`
      : "";
  return `
    <title>${ft}</title>
    <meta name="description" content="${d}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="STARYUME WEB">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${d}">
    <meta property="og:image" content="${img}">
    <meta property="og:image:secure_url" content="${img}">${sizeTags}
    <meta property="og:image:alt" content="${t}">
    <meta property="og:url" content="${u}">
    <meta property="og:locale" content="zh_HK">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${d}">
    <meta name="twitter:image" content="${img}">
    <meta name="author" content="staryume">
  `.replace(/\n\s+/g, "\n    ");
}

function injectMeta(html, metaBlock, fullTitle) {
  // Remove existing title + common social tags so we don't duplicate
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");

  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1>\n${metaBlock}\n`);
  } else {
    out = metaBlock + out;
  }
  return out;
}

function htmlResponse(html, original) {
  const headers = new Headers(original.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  // Allow Facebook to re-fetch when content changes
  headers.set("cache-control", "public, max-age=300");
  return new Response(html, {
    status: original.status,
    statusText: original.statusText,
    headers,
  });
}
