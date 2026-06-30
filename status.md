# Status

_Last updated: 2026-06-29_

## Current state

- The app is **live on the FCPS account** as a Google Apps Script web app at the `/exec` URL (redeployed several times this session, now ~**Version 20**). The script reads the restricted FCPS Sheet directly and serves `index.html` with the data injected, so the Sheet stays locked to "FCPS All Staff" (no public CSV, no CORS). Edits to the Sheet appear on the next reload (within the cache's 5-10 min window, or instantly with `?fresh=1`).
- Real schedule data is loaded from the live Sheet (the cleaned workbook was imported into it). The CSV branch in `loadData()` reads `window.__KICKOFF_CSV__` injected by the host.
- **New audience model is live**: identity is role + level + cross-cutting labels, picked via a cascade (role -> dependent level -> label checkboxes) with a "Show only what's required for me" toggle. Relevance is matched as a union across role, level, umbrella, level group, and labels, tolerant of legacy wording. See AUDIENCE_MODEL.md.
- **Session Code** links occurrences of one session across days (each occurrence individually selectable, cross-referenced on the card). Same-day repeats still use "Also Offered At".
- All-days view shows a total session count and renders each day as a collapsible group.
- **Requirement pill help**: Required sessions with a Requirement Detail ("One per school", etc.) show an info pill that reveals an inline explanation on click and a tooltip on hover. Glossary text is editable from the Sheet's Lists tab (cols G/H); the app seeds three safe defaults so a blank Explanation cell can't blank the pill.
- Authoring/organizer instructions removed from the attendee-facing app.
- Both logos (FCPS header, TheFist splash/footer) are inlined as base64, so the app is one self-contained file.
- Branded to the official FCPS palette (teal/gold), white masthead, "Office of Professional Learning" in teal.
- **Cache layer** in `apps-script/Code.gs` (now per-day keys + lock + warmer — see the three cache bullets lower down). `?fresh=1` bypasses it; `flushCache()` clears it and is called at the end of `applyAudienceSetup()`. Addresses the read-concurrency risk IT raised.
- **CSS Administrator removed** (no more CSS sessions): dropped from the "I am also" picker, the `parseSelector` alias, and the demo fallback row. The organizer had already removed it from the Lists tab.
- **Audience level matching now supports multiple levels per tag and an "Any level" wildcard.** `parseSelector` collects every level named in a tag (so "MS/HS Science Administrators" -> `levels:['middle','high']`), and `selectorMatches` enforces level only when the attendee picked one — leaving the level on "Any level" matches all levels. This fixed required sessions for science admins (and any multi-level audience) not surfacing under "Show only what's required for me."
- **Search now indexes Format** plus a synthetic virtual/in-person token, so searching "virtual" (or "in-person") reliably finds sessions by their actual format, not just ones that mention the word in text.
- **Virtual sessions get a teal "Virtual" pill** in the card badge row; in-person is left untagged (it's the assumed default). The old bold "Virtual" line at the bottom of the card was removed as redundant; the Join link remains when present.
- **Sheet column headers are normalized before matching** (`_hk()`): whitespace — including non-breaking spaces and line breaks — is collapsed and spaces around a slash are dropped, so "Room / Location" resolves however it's typed. This fixed room numbers not appearing on cards.
- **Sessions now render as condensed tap-to-expand rows** (not full cards) across day tabs and all-days, so a 16-21 session block fits on one screen. Each row leads with the title (flush left), a muted second line of presenter / room / (on all-days) time, and the gold "R" (required for viewer) and teal "V" (virtual) chips on the right; tap to expand for full detail. Dividers strengthened so rows separate clearly. A key row under the day selector explains the chips (R then V); when expanded, the "Where" line is teal and the "Requirement" line is amber, matching the chips (colored only when that chip applies). Join link still comes from the Sheet's "Virtual Link" column. The condensed second line hides on expand (no duplication with the detail), and the "Also offered" line is a pale navy pill (FCPS navy) so it stands out while teal stays the virtual marker. `cardFor` is retained but unused, so reverting or condensing only large blocks is a one-line change. Driven by the big-block analysis: ~7 blocks of 16-21 relevant sessions for an Elementary Principal, with no Theme/Track data coming to subdivide them.
- **Day tabs now group into collapsible time blocks** (by normalized start time, with a "Time to be announced" block for untimed sessions); the all-days view stays grouped by day. The collapsible caret was made more prominent (larger teal chevron on a soft rounded background). Verified the resulting blocks on live data (occurrences, with "Also Offered At" expanded): Tue 8:00 AM (1) / 1:00 PM (23) / 2:15 PM (23); Wed 8:15 (1) / 10:00 (21) / 11:15 (22) / 1:15 (19) / 2:30 (1); Thu 8:15 (1) / 12:30 (22) / 1:45 (20) / 2:45 (1); Fri 8:30 (1) / Time TBA (11). Most afternoon breakouts repeat (1:00->2:15 Tue, 10:00->11:15 Wed, 12:30->1:45 Thu). The grouping buckets the already-expanded occurrence list, so repeats land in their own blocks automatically.
- **Time parser fixed** (`timeToMin`): tolerates a seconds part ("1:00:00 PM") and infers PM for bare afternoon hours 1-6. Fixed ~37 live sessions that had no parseable time (seconds format) and afternoon times misread as AM (the "2:15 AM" card). Format variants now merge into one block.
- **Mobile tweaks (phones ≤640px):** condensed-row titles wrap to two lines instead of truncating (full title on expand), and tap targets bumped to ~44px (inputs, Add, export buttons, day tabs). The app was already responsive (single column on phones, schedule panel becomes a bottom sheet with a fixed bar, horizontal-scroll day tabs, viewport meta present).
- **Cache warming + lock guard added to `Code.gs`.** Measured `doGet`: ~0.8s warm / ~3.4s cold. `getData` rebuilds under a `LockService` lock (prevents a cold-cache stampede of simultaneous Sheet reads), and a `warmCache` time trigger refreshes the cache every 5 min so it never goes cold. **Live** (`installCacheWarmer()` was run; trigger active, 0% error). This is the in-architecture answer to Noah's 30-simultaneous-executions concern (warm path = ~38 req/s to reach 30, i.e. all 1,500 loading within ~40s).
- **Cache is now per-day, not one combined key.** `getData()` caches each day tab plus help and audmap under separate CacheService keys (`getAll`/`putAll`/`removeAll`, `CACHE_VERSION` 'v3'). Since the 100KB cap is per key, each day gets its own budget. Measured live payload today: ~14KB schedule, largest day ~4.4KB, so there is effectively unlimited headroom for detailed descriptions. Verified with a mock-CacheService Node test. This is the answer to Noah Hwang's 100KB concern. Live.
- **Picking a role now auto-filters the list.** A new lenient matcher, `relevantToMe()`, hides sessions aimed only at other audiences as soon as a role is chosen (no checkbox needed); blank or unrecognized audiences lean toward showing so a Sheet typo can't hide something for the attendee. The "Show only what's required for me" checkbox is kept and now narrows the already-relevant list to just the Required sessions (still using strict `audienceMatches`). Verified by a logic test: for an Elementary Principal, Central Office, Directors of Student Services, and Auto Tech sessions hide while School-Based, Principal, and general sessions stay. See decisions.md (2026-06-29).

## In progress

- **All of this session's work is DEPLOYED and live** (web app redeployed several times, now ~Version 20; `installCacheWarmer()` was run once so the 5-minute `warmCache` trigger is active). What's live: per-day cache + lock + warming, role auto-filter, time-block grouping, time-parser fix, condensed rows with R/V chips + key row + color-matched detail lines + navy "Also offered" pill, and the phone tweaks.
- **Not yet committed to git.** The last commit is `b20ae6e` (role auto-filter); everything after it sits uncommitted in the working tree (`index.html`, `apps-script/Code.gs`, `status.md`, `decisions.md`). Commit from the host (Windows) shell — the sandbox mount is unreliable for `index.html`. Suggested message: "Per-day cache + lock + warmer; time-block grouping; time-parser fix; condensed rows with R/V key and color-matched detail; mobile tweaks."
- **Noah Hwang's reply is drafted but not sent.** Monica is to send it (covers the 100KB-per-key cache answer and the concurrency answer with measured ~0.8s warm path + lock + warmer). No Atlas/rebuild pitch, per request.

## Next steps

1. **Commit the session's work from the host shell** (see In progress) so git matches what's deployed.
2. **Send Noah Hwang's reply** (Monica) once you're happy with it.
3. Verify the phone layout on a real device or Chrome device-mode. (DOM measurement at 390px confirmed titles wrap to two lines and the Add button stays on-screen with no overflow; the live cross-origin iframe screenshots were unreliable and a "missing Add button" read was a false alarm.)
4. Convert the Audience column to dropdown chips for click-to-pick (Google single-value-per-cell limitation noted; may need a multi-select or a chips UI).
5. Test on an FCPS device (laptop and phone) through the district content filter.
6. Fill remaining content in the Sheet (Tuesday/Friday times, rooms, Friday virtual links). Note: ~37 sessions still have seconds-format or AM/PM-less times in the Sheet; the parser now copes, but cleaning them is still worthwhile.

(Done this session: per-day cache + LockService guard + 5-min cache-warmer trigger; role auto-filter with lenient `relevantToMe`; day-tab time-block grouping; `timeToMin` seconds + 1-6=PM fix; condensed tap-to-expand rows with R/V chips, key row, color-matched detail lines, navy "Also offered" pill; phone tweaks (2-line titles, 44px targets); drafted Noah Hwang reply.)

## Waiting on the organizer

- Tuesday and Friday start and end times.
- Rooms, and virtual links for Friday's online sessions.
- Theme or Track values, once decided (column stays empty until then; the filter is hidden while empty).
- (Resolved this session: Legal Updates is for all leaders who work in schools = School-Based Admin.)

## Waiting on IT

- (2026-06-29) **Noah Hwang, Ph.D.** (Senior Manager III, Software Engineering, EISA) reviewed the technical components and is "generally aligned with DJ's approach," with two clarifications: the CacheService 100KB-per-key cap, and the Apps Script 30-simultaneous-executions limit. Both are now addressed in code and live (per-day cache keys; LockService guard + 5-min cache-warmer; measured ~0.8s warm path). A reply is drafted for Monica to send.
- (2026-06-16) Replied to Michael Reilly's concern about Apps Script handling 1,500 simultaneous users. Clarified there are **no sign-ups / no writes** (it's read-only personal planning), so his concurrent-write / Sheets-as-database concerns don't apply; the only real exposure is read concurrency, which the cache layer addresses. Offered IT a choice: keep on Apps Script + cache, or commit to hosting on Atlas and we rebuild natively there. Awaiting his preference and a meeting on the Atlas path.
- Whether the app can be hosted or embedded on Atlas, or needs an FCPS hosted URL.
- Whether publishing the Google Sheet as CSV is allowed under district policy.
- If either is blocked, switch to the Google Apps Script route in DESIGN.md.

## Notes

- The Linux sandbox mount repeatedly served a stale, truncated snapshot of `index.html`. Never write `index.html` from the sandbox (it persists the stale truncation). Use the file tools (Read/Edit) and run all git from the host (Windows) shell. If host git reports an `index.lock` error, delete `.git/index.lock` on the host.
- Deploying app changes: paste `index.html` into the Apps Script `Index` file, then Deploy -> Manage deployments -> edit (pencil) -> Version: New version -> Deploy. Saving the file alone does NOT publish; the "New version" step is what goes live. This session the edit was applied directly to the Apps Script Monaco model via the Chrome extension, saved, and deployed as Version 10.
- The live app runs in a cross-origin sandboxed iframe: the Chrome extension can't read or click inside it (find/JS can't reach the app content), and screenshots can freeze after scrolling. Verify app behavior by asking the user, or drive the Apps Script editor/deploy dialog (same origin, reliable) rather than the live iframe.
