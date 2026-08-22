// ── STARYUME FF47 色紙 auction — paste into Apps Script bound to a NEW Sheet ──
// Deploy: Deploy → New deployment → Web app
//   Execute as: Me · Who has access: Anyone
// After edit: Manage deployments → Edit → New version → Deploy
// Trigger: Triggers → Add trigger → autoCloseTick_ → Time-driven → Every 5 minutes
// Backup: run installBackupTriggers() once (hourly snapshots; every minute in last hour)
// Setup: docs/auction-apps-script.md

var PUBLIC_SITE_ORIGIN = 'https://staryu.me';
var PAGE_PATH = '/auction.html';
var STAFF_NOTIFY_EMAIL = 'staryume@gmail.com';

var CONFIG_SHEET = 'Config';
var BIDS_SHEET = 'Bids';
var RESULT_SHEET = 'Result';
var BIDS_LOG_SHEET = 'BidsLog';
var SNAPSHOT_SHEET = 'Snapshots';
var SNAPSHOT_BIDS_SHEET = 'SnapshotBids';
var PUBLIC_CACHE_KEY = 'publicStateV1';
var PUBLIC_CACHE_SEC = 8;

var BID_HEADERS = [
  'Timestamp', 'BidId', 'Email', 'Name', 'Discord', 'Phone',
  'Amount', 'Source', 'Note'
];
var RESULT_HEADERS = [
  'ClosedAt', 'WinnerBidId', 'WinnerName', 'WinnerEmail', 'WinnerAmount',
  'BidCount', 'Note'
];
var SNAPSHOT_HEADERS = [
  'TakenAt', 'Kind', 'BidCount', 'HighAmount', 'HighName', 'HighEmail',
  'HighBidId', 'EndAt', 'Closed', 'ListText'
];
var SNAPSHOT_BID_HEADERS = [
  'SnapshotAt', 'Kind', 'Timestamp', 'BidId', 'Email', 'Name', 'Discord',
  'Phone', 'Amount', 'Source'
];

function doGet(e) {
  try {
    e = e || {};
    var p = e.parameter || {};
    var action = String(p.action || 'config').toLowerCase();
    ensureSheets_();
    if (action === 'config' || action === 'status') {
      return jsonOut_(cachedOrFreshPublicState_());
    }
    return jsonOut_({ ok: true, service: 'staryume-auction' });
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
    var action = String(data.action || 'bid').toLowerCase();
    if (action === 'config' || action === 'status') {
      return jsonOut_(cachedOrFreshPublicState_());
    }
    if (action === 'bid') return handleBid_(data, 'web');
    if (action === 'staff_bid') return handleStaffBid_(data);
    if (action === 'snapshot') {
      var cfgSnap = readConfig_();
      if (!data.staffKey || !cfgSnap.staffKey || data.staffKey !== cfgSnap.staffKey) {
        return jsonOut_({ ok: false, error: 'forbidden' });
      }
      return jsonOut_(snapshotBids_('manual'));
    }
    if (action === 'close') {
      var cfg = readConfig_();
      if (!data.staffKey || !cfg.staffKey || data.staffKey !== cfg.staffKey) {
        return jsonOut_({ ok: false, error: 'forbidden' });
      }
      return jsonOut_(runClose_('staff_force'));
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

function ensureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG_SHEET)) {
    var c = ss.insertSheet(CONFIG_SHEET);
    c.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    var defaults = [
      ['title', 'FF47 色紙競標'],
      ['eventName', 'Fancy Frontier 47'],
      ['startBid', '1000'],
      ['step', '100'],
      ['endAt', '2026-08-23T15:00:00+08:00'],
      ['extendedEndAt', ''],
      ['softCloseMinutes', '5'],
      ['extendMinutes', '3'],
      ['extendCapMinutes', '30'],
      ['pickup', '8/23（日）15:00 花博爭豔館 S-27 / S-28 ありぃずこーひー'],
      ['pickupNote', '若得標者無法進入 FF 會場，可安排於花博入口交接。'],
      ['accessKey', ''],
      ['staffKey', ''],
      ['closed', 'FALSE'],
      ['enrollOpen', 'TRUE']
    ];
    c.getRange(2, 1, defaults.length, 2).setValues(defaults);
  }
  if (!ss.getSheetByName(BIDS_SHEET)) {
    var b = ss.insertSheet(BIDS_SHEET);
    b.getRange(1, 1, 1, BID_HEADERS.length).setValues([BID_HEADERS]);
  }
  if (!ss.getSheetByName(RESULT_SHEET)) {
    var r = ss.insertSheet(RESULT_SHEET);
    r.getRange(1, 1, 1, RESULT_HEADERS.length).setValues([RESULT_HEADERS]);
  }
  if (!ss.getSheetByName(BIDS_LOG_SHEET)) {
    var log = ss.insertSheet(BIDS_LOG_SHEET);
    log.getRange(1, 1, 1, BID_HEADERS.length).setValues([BID_HEADERS]);
  }
  if (!ss.getSheetByName(SNAPSHOT_SHEET)) {
    var snap = ss.insertSheet(SNAPSHOT_SHEET);
    snap.getRange(1, 1, 1, SNAPSHOT_HEADERS.length).setValues([SNAPSHOT_HEADERS]);
  }
  if (!ss.getSheetByName(SNAPSHOT_BIDS_SHEET)) {
    var sb = ss.insertSheet(SNAPSHOT_BIDS_SHEET);
    sb.getRange(1, 1, 1, SNAPSHOT_BID_HEADERS.length).setValues([SNAPSHOT_BID_HEADERS]);
  }
}

function backfillBidsLogIfEmpty_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(BIDS_LOG_SHEET);
  var bidsSh = ss.getSheetByName(BIDS_SHEET);
  if (!log || !bidsSh) return;
  if (log.getLastRow() > 1) return;
  if (bidsSh.getLastRow() < 2) return;
  var width = BID_HEADERS.length;
  var values = bidsSh.getRange(2, 1, bidsSh.getLastRow() - 1, width).getValues();
  log.getRange(2, 1, values.length, width).setValues(values);
}

function readConfig_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  var values = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (k) map[k] = values[i][1];
  }
  var endAtRaw = String(map.endAt || '').trim();
  var extRaw = String(map.extendedEndAt || '').trim();
  var endAtMs = endAtRaw ? Date.parse(endAtRaw) : NaN;
  var extMs = extRaw ? Date.parse(extRaw) : NaN;
  var effectiveMs = endAtMs;
  if (!isNaN(extMs) && (isNaN(endAtMs) || extMs > endAtMs)) effectiveMs = extMs;
  return {
    title: String(map.title || 'FF47 色紙競標'),
    eventName: String(map.eventName || 'Fancy Frontier 47'),
    startBid: int_(map.startBid, 1000),
    step: int_(map.step, 100),
    endAt: endAtRaw,
    endAtMs: isNaN(endAtMs) ? null : endAtMs,
    extendedEndAt: extRaw,
    effectiveEndMs: isNaN(effectiveMs) ? null : effectiveMs,
    softCloseMinutes: int_(map.softCloseMinutes, 5),
    extendMinutes: int_(map.extendMinutes, 3),
    extendCapMinutes: int_(map.extendCapMinutes, 30),
    pickup: String(map.pickup || ''),
    pickupNote: String(map.pickupNote || ''),
    accessKey: String(map.accessKey || '').trim(),
    staffKey: String(map.staffKey || '').trim(),
    closed: String(map.closed || 'FALSE').toUpperCase() === 'TRUE',
    enrollOpen: String(map.enrollOpen || 'TRUE').toUpperCase() !== 'FALSE'
  };
}

function setConfig_(key, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function int_(v, fallback) {
  var n = parseInt(v, 10);
  return isFinite(n) ? n : (fallback || 0);
}

function normalizeEmail_(e) {
  return String(e || '').trim().toLowerCase();
}

function bidsSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BIDS_SHEET);
}

function allBids_() {
  var sh = bidsSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last, BID_HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var amount = int_(row[6], 0);
    if (!amount) continue;
    var ts = row[0];
    var ms = ts instanceof Date ? ts.getTime() : Date.parse(ts);
    out.push({
      ts: ts,
      tsMs: isFinite(ms) ? ms : 0,
      tsLabel: ts instanceof Date
        ? Utilities.formatDate(ts, 'Asia/Taipei', 'MM/dd HH:mm')
        : String(ts || ''),
      bidId: String(row[1] || ''),
      email: String(row[2] || ''),
      name: String(row[3] || ''),
      discord: String(row[4] || ''),
      phone: String(row[5] || ''),
      amount: amount,
      source: String(row[7] || 'web')
    });
  }
  out.sort(function (a, b) {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.tsMs - b.tsMs;
  });
  return out;
}

function highBid_(bids) {
  if (!bids || !bids.length) return null;
  return bids[0];
}

function publicList_(bids) {
  return (bids || []).map(function (b) {
    return {
      tsLabel: b.tsLabel,
      name: b.name,
      discord: b.discord,
      amount: b.amount,
      source: b.source === 'booth' ? 'booth' : 'web'
    };
  });
}

function publicState_() {
  var state = computePublicState_();
  var ttl = PUBLIC_CACHE_SEC;
  if (state.endAtMs) {
    var left = state.endAtMs - Date.now();
    if (left <= 2 * 60 * 1000) ttl = 1;
    else if (left <= 15 * 60 * 1000) ttl = 2;
    else if (left <= 60 * 60 * 1000) ttl = 4;
  }
  try {
    CacheService.getScriptCache().put(PUBLIC_CACHE_KEY, JSON.stringify(state), ttl);
  } catch (e) { /* ignore */ }
  return state;
}

function computePublicState_() {
  var cfg = readConfig_();
  var bids = allBids_();
  var high = highBid_(bids);
  var now = Date.now();
  var pastEnd = cfg.effectiveEndMs != null && now >= cfg.effectiveEndMs;
  var open = cfg.enrollOpen && !cfg.closed && !pastEnd;
  var nextMin = high ? high.amount + cfg.step : cfg.startBid;
  return {
    ok: true,
    title: cfg.title,
    eventName: cfg.eventName,
    startBid: cfg.startBid,
    step: cfg.step,
    high: high ? high.amount : 0,
    highName: high ? high.name : '',
    highDiscord: high ? high.discord : '',
    nextMin: nextMin,
    bidCount: bids.length,
    bids: publicList_(bids),
    endAt: cfg.endAt,
    endAtMs: cfg.effectiveEndMs,
    serverNowMs: now,
    pickup: cfg.pickup,
    pickupNote: cfg.pickupNote,
    open: open,
    closed: cfg.closed || pastEnd,
    accessKeyRequired: !!cfg.accessKey
  };
}

function cachedOrFreshPublicState_() {
  try {
    var hit = CacheService.getScriptCache().get(PUBLIC_CACHE_KEY);
    if (hit) {
      var cached = JSON.parse(hit);
      var left = (cached.endAtMs || 0) - Date.now();
      // Last 2 minutes: always re-read so close lands on time.
      if (left > 2 * 60 * 1000) return cached;
    }
  } catch (e) { /* ignore */ }
  maybeCloseIfDue_();
  return publicState_();
}

function invalidatePublicCache_() {
  try { CacheService.getScriptCache().remove(PUBLIC_CACHE_KEY); } catch (e) {}
}

function handleStaffBid_(data) {
  var cfg = readConfig_();
  if (!data.staffKey || !cfg.staffKey || String(data.staffKey) !== cfg.staffKey) {
    return jsonOut_({ ok: false, error: 'forbidden' });
  }
  data.pledgePay = true;
  data.pledgePickup = true;
  return handleBid_(data, 'booth');
}

function handleBid_(data, source) {
  if (data.website || data.hp) {
    return jsonOut_({ ok: true, ignored: true });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    maybeCloseIfDue_();
    var cfg = readConfig_();
    var now = Date.now();
    if (cfg.closed) {
      return jsonOut_({ ok: false, error: 'closed' });
    }
    if (!cfg.enrollOpen) {
      return jsonOut_({ ok: false, error: 'closed' });
    }
    if (cfg.effectiveEndMs != null && now >= cfg.effectiveEndMs) {
      runClose_('auto_on_bid');
      return jsonOut_({ ok: false, error: 'ended' });
    }
    if (source !== 'booth' && cfg.accessKey) {
      var key = String(data.accessKey || data.k || '').trim();
      if (key !== cfg.accessKey) {
        return jsonOut_({ ok: false, error: 'bad_key' });
      }
    }

    var name = String(data.name || '').trim();
    var email = normalizeEmail_(data.email);
    var discord = String(data.discord || '').trim();
    var phone = String(data.phone || '').trim();
    var amount = int_(data.amount, 0);

    if (!name || name.length > 80) {
      return jsonOut_({ ok: false, error: 'bad_name' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonOut_({ ok: false, error: 'bad_email' });
    }
    if (!data.pledgePay || !data.pledgePickup) {
      return jsonOut_({ ok: false, error: 'pledges_required' });
    }
    if (amount <= 0 || amount % cfg.step !== 0) {
      return jsonOut_({ ok: false, error: 'bad_amount' });
    }

    var bids = allBids_();
    var high = highBid_(bids);
    var minOk = high ? high.amount + cfg.step : cfg.startBid;
    if (amount < minOk) {
      return jsonOut_({
        ok: false,
        error: 'too_low',
        nextMin: minOk,
        high: high ? high.amount : 0
      });
    }

    var ownHigh = 0;
    for (var i = 0; i < bids.length; i++) {
      if (bids[i].email === email && bids[i].amount > ownHigh) ownHigh = bids[i].amount;
    }
    if (amount <= ownHigh) {
      return jsonOut_({ ok: false, error: 'not_higher_than_own', nextMin: minOk });
    }

    var prevLeader = high;

    if (cfg.endAtMs != null && cfg.softCloseMinutes > 0) {
      var capMs = cfg.endAtMs + cfg.extendCapMinutes * 60 * 1000;
      var windowMs = cfg.softCloseMinutes * 60 * 1000;
      var effective = cfg.effectiveEndMs || cfg.endAtMs;
      if (now >= effective - windowMs && now < capMs) {
        var extended = now + cfg.extendMinutes * 60 * 1000;
        if (extended > capMs) extended = capMs;
        if (extended > effective) {
          var iso = Utilities.formatDate(new Date(extended), 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm:ss'+08:00'");
          setConfig_('extendedEndAt', iso);
          cfg.effectiveEndMs = extended;
        }
      }
    }

    var bidId = 'B' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
    var ts = new Date();
    bidsSheet_().appendRow([
      ts,
      bidId,
      email,
      name,
      discord,
      phone,
      amount,
      source || 'web',
      ''
    ]);
    try {
      var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BIDS_LOG_SHEET);
      if (log) {
        log.appendRow([
          ts,
          bidId,
          email,
          name,
          discord,
          phone,
          amount,
          source || 'web',
          ''
        ]);
      }
    } catch (logErr) { /* bid still recorded */ }
    invalidatePublicCache_();

    var pageUrl = PUBLIC_SITE_ORIGIN + PAGE_PATH;
    try {
      sendBidConfirmEmail_(name, email, amount, cfg, pageUrl);
    } catch (mailErr) {
      /* still recorded */
    }

    if (prevLeader && prevLeader.email && prevLeader.email !== email) {
      try {
        sendOutbidEmail_(prevLeader.name, prevLeader.email, prevLeader.amount, amount, pageUrl, cfg);
      } catch (e2) { /* ignore */ }
    }

    if (STAFF_NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail({
          to: STAFF_NOTIFY_EMAIL,
          subject: '[色紙競標] NT$' + amount + ' · ' + name,
          body: name + ' <' + email + '>\nDiscord: ' + discord + '\nNT$ ' + amount + '\nsource: ' + (source || 'web') + '\n' + pageUrl
        });
      } catch (e3) { /* ignore */ }
    }

    return jsonOut_({
      ok: true,
      bidId: bidId,
      amount: amount,
      high: amount,
      nextMin: amount + cfg.step,
      endAtMs: cfg.effectiveEndMs
    });
  } finally {
    lock.releaseLock();
  }
}

function maybeCloseIfDue_() {
  var cfg = readConfig_();
  if (cfg.closed) return;
  if (cfg.effectiveEndMs != null && Date.now() >= cfg.effectiveEndMs) {
    runClose_('auto');
  }
}

function autoCloseTick_() {
  ensureSheets_();
  maybeCloseIfDue_();
}

function runClose_(note) {
  var cfg = readConfig_();
  if (cfg.closed) {
    return { ok: true, alreadyClosed: true };
  }
  var bids = allBids_();
  var high = highBid_(bids);
  setConfig_('closed', 'TRUE');
  setConfig_('enrollOpen', 'FALSE');
  invalidatePublicCache_();
  try { snapshotBids_('close'); } catch (snapErr) { /* still close */ }
  var closedAt = new Date();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESULT_SHEET);
  sh.appendRow([
    closedAt,
    high ? high.bidId : '',
    high ? high.name : '',
    high ? high.email : '',
    high ? high.amount : '',
    bids.length,
    note || ''
  ]);

  if (high && high.email) {
    try {
      sendWinnerEmail_(high, cfg);
    } catch (e) { /* ignore */ }
  }
  if (STAFF_NOTIFY_EMAIL) {
    try {
      var lines = ['競標已結束 ' + note, ''];
      if (high) {
        lines.push('得標: ' + high.name + ' <' + high.email + '> NT$' + high.amount);
        lines.push('Discord: ' + high.discord);
        lines.push('電話: ' + high.phone);
      } else {
        lines.push('無出價');
      }
      lines.push('');
      bids.forEach(function (b) {
        lines.push('NT$' + b.amount + '  ' + b.name + '  ' + b.email + '  ' + b.tsLabel);
      });
      MailApp.sendEmail({
        to: STAFF_NOTIFY_EMAIL,
        subject: '[色紙競標] 結束' + (high ? (' · NT$' + high.amount + ' ' + high.name) : ' · 無出價'),
        body: lines.join('\n')
      });
    } catch (e2) { /* ignore */ }
  }
  return { ok: true, closed: true, winner: high ? { name: high.name, amount: high.amount } : null };
}

function sendBidConfirmEmail_(name, email, amount, cfg, pageUrl) {
  MailApp.sendEmail({
    to: email,
    subject: '【STARYUME】色紙競標出價已收到 NT$' + amount,
    body:
      name + ' 你好，\n\n' +
      '已收到你的出價：NT$ ' + amount + '\n' +
      '競標頁：' + pageUrl + '\n\n' +
      '截標：' + cfg.endAt + '\n' +
      '領取：' + cfg.pickup + '\n' +
      cfg.pickupNote + '\n\n' +
      '若被超標，會再寄信通知。得標者以現場現金支付得標金額。\n\n' +
      '— STARYUME'
  });
}

function sendOutbidEmail_(name, email, oldAmt, newAmt, pageUrl, cfg) {
  MailApp.sendEmail({
    to: email,
    subject: '【STARYUME】色紙競標：你的 NT$' + oldAmt + ' 已被超標',
    body:
      name + ' 你好，\n\n' +
      '目前最高價已更新為 NT$ ' + newAmt + '。\n' +
      '若要繼續競標，請到：' + pageUrl + '\n' +
      '下一手最低：NT$ ' + (newAmt + cfg.step) + '\n\n' +
      '截標：' + cfg.endAt + '\n\n' +
      '— STARYUME'
  });
}

function sendWinnerEmail_(high, cfg) {
  MailApp.sendEmail({
    to: high.email,
    subject: '【STARYUME】你得標了 FF47 色紙 · NT$' + high.amount,
    body:
      high.name + ' 你好，\n\n' +
      '恭喜，你是最高出價者：NT$ ' + high.amount + '\n\n' +
      '領取：' + cfg.pickup + '\n' +
      cfg.pickupNote + '\n' +
      '請以現金支付得標金額。\n\n' +
      '— STARYUME'
  });
}

function testPublicConfig() {
  ensureSheets_();
  Logger.log(JSON.stringify(publicState_()));
}

/**
 * Run once in the Apps Script editor (authorize if asked).
 * Creates a 1-minute trigger that writes:
 *   - hourly snapshots until the last hour
 *   - every-minute snapshots in the final 60 minutes
 * Also takes one snapshot immediately.
 */
function installBackupTriggers() {
  ensureSheets_();
  backfillBidsLogIfEmpty_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'backupTick_' || fn === 'hourlySnapshot_' || fn === 'minuteSnapshot_') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('backupTick_').timeBased().everyMinutes(1).create();
  var first = snapshotBids_('manual');
  PropertiesService.getScriptProperties().setProperty('lastHourlySnapshotMs', String(Date.now()));
  Logger.log('backupTick_ every 1 minute installed. first snapshot bidCount=' + (first && first.bidCount));
}

function backupTick_() {
  ensureSheets_();
  var cfg = readConfig_();
  var now = Date.now();
  var end = cfg.effectiveEndMs;
  var props = PropertiesService.getScriptProperties();

  if (end != null) {
    var msLeft = end - now;
    var inLastHour = msLeft <= 60 * 60 * 1000 && msLeft >= -10 * 60 * 1000;
    if (inLastHour) {
      snapshotBids_('minute');
      return;
    }
  }

  if (cfg.closed) {
    if (props.getProperty('closedSnapshotDone') !== '1') {
      snapshotBids_('close');
      props.setProperty('closedSnapshotDone', '1');
    }
    return;
  }

  var lastHourly = Number(props.getProperty('lastHourlySnapshotMs') || 0);
  if (!lastHourly || now - lastHourly >= 50 * 60 * 1000) {
    snapshotBids_('hourly');
    props.setProperty('lastHourlySnapshotMs', String(now));
  }
}

function snapshotBids_(kind) {
  ensureSheets_();
  var cfg = readConfig_();
  var bids = allBids_();
  var high = highBid_(bids);
  var takenAt = new Date();
  var stamp = Utilities.formatDate(takenAt, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
  var lines = [];
  for (var i = 0; i < bids.length; i++) {
    var b = bids[i];
    lines.push(
      'NT$' + b.amount + '\t' + b.name + '\t' + b.email + '\t' +
      (b.discord || '') + '\t' + (b.phone || '') + '\t' + b.tsLabel + '\t' + (b.source || '')
    );
  }
  var listText = lines.length ? lines.join('\n') : '(no bids)';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var snap = ss.getSheetByName(SNAPSHOT_SHEET);
  snap.appendRow([
    takenAt,
    kind || '',
    bids.length,
    high ? high.amount : 0,
    high ? high.name : '',
    high ? high.email : '',
    high ? high.bidId : '',
    cfg.endAt || '',
    cfg.closed ? 'TRUE' : 'FALSE',
    stamp + '\n' + listText
  ]);

  var sb = ss.getSheetByName(SNAPSHOT_BIDS_SHEET);
  // Minute ticks in the last hour only write the summary row; BidsLog already has every bid.
  if (bids.length && kind !== 'minute') {
    var rows = [];
    for (var j = 0; j < bids.length; j++) {
      var x = bids[j];
      rows.push([
        takenAt,
        kind || '',
        x.ts || '',
        x.bidId,
        x.email,
        x.name,
        x.discord,
        x.phone,
        x.amount,
        x.source || ''
      ]);
    }
    sb.getRange(sb.getLastRow() + 1, 1, rows.length, SNAPSHOT_BID_HEADERS.length).setValues(rows);
  }

  var props = PropertiesService.getScriptProperties();
  var fp = String(bids.length) + ':' + (high ? high.amount : 0) + ':' + (high ? high.bidId : '');
  var lastMailMs = Number(props.getProperty('lastBackupMailMs') || 0);
  var hourDue = !lastMailMs || (Date.now() - lastMailMs >= 50 * 60 * 1000);
  var shouldMail = kind === 'hourly' || kind === 'manual' || kind === 'close';
  if (kind === 'minute') {
    var prev = props.getProperty('lastMailedFingerprint') || '';
    // last hour: still send the hourly inbox copy, plus extra mail when the high changes
    if (fp !== prev || hourDue) shouldMail = true;
  }
  if (kind === 'close') {
    props.setProperty('closedSnapshotDone', '1');
  }

  if (shouldMail && STAFF_NOTIFY_EMAIL) {
    try {
      sendBackupEmail_(kind, stamp, cfg, bids, high, listText);
      props.setProperty('lastMailedFingerprint', fp);
      props.setProperty('lastBackupMailMs', String(Date.now()));
    } catch (mailErr) { /* sheet snapshot still saved */ }
  }

  return {
    ok: true,
    kind: kind || '',
    bidCount: bids.length,
    high: high ? high.amount : 0
  };
}

function sendBackupEmail_(kind, stamp, cfg, bids, high, listText) {
  var reason =
    kind === 'hourly' ? '每小時自動備份（不是新出價通知）' :
    kind === 'minute' ? '截標前一小時備份（最高價有變，或已滿一小時）' :
    kind === 'close' ? '截標備份' :
    kind === 'manual' ? '手動備份（installBackupTriggers / snapshotNow）' :
    ('備份 · ' + (kind || ''));
  MailApp.sendEmail({
    to: STAFF_NOTIFY_EMAIL,
    subject:
      '【色紙競標備份】' + bids.length + '筆 · ' +
      (high ? ('最高 NT$' + high.amount + ' ' + high.name) : '無出價') +
      ' · ' + stamp,
    body:
      reason + '\n\n' +
      '時間：' + stamp + '（台北）\n' +
      '截標：' + (cfg.endAt || '') + '\n' +
      '目前最高：' + (high ? ('NT$' + high.amount + '  ' + high.name + '  <' + high.email + '>') : '尚無出價') + '\n' +
      '筆數：' + bids.length + '\n' +
      'closed：' + cfg.closed + '\n\n' +
      '完整列表（高→低）：\n' +
      '金額\t姓名\t電郵\tDiscord\t電話\t時間\t來源\n' +
      listText + '\n\n' +
      '試算表分頁：Snapshots / SnapshotBids / BidsLog\n' +
      '競標頁：' + PUBLIC_SITE_ORIGIN + PAGE_PATH + '\n'
  });
}

function snapshotNow() {
  ensureSheets_();
  var r = snapshotBids_('manual');
  Logger.log(JSON.stringify(r));
  return r;
}

/**
 * Run this in the Apps Script editor after a test bid to wipe bids and reopen.
 * Does not send emails. Keeps Config rules (startBid / endAt).
 */
function resetAuctionForTest() {
  ensureSheets_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bids = ss.getSheetByName(BIDS_SHEET);
  if (bids.getLastRow() > 1) {
    bids.deleteRows(2, bids.getLastRow() - 1);
  }
  var result = ss.getSheetByName(RESULT_SHEET);
  if (result.getLastRow() > 1) {
    result.deleteRows(2, result.getLastRow() - 1);
  }
  setConfig_('closed', 'FALSE');
  setConfig_('enrollOpen', 'TRUE');
  setConfig_('extendedEndAt', '');
  invalidatePublicCache_();
  PropertiesService.getScriptProperties().deleteProperty('closedSnapshotDone');
  Logger.log('Auction reset: no bids, open. BidsLog / Snapshots kept.');
}
