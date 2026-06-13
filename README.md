# Leadership Kickoff Planner

A lightweight schedule planner for the Fairfax County Public Schools Leadership Kickoff, July 21 to 24, 2026. Attendees browse sessions, filter to what is required for their role, build a personal day, and send it to themselves or add it to a calendar. There are no sign ups, no accounts, and no database. Personal planning only.

The whole app is one self contained `index.html` file with no framework, no build step, and no external libraries, so it keeps working on locked down district devices.

## How to edit the schedule

All content lives in one Google Sheet with a separate tab for each day (`Tue Jul 21`, `Wed Jul 22`, `Thu Jul 23`, `Fri Jul 24`). Every tab uses the same columns:

Start Time, End Time, Session Title, Requirement, Requirement Detail, Audience Group (lane), Target Audience (as written), Theme / Track, Format, Room / Location, Virtual Link, Presenter, Description, Also Offered At, Notes.

To change the schedule, edit the Sheet. The page reflects the change the next time someone loads it. You never need to touch the code. See DESIGN.md for the full column reference.

## How to connect the Sheet

1. In the Sheet, go to File, Share, Publish to web.
2. Publish each day tab separately as Comma-separated values (.csv) and copy each link.
3. Open `index.html`, find the `CONFIG.tabs` list near the top of the script, and paste each tab's link into its `csvUrl`.

While the `csvUrl` values are blank, the app shows a built-in sample schedule so it always renders.

## How to preview locally

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Hosting

The single file is meant to be hosted and then embedded in Atlas or a Google Site by URL. GitHub Pages gives a quick test URL. If IT cannot host or publish the Sheet, the fallback is a Google Apps Script web app that reads the private Sheet from inside Workspace; because all data loading is isolated in `loadData()`, that swap is a contained change. See DESIGN.md for details.

## Files

- `index.html` the app
- `DESIGN.md` design and data schema
- `PROJECT_CONTEXT.md` stable project context
- `status.md` current state and next steps
- `decisions.md` decision log
