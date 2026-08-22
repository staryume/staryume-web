// ── STARYUME FF47 色紙 auction — paste into Apps Script bound to a NEW Sheet ──
// Deploy: Deploy → New deployment → Web app
//   Execute as: Me · Who has access: Anyone
// After edit: Manage deployments → Edit → New version → Deploy
// Trigger: Triggers → Add trigger → autoCloseTick_ → Time-driven → Every 5 minutes
// Setup: docs/auction-apps-script.md

var PUBLIC_SITE_ORIGIN = 'https://staryu.me';
var PAGE_PATH = '/auction.html';
var STAFF_NOTIFY_EMAIL = 'staryume@gmail.com';

var CONFIG_SHEET = 'Config';
var BIDS_SHEET = 'Bids';
var RESULT_SHEET = 'Result';

var BID_HEADERS = [
  'Timestamp', 'BidId', 'Email', 'Name', 'Discord', 'Phone',
  'Amount', 'Source', 'Note'
];
var RESULT_HEADERS = [
  'ClosedAt', 'WinnerBidId', 'WinnerName', 'WinnerEmail', 'WinnerAmount',
  'BidCount', 'Note'
];

function doGet(e) {
  try {
    e = e || {};
    var p = e.parameter || {};
    var action = String(p.action || 'config').toLowerCase();
    ensureSheets_();
    if (action === 'config' || action === 'status') {
      maybeCloseIfDue_();
      return jsonOut_(publicState_());
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
      maybeCloseIfDue_();
      return jsonOut_(publicState_());
    }
    if (action === 'bid') return handleBid_(data, 'web');
    if (action === 'staff_bid') return handleStaffBid_(data);
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
      ['startBid', '2000'],
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
    startBid: int_(map.startBid, 2000),
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
