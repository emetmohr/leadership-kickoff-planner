# Audience Model and Parameters Tab (agreed)

This is the agreed structure for who attends what. The goal is one place to
define the audience vocabulary so data entry stays consistent and the planner
filters correctly. Everything here is editable by the organizer in the Sheet,
with no code changes.

This reflects the decisions made in review. The build will follow it.

## An identity has three parts

A person is described by:

1. A **role** (what they do).
2. A **level**, where the role applies (what kind of building).
3. Any **cross-cutting labels** they carry (yes or no, and they can hold several).

The planner uses all three to decide what is relevant to a person.

## Roles

| Role | Valid levels | Rolls up to | In "I am a" picker |
| --- | --- | --- | --- |
| Principal | Elementary, Middle, High, Secondary | School-Based Admin | Yes |
| Assistant Principal | Elementary, Middle, High, Secondary | School-Based Admin | Yes |
| Director of Student Services (DSS) | Middle, High, Secondary | School-Based Admin | Yes |
| Director of Student Activities (DSA) | High, Secondary | School-Based Admin | Yes |
| Administrator of NTS | Elementary, Middle, High, Secondary | behaves like Principal, then School-Based Admin | Yes |
| Assistant Administrator of NTS | Elementary, Middle, High, Secondary | behaves like Assistant Principal, then School-Based Admin | Yes |
| Central Office Leader | none (level step skipped) | All Leaders (not school-based) | Yes |

## Levels

Elementary, Middle, High School, and Secondary. Secondary means one building that
serves both middle and high school. When a session is open to every level, it is
tagged "All levels" rather than left blank, so intent is explicit.

## Cross-cutting labels

These sit on top of a role. Each is simply on or off, a person can hold more than
one, and any of them can trigger required sessions on specific days. They apply
to school-based leaders. The list is open-ended and lives in the parameters tab:

- Title I
- Project Momentum
- Discipline Lead
- Science administrator
- CSS administrator (Comprehensive Services Site)

## Umbrella and level groups

- **School-Based Admin** includes every role above except Central Office Leader.
  This is the audience for "all leaders who work in schools" (for example Legal
  Updates).
- **Everyone** equals **All Leaders**, which is School-Based Admin plus Central
  Office. Because this is a leadership kickoff, Everyone and All Leaders are the
  same thing, so they are kept as one top-level group.
- **Level groups** such as "All Elementary Leaders" or "All Secondary Leaders"
  mean every school-based role at that level. The data uses these often, so they
  are first-class audience tags.

## No "NA" values

We do not use a literal "NA" option. Labels are opt-in (unchecked means it does
not apply), the picker skips the level step for roles that have no level, and
broad sessions use a meaningful value like "All levels." This keeps the interface
clear rather than cluttered with placeholders.

## Tagging a session's audience

The Audience cell on a session is a multi-select. You can tag a session with one
or more of:

- Everyone
- School-Based Admin
- A level group, for example "All Secondary Leaders"
- A role, optionally narrowed to a level, for example "High School Principals"
- A cross-cutting label, for example "Discipline Lead"

Google Sheets supports multi-select dropdowns, so a single session can carry
several of these at once.

## The "I am a" picker

The picker is a short cascade instead of one long list:

1. Pick your role.
2. Pick your level (only the levels valid for that role appear; skipped for
   Central Office).
3. Check any labels you hold (Title I, Project Momentum, Discipline Lead, Science
   administrator, CSS administrator).

The planner then shows the union of everything relevant to you: sessions required
for your role, level, or umbrella, sessions required for any label you hold that
day, and choice sessions that match.

## Requirement and Requirement Detail

Two separate columns, each single-purpose:

- **Requirement**: Required or Choice.
- **Requirement Detail**: only the attendance rule, never an audience name. A
  short controlled list:
  - blank = everyone in the audience attends
  - One per school
  - One select per school (the school picks who)
  - Select group (a named subset)

The level or role a rule applies to lives in the Audience, not here. So "one
secondary principal per school" is Audience = Secondary Principals, Requirement =
Required, Requirement Detail = "One per school."

## Sessions offered more than once

Two cases:

- **Same day, repeated times**: keep using the "Also Offered At" cell with the
  extra time slots, for example "11:15 AM-12:15 PM; 1:15 PM-2:15 PM."
- **Different day, or any occurrence that differs** (different format, room, or
  virtual link): enter that occurrence as its own row on the correct day's tab,
  and give every row for the same session a shared **Session Code** (a short
  token, for example "HIT"). The app gathers all rows with the same code into one
  session with multiple occurrences.

Each occurrence is individually selectable, so conflict detection stays honest,
and each occurrence's card shows the others, for example "Also offered: Fri Jul
24, 1:15 PM (Virtual)." The Read Me tab must explain how the Session Code works.

## Themes

Keep the Theme / Track column but clear its current values, including the stray
"Title I." The app hides the theme filter entirely when the column is empty, so
nothing shows to attendees until themes are defined. If themes emerge during
planning, filling the column makes the filter appear automatically.

## Final column list

| Column | Purpose | Controlled or free |
| --- | --- | --- |
| Session Code | links occurrences of one session | free (short token) |
| Start Time | session start | free |
| End Time | session end | free |
| Session Title | name (include level when two versions share a name) | free |
| Requirement | Required or Choice | controlled |
| Requirement Detail | attendance rule only | controlled (short list) |
| Audience | who it is for | controlled (multi-select) |
| Theme / Track | optional theme | controlled, may stay empty |
| Format | In-person or Virtual | controlled |
| Room / Location | where | free (or controlled if a room list exists) |
| Virtual Link | join link | free |
| Presenter | who presents | free |
| Description | details | free |
| Also Offered At | same-day repeat times only | free |
| Notes | anything else | free |

"Target Audience (as written)" is retired. It overlapped with Audience and the
two contradicted on several rows.

## Data cleanup before more rows are entered

- Remove the "Target Audience (as written)" column.
- Re-map every vague "All Administrators" to the term that was meant: Everyone,
  School-Based Admin, or a specific role, level group, or label.
- Move attendance qualifiers into Requirement Detail and audience out of it.
- Clear the Theme column (remove the "Title I" value).
- Move the High Impact Tutoring and Robotics "Friday" repeats to their own rows
  on the Friday tab, with a Session Code and the correct (virtual) format.
- Add the level to titles that otherwise read as duplicates (the two Summer
  Literacy Symposium rows).

## App changes this implies

- Replace the single role dropdown with the cascade plus label checkboxes.
- Read the parameters tab for roles, levels, labels, and groups.
- Match relevance by union across role, level, umbrella, level group, and labels.
- Group occurrences across days by Session Code and show the cross-references.
- On "All days," show a total session count and make each day collapsible.
- Remove the authoring instructions from the app (attendees do not need them).

## Read Me updates needed at the end

- How the Session Code links occurrences.
- The Requirement Detail rules and what blank means.
- That Audience is multi-select and how the groups and labels work.
- That Theme can stay empty.
