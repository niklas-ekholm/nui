---
date: 2026-07-27
---
# NUI — example vault

This vault exists to show what the NUI plugin and theme do. Every note in it is
invented. Poke at anything.

> [!warning] This vault is opinionated on purpose
> The settings here are not NUI's defaults. Folder-index navigation is **on**,
> which changes what clicking a folder in the sidebar does: it opens that
> folder's own note instead of expanding it. Habits, dates, and cover images
> follow specific conventions, described below. If you install NUI into a vault
> of your own, everything starts off until you turn it on.

## Where to look first

Open the **note**, not the base. Every base in [[Bases]] filters on
`file.inFolder(this.file.folder)` — the folder of the note it is embedded in,
and everything below. So the same `Timeline.base` shows all your projects from
one note and a single project from another. Opened on its own from `Bases`, it
scopes to `Bases`, which holds nothing, and comes up empty.

| Open this | To see |
| --- | --- |
| [[Projects]] | Every project as a bar on a date axis, three layouts, plus the task lists |
| [[Kettle shelf]] | The same timeline embed, one folder down: that project's three phases and nothing else |
| [[Habits]] | Three-week, year, and month trackers across Reading, Running and Writing |
| [[Running]] | One habit's distances as a line chart and as bars, and the trackers narrowed to it |
| [[Library]] | The picture gallery and both card sizes |
| [[Daily]] | Files grouped by date, and the link to today's daily note |

Between them those cover all fourteen views the plugin adds. Each embed has a
view picker in its top-right corner — most hold more than one view.

Because folder-index is on, clicking any of those folders in the sidebar opens
the note above. The whole vault at once looks like this:

![[Contents.base]]

## The conventions this vault uses

These are the parts you would have to match in your own vault for the views to
find anything.

**Dates** live in a `date` property, `YYYY-MM-DD`. A view can be pointed at a
different property, and falls back to an ISO date at the start of the filename.

**Habits are folders.** `Habits/` holds one folder per habit — Reading, Running,
Writing — and each dated note inside a habit folder is one completion. A
`rating` from 1 to 5 shades the cell. Three of the fourteen views ignore the
query and read the host folder directly: **Week Tracker: 3** takes its rows from
the subfolders of wherever it is embedded, which is why the same `Tracker.base`
shows three habits from [[Habits]] and one from [[Running]]. **List: Navigation**
and **List: Folders** walk out from the host folder the same way.

**Projects** carry `start`, `end`, and `project`. The timeline groups bars by
`project`, so `Meridian` gathers four notes under one heading and `Kettle`
gathers two. The phases under [[Kettle shelf]] carry no `project` at all, which
is what an ungrouped bar looks like. Checkbox lines in the note body feed the
task views.

**Cover images** go in a `coverimage` property as a link — `"[[quiet-machines.png]]"`.
The same property drives the card grids and the image at the top of the note
itself.

**Scores** are a `score` number. The chart in `Scores.base` reads the distance
recorded on each run.

## What is missing on purpose

There is no `workspace.json`, so Obsidian opens with its own default layout
rather than one saved on someone else's monitor. Set the panes up however you
like — the vault will remember it from then on, and git ignores it.
