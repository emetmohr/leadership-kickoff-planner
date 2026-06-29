# Status

_Last updated: 2026-06-29_

## Current state

- The app is **live on the FCPS account** as a Google Apps Script web app at the `/exec` URL, **Version 10**. The script reads the restricted FCPS Sheet directly and serves `index.html` with the data injected, so the Sheet stays locked to "FCPS All Staff" (no public CSV, no CORS). Edits to the Sheet appear on the next reload.
- Real schedule data is loaded from the live Sheet (the cleaned workbook was imported into it). The CSV branch in `loadData()` reads `window.__KICKOFF_CSV__` injected by the host.
- **New audience model is live**: identity is role + level + cross-cutting labels, picked via a cascade (role -> dependent level -> label checkboxes) with a "Show only what's required for me" toggle. Relevance is matched as a union across role, level, umbrella, level group, and labels, tolerant of legacy wording. See AUDIENCE_MODEL.md.
- **Session Code** links occurrences of one session across days (each occurrence individually selectable, cross-referenced on the card). Same-day repeats still use "Also Offered At".
- All-days view shows a total session count and renders each day as a collapsible group.
- **Requirement pill help**: Required sessions with a Requirement Detail ("One per school", etc.) show an info pill that reveals an inline explanation on click and a tooltip on hover. Glossary text is editable from the Sheet's Lists tab (cols G/H); the app seeds three safe defaults so a blank Explanation cell can't blank the pill.
- Authoring/organizer instructions removed from the attendee-facing app.
- Both logos (FCPS header, TheFist splash/footer) are inlined as base64, so the app is one self-contained file.
- Branded to the official FCPS palette (teal/gold), white masthead, "Office of Professional Learning" in teal.
- **Cache layer is implemented** in `apps-script/Code.gs`. `getData()` assembles the full payload (`schedule`, `help`, `audmap`) once and stores it in `CacheService` under `kickoff_payload_v2` with a 10-minute TTL; subsequent loads serve from cache without touching the Sheet (addresses the read-concurrency risk IT raised). `?fresh=1` bypasses the cache; `flushCache()` clears it and is called at the end of `applyAudienceSetup()`. Values over ~95KB skip caching (CacheService's 100KB per-value cap).
- **CSS Administrator removed** (no more CSS sessions): dropped from the "I am also" picker, the `parseSelector` alias, and the demo fallback row. The organizer had already removed it from the Lists tab.
- **Audience level matching now supports multiple levels per tag and an "Any level" wildcard.** `parseSelector` collects every level named in a tag (so "MS/HS Science Administrators" -> `levels:['middle','high']`), and `selectorMatches` enforces level only when the attendee picked one — leaving the level on "Any level" matches all levels. This fixed required sessions for science admins (and any multi-level audience) not surfacing under "Show only what's required for me."
- **Search now indexes Format** plus a synthetic virtual/in-person token, so searching "virtual" (or "in-person") reliably finds sessions by their actual format, not just ones that mention the word in text.
- **Virtual sessions get a teal "Virtual" pill** in the card badge row; in-person is left untagged (it's the assumed default). The old bold "Virtual" line at the bottom of the card was removed as redundant; the Join link remains when present.
- **Sheet column headers are normalized before matching** (`_hk()`): whitespace — including non-breaking spaces and line breaks — is collapsed and spaces around a slash are dropped, so "Room / Location" resolves however it's typed. This fixed room numbers not appearing on cards.
- **Picking a role now auto-filters the list.** A new lenient matcher, `relevantToMe()`, hides sessions aimed only at other audiences as soon as a role is chosen (no checkbox needed); blank or unrecognized audiences lean toward showing so a Sheet typo can't hide something for the attendee. The "Show only what's required for me" checkbox is kept and now narrows the already-relevant list to just the Required sessions (still using strict `audienceMatches`). Verified by a logic test: for an Elementary Principal, Central Office, Directors of Student Services, and Auto Tech sessions hide while School-Based, Principal, and general sessions stay. See decisions.md (2026-06-29).

## In progress

- This session's `index.html` work was committed from the host shell across three commits (`0d2afbf` CSS removal, `a93e717` multi-level/Any-level matching, `4ceff0c` format-in-search + Virtual-only tag + header normalization), then pasted into the Apps Script `Index` and deployed as a new version.
- **Uncommitted in `index.html`: the role auto-filter change (2026-06-29) plus the earlier card tweak.** The auto-filter work (`relevantToMe()` + reworked `passes()`) is on disk via the file tools but not yet committed or deployed. The earlier final card tweak (removing the redundant bold "Virtual" at the bottom of the card, keeping the Join link) may also still be uncommitted. Confirm with `git status` on the host (Windows) shell, commit both, then redeploy a new Apps Script version. The sandbox `index.html` view is unreliable (stale-mount + phantom `index.lock`), so commit and deploy from the host; the real file on disk is correct (verified via file tools).

## Next steps

1. Commit the role auto-filter change (and the final card tweak) on the host, then redeploy a new Apps Script version (see In progress).
2. **Fix a comment typo in `apps-script/Code.gs` (line 38):** the debug-endpoint comment starts with `\ ` instead of `//`, which is a syntax error in that file. Change to `//`.
3. Convert the Audience column to dropdown chips for click-to-pick (Google single-value-per-cell limitation noted; may need a multi-select or a chips UI).
4. Test on an FCPS device (laptop and phone) through the district content filter.
5. Fill remaining content in the Sheet (Tuesday/Friday times, rooms, Friday virtual links).

(Done this session: removed CSS Administrator; multi-level + Any-level audience matching; format-aware search; Virtual-only card pill; Sheet-header normalization fixing room display. Done prior session: cache layer in `apps-script/Code.gs`.)

## Waiting on the organizer

- Tuesday and Friday start and end times.
- Rooms, and virtual links for Friday's online sessions.
- Theme or Track values, once decided (column stays empty until then; the filter is hidden while empty).
- (Resolved this session: Legal Updates is for all leaders who work in schools = School-Based Admin.)

## Waiting on IT

- (2026-06-16) Replied to Michael Reilly's concern about Apps Script handling 1,500 simultaneous users. Clarified there are **no sign-ups / no writes** (it's read-only personal planning), so his concurrent-write / Sheets-as-database concerns don't apply; the only real exposure is read concurrency, which the cache layer addresses. Offered IT a choice: keep on Apps Script + cache, or commit to hosting on Atlas and we rebuild natively there. Awaiting his preference and a meeting on the Atlas path.
- Whether the app can be hosted or embedded on Atlas, or needs an FCPS hosted URL.
- Whether publishing the Google Sheet as CSV is allowed under district policy.
- If either is blocked, switch to the Google Apps Script route in DESIGN.md.

## Notes

- The Linux sandbox mount repeatedly served a stale, truncated snapshot of `index.html`. Never write `index.html` from the sandbox (it persists the stale truncation). Use the file tools (Read/Edit) and run all git from the host (Windows) shell. If host git reports an `index.lock` error, delete `.git/index.lock` on the host.
- Deploying app changes: paste `index.html` into the Apps Script `Index` file, then Deploy -> Manage deployments -> edit (pencil) -> Version: New version -> Deploy. Saving the file alone does NOT publish; the "New version" step is what goes live. This session the edit was applied directly to the Apps Script Monaco model via the Chrome extension, saved, and deployed as Version 10.
- The live app runs in a cross-origin sandboxed iframe: the Chrome extension can't read or click inside it (find/JS can't reach the app content), and screenshots can freeze after scrolling. Verify app behavior by asking the user, or drive the Apps Script editor/deploy dialog (same origin, reliable) rather than the live iframe.
