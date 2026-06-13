# Project Memory and Instructions

Paste this into the Cowork project's memory or instructions field.

## North star

A single file, no backend schedule planner for the Leadership Kickoff conference. Attendees browse sessions, filter to what is required for their role, build a personal day, and email or calendar it to themselves. The content lives in a Google Sheet with one tab per day. The app reads it live. No sign ups, no accounts, no database.

## Architecture commitments (do not drift from these)

- One self contained index.html. Vanilla HTML, CSS, JavaScript. No framework, no build step.
- No external libraries or CDNs. No localStorage or sessionStorage.
- Data comes only from the Google Sheet, one published CSV per day tab, fetched live, with sample data as a fallback.
- All filter options are derived from the Sheet contents, never hard coded.
- Keep all data loading inside a single loadData() function for a future Apps Script swap.
- Wrap the History API so it never throws inside a sandboxed iframe.
- Do not regenerate index.html from scratch. It is the tested baseline. Edit it only as specified in DESIGN.md.

## How I work

- I plan and design in chat, then build in Cowork. Cowork is the primary build surface.
- I run git and build commands myself in Command Prompt, not PowerShell, then paste output back.
- Prefer batched instructions over many small steps. Auto approve is fine for long unattended builds.
- Always stop for my review before anything consequential: git push, deploy, deleting, or anything irreversible. Prepare the commands and let me run them.
- No em dashes in any written content or file.
- Bias toward simplicity and consolidating tools.

## Conventions

- Three context files: PROJECT_CONTEXT.md, status.md, decisions.md.
- Start a session with the standup skill, end it with the conclude skill, so the context files stay current.
