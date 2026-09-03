import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(name) {
  return readFileSync(join(root, name), "utf8");
}

describe("survey pages", () => {
  it("Chinese copy includes the listed questions and FF47-only Q1", () => {
    const html = read("survey.html");
    expect(html).toContain("事前預約系統");
    expect(html).toContain("互動價目表");
    expect(html).toContain("新刊 / 新商品");
    expect(html).toContain("活動後通販的初步預購");
    expect(html).toContain("遊戲王題材");
    expect(html).toContain("非遊戲王二創");
    expect(html).toContain("海報猜拳 / 色紙競標");
    expect(html).toContain("實體卡片禮物");
    expect(html).toContain("survey-validate.js");
    expect(html).toContain('name="event" value="acghk"');
    expect(html).toContain('name="event" value="ff47"');
    expect(html).toContain('content="noindex, nofollow"');
  });

  it("Japanese copy is C108 / janken without 色紙競標", () => {
    const html = read("survey.html");
    expect(html).toContain("Comic Market 108");
    expect(html).toContain("インタラクティブなお品書き");
    expect(html).toContain("新刊・新作グッズ");
    expect(html).toContain("イベント後通販");
    expect(html).toContain("ポスターじゃんけん");
    expect(html).toContain("特製カード");
    expect(html).not.toMatch(/jp:[\s\S]*色紙/);
    const jpBlock = html.slice(html.indexOf("jp: {"), html.indexOf("submit: '送信する'"));
    expect(jpBlock).not.toContain("色紙");
  });

  it("dashboard covers averages, open answers, and redeem", () => {
    const html = read("survey-dashboard.html");
    expect(html).toContain("data-tab=\"overview\"");
    expect(html).toContain("data-tab=\"notes\"");
    expect(html).toContain("data-tab=\"open\"");
    expect(html).toContain("data-tab=\"redeem\"");
    expect(html).toContain("標記已兌換");
    expect(html).toContain("action: 'summary'");
    expect(html).toContain("claimed ? 'claim' : 'unclaim'");
    expect(html).toContain('content="noindex, nofollow"');
  });

  it("edge proxy and Code.gs stay aligned on uniqueness and Q1", () => {
    const gs = read("docs/survey-Code.gs");
    const edge = read("netlify/edge-functions/survey.js");
    expect(gs).toContain("findByEmailEvent_");
    expect(gs).toContain("event === 'ff47'");
    expect(gs).toContain("handleClaim_");
    expect(gs).toContain("SY-");
    expect(edge).toContain("path: \"/api/survey\"");
    expect(edge).toContain("missing_score");
  });
});
