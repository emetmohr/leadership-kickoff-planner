# Deploying the Live Planner (Google Apps Script)

This is how the planner reads the schedule live while the Google Sheet stays
restricted to FCPS staff. A small Apps Script runs as an authorized FCPS user,
reads the four day tabs, and serves the app with the data already baked into the
page. No public Sheet, no CORS, and edits to the Sheet appear on the next reload.

**Who has to do this:** someone signed into the FCPS Google account that can open
the schedule Sheet (the account the Sheet is shared with). A personal Gmail will
not work, because the Sheet is locked to "FCPS All Staff."

## One-time setup

1. Open the schedule Google Sheet (the one with the four day tabs).
2. Confirm the four tab names match these exactly. If they differ, either rename
   the tabs or edit the `TABS` list at the top of `Code.gs`:
   `Tue Jul 21`, `Wed Jul 22`, `Thu Jul 23`, `Fri Jul 24`.
3. In the Sheet menu: **Extensions -> Apps Script**. This opens a script that is
   already bound to this Sheet, so no Sheet ID is needed.
4. Delete whatever is in the default `Code.gs`, then paste in the full contents of
   `apps-script/Code.gs` from this project.
5. Add the app's HTML:
   - Click the **+** next to "Files" -> **HTML**.
   - Name it exactly **`Index`** (no `.html`, capital I).
   - Delete the placeholder content and paste in the **entire contents of
     `index.html`** from this project.
   - Save (the disk icon, or Ctrl/Cmd-S).

## Deploy as a web app

1. Top right: **Deploy -> New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** `Leadership Kickoff Planner`
   - **Execute as:** `Me` (this is what lets it read the restricted Sheet)
   - **Who has access:** pick the most open option FCPS allows. `Anyone` is ideal.
     If that is blocked by district policy, `Anyone within FCPS` also works for
     attendees on FCPS accounts.
4. Click **Deploy**. The first time, Google asks you to **authorize**: approve the
   permission to read your spreadsheets. (If you see an "unverified app" screen,
   click **Advanced -> Go to (project) -> Allow**. It is your own script.)
5. Copy the **Web app URL** (ends in `/exec`). That is the live planner. Open it
   to confirm the real sessions load.

## Checking it works

- Open the Web app URL. You should see the real schedule, not the sample data.
  (The footer/notice will say it loaded from the Sheet.)
- Quick data check: add `?api=1` to the end of the URL. You should see the raw
  schedule as JSON, four entries (one per day). If a day is empty here, the tab
  name in the Sheet does not match the `TABS` list in `Code.gs`.

## The live-update demo

This is the part to show people: edit any cell in the Sheet, save, then reload the
Web app URL. The change is there. No code, no re-publishing, no waiting. To make
the point cleanly, edit a session title or room, reload, and point it out.

## When you change the app

`Index` in Apps Script is a copy of `index.html`. If the app's design changes in
this project, paste the new `index.html` into the `Index` file again, then
**Deploy -> Manage deployments -> (edit, the pencil) -> Version: New version ->
Deploy**. The Web app URL stays the same. Editing the *Sheet* never needs a
redeploy; only changing the *app* does.

## Embedding in Atlas or a Google Site

Use the same Web app URL. The script already allows embedding (it sets
`XFrameOptionsMode.ALLOWALL`), so it can go in an iframe / embed block. If your
host only accepts a same-domain or signed embed, that is an IT question, but the
URL itself is ready to embed.

## If "Who has access: Anyone" is blocked

Then the planner is reachable only by signed-in FCPS users. That is fine for an
all-FCPS audience. If you need it open to non-FCPS guests later, that is a district
policy conversation, not a code change.
