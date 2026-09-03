// ── STARYUME Summer 2026 questionnaire — paste into Apps Script ──
// Setup: docs/survey-apps-script.md
// Deploy: Deploy → New deployment → Web app
//   Execute as: Me
//   Who has access: Anyone
// After edit: Manage deployments → Edit → New version → Deploy
//
// Script Properties (recommended):
//   SURVEY_PASSCODE     staff dashboard passcode
//   SPREADSHEET_ID      from Sheet URL …/d/THIS_ID/edit
//   STAFF_NOTIFY_EMAIL  optional: you on each new response

var SURVEY_PASSCODE = 'CHANGE_ME';
var SPREADSHEET_ID = '';
var STAFF_NOTIFY_EMAIL = '';
var DISCORD_INVITE_URL = 'https://discord.gg/staryume';
var PUBLIC_SITE_ORIGIN = 'https://staryu.me';

var CONFIG_SHEET = 'Config';
var RESPONSES_SHEET = 'Responses';

var RESPONSE_HEADERS = [
  'Timestamp', 'Serial', 'Lang', 'Event', 'Email', 'Handle', 'SnsType', 'SnsContact',
  'Q1', 'Q1Notes', 'Q2', 'Q2Notes', 'Q3', 'Q3Notes', 'Q4', 'Q4Notes',
  'Q5', 'Q6', 'Q7', 'Q7Notes', 'Q8', 'Q9',
  'Claimed', 'ClaimedAt'
];

var COL = {
  Timestamp: 0, Serial: 1, Lang: 2, Event: 3, Email: 4, Handle: 5, SnsType: 6, SnsContact: 7,
  Q1: 8, Q1Notes: 9, Q2: 10, Q2Notes: 11, Q3: 12, Q3Notes: 13, Q4: 14, Q4Notes: 15,
  Q5: 16, Q6: 17, Q7: 18, Q7Notes: 19, Q8: 20, Q9: 21,
  Claimed: 22, ClaimedAt: 23
};

var LIMITS = { notes: 500, short: 200, long: 2000, handle: 80, snsType: 40, snsContact: 120, email: 120 };
var EVENT_TAGS = { c108: 'C108', acghk: 'HK26', ff47: 'FF47' };
var EVENT_LABELS = {
  c108: { zh: 'C108（Comic Market 108）', jp: 'Comic Market 108' },
  acghk: { zh: 'ACGHK2026（香港）', jp: 'ACGHK 2026' },
  ff47: { zh: 'FF47（台北）', jp: 'FF47（台北）' }
};

// ── HTTP ───────────────────────────────────────────────────────────────────

function doGet() {
  return ContentService
    .createTextOutput('STARYUME survey endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    ensureSheets_();
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || 'submit').toLowerCase();

    if (action === 'submit') return handleSubmit_(data);

    if (!authStaff_(data)) {
      return jsonOut_({ ok: false, error: 'unauthorized', message: '通關密碼錯誤。' });
    }
    if (action === 'ping') {
      return jsonOut_({ ok: true, pong: true, open: isOpen_() });
    }
    if (action === 'summary') return handleSummary_(data);
    if (action === 'lookup') return handleLookup_(data);
    if (action === 'claim') return handleClaim_(data, true);
    if (action === 'unclaim') return handleClaim_(data, false);
    return jsonOut_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function scriptProp_(key, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(key);
    if (v != null && String(v).length) return String(v);
  } catch (e) { /* ignore */ }
  return fallback;
}

function authStaff_(data) {
  var expected = scriptProp_('SURVEY_PASSCODE', SURVEY_PASSCODE);
  var got = String((data && (data.passcode || data.password)) || '');
  return expected && expected !== 'CHANGE_ME' && got && got === expected;
}

function staffNotifyEmail_() {
  return scriptProp_('STAFF_NOTIFY_EMAIL', STAFF_NOTIFY_EMAIL);
}

// ── Sheets ─────────────────────────────────────────────────────────────────

function ss_() {
  var id = scriptProp_('SPREADSHEET_ID', SPREADSHEET_ID);
  if (id && String(id).length > 10) {
    return SpreadsheetApp.openById(String(id).trim());
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Set SPREADSHEET_ID in Script Properties (Sheet URL …/d/ID/edit).');
}

function ensureSheets_() {
  var ss = ss_();
  if (!ss.getSheetByName(CONFIG_SHEET)) {
    var c = ss.insertSheet(CONFIG_SHEET);
    c.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    c.getRange(2, 1, 2, 2).setValues([
      ['enrollOpen', 'TRUE'],
      ['title', 'STARYUME Survey · Summer 2026']
    ]);
  }
  var r = ss.getSheetByName(RESPONSES_SHEET);
  if (!r) {
    r = ss.insertSheet(RESPONSES_SHEET);
    r.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
    r.setFrozenRows(1);
  } else {
    ensureHeaders_(r, RESPONSE_HEADERS);
  }
}

function ensureHeaders_(sheet, headers) {
  var lastCol = Math.max(sheet.getLastColumn(), headers.length);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!String(existing[0] || '')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function configMap_() {
  var sheet = ss_().getSheetByName(CONFIG_SHEET);
  var values = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (!k) continue;
    map[k] = values[i][1];
  }
  return map;
}

function isOpen_() {
  var v = configMap_().enrollOpen;
  if (v === false || v === 0) return false;
  var s = String(v == null ? 'TRUE' : v).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES';
}

function responsesSheet_() {
  return ss_().getSheetByName(RESPONSES_SHEET);
}

function allResponseRows_() {
  var sheet = responsesSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last, RESPONSE_HEADERS.length).getValues();
}

// ── Validation (keep in sync with survey-validate.js) ───────────────────────

function clip_(s, max) {
  var t = String(s == null ? '' : s).trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

function normalizeEmail_(email) {
  return String(email == null ? '' : email).trim().toLowerCase();
}

function resolveLang_(raw) {
  var s = String(raw || '').trim().toLowerCase();
  if (s === 'jp' || s === 'ja') return 'jp';
  if (s === 'zh' || s.indexOf('zh') === 0) return 'zh';
  return '';
}

function normalizeEventId_(raw) {
  var e = String(raw || '').trim().toLowerCase();
  if (e === 'c108' || e === 'comiket' || e === 'cm108') return 'c108';
  if (e === 'acghk' || e === 'acghk2026' || e === 'hk' || e === 'hk26') return 'acghk';
  if (e === 'ff47' || e === 'ff' || e === 'fancyfrontier') return 'ff47';
  return '';
}

function resolveEvent_(lang, rawEvent) {
  if (lang === 'jp') return 'c108';
  return normalizeEventId_(rawEvent);
}

function normalizeScore_(v) {
  if (v == null || v === '') return '';
  var s = String(v).trim().toLowerCase();
  if (s === 'na') return 'na';
  if (s === '1' || s === '2' || s === '3' || s === '4' || s === '5') return s;
  return null;
}

function readScale_(raw, id) {
  var src = raw[id];
  var score;
  var notes;
  if (src && typeof src === 'object') {
    score = src.score;
    notes = src.notes;
  } else {
    score = raw[id];
    notes = raw[id + 'Notes'] || raw[id + '_notes'];
  }
  return { score: normalizeScore_(score), notes: clip_(notes, LIMITS.notes) };
}

function validateSubmit_(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid_payload' };
  if (raw.website || raw.hp || raw._gotcha) return { ok: true, ignored: true };

  var lang = resolveLang_(raw.lang);
  if (!lang) return { ok: false, error: 'bad_lang', field: 'lang' };
  var event = resolveEvent_(lang, raw.event);
  if (!event) return { ok: false, error: 'bad_event', field: 'event' };
  if (lang === 'zh' && event === 'c108') return { ok: false, error: 'bad_event', field: 'event' };

  var email = normalizeEmail_(raw.email);
  if (!email || email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'bad_email', field: 'email' };
  }

  var q1 = readScale_(raw, 'q1');
  var q2 = readScale_(raw, 'q2');
  var q3 = readScale_(raw, 'q3');
  var q4 = readScale_(raw, 'q4');
  var q7 = readScale_(raw, 'q7');

  if (event === 'ff47') {
    if (q1.score === null) return { ok: false, error: 'bad_score', field: 'q1' };
    if (!q1.score) return { ok: false, error: 'missing_score', field: 'q1' };
  } else {
    q1.score = '';
    q1.notes = '';
  }

  var scales = [['q2', q2], ['q3', q3], ['q4', q4], ['q7', q7]];
  for (var i = 0; i < scales.length; i++) {
    if (scales[i][1].score === null) return { ok: false, error: 'bad_score', field: scales[i][0] };
    if (!scales[i][1].score) return { ok: false, error: 'missing_score', field: scales[i][0] };
  }

  return {
    ok: true,
    data: {
      lang: lang,
      event: event,
      email: email,
      handle: clip_(raw.handle, LIMITS.handle),
      snsType: clip_(raw.snsType, LIMITS.snsType),
      snsContact: clip_(raw.snsContact, LIMITS.snsContact),
      q1: q1.score,
      q1Notes: q1.notes,
      q2: q2.score,
      q2Notes: q2.notes,
      q3: q3.score,
      q3Notes: q3.notes,
      q4: q4.score,
      q4Notes: q4.notes,
      q5: clip_(raw.q5, LIMITS.short),
      q6: clip_(raw.q6, LIMITS.short),
      q7: q7.score,
      q7Notes: q7.notes,
      q8: clip_(raw.q8, LIMITS.short),
      q9: clip_(raw.q9, LIMITS.long)
    }
  };
}

// ── Submit ─────────────────────────────────────────────────────────────────

function handleSubmit_(raw) {
  var v = validateSubmit_(raw);
  if (v.ignored) return jsonOut_({ ok: true, serial: 'IGNORED' });
  if (!v.ok) return jsonOut_(v);
  if (!isOpen_()) return jsonOut_({ ok: false, error: 'closed' });

  var d = v.data;
  var existing = findByEmailEvent_(d.email, d.event);
  if (existing) {
    var resent = false;
    var mailError = '';
    try {
      sendConfirmEmail_(d.lang, d.email, d.handle, existing.serial, d.event, true);
      resent = true;
    } catch (err) {
      mailError = String(err);
    }
    return jsonOut_({
      ok: true,
      duplicate: true,
      serial: existing.serial,
      emailSent: resent,
      mailError: mailError || undefined
    });
  }

  var serial = newSerial_(d.event);
  var now = new Date();
  responsesSheet_().appendRow([
    now,
    serial,
    d.lang,
    d.event,
    d.email,
    d.handle,
    d.snsType,
    d.snsContact,
    d.q1,
    d.q1Notes,
    d.q2,
    d.q2Notes,
    d.q3,
    d.q3Notes,
    d.q4,
    d.q4Notes,
    d.q5,
    d.q6,
    d.q7,
    d.q7Notes,
    d.q8,
    d.q9,
    false,
    ''
  ]);

  var emailSent = false;
  var mailError = '';
  try {
    sendConfirmEmail_(d.lang, d.email, d.handle, serial, d.event, false);
    emailSent = true;
  } catch (err2) {
    mailError = String(err2);
  }

  var staffTo = staffNotifyEmail_();
  if (staffTo) {
    try {
      MailApp.sendEmail({
        to: staffTo,
        subject: '【問卷】' + serial + ' · ' + (EVENT_LABELS[d.event] && EVENT_LABELS[d.event].zh || d.event),
        body: [
          serial,
          '活動: ' + d.event,
          '電郵: ' + d.email,
          '名稱: ' + (d.handle || '—'),
          'Q3: ' + d.q3 + '  Q5: ' + (d.q5 || '—')
        ].join('\n')
      });
    } catch (e3) { /* ignore */ }
  }

  return jsonOut_({
    ok: true,
    serial: serial,
    emailSent: emailSent,
    mailError: mailError || undefined
  });
}

function findByEmailEvent_(email, event) {
  var rows = allResponseRows_();
  for (var i = 0; i < rows.length; i++) {
    if (normalizeEmail_(rows[i][COL.Email]) === email && String(rows[i][COL.Event]) === event) {
      return { rowIndex: i + 2, serial: String(rows[i][COL.Serial] || ''), row: rows[i] };
    }
  }
  return null;
}

function findBySerial_(serial) {
  var want = String(serial || '').trim().toUpperCase();
  if (!want) return null;
  var rows = allResponseRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.Serial] || '').toUpperCase() === want) {
      return { rowIndex: i + 2, serial: String(rows[i][COL.Serial] || ''), row: rows[i] };
    }
  }
  return null;
}

function serialExists_(serial) {
  return !!findBySerial_(serial);
}

function newSerial_(event) {
  var tag = EVENT_TAGS[event] || 'XXXX';
  var alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (var attempt = 0; attempt < 30; attempt++) {
    var s = '';
    for (var i = 0; i < 4; i++) {
      s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    var serial = 'SY-' + tag + '-' + s;
    if (!serialExists_(serial)) return serial;
  }
  return 'SY-' + tag + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
}

function sendConfirmEmail_(lang, email, handle, serial, event, duplicate) {
  var jp = lang === 'jp';
  var eventLabel = (EVENT_LABELS[event] && EVENT_LABELS[event][jp ? 'jp' : 'zh']) || event;
  var greet = handle ? (jp ? (handle + ' さん') : (handle + ' 你好')) : (jp ? 'こんにちは' : '你好');
  var lines;
  if (jp) {
    lines = [
      greet + '、',
      '',
      duplicate
        ? 'このイベントのアンケートはすでに回答済みです。確認番号は変わりません。'
        : 'ご回答ありがとうございます。確認メールをお送りします。',
      '',
      'このメールを保存してください。次回の冬の大型イベント（C109 など）で星夢亭ブースにご提示いただくと、特製カードをプレゼントします。',
      '',
      '【確認番号】' + serial,
      '【イベント】' + eventLabel,
      '',
      '同じイベントでのプレゼント受け取りはお一人様一回です。',
      '',
      'ご不明点は Discord へ：',
      DISCORD_INVITE_URL,
      '',
      '— 星夢亭 / staryume'
    ];
  } else {
    lines = [
      greet + '，',
      '',
      duplicate
        ? '你已經填過這個活動的問卷，確認編號不變。'
        : '感謝你填寫星夢亭 2026 夏季活動問卷。',
      '',
      '請保存這封電郵。在即將到來的冬季大型活動（C109、FF48 等）向星夢亭出示本信，即可領取實體卡片禮物。',
      '',
      '【確認編號】' + serial,
      '【活動】' + eventLabel,
      '',
      '每個活動僅能兌換一次禮物。',
      '',
      '有問題歡迎加入 Discord：',
      DISCORD_INVITE_URL,
      '',
      '— 星夢亭 / staryume'
    ];
  }
  MailApp.sendEmail({
    to: email,
    subject: jp
      ? ('【星夢亭】夏イベントアンケート確認 · ' + serial)
      : ('【星夢亭】夏季活動問卷確認 · ' + serial),
    body: lines.join('\n')
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function rowToPublic_(row) {
  var claimed = isTruthy_(row[COL.Claimed]);
  return {
    serial: String(row[COL.Serial] || ''),
    lang: String(row[COL.Lang] || ''),
    event: String(row[COL.Event] || ''),
    email: String(row[COL.Email] || ''),
    handle: String(row[COL.Handle] || ''),
    snsType: String(row[COL.SnsType] || ''),
    snsContact: String(row[COL.SnsContact] || ''),
    q1: String(row[COL.Q1] || ''),
    q1Notes: String(row[COL.Q1Notes] || ''),
    q2: String(row[COL.Q2] || ''),
    q2Notes: String(row[COL.Q2Notes] || ''),
    q3: String(row[COL.Q3] || ''),
    q3Notes: String(row[COL.Q3Notes] || ''),
    q4: String(row[COL.Q4] || ''),
    q4Notes: String(row[COL.Q4Notes] || ''),
    q5: String(row[COL.Q5] || ''),
    q6: String(row[COL.Q6] || ''),
    q7: String(row[COL.Q7] || ''),
    q7Notes: String(row[COL.Q7Notes] || ''),
    q8: String(row[COL.Q8] || ''),
    q9: String(row[COL.Q9] || ''),
    claimed: claimed,
    claimedAt: row[COL.ClaimedAt] ? String(row[COL.ClaimedAt]) : ''
  };
}

function isTruthy_(v) {
  if (v === true || v === 1) return true;
  var s = String(v || '').trim().toUpperCase();
  return s === 'TRUE' || s === 'YES' || s === '1';
}

function emptyStats_() {
  return { n: 0, na: 0, avg: null, dist: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, na: 0 }, notes: [] };
}

function addScore_(stats, score, notes, event, serial) {
  var s = String(score || '').trim().toLowerCase();
  if (s === 'na') {
    stats.na += 1;
    stats.dist.na += 1;
  } else if (s === '1' || s === '2' || s === '3' || s === '4' || s === '5') {
    stats.dist[s] += 1;
    stats.n += 1;
    stats._sum = (stats._sum || 0) + Number(s);
  }
  var note = String(notes || '').trim();
  if (note) {
    stats.notes.push({ event: event, serial: serial, text: note, score: s });
  }
}

function finalizeStats_(stats) {
  stats.avg = stats.n ? Math.round((stats._sum / stats.n) * 10) / 10 : null;
  delete stats._sum;
  return stats;
}

function freqPush_(bucket, text) {
  var original = String(text || '').trim();
  if (!original) return;
  var k = original.toLowerCase();
  if (!bucket.map[k]) {
    bucket.map[k] = { text: original, count: 0 };
    bucket.order.push(k);
  }
  bucket.map[k].count += 1;
}

function freqFinish_(bucket) {
  var out = [];
  for (var i = 0; i < bucket.order.length; i++) out.push(bucket.map[bucket.order[i]]);
  out.sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return a.text.localeCompare(b.text);
  });
  return out;
}

function handleSummary_(data) {
  var filter = String(data.event || data.filter || 'all').trim().toLowerCase();
  if (filter !== 'all' && !EVENT_TAGS[filter]) filter = 'all';

  var counts = { all: 0, c108: 0, acghk: 0, ff47: 0 };
  var claimed = { all: 0, c108: 0, acghk: 0, ff47: 0 };
  var questions = {
    q1: emptyStats_(),
    q2: emptyStats_(),
    q3: emptyStats_(),
    q4: emptyStats_(),
    q7: emptyStats_()
  };
  var open = { q5: [], q6: [], q8: [], q9: [] };
  var freq5 = { map: {}, order: [] };
  var freq6 = { map: {}, order: [] };

  var rows = allResponseRows_();
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var event = String(row[COL.Event] || '');
    if (!EVENT_TAGS[event]) continue;
    counts.all += 1;
    counts[event] += 1;
    if (isTruthy_(row[COL.Claimed])) {
      claimed.all += 1;
      claimed[event] += 1;
    }
    if (filter !== 'all' && event !== filter) continue;

    var serial = String(row[COL.Serial] || '');
    var handle = String(row[COL.Handle] || '');
    addScore_(questions.q1, row[COL.Q1], row[COL.Q1Notes], event, serial);
    addScore_(questions.q2, row[COL.Q2], row[COL.Q2Notes], event, serial);
    addScore_(questions.q3, row[COL.Q3], row[COL.Q3Notes], event, serial);
    addScore_(questions.q4, row[COL.Q4], row[COL.Q4Notes], event, serial);
    addScore_(questions.q7, row[COL.Q7], row[COL.Q7Notes], event, serial);

    var q5 = String(row[COL.Q5] || '').trim();
    var q6 = String(row[COL.Q6] || '').trim();
    var q8 = String(row[COL.Q8] || '').trim();
    var q9 = String(row[COL.Q9] || '').trim();
    if (q5) {
      open.q5.push({ event: event, handle: handle, text: q5 });
      freqPush_(freq5, q5);
    }
    if (q6) {
      open.q6.push({ event: event, handle: handle, text: q6 });
      freqPush_(freq6, q6);
    }
    if (q8) open.q8.push({ event: event, handle: handle, text: q8 });
    if (q9) open.q9.push({ event: event, handle: handle, text: q9 });
  }

  finalizeStats_(questions.q1);
  finalizeStats_(questions.q2);
  finalizeStats_(questions.q3);
  finalizeStats_(questions.q4);
  finalizeStats_(questions.q7);

  return jsonOut_({
    ok: true,
    open: isOpen_(),
    filter: filter,
    counts: counts,
    claimed: claimed,
    questions: questions,
    answers: open,
    freq: { q5: freqFinish_(freq5), q6: freqFinish_(freq6) }
  });
}

function handleLookup_(data) {
  var q = String(data.query || data.q || data.serial || data.email || '').trim();
  if (!q) return jsonOut_({ ok: false, error: 'missing_query' });

  var found = findBySerial_(q);
  if (!found && q.indexOf('@') !== -1) {
    var email = normalizeEmail_(q);
    var matches = [];
    var rows = allResponseRows_();
    for (var i = 0; i < rows.length; i++) {
      if (normalizeEmail_(rows[i][COL.Email]) === email) {
        matches.push(rowToPublic_(rows[i]));
      }
    }
    if (!matches.length) return jsonOut_({ ok: true, found: false, matches: [] });
    return jsonOut_({ ok: true, found: true, matches: matches });
  }
  if (!found) {
    // email-like search without @ : scan email / serial contains
    var needle = q.toLowerCase();
    var loose = [];
    var all = allResponseRows_();
    for (var j = 0; j < all.length; j++) {
      var serial = String(all[j][COL.Serial] || '').toLowerCase();
      var em = String(all[j][COL.Email] || '').toLowerCase();
      var handle = String(all[j][COL.Handle] || '').toLowerCase();
      if (serial === needle || em === needle || handle === needle) {
        loose.push(rowToPublic_(all[j]));
      }
    }
    if (!loose.length) return jsonOut_({ ok: true, found: false, matches: [] });
    return jsonOut_({ ok: true, found: true, matches: loose });
  }
  return jsonOut_({ ok: true, found: true, matches: [rowToPublic_(found.row)] });
}

function handleClaim_(data, claimed) {
  var serial = String(data.serial || '').trim();
  var found = findBySerial_(serial);
  if (!found) return jsonOut_({ ok: false, error: 'not_found' });
  var sheet = responsesSheet_();
  sheet.getRange(found.rowIndex, COL.Claimed + 1).setValue(!!claimed);
  sheet.getRange(found.rowIndex, COL.ClaimedAt + 1).setValue(claimed ? new Date() : '');
  SpreadsheetApp.flush();
  var updated = sheet.getRange(found.rowIndex, 1, 1, RESPONSE_HEADERS.length).getValues()[0];
  return jsonOut_({
    ok: true,
    claimed: !!claimed,
    match: rowToPublic_(updated)
  });
}
