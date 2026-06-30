/**
 * Leadership Kickoff Planner — Apps Script host
 * ---------------------------------------------
 * Serves the planner app and injects the live schedule, read directly from the
 * FCPS Google Sheet. Because the script runs as an authorized FCPS user, the
 * Sheet can stay restricted to "FCPS All Staff": only this script reads it, and
 * it exposes nothing but the schedule data already meant to be shown.
 *
 * Setup is in apps-script/DEPLOY.md. In short:
 *   1. Open the schedule Sheet, Extensions -> Apps Script (this binds the script
 *      to the Sheet, so no Sheet ID is needed).
 *   2. Paste this file into Code.gs.
 *   3. Add an HTML file named exactly "Index" and paste the full index.html into it.
 *   4. Deploy -> New deployment -> Web app. Execute as: Me. Who has access:
 *      whatever FCPS allows (Anyone, or Anyone within FCPS).
 */

// Day tabs, in order. Each "tab" must match a Sheet tab name exactly.
var TABS = [
  { day: 'Tue Jul 21', date: '2026-07-21', tab: 'Tue Jul 21' },
  { day: 'Wed Jul 22', date: '2026-07-22', tab: 'Wed Jul 22' },
  { day: 'Thu Jul 23', date: '2026-07-23', tab: 'Thu Jul 23' },
  { day: 'Fri Jul 24', date: '2026-07-24', tab: 'Fri Jul 24' }
];

// Leave blank when the script is bound to the Sheet (the normal setup). If you
// run this as a standalone script instead, paste the Sheet's file ID here — the
// long string in the Sheet's edit URL, /spreadsheets/d/<THIS_PART>/edit.
var SHEET_ID = '';

/** Web app entry point. */
function doGet(e) {
  // 1,500 attendees can load this at once, so the assembled payload is cached
  // (see getData). Append ?fresh=1 to bypass the cache and read the Sheet live.
  var fresh = !!(e && e.parameter && e.parameter.fresh);
  var data = getData(fresh);

  // Debug endpoint: append ?api=1 to the web app URL to see the raw data as JSON.
  if (e && e.parameter && e.parameter.api === '1') {
    return ContentService
      .createTextOutput(JSON.stringify(data.schedule, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var json = JSON.stringify(data.schedule).replace(/<\//g, '<\\/'); // keep </script> safe
  var help = JSON.stringify(data.help).replace(/<\//g, '<\\/');
  var audmap = JSON.stringify(data.audmap).replace(/<\//g, '<\\/');
  var appUrl = '';
  try { appUrl = ScriptApp.getService().getUrl() || ''; } catch (err) {}
  var plan = (e && e.parameter && e.parameter.plan) ? String(e.parameter.plan) : '';
  var html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  var inject = '<script>'
    + 'window.__KICKOFF_CSV__ = ' + json + ';'
    + 'window.__REQHELP__ = ' + help + ';'
    + 'window.__AUDMAP__ = ' + audmap + ';'
    + 'window.__APP_URL__ = ' + JSON.stringify(appUrl) + ';'
    + 'window.__PLAN__ = ' + JSON.stringify(plan) + ';'
    + '</script>\n';

  // Inject the data before the app's own script runs.
  if (html.indexOf('</head>') !== -1) {
    html = html.replace('</head>', inject + '</head>');
  } else {
    html = inject + html;
  }

  return HtmlService.createHtmlOutput(html)
    .setTitle('Leadership Kickoff Planner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // allow embedding in Atlas / a Google Site
}

// ---- Data assembly + caching ----------------------------------------------
// Reading the Sheet on every one of 1,500 concurrent loads is the read-
// concurrency risk IT flagged. Instead we assemble the payload once and cache
// it in CacheService for 10 minutes; subsequent loads serve from cache without
// touching the Sheet. ?fresh=1 bypasses the cache (instant view of edits), and
// flushCache() clears it on demand.
//
// CacheService caps a single value at 100KB. Rather than store the whole payload
// under one key, we cache each day under its own key (plus help and the audience
// map), so no single value approaches the cap even as descriptions grow: the
// largest day is only a few KB today and would have to grow ~20x to hit 100KB.
// All keys are written together with the same TTL, so a load always reconstructs
// one consistent snapshot.
var CACHE_VERSION = 'v3';      // bump to invalidate all keys at once
var CACHE_TTL = 600;           // seconds (10 minutes)
var CACHE_MAX = 95000;         // per-key safety margin under the 100KB cap

/** The full set of cache keys: one per day tab, plus help and audmap. */
function cacheKeys_() {
  var keys = TABS.map(function (t, i) { return cacheKey_('day_' + i); });
  keys.push(cacheKey_('help'));
  keys.push(cacheKey_('audmap'));
  return keys;
}
function cacheKey_(suffix) { return 'kickoff_' + CACHE_VERSION + '_' + suffix; }

/** Assemble everything the page needs in one object. */
function buildData() {
  return { schedule: readSchedule(), help: readHelp(), audmap: readAudienceMap() };
}

/** Return the payload from cache, or build + cache it. Pass fresh=true to skip
 *  the cache read. A script lock ensures only ONE execution rebuilds at a time,
 *  so a cold cache can't trigger a stampede of simultaneous Sheet reads: the
 *  first request rebuilds and caches, everyone else waits a moment and reads the
 *  now-warm cache. Reads/writes every key in one getAll/putAll round-trip, so a
 *  load never mixes data of different ages. */
function getData(fresh) {
  var cache = CacheService.getScriptCache();
  var keys = cacheKeys_();
  if (!fresh) {
    var hit = readAll_(cache, keys);
    if (hit) return hit;
  }
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    locked = lock.tryLock(5000); // wait up to 5s for the single rebuild slot
    if (locked) {
      if (!fresh) {              // someone may have filled the cache while we waited
        var again = readAll_(cache, keys);
        if (again) return again;
      }
      var data = buildData();
      try { putData_(cache, data); } catch (e) {}
      return data;
    }
  } catch (e) {
  } finally {
    if (locked) { try { lock.releaseLock(); } catch (e) {} }
  }
  // Lock not obtained in time: serve a fresh build (uncached) rather than block.
  return buildData();
}

/** Read every cache key in one getAll and reassemble, or null if any is missing. */
function readAll_(cache, keys) {
  try {
    var hit = cache.getAll(keys);
    if (hasAllKeys_(hit, keys)) return assembleFromCache_(hit);
  } catch (e) {}
  return null;
}

/** True only if every expected key is present in the getAll result. */
function hasAllKeys_(hit, keys) {
  for (var i = 0; i < keys.length; i++) { if (!hit[keys[i]]) return false; }
  return true;
}

/** Rebuild the payload object from the per-key cache values. */
function assembleFromCache_(hit) {
  return {
    schedule: TABS.map(function (t, i) { return JSON.parse(hit[cacheKey_('day_' + i)]); }),
    help: JSON.parse(hit[cacheKey_('help')]),
    audmap: JSON.parse(hit[cacheKey_('audmap')])
  };
}

/** Write each piece under its own key in a single putAll. A piece over the
 *  per-key cap is simply left uncached (re-read from the Sheet next load). */
function putData_(cache, data) {
  var toPut = {};
  data.schedule.forEach(function (d, i) {
    var s = JSON.stringify(d);
    if (s.length < CACHE_MAX) toPut[cacheKey_('day_' + i)] = s;
  });
  var h = JSON.stringify(data.help);
  if (h.length < CACHE_MAX) toPut[cacheKey_('help')] = h;
  var a = JSON.stringify(data.audmap);
  if (a.length < CACHE_MAX) toPut[cacheKey_('audmap')] = a;
  if (Object.keys(toPut).length) cache.putAll(toPut, CACHE_TTL);
}

/** Clear all cached keys so the next load rebuilds from the Sheet. */
function flushCache() {
  CacheService.getScriptCache().removeAll(cacheKeys_());
}

// ---- Keep the cache warm ----------------------------------------------------
// A time-based trigger refreshes the cache every 5 minutes. The cache TTL is 10
// minutes, so this keeps it from ever going cold during the conference: every
// visitor then hits the fast cached path (~0.8s) instead of a cold rebuild
// (~3.4s), and the cold-stampede scenario (many requests reading the Sheet at
// once before the first finishes) can't happen. Run installCacheWarmer() ONCE
// from the editor to set it up; removeCacheWarmer() tears it down.
function warmCache() { getData(true); }

function installCacheWarmer() {
  removeCacheWarmer();
  ScriptApp.newTrigger('warmCache').timeBased().everyMinutes(5).create();
  warmCache(); // prime it right away
  return 'Cache warmer installed: refreshing every 5 minutes.';
}

function removeCacheWarmer() {
  var triggers = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'warmCache') { ScriptApp.deleteTrigger(triggers[i]); n++; }
  }
  return 'Removed ' + n + ' cache-warmer trigger(s).';
}

/** Read each day tab and return [{ day, date, csv }, ...]. */
function readSchedule() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  return TABS.map(function (t) {
    var sheet = ss.getSheetByName(t.tab);
    return {
      day: t.day,
      date: t.date,
      // getDisplayValues mirrors what a published CSV would export: exactly the
      // text shown in each cell, so "9:45 AM" stays "9:45 AM" (never a raw Date).
      csv: sheet ? valuesToCsv(sheet.getDataRange().getDisplayValues()) : ''
    };
  });
}

/** Read the editable label glossary from the Lists tab, columns F (Label) and
 *  G (Explanation), starting at row 2. Returns [{ label, desc }, ...]. Safe if
 *  the tab or columns are missing. The app shows this in its requirement-pill
 *  help, so the team can reword it in the Sheet with no code change. */
function readHelp() {
  try {
    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Lists');
    if (!sh || sh.getLastRow() < 2) return [];
    var vals = sh.getRange(2, 6, sh.getLastRow() - 1, 2).getDisplayValues(); // F:G
    var out = [];
    vals.forEach(function (r) {
      if (r[0] && String(r[0]).trim()) out.push({ label: String(r[0]).trim(), desc: String(r[1] || '').trim() });
    });
    return out;
  } catch (err) { return []; }
}

/** Read the audience display-name map from the Lists tab: column I (Audience Key)
 *  and column J (Display Name), starting at row 2. The day-tab Audience cells store
 *  the Key; the app shows the Display Name, so the team can rename what attendees
 *  see — app-wide — from one place. Returns [{ key, display }, ...]. Safe if missing. */
function readAudienceMap() {
  try {
    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Lists');
    if (!sh || sh.getLastRow() < 2) return [];
    var vals = sh.getRange(2, 9, sh.getLastRow() - 1, 2).getDisplayValues(); // I:J
    var out = [];
    vals.forEach(function (r) {
      if (r[0] && String(r[0]).trim()) out.push({ key: String(r[0]).trim(), display: String(r[1] || '').trim() });
    });
    return out;
  } catch (err) { return []; }
}

/** Turn a 2-D array of display strings into RFC-4180-style CSV text. */
function valuesToCsv(values) {
  return values.map(function (row) {
    return row.map(function (cell) {
      var s = (cell === null || cell === undefined) ? '' : String(cell);
      if (/[",\n\r]/.test(s)) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\n');
}

// ===========================================================================
// ONE-TIME SETUP — run applyAudienceSetup() once from the Apps Script editor.
// ---------------------------------------------------------------------------
// This builds the audience source-of-truth, repairs known data issues, adds the
// Audience dropdowns to the day tabs, and syncs the Parameters legend. It is
// idempotent: safe to re-run. It does NOT delete sessions or touch the schedule.
// ===========================================================================

// Audience Key (stored in the day tabs + offered in the dropdown) -> Display Name
// (what attendees see). Edit the Display Name on the Lists tab anytime; the app
// shows it on the next load. Keep keys stable — renaming a key would orphan it.
var AUDIENCE_MAP = [
  ['Everyone',                                'Everyone'],
  ['Central Office Leaders',                  'Central Office Leaders'],
  ['School-Based Admin',                      'School-Based Administrators'],
  ['Central Office and School-Based Leaders', 'Central Office and School-Based Leaders'],
  ['All Elementary Leaders',                  'All Elementary Administrators'],
  ['All Middle Leaders',                      'All Middle School Administrators'],
  ['All High School Leaders',                 'All High School Administrators'],
  ['All Secondary Leaders',                   'All Secondary Administrators'],
  ['Principals',                              'Principals'],
  ['Elementary Principals',                   'Elementary Principals'],
  ['Middle School Principals',                'Middle School Principals'],
  ['High School Principals',                  'High School Principals'],
  ['Secondary Principals',                    'Secondary Principals'],
  ['Assistant Principals',                    'Assistant Principals'],
  ['Secondary Assistant Principals',          'Secondary Assistant Principals'],
  ['DSS',                                     'Director of Student Services (DSS)'],
  ['DSA',                                     'Director of Student Activities (DSA)'],
  ['Administrator of NSP',                    'Administrator of NSP'],
  ['Assistant Administrator of NSP',          'Assistant Administrator of NSP'],
  ['Title I',                                 'Principals at Title I schools'],
  ['Project Momentum',                        'Principals at Project Momentum schools'],
  ['Discipline Lead',                         'Discipline Lead'],
  ['Experienced Science Administrators',      'Experienced Science Administrators'],
  ['New Science Administrators',              'New Science Administrators'],
  ['CSS administrator',                       'CSS Administrator'],
  ['Auto Tech Administrator',                 'Auto Tech Administrator']
];

/** Run this once. Returns a short report string. */
function applyAudienceSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  writeAudienceMapping_(ss);
  var fixes = fixDayTabContent_(ss);
  cleanupListsTab_(ss);
  setAudienceDropdowns_(ss);
  syncParameters_(ss);
  updateReadMe_(ss);
  flushCache();
  return 'Setup complete. Day-tab fixes applied: ' + fixes + '. Cache flushed.';
}

/** Retire the old standalone Audience list in column D (now superseded by the
 *  Audience Key / Display Name pair in columns I-J) and annotate the headers so
 *  it is obvious which column to edit. */
function cleanupListsTab_(ss) {
  var sh = ss.getSheetByName('Lists');
  if (!sh) return;
  var rows = sh.getMaxRows() - 1;
  if (rows > 0) sh.getRange(2, 4, rows, 1).clearContent(); // clear old column D list
  sh.getRange(1, 4).setValue('Audience -> use Audience Key / Display Name (cols I-J)');
  sh.getRange(1, 9).setNote('The stable value stored on the day tabs and offered in the Audience dropdown. Do NOT rename these - a rename orphans sessions already using the old value. Add a new row here to add a new audience.');
  sh.getRange(1, 10).setNote('What attendees see in the app. Edit this to rename an audience across the whole app, then reload (or add ?fresh=1 to the app URL to see it immediately).');
}

/** Refresh the Read Me tab: fix label casing and append a clear section on how
 *  audience renaming and the multi-select dropdown work. Idempotent. */
function updateReadMe_(ss) {
  var sh = ss.getSheetByName('Read Me');
  if (!sh) return;
  var last = sh.getLastRow();
  if (last < 1) return;
  var rng = sh.getRange(1, 1, last, 1);
  var vals = rng.getValues();
  var already = false;
  for (var i = 0; i < vals.length; i++) {
    var v = String(vals[i][0] || '');
    if (/Renaming audiences/.test(v)) already = true;
    v = v.replace(/Science administrator/g, 'Science Administrator')
         .replace(/CSS administrator/g, 'CSS Administrator')
         .replace(/Discipline Lead, Science Administrator, CSS Administrator\)/,
                  'Discipline Lead, Science Administrator, CSS Administrator, Auto Tech Administrator)');
    vals[i][0] = v;
  }
  rng.setValues(vals);
  if (already) return;
  var add = [
    ['Renaming audiences (and the multi-select dropdown)'],
    ['Audience is managed in two columns on the Lists tab: "Audience Key" and "Display Name". The day tabs store the Key (also what the dropdown offers); the app shows the Display Name. To rename an audience everywhere in the app - even last minute - change only its Display Name on the Lists tab and reload. Do not change the Key, and you never have to touch the day tabs. To add a brand-new audience, add a row with both a Key and a Display Name.'],
    ['A session can have more than one audience. The dropdown picks one value at a time, so to list two, type a comma after the first and pick the second (for example: Central Office Leaders, School-Based Admin). If you would rather click check-box chips to choose several, ask to turn on "Allow multiple selections" on the Audience column.'],
    ['Seeing edits right away: the app caches data for about 10 minutes so it stays fast for everyone. To see a change immediately, add ?fresh=1 to the end of the app URL and reload.']
  ];
  sh.getRange(last + 2, 1, add.length, 1).setValues(add);
}

/** Write the Audience Key / Display Name table into Lists columns I and J. */
function writeAudienceMapping_(ss) {
  var sh = ss.getSheetByName('Lists');
  if (!sh) return;
  sh.getRange(1, 9, 1, 2).setValues([['Audience Key', 'Display Name (shown in app)']]);
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, 9, rows, 2).clearContent();
  sh.getRange(2, 9, AUDIENCE_MAP.length, 2).setValues(AUDIENCE_MAP);
}

/** Apply the requested per-session audience changes + repair known corruptions.
 *  Surgical: only writes the Audience column, the Session Code column (when a stray
 *  is cleared), and cell A1 — never the time/title/description cells. */
function fixDayTabContent_(ss) {
  var changed = 0;
  TABS.forEach(function (t) {
    var sh = ss.getSheetByName(t.tab);
    if (!sh) return;
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow < 1) return;
    var header = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0]
      .map(function (h) { return String(h).trim().toLowerCase(); });
    // Repair a corrupted Session Code header (seen as "In the " on Wed).
    if (header[0] !== 'session code') { sh.getRange(1, 1).setValue('Session Code'); changed++; }
    var ai = header.indexOf('audience'), ti = header.indexOf('session title');
    if (ai < 0 || lastRow < 2) return;
    var n = lastRow - 1;
    var audVals = sh.getRange(2, ai + 1, n, 1).getDisplayValues();
    var titles = ti >= 0 ? sh.getRange(2, ti + 1, n, 1).getDisplayValues() : null;
    var codes = sh.getRange(2, 1, n, 1).getDisplayValues();
    var newAud = [], newCodes = [], codeChanged = false;
    for (var i = 0; i < n; i++) {
      var before = String(audVals[i][0] || ''), aud = before;
      var title = titles ? String(titles[i][0] || '') : '';
      // Plenaries: Everyone -> Central Office + School-Based.
      if (/opening remarks|key ?note|conversation with dr\.? reid/i.test(title) && /everyone/i.test(aud)) {
        aud = 'Central Office Leaders, School-Based Admin';
      } else if (/cte programs with outside accreditation/i.test(title)) {
        aud = 'Auto Tech Administrator';
      }
      if (aud.trim() === 'All Leaders') aud = 'Everyone';
      aud = aud.replace(/Experienced Science Administrator(?!s)/g, 'Experienced Science Administrators');
      newAud.push([aud]);
      if (aud !== before) changed++;
      // Clear stray text in the Session Code column (seen as "equired for " on Tue).
      var c = String(codes[i][0] || '');
      if (/equired/i.test(c)) { newCodes.push(['']); codeChanged = true; changed++; } else { newCodes.push([c]); }
    }
    sh.getRange(2, ai + 1, n, 1).setValues(newAud);
    if (codeChanged) sh.getRange(2, 1, n, 1).setValues(newCodes);
  });
  return changed;
}

/** Put an Audience dropdown on every day tab, sourced from the Lists "Audience
 *  Key" column (I) so the Sheet is the single source for the options. Multi-value
 *  cells stay valid so a session can list more than one audience. */
function setAudienceDropdowns_(ss) {
  var lists = ss.getSheetByName('Lists');
  if (!lists) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(lists.getRange('I2:I'), true) // Audience Key column
    .setAllowInvalid(true) // keeps comma-separated multi-audience cells valid
    .build();
  TABS.forEach(function (t) {
    var sh = ss.getSheetByName(t.tab);
    if (!sh) return;
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return;
    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim().toLowerCase(); });
    var ai = header.indexOf('audience');
    if (ai < 0) return;
    sh.getRange(2, ai + 1, lastRow - 1, 1).setDataValidation(rule);
  });
}

/** Keep the Parameters legend consistent with the new names (doc only). */
function syncParameters_(ss) {
  var sh = ss.getSheetByName('Parameters');
  if (!sh) return;
  var rng = sh.getDataRange();
  var vals = rng.getValues();
  var subs = [
    [/Assistant Administrator of NTS/g, 'Assistant Administrator of NSP'],
    [/Administrator of NTS/g, 'Administrator of NSP'],
    [/Science administrator/g, 'Science Administrator'],
    [/CSS administrator/g, 'CSS Administrator'],
    [/All Elementary \/ Middle \/ High School \/ Secondary Leaders/g, 'All Elementary / Middle / High School / Secondary Administrators'],
    [/School-Based Admin\b/g, 'School-Based Administrators']
  ];
  for (var r = 0; r < vals.length; r++) {
    for (var c = 0; c < vals[r].length; c++) {
      var v = vals[r][c];
      if (typeof v !== 'string' || !v) continue;
      subs.forEach(function (s) { v = v.replace(s[0], s[1]); });
      vals[r][c] = v;
    }
  }
  rng.setValues(vals);
}
