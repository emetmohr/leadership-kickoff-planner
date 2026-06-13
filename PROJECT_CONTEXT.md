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

- Front end: vanilla HTML, CSS, JavaScript, single file.
- Data: Google Sheet, one tab per day, each published as CSV, fetched live.
- Version control: Git and GitHub.
- Hosting: to be confirmed with IT. Options are Atlas, a Google Site, or a hosted URL. GitHub Pages for testing.

## Data source

The companion Google Sheet has one tab per day (`Tue Jul 21` through `Fri Jul 24`) with identical columns on each tab. See DESIGN.md for the exact schema. The clean template was prepared from the organizer's draft and is pending her review and the remaining content (Tuesday and Friday times, rooms, virtual links).

## Constraints and context

- District devices may filter external domains and block CDNs, so the app ships with zero external runtime dependencies.
- Hosting and embedding depend on an IT answer. If IT blocks external hosting or publishing the Sheet, the fallback is a Google Apps Script web app that reads the private Sheet from inside Workspace. The design isolates data loading so that swap is a contained change.

## Glossary

- Audience Group (lane): the controlled audience category used for filtering, for example School-Based Administrators versus All Administrators.
- Requirement: Required or Choice. Requirement Detail carries the qualifier, for example one admin per building.
- Also Offered At: extra time slots for a session that repeats; the app makes each occurrence individually selectable.
