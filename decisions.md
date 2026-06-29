# Decision Log

_Newest first. Each entry: the decision, then the reason._

## 2026-06-29

**Picking a role auto-filters the list; the toggle narrows to just my required sessions.**
Selecting a role (and level) now hides sessions aimed only at other audiences by default, with no checkbox required. A new lenient matcher, `relevantToMe()`, keeps a session visible unless every one of its selectors clearly names a different audience; sessions with a blank or unrecognized audience lean toward showing so a Sheet typo can't hide something meant for the attendee. The "Show only what's required for me" checkbox is kept, and now means: from my already-relevant list, collapse to just the Required ones (it still uses the strict `audienceMatches`, the same test that drives the "Required for you" star). Reason: an Elementary Principal saw Central Office, Directors of Student Services, and Auto Tech sessions in the list and expected role selection alone to filter them out. Two visibility tiers now exist: default shows everything for me (Required and Choice), toggle shows only my must-attends. Trade-off accepted: a session with a literally blank audience cell is hidden under the toggle (pre-existing behavior; properly tagging it "Everyone" makes it surface).

## 2026-06-27

**Audience level matching is multi-level and "Any level" is a wildcard.**
A tag can name several levels and `parseSelector` now keeps them all (`levels: []`), matched as an OR, so "Experienced MS/HS Science Administrators" reaches both middle- and high-school science admins. `selectorMatches` enforces level only when the attendee actually picked one; leaving the picker on "Any level" matches every level. Reason: a High School science admin was getting no required-for-me results because the old parser read "MS/HS" as middle only and then excluded high. Trade-off accepted: "Any level" now surfaces all level-specific required sessions (over-show), which is the safer direction for a "required for me" view than hiding something.

**New audience *values* are Sheet-managed (Lists cols I/J); the identity picker stays code-defined.**
The organizer can add any number of audience tags from the Lists tab (Audience Key in col I, Display Name in col J) — they flow into the day-tab dropdown and the card display with no code change. The "I am a / I am also" picker (roles, levels, cross-cutting label checkboxes) remains defined in `index.html`. Consequence: a brand-new audience value is taggable and displayable immediately, but it only self-filters under "required for me" if it maps to an identity the app already understands (a role, a level, or an existing label). Distinguishing genuinely new identities (e.g., "new" vs "experienced") would require adding picker checkboxes in code.

**Tag only Virtual sessions; in-person is the unlabeled default.**
Cards show a teal "Virtual" pill in the badge row and nothing for in-person, since the conference is in-person by default and only the exceptions need flagging. The previously bold "Virtual" location line was removed as redundant once the pill existed; the Join link stays. Search also indexes Format plus a virtual/in-person token so "virtual" reliably finds every virtual session.

**Normalize Sheet column headers before matching (`_hk()`).**
Header lookups collapse all whitespace (including non-breaking spaces and line breaks) and drop spaces around a slash, so "Room / Location" resolves no matter how it was typed or pasted. Reason: room numbers weren't displaying because the live header carried invisible spacing that didn't equal the literal key. Applied to both the live and sample data paths so they stay consistent.

**CSS Administrator retired.**
No more Comprehensive Services Site sessions, so CSS was removed from the picker, the `parseSelector` alias, and the demo fallback row (the organizer had already removed it from the Lists tab). Reverses the earlier CSS-as-cross-cutting-label decision.

## 2026-06-23

**Cache the assembled payload in `CacheService`, not the raw Sheet reads.** `getData()` builds the whole page payload (`schedule`, `help`, `audmap`) once and stores it under `kickoff_payload_v2` with a 10-minute TTL, so 1,500 concurrent loads serve from cache instead of each triggering a full Sheet read (the read-concurrency exposure IT raised). `?fresh=1` bypasses the cache for instant views of edits, and `flushCache()` (called after `applyAudienceSetup()`) clears it on demand. Caching the assembled object rather than per-tab reads keeps it to a single key; values over ~95KB skip caching to stay under CacheService's 100KB per-value cap.

## 2026-06-14

**Live data via a Google Apps Script web app, not published CSV.**
The Sheet is locked to "FCPS All Staff" and the publish-to-web restriction could not be unchecked, so the published-CSV route was a dead end. Instead a bound Apps Script (`apps-script/Code.gs`) runs as an authorized FCPS user, reads the four day tabs with `getDisplayValues()`, and serves `index.html` with the data injected into `window.__KICKOFF_CSV__`. The Sheet stays restricted, there is no CORS, and Sheet edits show on the next reload. This is the fallback from PROJECT_CONTEXT promoted to the primary host.

**Audience model: identity = role + level + cross-cutting labels.**
The old flat "I am a" dropdown could not express FCPS reality. Identity is now a cascade: role -> dependent level (skipped for Central Office) -> opt-in labels (Title I, Project Momentum, Discipline Lead, Science administrator, CSS administrator). Sessions carry audience selectors; relevance is the union across role, level, umbrella (School-Based Admin), level groups, and labels. Matching is legacy-tolerant via aliases so it works before full Sheet cleanup. Full spec in AUDIENCE_MODEL.md.

**"Administrator of NTS" / "Assistant Administrator of NTS" instead of "nontraditional school".**
"Nontraditional school" is not the culture's language. These roles behave like Principal / Assistant Principal and roll up to School-Based Admin. CSS (Comprehensive Services Site) is a cross-cutting label, not a role.

**Requirement and Requirement Detail are two single-purpose columns.**
Requirement = Required or Choice. Requirement Detail = attendance rule only (blank = all attend; "One per school"; "One select per school"; "Select group"). The role/level a rule applies to lives in Audience, never in Requirement Detail. "Target Audience (as written)" is retired (it overlapped with Audience and contradicted it on several rows).

**Session Code links occurrences across days; "Also Offered At" stays for same-day repeats.**
Cross-day or differing occurrences (room, format, virtual link) are entered as their own rows sharing a short Session Code; the app gathers them into one session with multiple individually-selectable occurrences. Same-day repeated times keep using "Also Offered At". The Read Me explains the Session Code.

**Requirement-pill glossary seeds safe defaults; the Sheet overrides only with non-empty text.**
The Lists tab (cols G/H) holds editable label explanations, injected as `window.__REQHELP__`. A blank Explanation cell was overwriting the built-in default with an empty string, which blanked the pill (no inline note, no tooltip). `setupHelp()` now always seeds the three standard meanings and only applies a Sheet value when it is non-empty, so the team can reword in the Sheet but can never blank a pill by leaving a cell empty.

**Logos inlined as base64; app is one self-contained file.**
External `fcps-logo.png` / `thefist-logo.png` didn't publish through the Apps Script host. Both logos (FCPS PNG header, TheFist JPEG splash/footer) are now inlined as base64, so the single `index.html` carries everything and embeds cleanly.

**The app is attendee-facing only; authoring instructions removed.**
The in-page organizer guide was removed. Deploy/authoring guidance lives in `apps-script/DEPLOY.md` and these context docs, not in the app the attendees see.

## 2026-06-13

**Brand to the official FCPS palette: teal and gold, not blue.**
FCPS's published brand colors are Dark Teal (#00677F), bright Teal (#00A2BC), and Gold (#FFB500), with Navy (#001A70) as an accent (source: fcps.edu/brand-color-palette). The app was re-themed from its original blue to this palette. The header is a white masthead with the official FCPS logo, a gold rule, and "Office of Professional Learning" set off in teal.

**Logos ship as separate image files for now, to be inlined before any embed.**
fcps-logo.png and thefist-logo.png load as external files. This works on GitHub Pages. Before embedding in a Google Site or Atlas, they should be base64-inlined so the app stays one self-contained file. Inlining must be done programmatically, not by hand-pasting base64 (a hand edit corrupted the file once this session).

**TheFist credit: subtle splash plus footer line.**
A brief teal splash on load ("Brought to you by TheFist," auto-dismisses, tap to skip) plus a small footer credit. No browser storage, so the splash shows each load; kept short to stay unobtrusive.

**Repeated sessions are expanded into individually selectable occurrences.**
A session with entries in "Also Offered At" renders as one card per time slot, each separately addable, so conflict detection stays honest. Each occurrence is tagged "Offered at more than one time."

**Repo is private-then-public for GitHub Pages testing.**
GitHub Pages is not available for private repos on the free plan, so the repo was made public to get a test URL (https://emetmohr.github.io/leadership-kickoff-planner/). No sensitive data is in the repo. Revisit visibility once IT confirms the real host.

**No session sign ups; personal planning only.**
The organizer would like attendees to reserve seats to avoid overflow, but that needs a backend, identity, and capacity enforcement. For this year it was dropped, which keeps the simple no backend design. If sign ups return later, the path is a commercial platform (Sched or Whova both do session caps and waitlists) or a custom build on Next.js and Supabase. The clean Sheet imports straight into either.

**One tab per day in the Sheet, not one combined tab.**
The organizing team plans and works day by day, and a single long tab was hard to use. Each day tab uses identical columns so the app can read all four and merge them. This is an editing experience win with no cost to the app.

**Static HTML plus published CSV, with data and presentation separated.**
The valuable, durable asset is the structured schedule in the Sheet. The app is a single disposable HTML file. This keeps lock in near zero: content edits are instant, app edits are easy, and moving to a bought platform or a custom rebuild reuses the Sheet rather than starting over.

**No tracks for now; keep an optional Theme column.**
There is no defined theme yet. The day already carries a loose character (Tuesday general leadership, Wednesday and Thursday compliance and content). A Theme or Track column is present but empty until themes are decided.

**Audience lanes keep School-Based Administrators distinct from All Administrators.**
The original draft used inconsistent wording. The Audience Group lane is a controlled field for filtering, and the organizer's own wording is preserved separately for display.

**No external libraries, no CDN, no browser storage.**
District devices may filter external domains and block CDNs. State lives in memory and the URL hash. The History API is wrapped so it never throws inside sandboxed iframes.

**Isolate all data loading in one function.**
So that a future swap to a Google Apps Script web app, if IT requires staying inside Workspace, is a one spot change rather than a rebuild.

**Hosting pending IT; Google Site or Apps Script as fallback.**
Preferred home is Atlas alongside the other conference materials. If IT cannot host or embed it, a Google Site embed or an Apps Script web app are the fallbacks, in that order.
