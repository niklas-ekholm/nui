---
type: Implementation
title: Contents
description: The shared folder-navigation base and its views.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Contents

Shared folder-navigation base at `┼/Bases/Contents.base`. Filters use `this.file.folder`, so one base serves every folder index in the vault.

| View | Embed | Layout |
| ---- | ----- | ------ |
| Navigation   | `![[Contents.base#Navigation]]`   | [[2-elements/list/index|List]] folders + [[2-elements/list/index|List]] files (replaces Folders + Files pair) |
| Daily links | `![[Daily.base#today]]` (also `#yesterday`, `#tomorrow`) | [[today-daily-note|Daily Note Link]] — separate base, not on Contents/Navigation |
| Folders      | `![[Contents.base#Folders]]`      | [[2-elements/list/index|List]] folders (flex-wrap chips) |
| Files        | `![[Contents.base#Files]]`        | [[2-elements/list/index|List]] files   |
| Files by Date | `![[Contents.base#Files By Date]]` | [[2-elements/list/index|List]] files by date |
| Recent Files | `![[Contents.base#Recent Files]]` | [[2-elements/list/index|List]] files   |

Calendar tracking uses the sibling bases in `┼/Bases/` — `Year.base` (a `nui-year-tracker` view per year), `Month.base` (`nui-month-tracker`: `Calendar`, `compact`, months `1`–`12`, and a view per year), and `Tracker.base` (the Week ×3 board). All scope themselves by embed location, the same way `Contents.base` does. Habits live in `Habits/{Name}/` — see [[habit-year-tracker]] and [[weekly-habits]].
