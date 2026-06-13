# Leadership Kickoff Planner: Cowork Setup

This is the entry point. Follow the few human steps, then paste the prompt into Cowork and let it scaffold the rest.

## Your steps (about five, mostly paste and run)

1. Create a local folder named `leadership-kickoff-planner`.
2. Put these files in it: `index.html`, `DESIGN.md`, `PROJECT_CONTEXT.md`, `status.md`, `decisions.md`. (Keep `KICKOFF.md` and `PROJECT_MEMORY.md` alongside for reference; they do not need to be in the repo.)
3. Open the folder as a Cowork project.
4. Add the contents of `PROJECT_MEMORY.md` to the project's memory or instructions field in Cowork.
5. Paste the "Prompt for Cowork" block below into Cowork.
6. When Cowork finishes, run the "Command Prompt block" below to create the GitHub repo and push.

## Prompt for Cowork (paste this)

> You are setting up a new project: the Leadership Kickoff schedule planner. Before doing anything else, read these files in the project, in this order: PROJECT_CONTEXT.md, DESIGN.md, decisions.md, status.md. If a standup skill is available, run it first.
>
> Then do the following as one batch, and stop for my review before any git push or deploy:
>
> 1. Confirm index.html is present and opens. Do not regenerate it from scratch; it is the tested baseline UI. Modify it only as specified in DESIGN.md.
> 2. Update index.html per the "Data schema" and "Multi-tab loading" sections of DESIGN.md: change the CONFIG block to hold the four published CSV URLs (one per day tab) plus the tab to date map, and update the row normalization to the new column set. Leave the four URLs as empty placeholders for now, and make sure the built in sample data still renders when they are blank.
> 3. Create README.md (short: what this is, how to edit it through the Google Sheet, how to preview it locally, how it gets hosted) and a .gitignore (node_modules, .DS_Store, .env).
> 4. Keep all data loading inside the single loadData() function, so a future swap to Google Apps Script is a one spot change (see "Future Google route" in DESIGN.md).
> 5. Update status.md with what you did and the remaining open items.
> 6. Prepare, but do not run, the git commands. Echo the exact Command Prompt block I should run to create the repo and push.
>
> Constraints: no external libraries or CDNs, no localStorage or sessionStorage, no em dashes in any file you write. Ask me before anything irreversible.

## Command Prompt block (run after Cowork scaffolds)

If you have GitHub CLI (`gh`) installed:

```
cd path\to\leadership-kickoff-planner
git init
git add .
git commit -m "Initial scaffold: Leadership Kickoff planner"
gh repo create leadership-kickoff-planner --private --source=. --remote=origin --push
```

If you do not have `gh`, create an empty private repo on github.com first, then:

```
cd path\to\leadership-kickoff-planner
git init
git add .
git commit -m "Initial scaffold: Leadership Kickoff planner"
git remote add origin https://github.com/YOUR_USERNAME/leadership-kickoff-planner.git
git branch -M main
git push -u origin main
```

## Working rhythm after setup

- Start each session with the standup skill so Cowork reads the three context files first.
- End each session with the conclude skill so it updates them.
- You run all git pushes and any deploy yourself. Cowork prepares the commands; you execute them. That keeps a human checkpoint before anything consequential.
