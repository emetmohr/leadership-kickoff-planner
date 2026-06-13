# Leadership Kickoff Planner: Design

## Overview

A single page web app that displays the Leadership Kickoff conference schedule (July 21 to 24, 2026, about 82 sessions) and lets attendees browse it, filter to what is required for their role, build a personal day, and send it to themselves. The schedule content lives in a Google Sheet that the organizer maintains. The app reads it live and renders it. There is no backend, no database, no login, and no session sign ups.

The guiding idea is a clean split between the durable asset (the structured schedule in the Sheet) and the disposable asset (this one HTML file). That split keeps lock in near zero and makes any future change cheap.

## Non goals

- No registration or capacity tracking. Attendees plan for themselves only.
- No accounts, no authentication, no stored personal data.
- No database or server. The only data source is the Google Sheet.
- No build step, no framework, no external libraries or CDNs.

## Architecture

- One self contained `index.html` with vanilla HTML, CSS, and JavaScript.
- Data comes from a Google Sheet, one tab per day, each tab published to the web as CSV.
- The app fetches each tab's CSV, tags each row with that tab's date, merges them, and renders.
- If the URLs are blank or a fetch fails, the app falls back to built in sample data so it always renders.
- Zero external runtime dependencies, so it survives locked down district devices and content filters.

## Data schema (the Google Sheet)

One tab per day. Tab names carry the date: `Tue Jul 21`, `Wed Jul 22`, `Thu Jul 23`, `Fri Jul 24`. There is no Day column; the tab is the day.

Every tab uses the exact same columns, in this order:

1. Start Time (for example `9:45 AM`)
2. End Time (for example `11:00 AM`)
3. Session Title
4. Requirement (`Required` or `Choice`)
5. Requirement Detail (free text, for example `One admin per building`, `Select admins`, `Principal`)
6. Audience Group (lane) (controlled, for example `All Administrators`, `School-Based Administrators`, `Elementary`, `Secondary`, `Central Office`, `Title I`, `Principals`, `Assistant Principals`, `Specialized / Select`, `Other`)
7. Target Audience (as written) (the organizer's own wording, for display)
8. Theme / Track (optional, empty until themes are defined)
9. Format (`In-person` or `Virtual`)
10. Room / Location
11. Virtual Link (for online sessions)
12. Presenter
13. Description
14. Also Offered At (extra time slots when a session repeats, for example `11:15 AM-12:15 PM; 1:15 PM-2:15 PM`)
15. Notes

Notes on the data:
- The app derives all filter options (audience lanes, themes, requirement values) from the column contents at load time. Renaming or adding a value in the Sheet updates the app automatically. Nothing is hard coded.
- "School-Based Administrators" must stay distinct from "All Administrators."
- Times are per session. Nothing is locked to a shared grid; any session can be any length.

## Multi tab loading

All loading lives in one `loadData()` function so it can be swapped wholesale later.

- CONFIG holds an array of day tabs, each with its published CSV URL and its date.
- For each tab: fetch the CSV, parse it, normalize each row to a session object, set the session's day and date from the tab config.
- Merge all days, sort by date then start time, then render.
- On any blank URL or failed fetch, use the embedded sample data and show a small "preview" notice.

## CONFIG block (top of the script)

```js
const CONFIG = {
  title: "Leadership Kickoff",
  dates: "July 21 to 24, 2026",
  year: 2026,
  tabs: [
    { day: "Tue Jul 21", date: "2026-07-21", csvUrl: "" },
    { day: "Wed Jul 22", date: "2026-07-22", csvUrl: "" },
    { day: "Thu Jul 23", date: "2026-07-23", csvUrl: "" },
    { day: "Fri Jul 24", date: "2026-07-24", csvUrl: "" }
  ]
};
```

When the Sheet is published, paste each tab's CSV link into its `csvUrl`.

## Features

- Filter by day, by Audience Group lane, by Requirement, and a free text search.
- A role selector ("I am a...") built from the audience lanes, plus a "show only what is required for me" toggle.
- Session cards: time, title, requirement badge, audience, room or virtual link, presenter, and an expandable description.
- Personal schedule builder: add or remove sessions, sorted by day and time.
- Conflict detection: warns when two selected sessions overlap in time.
- Repeated sessions: any session with entries in "Also Offered At" is expanded into individually pickable times, so conflict detection stays honest.
- Required once plenaries (opening, keynote, legal updates, integrated discipline) are shown clearly as required for everyone.
- Virtual sessions show a join link rather than a room.

## Exports

- Add to calendar: a client side `.ics` file with room or link in the location field.
- Email to me: a `mailto` with a formatted list plus a link back to the plan.
- Print or save as PDF: a print stylesheet that prints only the personal schedule.
- Copy a link to my schedule: selections encoded in the URL hash.

## Engineering constraints

- No localStorage or sessionStorage. State lives in memory and in the URL hash.
- The History API is wrapped in try and catch so it never throws inside a sandboxed iframe (Google Sites embed, Apps Script, preview frames).
- CSV parser handles quoted fields, embedded commas, and newlines.
- Time parser handles AM and PM, infers PM for afternoon times without a meridiem, and splits multi slot strings.
- Accessibility: semantic HTML, keyboard navigation, visible focus, sufficient contrast, color is never the only signal, reduced motion respected.
- Responsive layout with a mobile bottom bar for the schedule panel.

## Hosting and embedding

- Host the single file, then embed it in Atlas or a Google Site by URL.
- For testing, GitHub Pages gives a working URL quickly.
- No CDN means it keeps working behind district content filters.

## Future Google route

If IT does not allow external hosting or publishing the Sheet, convert to a Google Apps Script web app:

- Reuse the entire UI. The only change is the data layer.
- A small server script reads all four day tabs directly and serves the data, so the Sheet can stay private and everything stays inside Google Workspace.
- Because all loading is isolated in `loadData()`, this is a contained, roughly one day change, not a rebuild.

## File structure

```
leadership-kickoff-planner/
  index.html          the app
  README.md           short readme
  DESIGN.md           this file
  PROJECT_CONTEXT.md  stable project context
  status.md           current state and next steps
  decisions.md        decision log
  .gitignore
```
