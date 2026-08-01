---
type: Element
title: Data
description: Options for the year and week x3 tracker views, and the habit bundle they read.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Data

Parent: [[2-elements/tracker/index|Tracker]]

## View options

Both tracker views read one option, `dateField`, a property id — `note.date` in the shipped bases. Everything else comes from the base's own filter and from the folder tree.

| View | Option | Scope comes from |
| ---- | ------ | ---------------- |
| Year Tracker (`nui-year-tracker`) | `dateField` | The base query — `file.inFolder(this.file.folder)`. The **view name** supplies the year (`2026`) |
| Week ×3 (`nui-week-tracker-3`) | `dateField` | Child folders of the folder hosting the embed (`listHabitRowsInHostFolder`) |

There is no tag option and no habits-folder option. The habits root (`Habits`) is a constant in the plugin, used only to decide whether a folder rename is a habit rename.

## Date resolution

`readDate` tries, in order:

1. the configured `dateField`
2. `note.date`, `note.Start Date`, `note.startDate`, `note.start`
3. the leading `YYYY-MM-DD` of the filename

So an undated day note still lands on the right day via its name.

## Habit bundle (vault convention)

| Concept | Rule |
| ------- | ---- |
| Habit | A folder holding a hub note |
| Habit name | The folder name |
| Hub note | `index.md`, H1 = habit name |
| Hub embed | `![[Year.base#{year}]]` |
| Day note | `{YYYY-MM-DD} {HabitName}.md` |

### Day note frontmatter

```yaml
date: YYYY-MM-DD
rating: 3     # optional, 1-5, rendered on the day mark
```

No tags. Membership is the folder.

### Base YAML

Both trackers use the same shape — one shared base, scoped by where it is embedded:

```yaml
filters:
  and:
    - file.inFolder(this.file.folder)
    - file.path != this.file.path
views:
  - type: nui-year-tracker
    name: "2026"
    dateField: note.date
```

Create and rename rules: [[3-implementations/obsidian/behavior/index|Behavior]], [[habit-create]].
