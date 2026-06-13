# Status

_Last updated: 2026-06-13_

## Current state

- The interface is built as a single `index.html` (browse, filter, role selector, schedule builder, conflict detection, calendar, email, print, and share link exports).
- `index.html` now uses the per-day-tab schema and four-CSV-URL config from DESIGN.md. The `CONFIG.tabs` list holds the four day tabs with empty `csvUrl` placeholders, and row normalization reads the 15-column schema. Built-in sample data still renders while the URLs are blank.
- All data loading is isolated in a single `loadData()` function, so the future Google Apps Script swap is a one-spot change.
- The in-page organizer guide was updated to describe the per-day tabs and the new columns.
- README.md and .gitignore were added.
- The clean Google Sheet template (one tab per day, identical columns, dropdowns, Read Me tab) is with the organizer for review.

## In progress

- Standing up the GitHub repo and pushing. Git is not initialized yet; the commands are ready to run from the host shell (see below). Nothing has been committed or pushed.

## Next steps

1. From the host shell (Windows), run the git init, commit, and push commands to create the private repo.
2. Stand up a GitHub Pages test URL.
3. Paste the four published CSV links into `CONFIG.tabs` once the Sheet is live.
4. Implement "Also Offered At" expansion so repeated sessions are individually selectable (the field is captured in normalization now but not yet expanded into separate cards).
5. Test on an FCPS device once a test URL exists.

## Waiting on the organizer

- Tuesday and Friday start and end times.
- Rooms, and virtual links for Friday's online sessions.
- Confirm the Wednesday Legal Updates audience (set to School-Based Administrators, needs a yes or no).
- Theme or Track values, once decided.

## Waiting on IT

- Whether the app can be hosted or embedded on Atlas, or needs an FCPS hosted URL.
- Whether publishing the Google Sheet as CSV is allowed under district policy.
- If either is blocked, switch to the Google Apps Script route in DESIGN.md.

## Notes

- The Linux sandbox mount served a stale, truncated snapshot of `index.html` during this session. The real file on disk is correct and complete; edits and validation were verified with the file tools and by running the normalization logic against the new sample data (15 sessions parsed, 2 virtual, 6 required, 8 audience lanes). If working in the sandbox shell, prefer the host shell for git operations.
