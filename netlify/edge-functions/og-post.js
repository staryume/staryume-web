/**
 * Inject per-post Open Graph / Twitter meta for Facebook, LINE, Discord crawlers.
 * Crawlers do not run client JS, so static post.html always looked generic.
 *
 * Path: /post.html?id=N&lang=jp|en|zh
 * When ?lang= is set, title/description/locale follow that language.
 * Without ?lang=, prefers zh → jp → en (existing share links stay stable).
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

    const lang = resolveLang(url.searchParams.get("lang"), post);
    const title =
      pickLang(post.title, langOrder(lang), post.langs) || `Post #${idParam}`;
    const raw = pickLang(post.content, langOrder(lang), post.langs) || "";
    const description = toPlainText(raw).slice(0, 180) || "STARYUME WEB Blog";
    // Prefer dedicated 1200×630 ogImage for large Facebook/Messenger cards
    const imagePath = post.ogImage || post.img;
    const image =
      toAbsoluteUrl(imagePath, url.origin) || `${url.origin}/assets/coreimg/logo.png`;
    const imageWidth = Number(post.ogImageWidth) || (post.ogImage ? 1200 : 0);
    const imageHeight = Number(post.ogImageHeight) || (post.ogImage ? 630 : 0);
    // Distinct og:url per language so LINE/FB cache JP vs ZH previews separately
    const pageUrl = buildPageUrl(url.origin, idParam, lang, url.searchParams.get("lang"));
    const fullTitle = `${title} | STARYUME WEB`;
    const locale = localeFor(lang);

    const meta = buildMetaTags({
      fullTitle,
      title,
      description,
      image,
      imageWidth,
      imageHeight,
      pageUrl,
      locale,
    });

    html = injectMeta(html, meta, fullTitle, htmlLangFor(lang));
    html = html.replace(
      /<script src="events\.js[^"]*"><\/script>/,
      '<script src="event-catalog.js?v=20260822a"><\/script>'
    );
    return htmlResponse(html, response);
  } catch (err) {
    console.error("og-post edge error:", err);
    return htmlResponse(html, response);
  }
};

export const config = {
  path: "/post.html",
};

/** Normalize ?lang=; fall back when missing or not available on the post. */
function resolveLang(rawLang, post) {
  const requested = String(rawLang || "").toLowerCase();
  const allowed = ["jp", "en", "zh"];
  const hasContent = (code) => {
    if (post.langs && typeof post.langs[code] === "boolean" && !post.langs[code]) {
      return false;
    }
    const t = post.title && post.title[code];
    return t != null && String(t).trim() !== "";
  };

  if (allowed.includes(requested) && hasContent(requested)) return requested;

  // Default order for links without ?lang= (keeps existing ZH LINE shares stable)
  for (const code of ["zh", "jp", "en"]) {
    if (hasContent(code)) return code;
  }
  return "jp";
}

function langOrder(preferred) {
  const rest = ["zh", "jp", "en"].filter((k) => k !== preferred);
  return [preferred, ...rest];
}

function pickLang(obj, order, langs) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  for (const k of order) {
    if (langs && typeof langs[k] === "boolean" && !langs[k]) continue;
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]);
  }
  return "";
}

function localeFor(lang) {
  if (lang === "en") return "en_US";
  if (lang === "zh") return "zh_HK";
  return "ja_JP";
}

function htmlLangFor(lang) {
  if (lang === "en") return "en";
  if (lang === "zh") return "zh-Hant";
  return "ja";
}

/**
 * Only pin lang= in og:url when the share link explicitly had ?lang=.
 * That way crawlers treat JP/EN/ZH URLs as separate cache keys.
 */
function buildPageUrl(origin, idParam, resolvedLang, rawLangParam) {
  const base = `${origin.replace(/\/$/, "")}/post.html?id=${encodeURIComponent(idParam)}`;
  const requested = String(rawLangParam || "").toLowerCase();
  if (requested === "jp" || requested === "en" || requested === "zh") {
    return `${base}&lang=${encodeURIComponent(requested)}`;
  }
  // Implicit default — omit lang= so legacy shared URLs stay the same key
  return base;
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
  locale,
}) {
  const t = escapeAttr(title);
  const ft = escapeAttr(fullTitle);
  const d = escapeAttr(description);
  const img = escapeAttr(image);
  const u = escapeAttr(pageUrl);
  const loc = escapeAttr(locale);
  const sizeTags =
    imageWidth > 0 && imageHeight > 0
      ? `
    <meta property="og:image:width" content="${imageWidth}">
    <meta property="og:image:height" content="${imageHeight}">
    <meta property="og:image:type" content="image/jpeg">`
      : "";
  // Alternate locales help some platforms; primary is og:locale
  const alternates = ["ja_JP", "zh_HK", "en_US"]
    .filter((l) => l !== locale)
    .map((l) => `<meta property="og:locale:alternate" content="${l}">`)
    .join("\n    ");
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
    <meta property="og:locale" content="${loc}">
    ${alternates}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${d}">
    <meta name="twitter:image" content="${img}">
    <meta name="author" content="staryume">
  `.replace(/\n\s+/g, "\n    ");
}

function injectMeta(html, metaBlock, fullTitle, htmlLang) {
  // Remove existing title + common social tags so we don't duplicate
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");

  // Align <html lang> with resolved content language for crawlers
  if (htmlLang) {
    out = out.replace(
      /<html([^>]*)\slang=["'][^"']*["']/i,
      `<html$1 lang="${htmlLang}"`
    );
  }

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
  // Short cache so language/content updates show up; LINE still may cache longer client-side
  headers.set("cache-control", "no-store");
  headers.set("netlify-cdn-cache-control", "no-store");
  headers.set("vary", "Accept-Encoding");
  return new Response(html, {
    status: original.status,
    statusText: original.statusText,
    headers,
  });
}
