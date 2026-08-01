---
type: Implementation
title: NUI Plugin
description: The Obsidian plugin — element registration table and cross-cutting code paths.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# NUI Plugin

NUI Plugin is the Obsidian plugin for NUI layouts and behaviour. Source lives in **`plugin/`** in this monorepo. `npm run dev` writes the build to `vault-example/.obsidian/plugins/nui/`.

## Purpose

Maps [[2-elements/index|2 Elements]] and [[1-foundations/index|1 Foundations]] to Obsidian Bases view types and plugin modules. Registration table and cross-cutting code paths live here; implementation roadmap in [[nui-plugin-roadmap]].

## Element registration

| NUI element                    | Menu name       | Type id                    | Source                                   |
| -------------------------------- | --------------- | -------------------------- | ---------------------------------------- |
| [[2-elements/timeline/index|Timeline]] | Timeline        | `nui-timeline`        | `src/views/timeline-bases-view.ts`       |
| [[2-elements/tracker/index|Tracker]]   | Year Tracker    | `nui-year-tracker`    | `src/views/year-tracker-bases-view.ts`   |
| [[month|Tracker — Month]]              | Month Tracker   | `nui-month-tracker`   | `src/views/month-tracker-bases-view.ts`  |
| [[2-elements/tracker/index|Tracker]]   | Week Tracker: 3 | `nui-week-tracker-3`  | `src/views/week-tracker-3-bases-view.ts` |
| [[2-elements/card/index|Card]]         | Card: S         | `nui-card-s`          | `src/views/card-list-bases-views.ts`     |
| [[2-elements/card/index|Card]]         | Card: L         | `nui-card-l`          | `src/views/card-list-bases-views.ts`     |
| [[2-elements/card/index|Card]]         | Picture Gallery | `nui-picture-gallery` | `src/views/card-list-bases-views.ts`     |
| [[2-elements/list/index|List]]         | List: Files     | `nui-list-files`      | `src/views/card-list-bases-views.ts`     |
| [[2-elements/list/index|List]]         | List: Folders   | `nui-list-folders`    | `src/views/card-list-bases-views.ts`     |
| [[2-elements/list/index|List]]         | List: Navigation | `nui-navigation`     | `src/views/navigation-bases-view.ts`     |
| [[2-elements/list/index|List]]         | List: Today Daily Note | `nui-daily-note-link` | `src/views/daily-note-link-bases-view.ts` |
| [[2-elements/list/index|List]]         | List: Tasks     | `nui-task-list`       | `src/views/task-list-bases-view.ts`      |
| [[2-elements/list/index|List]]         | List: Files by Date | `nui-list-files-by-date` | `src/views/card-list-bases-views.ts` |
| [[score-chart|Score Chart]]             | Score Chart     | `nui-score-chart`     | `src/views/score-chart-bases-view.ts`    |

All 14 registered views are listed. Bases view type ids use the `nui-` namespace prefix; the constants live in `src/layouts/types.ts` and the menu names in the `registerBasesView` calls in `src/main.ts`.

No `.base` in the vault uses **Score Chart** yet — see [[score-chart]].

## Cross-cutting modules

| Area | Path |
| ---- | ---- |
| Folder index create + rename | `src/navigation/folder-index.ts`, `src/navigation/folder-index-suppress.ts`, `src/navigation/create-subfolder.ts` |
| Habit create | `src/habits/create-habit.ts` |
| Habit rename | `src/habits/rename-habit.ts`, `src/habits/habit-rename-manager.ts` |
| Habit rows and day notes (folder-derived) | `src/habits/habit-bundle.ts`, `src/bases/tracker-from-entries.ts` |
| Timeline render | `src/core/timeline/render-timeline.ts` |
| Timeline viewport | `src/core/timeline/timeline-viewport.ts` |
| Week grid (desktop + mobile rolling) | `src/core/week-tracker-3/week-grid.ts` |
| Card / list render | `src/cards/render-cards.ts` |
| Daily note link | `src/bases/daily-note-path.ts`, `src/views/daily-note-link-bases-view.ts` |
| Task list render | `src/core/task-list/render-task-list.ts` |
| Month grid + event pills | `src/core/month-tracker/month-grid.ts`, `src/core/month-tracker/render-month-tracker.ts` |
| Score chart render | `src/core/score-chart/render-score-chart.ts`, `src/bases/score-from-entries.ts` |
| Task extraction | `src/bases/tasks-from-entries.ts` |
| Markdown table column layout | `src/editor/table-column-layout/` |
| Live Preview embed sticky (pane chrome, scroller padding) | `src/embed/embed-chrome-stick-line.ts`, `src/editor/note-cover-image.ts` — [[live-preview-sticky-headers]] |

## Mobile

Touch-specific layout and embed fixes are documented in [[mobile]].

## Note editor

Live Preview header layout (title left, properties right, body full width) and the short-note vertical-jump fix are documented in [[note-header-layout]].

Markdown pipe table column layout (separator-row shrink/fill ratios, separator dash preservation) is documented in [[table-column-layout]].

## NUI Finance (speculative)

> [!warning] Speculative — not built.

[[nui-finance|NUI Finance]] is finance **Bases views inside this plugin** — expense tracking first (`nui-expense-ledger`, `nui-expense-breakdown`), then a personal finance planner (`nui-finance-*`). Not a separate plugin or manifest.

Prerequisite: bundle detection and rename must generalise beyond `Habits/` before `Finance/` obligation folders are safe. Expense trackers can ship before the planner slice.

## See also

- Colour and typography tokens for custom views come from [[nui-theme]] inside `.nui-text-scope` — see [[scope-boundary]].

## Roadmap

- See [[nui-plugin-roadmap]] for planned plugin work

