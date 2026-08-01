---
type: Implementation
title: Doc Drift Audit
description: "Standing audit of NUI docs against the shipped code — run 2026-07-25, closed except one path."
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Doc Drift Audit

Every checkable claim in NUI docs compared against `plugin/src`, `vault-example/.obsidian/themes/NUI/theme.css`, `vault-example/.obsidian/plugins/nui/styles.css`, `vault-example/┼/Bases/*.base`, `hotkeys.json`, and `app.json`.

Every item is closed except one unverifiable script path. Most drift came from one event: the vault moved from NipaNotes (`index/…` bases, `{Folder}.md` hub notes, per-habit year bases, a habit tag registry) to N-docs (`┼/Bases/`, `index.md`, shared folder-scoped bases), and the behaviour and product docs did not follow. The code was taken as the source of truth and the docs rewritten to match, except for the habit bug in §3.

Re-run this after each plugin slice.

## 1. Resolved — behaviour docs rewritten

Each of these described behaviour that no longer existed. All now match the code.

| Doc | Was documented | Actually |
| --- | -------------- | -------- |
| [[folder-index-create]] | Trigger `vault.on("create")`; creating a folder spawns a hub named `{Folder}/{Folder}.md` | No create handler exists. Hubs are made lazily by `openFolderIndex` → `createFolderIndex` on folder-title or breadcrumb click, seeded `# {FolderName}` |
| [[folder-index-rename]] | Folder name ↔ hub note name kept in sync, "Status: live" | Removed in v1.0. The rename listener only refreshes header state; its code comment reads *"Folder and index.md names are independent now"* |
| [[habit-create]] | 7 steps, incl. creating a year base and registering a tag | 3 steps: unique name, folder, `index.md`. No base is created or touched |
| [[habit-rename-from-index-note]] | "Status: live" | Unreachable for v1.0 bundles — `isHabitHubIndexRename` requires a legacy same-named hub and rejects `index.md` paths |
| [[habit-delete]] | "Planned", with orphan-tag pruning | Nothing to implement; deleting the folder is the whole operation |
| [[3-implementations/obsidian/behavior/index\|Behavior]] | Habit bundle layout in `index/Calendar/Log/habits`, tag-based | `Habits/{Name}/` with `index.md`, folder-based |

## 2. Resolved — stale paths swept

The bases are `┼/Bases/{Contents,Tasks,Timeline,Tracker,Year,Month}.base`. Habits are `Habits/{Name}/` with day notes `{YYYY-MM-DD} {Name}.md` flat in the folder. Plugin source is `plugin/src` in the nui monorepo; build tooling is `plugin/` (`npm run dev` → `vault-example/.obsidian/plugins/nui/`).

Corrected across 14 notes: `Weekly Habits.base` → `Tracker.base`; per-habit `{Habit}{Year}.base` → `Year.base#{year}`; the whole `index/Calendar/…` tree; `index/*.base` → `┼/Bases/*.base`; `Sites/NUIrepo/Obsidian/plugin` → `plugin/`; "sources live in NipaNotes".

The one exception is the `normalize-vault-blank-lines.py` path — see **Still open** below.

## 3. Resolved — the habit corruption

`syncHabitRename` called `renameTagInWeeklyHabitsBase` on `┼/Bases/Tracker.base` on **every** habit rename. Against a folder-scoped base that had no tag registry to update, it:

- injected a `filters.or` branch beside the existing `filters.and`, one `file.tags.contains("{name}")` entry per rename
- set a meaningless `tags:` key on the Week view

A base with both `and` and `or` no longer scopes to its folder, so a single rename would have widened every `Tracker.base` embed in the vault. The habit data itself was never damaged — no rename had happened since the migration, and the bases on disk were clean.

Fixed by deleting the call and the module behind it — `habits/weekly-habits-base.ts`, now removed, whose other four exports had no callers at all — plus the dead `DEFAULT_WEEKLY_HABITS_BASE_PATH`, `DEFAULT_CALENDAR_BASE_PATH`, `buildHabitYearIndexContent` (which embedded a `Calendar.base` that does not exist), and the unused `weeklyHabitsBasePath` option.

Guarded by `src/habits/no-base-mutation.test.ts`: habit sources may not round-trip YAML, build a tag filter expression, reach into a base's `filters`, or reintroduce the module.

`main.js` was rebuilt from `plugin/` after the fix — `tsc -noEmit` clean, 30/30 tests, and the shipped bundle no longer contains `renameTagInWeeklyHabitsBase` or any `file.tags.contains` expression. Reload the plugin in Obsidian to pick it up.

## 4. Resolved — undocumented views written up

All 14 registered Bases views now appear in the registration table in [[nui-plugin]] and have a home in the spec.

| Was missing | Now |
| ----------- | --- |
| `Month Tracker` / `nui-month-tracker` | [[month\|Tracker — Month]] — scope-from-view-name, the two layouts, event pills |
| `Score Chart` / `nui-score-chart` | [[score-chart]] — a new element note. Still used by no `.base`, which the note says |
| `┼/Bases/Month.base` — 24 views | [[month-calendar]] — a Product recipe covering all four view families and the three live embeds |
| `nui:open-folder-index`, `nui:create-folder-index`, `nui:turn-note-into-folder`, `nui:toggle-hide-chrome` | Listed in [[hotkeys]] as unbound commands |

## 5. Resolved — smaller corrections

- [[config]] — the raw block listed three settings absent from `app.json` and omitted the two that are set. Now matches the file exactly.
- [[hotkeys]] — the multi-cursor bindings were credited to an "Advanced Cursors" community plugin; they are NUI Plugin commands in `src/editor/cursors.ts`, and `nui` is the only installed plugin. A ⌘` row with no `hotkeys.json` entry was dropped. (Advanced Cursors remains correctly listed in [[reference-plugins]] as a plugin to study.)

- [[structure]] and [[mobile]] described NipaNotes as the live vault, and `structure.md` still had `{FolderName}.md` folder indexes with rename sync. Both now describe N-docs, with NipaNotes named as the previous vault on the 0.1.x line. Same for [[3-implementations/obsidian/vault/index\|Vault]], [[3-implementations/obsidian/embeds/index\|Embeds]], [[3-implementations/obsidian/product/index\|Product]], [[note-header-layout]], [[nui-theme]], and [[normalize-blank-lines]]. The remaining NipaNotes mentions are deliberate references to the legacy line.

## 6. Verified accurate

Re-checked after the sweep:

- All 14 registered Bases view type ids, menu names, and source paths — every one now documented.
- Every `src/…` path cited anywhere in `docs/` exists on disk.
- Every `--nui-*` custom property and `.nui-*` class cited in NUI docs is present in `theme.css` or `styles.css`.
- View counts per base: `Contents` 6, `Month` 24, `Tasks` 3, `Timeline` 1, `Tracker` 1, `Year` 10.
- [[contents]]'s view table matches `Contents.base` exactly.
- [[folder-index-v1-0]] matches the code, including the `# {FolderName}` seed.
- [[hotkeys]] matches `hotkeys.json` exactly.
- Habit day-note naming and date-resolution fallbacks.

## Still open

One fact I could not verify from inside the vault:

- `normalize-vault-blank-lines.py` is not in the nui monorepo or the example vault, so it presumably stayed in NUIrepo. Flagged in [[normalize-blank-lines]]; confirm on disk.

## 7. Fixed — nested habit renames

Renaming a habit under a group folder (`Habits/Liikunta/Aamujumppa`) moved the folder but left its day-note filenames alone: `isChildOfHabitsRoot` tested `folder.parent?.path === "Habits"`, so only direct children of the root were detected.

Detection is now `isHabitBundleRename` — inside the habits root at **any** depth, *and* a habit bundle. The gate is the same predicate the trackers use to build rows, so anything appearing as a habit row renames like one, while plain subfolders (attachments) are skipped.

Three latent bugs surfaced with it, all fixed:

- `syncHabitRename`'s collision check built its target as `habitFolderPath(root, newName)`, which would have **hoisted a nested habit to the habits root**. Now `siblingHabitFolderPath(folder.path, newName)`.
- The rename walk was recursive, so renaming a group would have rewritten its sub-habits' files. Now `listOwnFilesInHabitFolder` stops at nested bundles.
- Renamed files were rebuilt as `${folder.path}/${basename}`, which would have **moved a file out of a subfolder** into the habit root. Now renamed in place using the file's own parent.

`isHabitHubIndexRename` got the same depth-independent treatment for consistency, though it remains legacy-only.

Path logic moved to `src/habits/habit-path.ts` — no Obsidian imports, so it is unit tested (`habit-path.test.ts`, 8 cases covering depth, the root itself, `Habits2` near-misses, trailing slashes, and the hoisting regression).

While in there, seven more orphans from the tag design were removed: `buildHabitYearBaseContent` (which authored a per-habit year base with a `file.hasTag()` filter), `habitBasePath`, `habitBaseFileName`, `habitYearFolderPath`, `habitDayFolderPath`, `buildHabitDayNoteContent`, `filterExistingHabitTags`, `habitFolderExists`, `resolveYearBasesInFolder`, `habitNameFromBaseBasename`, `isHabitFolderPath`, `listHabitFolderNames`, `resolveHabitNameFromPath`, and six dead tag helpers in `tracker-from-entries.ts`. The last three were themselves depth-1 traps.

`no-base-mutation.test.ts` gained a case for base content built by string concatenation — the form that let `buildHabitYearBaseContent` slip past the first version of the guard.

## 8. Resolved — NUI docs relocation (2026-08-01)

Product docs moved from `ncyclopedia-local/triage/incoming/from-n-docs/NUI` into the nui monorepo (`docs/`, `references/`). Commit `5a76749` — import unedited; path reconciliation in the same pass as this section. Consolidated under `docs/` only (2026-08-01).

| Stale | Correct |
| --- | --- |
| `~/Sites/nui-build` | `plugin/` |
| Plugin source in N-docs `.obsidian/plugins/nui/src` | `plugin/src` |
| Separate `nui-finance` plugin | Finance views inside NUI plugin — see [[nui-finance]] |

Rewrote [[nui-finance]] for one-plugin architecture (`nui-expense-*` view ids, `plugin/src/core/finance/`). Updated [[nui-plugin]] registration table and dropped the separate-plugin install section. Swept remaining build-path mentions in [[dev/index]], [[behavior/index]], [[mobile]], [[structure]], and this audit.

Triage source marked ingested; canonical home is `https://github.com/niklas-ekholm/nui` → `nui/docs`.

## Roadmap

- Give [[score-chart]] a `scoreField` option if a second use appears; add a Product recipe once a base uses it
- `DEFAULT_CALENDAR_FOLDER` is still hardcoded to `Habits`; make it a setting if a second habits root is ever wanted
- Re-run this audit after the next plugin slice
