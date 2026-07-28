/**
 * Option B: one Google Sheet + Apps Script deployment per event.
 *
 * How to add a new event:
 * 1. Create a new Google Sheet + paste docs/lottery-Code.gs + Deploy web app
 * 2. Add a block below with that deployment URL
 * 3. Share: lottery.html?event=EVENT_ID&k=ACCESS_KEY_FROM_THAT_SHEET
 *
 * SCRIPT_URL must be the full .../exec URL from Apps Script Deploy.
 * Leave scriptUrl empty until that event is set up.
 */
window.LOTTERY_EVENTS = {
  // Example / template — replace scriptUrl after you deploy
  acghk: {
    id: 'acghk',
    label: 'ACGHK',
    scriptUrl: 'https://script.google.com/macros/s/AKfycbygMlzqveQa5JV8qgWyF8yKWYY48v35SADuO7-wRTRb3CDRGCTDijlTKof1U6z1esUh/exec', // e.g. 'https://script.google.com/macros/s/XXXX/exec'
    // Optional hint only (real key is enforced by that Sheet's Config.accessKey)
    note: 'Hong Kong · 中文',
  },
  c108: {
    id: 'c108',
    label: 'Comic Market 108',
    scriptUrl: '',
    note: 'Japan · 日本語向け（UI 仍可為中文直到加語言包）',
  },
  ff47: {
    id: 'ff47',
    label: 'Fancy Frontier 47',
    scriptUrl: '',
    note: 'Taiwan · 繁中',
  },
};

/** Fallback if ?event= is missing — set to an event id you use most, or '' */
window.LOTTERY_DEFAULT_EVENT = 'acghk';

/**
 * Resolve which event + script URL to use from the page query string.
 * @returns {{ eventId: string, event: object|null, scriptUrl: string, error: string|null }}
 */
window.resolveLotteryEvent = function resolveLotteryEvent() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get('event') || params.get('e') || window.LOTTERY_DEFAULT_EVENT || '').trim().toLowerCase();
  const events = window.LOTTERY_EVENTS || {};
  const event = raw ? events[raw] : null;

  if (!raw) {
    return { eventId: '', event: null, scriptUrl: '', error: 'missing_event' };
  }
  if (!event) {
    return { eventId: raw, event: null, scriptUrl: '', error: 'unknown_event' };
  }
  const scriptUrl = String(event.scriptUrl || '').trim();
  if (!scriptUrl || scriptUrl === 'YOUR_SCRIPT_URL_HERE') {
    return { eventId: raw, event: event, scriptUrl: '', error: 'no_script_url' };
  }
  return { eventId: raw, event: event, scriptUrl: scriptUrl, error: null };
};
