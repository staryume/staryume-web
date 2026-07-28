// ── STARYUME Limited Poster Lottery — paste into Apps Script Code.gs ──
// Spreadsheet needs sheets: Config, Entrants, Result (auto-created on first run)
// Deploy: Deploy → New deployment → Web app
//   Execute as: Me
//   Who has access: Anyone
// After edit: Manage deployments → Edit → New version → Deploy
// Trigger: Triggers → Add trigger → autoDrawTick_ → Time-driven → Every 5 minutes

// ── CONFIG (edit these) ────────────────────────────────────────────────────
/** Public site origin for dashboard links in email (no trailing slash) */
var PUBLIC_SITE_ORIGIN = 'https://staryu.me';
/** Path to status page on your site */
var STATUS_PATH = '/lottery-status.html';
/** Optional: notify you on each enroll / draw */
var STAFF_NOTIFY_EMAIL = ''; // e.g. 'staryume@gmail.com'
/** Default access key if Config sheet empty — change this! Share only in Discord */
var DEFAULT_ACCESS_KEY = 'changeme-discord-only';

var CONFIG_SHEET = 'Config';
var ENTRANTS_SHEET = 'Entrants';
var RESULT_SHEET = 'Result';

var ENTRANT_HEADERS = [
  'Timestamp', 'EntryId', 'Token', 'Name', 'Email', 'Discord', 'Phone', 'Pledges'
];

var RESULT_HEADERS = [
  'DrawnAt', 'WinnerEntryId', 'Backup1', 'Backup2', 'Backup3',
  'WinnerName', 'Backup1Name', 'Backup2Name', 'Backup3Name',
  'EntrantCount', 'Note'
];

// ── HTTP ───────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    e = e || {};
    var p = e.parameter || {};
    var action = String(p.action || 'config').toLowerCase();
    ensureSheets_();

    if (action === 'config') {
      return jsonOut_(publicConfig_());
    }
    if (action === 'status') {
      maybeDrawIfDue_();
      return jsonOut_(statusPayload_(p.token || ''));
    }
    if (action === 'draw') {
      // Optional staff force: ?action=draw&staffKey=...
      var cfg = readConfig_();
      if (p.staffKey && cfg.staffKey && p.staffKey === cfg.staffKey) {
        var r = runDraw_('staff_force');
        return jsonOut_(r);
      }
      return jsonOut_({ ok: false, error: 'forbidden' });
    }
    return jsonOut_({ ok: true, service: 'staryume-lottery' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'empty_body' });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || 'enroll').toLowerCase();
    if (action === 'enroll') return handleEnroll_(data);
    if (action === 'status') {
      maybeDrawIfDue_();
      return jsonOut_(statusPayload_(data.token || ''));
    }
    return jsonOut_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheets bootstrap ───────────────────────────────────────────────────────

function ensureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG_SHEET)) {
    var c = ss.insertSheet(CONFIG_SHEET);
    c.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    var defaults = [
      ['title', '限定海報定價抽選'],
      ['price', 'HKD 80'],
      ['eventName', '同人活動攤位'],
      ['pickup', '18:00–20:00'],
      ['endAt', ''], // ISO e.g. 2026-07-28T14:00:00+08:00
      ['enrollOpen', 'TRUE'],
      ['accessKey', DEFAULT_ACCESS_KEY],
      ['staffKey', ''],
      ['drawn', 'FALSE'],
      ['showEntrantCount', 'TRUE']
    ];
    c.getRange(2, 1, 1 + defaults.length, 2).setValues(defaults);
  }
  if (!ss.getSheetByName(ENTRANTS_SHEET)) {
    var en = ss.insertSheet(ENTRANTS_SHEET);
    en.getRange(1, 1, 1, ENTRANT_HEADERS.length).setValues([ENTRANT_HEADERS]);
  } else {
    ensureHeaders_(ss.getSheetByName(ENTRANTS_SHEET), ENTRANT_HEADERS);
  }
  if (!ss.getSheetByName(RESULT_SHEET)) {
    var rs = ss.insertSheet(RESULT_SHEET);
    rs.getRange(1, 1, 1, RESULT_HEADERS.length).setValues([RESULT_HEADERS]);
  }
}

function ensureHeaders_(sheet, headers) {
  var lastCol = Math.max(sheet.getLastColumn(), headers.length);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!String(existing[0] || '')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function configSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
}
function entrantsSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ENTRANTS_SHEET);
}
function resultSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESULT_SHEET);
}

function readConfig_() {
  var sheet = configSheet_();
  var values = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (!k) continue;
    map[k] = values[i][1];
  }
  var endAtRaw = String(map.endAt || '').trim();
  var endAtMs = endAtRaw ? Date.parse(endAtRaw) : NaN;
  return {
    title: String(map.title || '限定海報定價抽選'),
    price: String(map.price || ''),
    eventName: String(map.eventName || ''),
    pickup: String(map.pickup || '18:00–20:00'),
    endAt: endAtRaw,
    endAtMs: isNaN(endAtMs) ? null : endAtMs,
    enrollOpen: String(map.enrollOpen || 'TRUE').toUpperCase() !== 'FALSE',
    accessKey: String(map.accessKey || DEFAULT_ACCESS_KEY).trim(),
    staffKey: String(map.staffKey || '').trim(),
    drawn: String(map.drawn || 'FALSE').toUpperCase() === 'TRUE',
    showEntrantCount: String(map.showEntrantCount || 'TRUE').toUpperCase() !== 'FALSE'
  };
}

function setConfig_(key, value) {
  var sheet = configSheet_();
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

// ── Public config / status ─────────────────────────────────────────────────

function publicConfig_() {
  var cfg = readConfig_();
  var count = entrantCount_();
  var now = Date.now();
  var pastEnd = cfg.endAtMs != null && now >= cfg.endAtMs;
  var canEnroll = cfg.enrollOpen && !cfg.drawn && !pastEnd;
  return {
    ok: true,
    title: cfg.title,
    price: cfg.price,
    eventName: cfg.eventName,
    pickup: cfg.pickup,
    endAt: cfg.endAt,
    endAtMs: cfg.endAtMs,
    serverNowMs: now,
    enrollOpen: canEnroll,
    drawn: cfg.drawn,
    entrantCount: cfg.showEntrantCount ? count : null,
    accessKeyRequired: !!cfg.accessKey
  };
}

function statusPayload_(token) {
  var cfg = readConfig_();
  var now = Date.now();
  var pastEnd = cfg.endAtMs != null && now >= cfg.endAtMs;
  var result = null;
  if (cfg.drawn) {
    result = readResult_();
  }
  var you = null;
  if (token) {
    you = lookupToken_(String(token).trim());
  }
  return {
    ok: true,
    title: cfg.title,
    price: cfg.price,
    eventName: cfg.eventName,
    pickup: cfg.pickup,
    endAt: cfg.endAt,
    endAtMs: cfg.endAtMs,
    serverNowMs: now,
    enrollOpen: cfg.enrollOpen && !cfg.drawn && !pastEnd,
    drawn: cfg.drawn,
    pastEnd: pastEnd,
    entrantCount: cfg.showEntrantCount ? entrantCount_() : null,
    result: result,
    you: you
  };
}

function entrantCount_() {
  var sheet = entrantsSheet_();
  var last = sheet.getLastRow();
  return last > 1 ? last - 1 : 0;
}

function readResult_() {
  var sheet = resultSheet_();
  if (sheet.getLastRow() < 2) return null;
  var row = sheet.getRange(2, 1, 1, RESULT_HEADERS.length).getValues()[0];
  return {
    drawnAt: row[0] ? String(row[0]) : '',
    winner: { entryId: row[1], name: row[5] || '—' },
    backups: [
      { entryId: row[2], name: row[6] || '—' },
      { entryId: row[3], name: row[7] || '—' },
      { entryId: row[4], name: row[8] || '—' }
    ].filter(function (b) { return b.entryId; }),
    entrantCount: row[9],
    note: row[10] || ''
  };
}

function lookupToken_(token) {
  if (!token) return null;
  var sheet = entrantsSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return { found: false };
  var data = sheet.getRange(2, 1, last, ENTRANT_HEADERS.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][2]) === token) {
      var entryId = String(data[i][1]);
      var name = String(data[i][3]);
      var outcome = 'pending';
      var rankLabel = '';
      if (readConfig_().drawn) {
        var res = readResult_();
        if (res) {
          if (String(res.winner.entryId) === entryId) {
            outcome = 'winner';
            rankLabel = '得主';
          } else {
            var found = false;
            for (var b = 0; b < res.backups.length; b++) {
              if (String(res.backups[b].entryId) === entryId) {
                outcome = 'backup';
                rankLabel = ['第一候補', '第二候補', '第三候補'][b] || ('候補' + (b + 1));
                found = true;
                break;
              }
            }
            if (!found) {
              outcome = 'not_selected';
              rankLabel = '未中選';
            }
          }
        }
      }
      return {
        found: true,
        name: name,
        entryId: entryId,
        outcome: outcome,
        rankLabel: rankLabel
      };
    }
  }
  return { found: false };
}

// ── Enroll ─────────────────────────────────────────────────────────────────

function handleEnroll_(data) {
  // Honeypot
  if (data.website || data.hp) {
    return jsonOut_({ ok: true, ignored: true });
  }

  var cfg = readConfig_();
  var now = Date.now();
  if (cfg.drawn) {
    return jsonOut_({ ok: false, error: 'already_drawn' });
  }
  if (!cfg.enrollOpen) {
    return jsonOut_({ ok: false, error: 'closed' });
  }
  if (cfg.endAtMs != null && now >= cfg.endAtMs) {
    return jsonOut_({ ok: false, error: 'ended' });
  }

  var key = String(data.accessKey || data.k || '').trim();
  if (cfg.accessKey && key !== cfg.accessKey) {
    return jsonOut_({ ok: false, error: 'bad_key' });
  }

  var name = String(data.name || '').trim();
  var email = normalizeEmail_(data.email);
  var discord = String(data.discord || '').trim();
  var phone = String(data.phone || '').trim();

  if (!name || name.length > 80) {
    return jsonOut_({ ok: false, error: 'bad_name' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonOut_({ ok: false, error: 'bad_email' });
  }
  if (!data.pledgeAttend || !data.pledgePay || !data.pledgeBackup) {
    return jsonOut_({ ok: false, error: 'pledges_required' });
  }

  if (emailExists_(email)) {
    return jsonOut_({ ok: false, error: 'duplicate_email' });
  }

  var entryId = 'E' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
  var token = Utilities.getUuid().replace(/-/g, '');
  var ts = new Date();
  entrantsSheet_().appendRow([
    ts,
    entryId,
    token,
    name,
    email,
    discord,
    phone,
    'attend+pay+backup'
  ]);

  // Optional: front-end sends event id (Option B multi-sheet routing)
  var eventSlug = String(data.eventId || data.event || '').trim().toLowerCase();
  var statusUrl = PUBLIC_SITE_ORIGIN + STATUS_PATH +
    '?token=' + encodeURIComponent(token) +
    (eventSlug ? '&event=' + encodeURIComponent(eventSlug) : '') +
    (cfg.accessKey ? '&k=' + encodeURIComponent(cfg.accessKey) : '');

  try {
    sendConfirmEmail_(name, email, cfg, statusUrl, entryId);
  } catch (mailErr) {
    // Still enrolled; report mail issue
    return jsonOut_({
      ok: true,
      entryId: entryId,
      token: token,
      statusUrl: statusUrl,
      mailError: String(mailErr)
    });
  }

  if (STAFF_NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: STAFF_NOTIFY_EMAIL,
        subject: '[Lottery] New enroll: ' + name,
        body: name + ' <' + email + '> discord=' + discord + ' id=' + entryId
      });
    } catch (e2) { /* ignore */ }
  }

  return jsonOut_({
    ok: true,
    entryId: entryId,
    token: token,
    statusUrl: statusUrl
  });
}

function normalizeEmail_(e) {
  return String(e || '').trim().toLowerCase();
}

function emailExists_(email) {
  var sheet = entrantsSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var emails = sheet.getRange(2, 5, last, 5).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (normalizeEmail_(emails[i][0]) === email) return true;
  }
  return false;
}

function sendConfirmEmail_(name, email, cfg, statusUrl, entryId) {
  var subject = '【報名成功】' + cfg.title;
  var body = [
    name + ' 你好，',
    '',
    '你已成功報名：' + cfg.title,
    '活動：' + cfg.eventName,
    '定價：' + cfg.price + '（現場付款）',
    '領取時段：' + cfg.pickup + ' 親臨香港攤位',
    '報名編號：' + entryId,
    cfg.endAt ? ('開獎時間：' + cfg.endAt) : '',
    '',
    '請保存你的查詢頁面（可查看倒數與結果）：',
    statusUrl,
    '',
    '規則摘要：',
    '· 得主 1 名 + 第一／第二／第三候補',
    '· 截止後系統自動抽選',
    '· 得獎者須於領取時段親臨並以定價付款',
    '· 無法到場則由候補遞補',
    '',
    '— staryume'
  ].filter(function (line) { return line !== undefined; }).join('\n');

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

// ── Draw ───────────────────────────────────────────────────────────────────

/** Time-driven trigger: every 5–15 minutes */
function autoDrawTick_() {
  ensureSheets_();
  maybeDrawIfDue_();
}

function maybeDrawIfDue_() {
  var cfg = readConfig_();
  if (cfg.drawn) return { ok: true, already: true };
  if (cfg.endAtMs == null) return { ok: true, waiting: 'no_endAt' };
  if (Date.now() < cfg.endAtMs) return { ok: true, waiting: 'not_yet' };
  return runDraw_('auto');
}

function runDraw_(note) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: 'locked' };
  }
  try {
    var cfg = readConfig_();
    if (cfg.drawn) {
      return { ok: true, already: true, result: readResult_() };
    }

    var sheet = entrantsSheet_();
    var last = sheet.getLastRow();
    if (last < 2) {
      setConfig_('drawn', 'TRUE');
      writeResultRow_([], note + '_empty');
      return { ok: true, empty: true, result: readResult_() };
    }

    var rows = sheet.getRange(2, 1, last, ENTRANT_HEADERS.length).getValues();
    var pool = rows.map(function (r) {
      return { entryId: String(r[1]), name: String(r[3]), email: String(r[4]) };
    });

    // Fisher–Yates
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }

    var top = pool.slice(0, 4);
    setConfig_('drawn', 'TRUE');
    setConfig_('enrollOpen', 'FALSE');
    writeResultRow_(top, note || 'draw');

    if (STAFF_NOTIFY_EMAIL) {
      try {
        var names = top.map(function (t, idx) {
          var label = idx === 0 ? 'Winner' : 'Backup' + idx;
          return label + ': ' + t.name + ' <' + t.email + '>';
        }).join('\n');
        MailApp.sendEmail({
          to: STAFF_NOTIFY_EMAIL,
          subject: '[Lottery] Drawn: ' + cfg.title,
          body: 'Count=' + pool.length + '\n' + names
        });
      } catch (e3) { /* ignore */ }
    }

    return { ok: true, drawn: true, result: readResult_() };
  } finally {
    lock.releaseLock();
  }
}

function writeResultRow_(top, note) {
  var sheet = resultSheet_();
  // Keep only one result row
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow(), RESULT_HEADERS.length).clearContent();
  }
  var w = top[0] || {};
  var b1 = top[1] || {};
  var b2 = top[2] || {};
  var b3 = top[3] || {};
  sheet.getRange(2, 1, 1, RESULT_HEADERS.length).setValues([[
    new Date(),
    w.entryId || '',
    b1.entryId || '',
    b2.entryId || '',
    b3.entryId || '',
    w.name || '',
    b1.name || '',
    b2.name || '',
    b3.name || '',
    entrantCount_(),
    note || ''
  ]]);
}

// ── Manual test helpers (run from Apps Script editor) ──────────────────────

function testPublicConfig() {
  Logger.log(JSON.stringify(publicConfig_()));
}

function testForceDraw() {
  Logger.log(JSON.stringify(runDraw_('manual_test')));
}

function testResetDrawnFlag() {
  // Does NOT clear entrants — only allows re-draw after clearing Result
  setConfig_('drawn', 'FALSE');
  setConfig_('enrollOpen', 'TRUE');
  resultSheet_().clearContents();
  resultSheet_().getRange(1, 1, 1, RESULT_HEADERS.length).setValues([RESULT_HEADERS]);
  Logger.log('drawn flag reset');
}
