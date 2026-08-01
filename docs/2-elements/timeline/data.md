---
type: Element
title: Data
description: Required start and end date properties for timeline items.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Data

Parent: [[2-elements/timeline/index|Timeline]]

## Required properties

Each item needs **start** and **end** dates (or whatever the view **Start date** / **End date** options reference).

```yaml
---
start: 2026-01-01
end: 2026-03-30
---
```

## Fallback property names

If options unset: `start` / `date` / `Start Date` / `startDate`; `end` / `dueDate` / `End Date` / `endDate`.

## Title

Configured **Title** property → `note.title` → filename.

## View options

| Option | Purpose |
| ------ | ------- |
| Start date | Bar start property |
| End date | Bar end property |
| Title | Bar label |
| Layout | **full** or **compact** in `.base` file |

