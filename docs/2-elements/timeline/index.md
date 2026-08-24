# Timeline

Horizontal Gantt-style chart of dated items. Each row is one record; the bar spans its start and end dates.

## In this section

- [[axis|Axis]] — Axis rows — week numbers with month name overlay.
- [[bars-and-rows|Bars and Rows]] — Row anatomy — title label left, bar spanning start to end date right — and row sizes.
- [[2-elements/timeline/data|Data]] — Required start and end date properties for timeline items.
- [[date-range|Date Range]] — The visible window on the time axis, its default, and scrubbing.
- [[filter-field|Filter Field]] — Underlined field filtering visible rows by bar title or path without changing the date range.
- [[2-elements/timeline/implementation|Implementation]] — Bases view type id and source modules for the timeline.
- [[navigation|Navigation]] — Pan and zoom inputs for the visible date range.
- [[persistence|Persistence]] — Which timeline view state survives reload, per vault.
- [[selection|Selection]] — Figma-style marquee and click selection on the chart body.
- [[states|States]] — Layout modifiers — pane-wide, compact, and related states.
- [[2-elements/timeline/toolbar|Toolbar]] — Fixed left-to-right control order in the timeline topbar.

## Purpose

Reference element folder for NUI docs — visual index, technical child notes, Product recipe, and Implementation note. Use as the template when deepening other elements.

## Uses foundations

- [[pan-and-zoom]], [[drag-to-edit]], [[full-bleed]], [[progressive-disclosure]], [[ghost-chrome]]

## Appearance

```
┌────────────────────────────────────────────────────────────────┐
│ [Title] [filter] [start]–[end] [⤶] [span▾] [Today] [Folders] [XS–XL] [+] │  ← topbar
├────────────────────────────────────────────────────────────────┤
│      W12  W13  W14 │ Apr      W16  W17 …                       │  ← time axis
│      M  T  W  T  F …                                           │  ← weekdays
├────────────────────────────────────────────────────────────────┤
│ Row label    ████████████                                      │  ← bar row
│ Row label         █████████████████                            │
│              │ today                                           │
└────────────────────────────────────────────────────────────────┘
```

- **Topbar** — [[2-elements/view-header/index|View Header]] on the left; control row on the right — [[topbar-layout]].
- **Time axis** — week numbers always; month names overlay when a month starts on a week boundary; weekday letters on a second row at wide zoom. In note embeds (Live Preview), topbar + time axis stick under pane chrome — [[live-preview-sticky-headers]].
- **Body** — one row per item; horizontal bar from start to end; vertical grid lines per day/week.
- **Today** — vertical accent line when today is in range.

## Variants

| Variant | Appearance |
| ------- | ---------- |
| **Full** | Pane-wide (`|wide`); embedded default height; grows with row count |
| **Compact** | Stays in note column; fixed 480px height; internal scroll |

## Chrome

Left to right on the control row:

| Control | Role |
| ------- | ---- |
| Filter field | Narrow rows by title or path |
| **start–end** | Visible date range |
| **⤶** | Reset default range and timespan |
| Timespan menu | Preset window length |
| **Today** | Center on today |
| Folders | Show or hide top-level folder contents |
| Row size | **XS** **S** **M** **L** **XL** |
| **+** | [[add-button]] — create note in `.base` folder |

Host default Bases toolbar and search row are hidden. See [[2-elements/embed-chrome/index|Embed Chrome]].

## States

| State | What changes |
| ----- | ------------ |
| Empty | Muted message in chart area |
| Hover embed | Toolbar chrome fades in |
| Selected bars | Accent fill on selected projects |
| Marquee | Rectangle over chart; bars intersecting are selected |
| Scrubbing dates | Cursor locked; range updates live |
| Filter active | Rows not matching hidden; **×** on filter |

## Examples

- Project planning — bars from `start` / `end` frontmatter in a folder.
- Vault recipe: [[project-timeline]].

## Roadmap

- Maintain as reference template when other elements are deepened

# Elements

* [Data](data.md) - Required start and end date properties for timeline items.
* [Implementation](implementation.md) - Bases view type id and source modules for the timeline.
* [Toolbar](toolbar.md) - Fixed left-to-right control order in the timeline topbar.
