# Project Context: Leadership Kickoff Planner

## What this is

A lightweight schedule planner for the Fairfax County Public Schools Leadership Kickoff, July 21 to 24, 2026, roughly 1,500 attendees and about 82 sessions across four days. Attendees use it to browse sessions, filter to what is required for their role, build their own day, and email it to themselves or add it to a calendar.

## Why it exists

The conference has multiple tracks of sessions, some required for specific groups and many by choice. Attendees need an easy way to see what applies to them and plan their day. The organizer needs to manage all of it without touching code.

## Who uses it

- Attendees: school and central office administrators, browsing on FCPS laptops and phones.
- Organizer: the conference lead, who owns the content through a single Google Sheet.

## Core principles

- Personal planning only. No sign ups, no capacity tracking, no accounts, no database.
- The Google Sheet is the single source of truth. The organizer edits the Sheet; the app reflects it.
- The app is one self contained HTML file with no framework, no build step, and no external libraries.
- Keep it simple and portable so any future change is cheap.

## Stack

- Front end: vanilla HTML, CSS, JavaScript, single file (logos inlined as base64).
- Data: Google Sheet, one tab per day, read live by a bound Google Apps Script that injects the data into the served page (the Sheet stays restricted to FCPS; no public CSV).
- Version control: Git and GitHub.
- Hosting: **live as an Apps Script web app** (`/exec` URL, runs as the FCPS account). Embeddable in Atlas or a Google Site via the same URL (`XFrameOptionsMode.ALLOWALL`). See `apps-script/DEPLOY.md`.

## Data source

The companion Google Sheet has one tab per day (`Tue Jul 21` through `Fri Jul 24`) with identical columns on each tab. See DESIGN.md for the exact schema. The clean template was prepared from the organizer's draft and is pending her review and the remaining content (Tuesday and Friday times, rooms, virtual links).

## Constraints and context

- District devices may filter external domains and block CDNs, so the app ships with zero external runtime dependencies.
- The Sheet is locked to "FCPS All Staff" and publishing it as CSV is blocked, so the Apps Script web-app route (formerly the fallback) is now the live host: it reads the private Sheet from inside Workspace and serves the app with data injected. Data loading is isolated in `loadData()`.

## Glossary

- Identity: an attendee's role + level + any cross-cutting labels. The picker builds it as a cascade; the app shows the union of everything relevant. See AUDIENCE_MODEL.md.
- Audience: who a session is for, as a list of selectors (Everyone, School-Based Admin, a level group, a role optionally narrowed to a level, or a label).
- Requirement: Required or Choice. Requirement Detail: attendance rule only (blank = all attend; "One per school"; "One select per school"; "Select group").
- Session Code: a short token shared by rows that are the same session offered on different days; the app merges them into one session with multiple occurrences.
- Also Offered At: extra same-day time slots for a session that repeats; the app makes each occurrence individually selectable.
