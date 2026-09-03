/**
 * Pure validation + aggregates for the summer 2026 questionnaire.
 * Browser: window.SurveyValidate
 * Node tests: module.exports
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SurveyValidate = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var LIMITS = {
    notes: 500,
    short: 200,
    long: 2000,
    handle: 80,
    snsType: 40,
    snsContact: 120,
    email: 120,
  };

  var EVENT_TAGS = { c108: "C108", acghk: "HK26", ff47: "FF47" };
  var ZH_EVENTS = { acghk: true, ff47: true };
  var SCALE_ALL = ["q2", "q3", "q4", "q7"];

  function clip(s, max) {
    var t = String(s == null ? "" : s).trim();
    if (t.length <= max) return t;
    return t.slice(0, max);
  }

  function normalizeEmail(email) {
    return String(email == null ? "" : email).trim().toLowerCase();
  }

  function isValidEmail(email) {
    var e = normalizeEmail(email);
    return e.length > 0 && e.length <= LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function resolveLang(raw) {
    var s = String(raw || "").trim().toLowerCase();
    if (s === "jp" || s === "ja") return "jp";
    if (s === "zh" || s === "zh-hant" || s === "zh-tw" || s === "zh-hk" || s === "zh-cn") return "zh";
    return "";
  }

  function normalizeEventId(raw) {
    var e = String(raw || "").trim().toLowerCase();
    if (e === "c108" || e === "comiket" || e === "cm108") return "c108";
    if (e === "acghk" || e === "acghk2026" || e === "hk" || e === "hk26") return "acghk";
    if (e === "ff47" || e === "ff" || e === "fancyfrontier") return "ff47";
    return "";
  }

  function resolveEvent(lang, rawEvent) {
    var l = resolveLang(lang);
    if (l === "jp") return "c108";
    return normalizeEventId(rawEvent);
  }

  function eventAllowedForLang(lang, event) {
    var l = resolveLang(lang);
    var e = normalizeEventId(event) || event;
    if (l === "jp") return e === "c108";
    if (l === "zh") return !!ZH_EVENTS[e];
    return false;
  }

  function serialTag(event) {
    return EVENT_TAGS[event] || "XXXX";
  }

  function duplicateKey(email, event) {
    return normalizeEmail(email) + "|" + event;
  }

  function isHoneypot(data) {
    return !!(data && (data.website || data.hp || data._gotcha));
  }

  function normalizeScore(v) {
    if (v == null || v === "") return "";
    var s = String(v).trim().toLowerCase();
    if (s === "na") return "na";
    if (s === "1" || s === "2" || s === "3" || s === "4" || s === "5") return s;
    var n = Number(s);
    if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return String(n);
    return null;
  }

  function readScale(raw, id) {
    var src = raw[id];
    var score;
    var notes;
    if (src && typeof src === "object" && !Array.isArray(src)) {
      score = src.score;
      notes = src.notes;
    } else {
      score = raw[id];
      notes = raw[id + "Notes"] || raw[id + "_notes"];
    }
    return { score: normalizeScore(score), notes: clip(notes, LIMITS.notes) };
  }

  /**
   * @param {object} raw
   * @returns {{ ok: true, ignored?: boolean, data?: object } | { ok: false, error: string, field?: string }}
   */
  function validateSubmit(raw) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "invalid_payload" };
    }
    if (isHoneypot(raw)) {
      return { ok: true, ignored: true };
    }

    var lang = resolveLang(raw.lang);
    if (!lang) return { ok: false, error: "bad_lang", field: "lang" };

    var event = resolveEvent(lang, raw.event);
    if (!event) return { ok: false, error: "bad_event", field: "event" };
    if (lang === "zh" && event === "c108") {
      return { ok: false, error: "bad_event", field: "event" };
    }

    var email = normalizeEmail(raw.email);
    if (!isValidEmail(email)) return { ok: false, error: "bad_email", field: "email" };

    var q1 = readScale(raw, "q1");
    var q2 = readScale(raw, "q2");
    var q3 = readScale(raw, "q3");
    var q4 = readScale(raw, "q4");
    var q7 = readScale(raw, "q7");

    if (event === "ff47") {
      if (q1.score === null) return { ok: false, error: "bad_score", field: "q1" };
      if (!q1.score) return { ok: false, error: "missing_score", field: "q1" };
    } else {
      q1.score = "";
      q1.notes = "";
    }

    var scales = [
      ["q2", q2],
      ["q3", q3],
      ["q4", q4],
      ["q7", q7],
    ];
    for (var i = 0; i < scales.length; i++) {
      var id = scales[i][0];
      var q = scales[i][1];
      if (q.score === null) return { ok: false, error: "bad_score", field: id };
      if (!q.score) return { ok: false, error: "missing_score", field: id };
    }

    var snsType = clip(raw.snsType, LIMITS.snsType);
    return {
      ok: true,
      data: {
        lang: lang,
        event: event,
        email: email,
        handle: clip(raw.handle, LIMITS.handle),
        snsType: snsType,
        snsContact: clip(raw.snsContact, LIMITS.snsContact),
        q1: q1.score,
        q1Notes: q1.notes,
        q2: q2.score,
        q2Notes: q2.notes,
        q3: q3.score,
        q3Notes: q3.notes,
        q4: q4.score,
        q4Notes: q4.notes,
        q5: clip(raw.q5, LIMITS.short),
        q6: clip(raw.q6, LIMITS.short),
        q7: q7.score,
        q7Notes: q7.notes,
        q8: clip(raw.q8, LIMITS.short),
        q9: clip(raw.q9, LIMITS.long),
        duplicateKey: duplicateKey(email, event),
      },
    };
  }

  function scoreStats(values) {
    var dist = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, na: 0 };
    var sum = 0;
    var n = 0;
    for (var i = 0; i < (values || []).length; i++) {
      var s = String(values[i] == null ? "" : values[i]).trim().toLowerCase();
      if (s === "na") dist.na += 1;
      else if (s === "1" || s === "2" || s === "3" || s === "4" || s === "5") {
        dist[s] += 1;
        sum += Number(s);
        n += 1;
      }
    }
    return {
      n: n,
      na: dist.na,
      avg: n ? Math.round((sum / n) * 10) / 10 : null,
      dist: dist,
    };
  }

  function frequency(texts) {
    var map = {};
    var order = [];
    for (var i = 0; i < (texts || []).length; i++) {
      var original = String(texts[i] == null ? "" : texts[i]).trim();
      if (!original) continue;
      var k = original.toLowerCase();
      if (!map[k]) {
        map[k] = { text: original, count: 0 };
        order.push(k);
      }
      map[k].count += 1;
    }
    var out = [];
    for (var j = 0; j < order.length; j++) out.push(map[order[j]]);
    out.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return a.text.localeCompare(b.text);
    });
    return out;
  }

  return {
    LIMITS: LIMITS,
    SCALE_ALL: SCALE_ALL,
    EVENT_TAGS: EVENT_TAGS,
    clip: clip,
    normalizeEmail: normalizeEmail,
    isValidEmail: isValidEmail,
    resolveLang: resolveLang,
    normalizeEventId: normalizeEventId,
    resolveEvent: resolveEvent,
    eventAllowedForLang: eventAllowedForLang,
    serialTag: serialTag,
    duplicateKey: duplicateKey,
    isHoneypot: isHoneypot,
    normalizeScore: normalizeScore,
    validateSubmit: validateSubmit,
    scoreStats: scoreStats,
    frequency: frequency,
  };
});
