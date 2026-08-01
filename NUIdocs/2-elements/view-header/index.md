# View Header

Title row shared across data views — title left, controls right, one baseline.

## In this section

- [[control-cluster|Control Cluster]] — Middle controls in the control row, ordered per layout.
- [[2-elements/view-header/implementation|Implementation]] — Class names and spacing variables for the header, per host view.
- [[title-slot|Title Slot]] — View or base name, linking to the source file when embedded.
- [[topbar-layout|Topbar Layout]] — Zones, spacing, alignment, and what counts as one element in a topbar.

## Purpose

Shared title row for data views — title slot and control cluster aligned on one baseline. Used by [[2-elements/timeline/index|Timeline]] and other layouts.

## Appearance

```
┌──────────────────────────────────────────┐
│ Display title          [controls…]       │
└──────────────────────────────────────────┘
```

- **Title slot** — [[title]]; in embeds, flush with content column.
- **Control row** — right-aligned; uniform spacing and baseline alignment — see [[topbar-layout]].
- **[[add-button]]** — last in the control row when the layout defines a create action.

## Examples

- [[2-elements/timeline/index|Timeline]] topbar
- Embed `.base` filename as clickable title

## Roadmap

- Flush inset rules across embed types

# Elements

* [Implementation](implementation.md) - Class names and spacing variables for the header, per host view.
