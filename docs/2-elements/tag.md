---
type: Element
title: Tag
description: Pill-outline chip with transparent fill for metadata and habit names.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Tag

Pill outline, transparent fill — habit tags, metadata chips.

## Purpose

Tag element — compact labelled chip for metadata and habit names.

## Habit row labels

The Week ×3 tracker renders each habit's name in this chip style, but it is a **folder label, not a tag**: the row label is the habit folder's name, read from the folder tree at render time, and it links to that folder's `index.md`. Habits carry no tag anywhere — see [[3-implementations/obsidian/behavior/index|Behavior]].

## Uses foundations

- [[border]], [[typography]], [[color]]

## Appearance

Rounded border (**border** token); text at **small** size.

## Used in

- [[2-elements/tracker/index|Tracker]]

