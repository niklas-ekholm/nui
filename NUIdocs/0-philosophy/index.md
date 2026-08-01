# 0 Philosophy

Design principles for NUI — the point of view behind every token, element, and implementation. Obsidian applies these via [[nui-theme]] and [[nui-plugin]].

Note-taking philosophy: [[The best ways to take notes is physical, but the best way to process them is digital]].

## In this section

- [[speculative-documentation|Speculative Documentation]] — Spec-first notes that describe what will be built, marked so they are never read as a record of shipped code.
- [[writing-nuidocs|Writing NUIdocs]] — Editorial guide for NUIdocs spec notes — structure, cross-links, and when a See also section earns its place.

## Purpose

Governs *why* NUI exists. Read before [[1-foundations/index|1 Foundations]] and [[2-elements/index|2 Elements]]. Principles here are durable; tokens and elements may evolve.

## Content

**NUI** specifies how content should look and behave. It builds on **markdown**, **YAML frontmatter** (properties in Obsidian), **folder structure**, and **query/embed mechanisms** — **Bases** (`.base`) in Obsidian. NUI does not define a separate file format.

## Flat surfaces

No chrome gradients or decorative shadows. Structure comes from hairlines and spacing, not elevation.

## Two-tier text

**Content** text and **UI** chrome use separate colours. Notes stay readable; the workspace stays quiet. UI defaults to muted; emphasis uses content colour. See [[two-tier-text]].

## Ghost interactions

Controls have no filled backgrounds. Hover and active states change colour only. See [[ghost-chrome]].

## Hairline structure

Borders are thin rules — bottom edges, grid lines, pill outlines — not frames around panels.

## Progressive disclosure

Toolbar and embed chrome stay hidden until hover over the embed region. See [[progressive-disclosure]].

## Layout and colour separation

Layout and behaviour live in the plugin (`styles.css`). Palette and typography live in the theme (`theme.css`). Plugin styles carry no palette hex; component colours are scoped under a text-scope root. See [[scope-boundary]].

## Roadmap

- None — principles are mature
