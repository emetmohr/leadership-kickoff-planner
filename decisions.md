# Decision Log

_Newest first. Each entry: the decision, then the reason._

## 2026-06-13

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
