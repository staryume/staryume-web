import { describe, it, expect } from "vitest";
import SurveyValidate from "../survey-validate.js";

const {
  validateSubmit,
  resolveLang,
  resolveEvent,
  eventAllowedForLang,
  duplicateKey,
  scoreStats,
  frequency,
  normalizeScore,
  isValidEmail,
} = SurveyValidate;

function baseZh(over) {
  return Object.assign(
    {
      lang: "zh",
      event: "ff47",
      email: "fan@example.com",
      q1: { score: "4" },
      q2: { score: "5" },
      q3: { score: "5" },
      q4: { score: "3" },
      q7: { score: "4" },
    },
    over || {}
  );
}

describe("resolveLang / event", () => {
  it("maps ja → jp and zh-Hant → zh", () => {
    expect(resolveLang("ja")).toBe("jp");
    expect(resolveLang("zh-Hant")).toBe("zh");
    expect(resolveLang("")).toBe("");
  });

  it("forces JP to C108 even if the client sent FF47", () => {
    expect(resolveEvent("jp", "ff47")).toBe("c108");
    expect(eventAllowedForLang("jp", "c108")).toBe(true);
    expect(eventAllowedForLang("jp", "ff47")).toBe(false);
  });

  it("allows only ACGHK / FF47 on Chinese", () => {
    expect(eventAllowedForLang("zh", "acghk")).toBe(true);
    expect(eventAllowedForLang("zh", "ff47")).toBe(true);
    expect(eventAllowedForLang("zh", "c108")).toBe(false);
    expect(resolveEvent("zh", "ACGHK2026")).toBe("acghk");
  });
});

describe("validateSubmit", () => {
  it("accepts a complete FF47 payload and keeps Q1", () => {
    const r = validateSubmit(baseZh());
    expect(r.ok).toBe(true);
    expect(r.data.event).toBe("ff47");
    expect(r.data.q1).toBe("4");
    expect(r.data.email).toBe("fan@example.com");
    expect(r.data.duplicateKey).toBe("fan@example.com|ff47");
  });

  it("strips Q1 for ACGHK and C108", () => {
    const acg = validateSubmit(baseZh({ event: "acghk", q1: { score: "5", notes: "x" } }));
    expect(acg.ok).toBe(true);
    expect(acg.data.q1).toBe("");
    expect(acg.data.q1Notes).toBe("");

    const jp = validateSubmit({
      lang: "jp",
      event: "ff47",
      email: "a@b.co",
      q2: "5",
      q3: "4",
      q4: "na",
      q7: "3",
    });
    expect(jp.ok).toBe(true);
    expect(jp.data.event).toBe("c108");
    expect(jp.data.q1).toBe("");
    expect(jp.data.q4).toBe("na");
  });

  it("requires Q1 on FF47", () => {
    const r = validateSubmit(baseZh({ q1: { score: "" } }));
    expect(r.ok).toBe(false);
    expect(r.field).toBe("q1");
    expect(r.error).toBe("missing_score");
  });

  it("rejects Chinese C108 and missing event", () => {
    expect(validateSubmit(baseZh({ event: "c108" })).error).toBe("bad_event");
    expect(validateSubmit(baseZh({ event: "" })).error).toBe("bad_event");
  });

  it("rejects bad / missing email and scores", () => {
    expect(validateSubmit(baseZh({ email: "nope" })).error).toBe("bad_email");
    expect(validateSubmit(baseZh({ q3: { score: "6" } })).error).toBe("bad_score");
    expect(validateSubmit(baseZh({ q2: { score: "" } })).error).toBe("missing_score");
  });

  it("treats honeypot as ignored success", () => {
    const r = validateSubmit(baseZh({ website: "http://spam" }));
    expect(r.ok).toBe(true);
    expect(r.ignored).toBe(true);
  });

  it("clips long optional text", () => {
    const r = validateSubmit(baseZh({ q9: "あ".repeat(3000), handle: "x".repeat(200) }));
    expect(r.ok).toBe(true);
    expect(r.data.q9.length).toBe(2000);
    expect(r.data.handle.length).toBe(80);
  });

  it("uses a per-email-per-event duplicate key", () => {
    expect(duplicateKey(" Fan@Example.COM ", "ff47")).toBe("fan@example.com|ff47");
    expect(duplicateKey("fan@example.com", "acghk")).not.toBe(duplicateKey("fan@example.com", "ff47"));
  });
});

describe("aggregates", () => {
  it("averages 1–5 and excludes na", () => {
    const s = scoreStats(["5", "5", "na", "1", "", "3"]);
    expect(s.n).toBe(4);
    expect(s.na).toBe(1);
    expect(s.avg).toBe(3.5);
    expect(s.dist["5"]).toBe(2);
  });

  it("groups character wishes case-insensitively", () => {
    const f = frequency(["黑魔導女孩", "黑魔導女孩", "  Black Magician Girl  ", "黑魔導女孩"]);
    expect(f[0].text).toBe("黑魔導女孩");
    expect(f[0].count).toBe(3);
    expect(f.length).toBe(2);
  });

  it("normalizeScore accepts 1–5 and na only", () => {
    expect(normalizeScore("5")).toBe("5");
    expect(normalizeScore("NA")).toBe("na");
    expect(normalizeScore("0")).toBe(null);
    expect(normalizeScore("")).toBe("");
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("")).toBe(false);
  });
});
