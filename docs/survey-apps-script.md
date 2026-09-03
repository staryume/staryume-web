# Summer 2026 questionnaire → Google Sheets + confirmation email

Public form: **`survey.html`**  
Staff dashboard: **`survey-dashboard.html`** (passcode)

| Language | URL |
|----------|-----|
| 中文（選 ACGHK2026 或 FF47） | `https://staryu.me/survey.html?lang=zh` |
| 日本語（C108 固定） | `https://staryu.me/survey.html?lang=jp` |
| 工作人員儀表板 | `https://staryu.me/survey-dashboard.html` |

Local: `python3 -m http.server 8000` from the `web` folder.

Risk: **R3** (email / SNS / present serial). Same pattern as lottery / hk-form / POS.

---

## What happens on submit

1. Edge `/api/survey` rate-limits and rejects empty required fields.
2. Apps Script checks **email + event** uniqueness (one response per email per event).
3. New row → confirmation **Gmail** with serial `SY-C108-K7M2` / `SY-HK26-…` / `SY-FF47-…`.
4. Duplicate → **no second row**; original serial is resent.
5. Customer shows that email at winter events; you mark **已兌換** on the dashboard.

Q1 (事前預約) is stored only for **FF47**. Japanese Q7/Q8 omit 色紙競標.

---

## 1. Create the spreadsheet

1. Google Drive → New → **Google Sheets**
2. Name: `STARYUME Survey · Summer 2026`
3. Extensions → **Apps Script**
4. Delete default code → paste entire **`docs/survey-Code.gs`**
5. **Project Settings → Script properties**:

| Property | Value |
|----------|--------|
| `SURVEY_PASSCODE` | Staff dashboard passcode (not the 裏 store code unless you accept that risk) |
| `SPREADSHEET_ID` | From the Sheet URL `https://docs.google.com/spreadsheets/d/`**`THIS_ID`**`/edit` |
| `STAFF_NOTIFY_EMAIL` | Optional. Your Gmail for a short ping on each **new** response |

6. Save → **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the `/exec` URL.

First run: open the web app URL in a browser. You should see `STARYUME survey endpoint OK`. The script creates **Config** and **Responses** sheets.

### Config sheet

| key | value | meaning |
|-----|--------|---------|
| `enrollOpen` | `TRUE` | Set `FALSE` to stop new submits (dashboard still works) |

### Responses headers

`Timestamp | Serial | Lang | Event | Email | Handle | SnsType | SnsContact | Q1 | Q1Notes | Q2 | Q2Notes | Q3 | Q3Notes | Q4 | Q4Notes | Q5 | Q6 | Q7 | Q7Notes | Q8 | Q9 | Claimed | ClaimedAt`

`Event` is `c108` / `acghk` / `ff47`. Scores are `1`–`5` or `na`.

---

## 2. Wire the website

### Edge proxy (`/api/survey`)

1. Put the web app URL in Netlify env **`SURVEY_APPS_SCRIPT_URL`**
   (the edge function also has a hardcoded fallback, same pattern as POS / hk-form)
2. Redeploy the site.

### Localhost fallback

`survey.html` and `survey-dashboard.html` use `SCRIPT_URL_DIRECT` on localhost. Production always uses `/api/survey`.

---

## 3. Test checklist

1. ZH + **FF47**: Q1 is visible; submit → Sheet row + Gmail with `SY-FF47-…`.
2. ZH + **ACGHK**: Q1 hidden; Sheet Q1 empty.
3. JP: no event picker; serial `SY-C108-…`; Q7 text has no 色紙.
4. Same email + same event again → no second row; mail says already submitted.
5. Same email + **other** event → second row (two presents, two serials).
6. Dashboard: passcode → averages (excludes `na`) → lookup serial → **標記已兌換** → Sheet `Claimed` is TRUE.
7. Config `enrollOpen=FALSE` → form shows closed; dashboard still opens.

**Note:** Do not share `survey-dashboard.html` on SNS. The URL is not secret; the passcode is.

---

## 4. Winter booth flow

1. Fan shows the confirmation email.
2. Dashboard → **兌換** → paste serial or email → **標記已兌換**.
3. If you tapped the wrong row: **取消兌換**.

---

## 5. After editing Code.gs

**Deploy → Manage deployments → Edit (pencil) → New version → Deploy.**  
A new deployment URL is only needed the first time; later edits are new versions of the same URL.
