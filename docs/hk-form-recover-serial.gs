/**
 * Recover 流水號 for HK Book Form Responses from Gmail Sent confirmation mail.
 *
 * Spreadsheet: Extensions → Apps Script → paste this file (or append below doPost).
 * Run: RecoverSerialsFromGmail
 * First run: Review permissions (Gmail + Sheets).
 *
 * Also run EnsureSerialColumn_ once if column B is still Method.
 */

var SERIAL_COL = 2;
var EMAIL_COL = 5; // after Serial is inserted: A Timestamp, B Serial, C Method, D Name, E Email
var SUBJECT_CONFIRM = '香港領取登記確認';
var SUBJECT_DUP = '流水號已登記';

function EnsureSerialColumn_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headerB = String(sheet.getRange(1, 2).getValue() || '').trim().toLowerCase();
  if (headerB === 'serial' || headerB.indexOf('流水') >= 0) return 'Serial column already present';
  sheet.insertColumnBefore(2);
  sheet.getRange(1, 2).setValue('Serial');
  return 'Inserted column B = Serial';
}

function RecoverSerialsFromGmail() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var colNote = EnsureSerialColumn_();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('No data rows.');
      return;
    }

    var emailToRows = indexSheetEmails_(sheet, lastRow);
    var parsed = collectSerialsFromGmail_();
    var filled = 0;
    var skippedHasSerial = 0;
    var unmatched = [];
    var used = {};

    parsed.forEach(function (item) {
      var key = item.email.toLowerCase();
      var rows = emailToRows[key] || [];
      if (!rows.length) {
        unmatched.push(item.email + ' / ' + item.serial + ' (no sheet row)');
        return;
      }
      var target = pickRow_(rows, item, used);
      if (!target) {
        unmatched.push(item.email + ' / ' + item.serial + ' (all rows already filled or no timestamp match)');
        return;
      }
      var existing = String(sheet.getRange(target.row, SERIAL_COL).getValue() || '').trim();
      if (existing) {
        skippedHasSerial++;
        return;
      }
      sheet.getRange(target.row, SERIAL_COL).setValue(item.serial);
      used[target.row] = true;
      filled++;
    });

    var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RecoverLog');
    if (!log) log = SpreadsheetApp.getActiveSpreadsheet().insertSheet('RecoverLog');
    log.clear();
    log.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    log.appendRow(['ranAt', new Date()]);
    log.appendRow(['columnFix', colNote]);
    log.appendRow(['gmailHits', parsed.length]);
    log.appendRow(['filled', filled]);
    log.appendRow(['skippedAlreadyHadSerial', skippedHasSerial]);
    log.appendRow(['unmatched', unmatched.length]);
    unmatched.forEach(function (u) { log.appendRow(['unmatched', u]); });

    SpreadsheetApp.getUi().alert(
      '流水號 recovery\n\n' +
      colNote + '\n' +
      'Gmail hits: ' + parsed.length + '\n' +
      'Filled empty Serial cells: ' + filled + '\n' +
      'Already had Serial: ' + skippedHasSerial + '\n' +
      'Unmatched: ' + unmatched.length + '\n\n' +
      (parsed.length === 0
        ? 'No confirmation emails with 【流水號】 found. The old script probably never mailed the serial. Ask customers on Discord.'
        : 'See sheet RecoverLog for details.')
    );
  } finally {
    lock.releaseLock();
  }
}

function indexSheetEmails_(sheet, lastRow) {
  var values = sheet.getRange(2, 1, lastRow, Math.max(EMAIL_COL, sheet.getLastColumn())).getValues();
  var map = {};
  for (var i = 0; i < values.length; i++) {
    var email = String(values[i][EMAIL_COL - 1] || '').trim().toLowerCase();
    if (!email) continue;
    if (!map[email]) map[email] = [];
    map[email].push({
      row: i + 2,
      ts: values[i][0] instanceof Date ? values[i][0] : null,
      serial: String(values[i][SERIAL_COL - 1] || '').trim()
    });
  }
  return map;
}

function pickRow_(rows, item, used) {
  var empty = rows.filter(function (r) { return !used[r.row]; });
  if (!empty.length) return null;
  if (empty.length === 1) return empty[0];
  if (item.date) {
    var best = null;
    var bestDiff = Infinity;
    empty.forEach(function (r) {
      if (!r.ts) return;
      var diff = Math.abs(r.ts.getTime() - item.date.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        best = r;
      }
    });
    // same person, same day (±36h) is good enough
    if (best && bestDiff < 36 * 60 * 60 * 1000) return best;
  }
  return empty.filter(function (r) { return !r.serial; })[0] || empty[0];
}

function collectSerialsFromGmail_() {
  var query = 'in:sent (subject:"' + SUBJECT_CONFIRM + '" OR subject:"' + SUBJECT_DUP + '")';
  var threads = GmailApp.search(query, 0, 500);
  var out = [];
  threads.forEach(function (th) {
    th.getMessages().forEach(function (msg) {
      var subject = String(msg.getSubject() || '');
      var body = String(msg.getPlainBody() || '');
      var serial = parseSerial_(subject, body);
      if (!serial) return;
      var email = firstTo_(msg);
      if (!email) {
        var m = body.match(/【電郵】\s*(\S+@\S+)/);
        if (m) email = m[1].trim();
      }
      if (!email) return;
      out.push({ email: email, serial: serial, date: msg.getDate() });
    });
  });
  return out;
}

function parseSerial_(subject, body) {
  var m = body.match(/【流水號】\s*([^\s\n]+)/);
  if (m) return String(m[1]).trim().replace(/\s+/g, '');
  m = body.match(/流水號「([^」]+)」/);
  if (m) return String(m[1]).trim().replace(/\s+/g, '');
  m = subject.match(/·\s*(\S+)\s*$/);
  if (m && /確認|已登記/.test(subject)) return String(m[1]).trim();
  return '';
}

function firstTo_(msg) {
  var to = String(msg.getTo() || '');
  var m = to.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  return m ? m[0] : '';
}
