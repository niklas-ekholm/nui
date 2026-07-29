# NUI

An Obsidian plugin that adds fourteen views to [Bases](https://help.obsidian.md/bases) — timelines, habit trackers, card grids, and file lists — alongside optional folder-index navigation and a handful of editor tools.

Requires Obsidian 1.10 or later, which is where the Bases view API became public.

## Bases views

Add any of these from a base's view picker. Each one reads its data from the base's own query, so the filters and sort you already have keep working.

| View | What it shows | Needs |
| --- | --- | --- |
| Timeline | Notes as draggable bars on a date axis, grouped by project | A start-date and an end-date property |
| List: Tasks | Checkbox tasks pulled from the body of matching notes | — |
| Year Tracker | A year-at-a-glance grid of habit completions | A date property |
| Month Tracker | One month per row for the selected year | A date property |
| Week Tracker: 3 | Three weeks of habit rows for the containing folder | A date property |
| Score Chart | A line chart of a numeric property over time | A date property |
| Card: S / Card: L | Cards at two sizes, with an optional image | — |
| List: Files | A compact file list with optional thumbnails | — |
| List: Files by Date | The same list grouped by a date property | A date property |
| List: Folders | Sibling folders rather than files | — |
| Picture Gallery | An image grid | An image property, or the file itself |
| List: Navigation | Links to the folder indexes below the current folder | Folder-index model turned on |
| List: Today Daily Note | A single link to today's daily note, created on click | A daily-notes folder |

Dates come from whichever property you point the view at — `note.date` by default. The trackers read habit completions from notes filed under a habits folder; each habit is a folder, and each completion a dated note inside it.

### Timeline

Drag a bar to move it, drag its edges to reshape it, and the plugin writes the new dates back to the note's frontmatter. Notes that live in a project folder collapse under a single parent row. The timeline only becomes editable when the start and end fields are plain note properties — formula and file properties stay read-only, because there is nothing to write back to.

## Folder index

Optionally, clicking a folder in the file explorer opens that folder's `index.md` instead of just expanding it, and the note header breadcrumb becomes clickable. The chevron still expands and collapses. Turn it on in settings; it is off by default because it changes what a click does and overlaps with folder-note plugins.

## Editor tools

Multi-cursor commands (add cursor above/below, add next match, copy line up/down), a text-colour picker, per-note cover images and wide layout, collapsible properties, table column widths, and HTML rendering in Live Preview.

## Commands and hotkeys

Eleven commands, all bindable under Settings → Hotkeys. Nine ship without a key. Two carry an opt-in default — `Mod+§` for "Show or hide chrome" and `Mod+Escape` for "Go to parent folder" — and Settings → NUI → Hotkeys turns both on or off together. The [root README](../README.md#commands-and-hotkeys) tabulates every command with the setting it depends on.

## The NUI theme is optional

The plugin styles itself from Obsidian's own CSS variables, so it inherits whatever theme you use. The companion [NUI theme](https://github.com/niklas-ekholm/nui-theme-obsidian) restyles typography to match, but nothing here depends on it being installed.

## Installing

Until this is in the community directory, install manually: download `main.js`, `manifest.json`, and `styles.css` from a [release](https://github.com/niklas-ekholm/nui-plugin/releases) into `<vault>/.obsidian/plugins/nui/`, then enable it under Settings → Community plugins.

## Developing

```bash
npm install
npm run dev
```

`npm run dev` watches `src/` and writes the build into `../vault-example/.obsidian/plugins/nui/`, the example vault in this repository. Point it somewhere else with `NUI_VAULT_PLUGIN_DIR`. `npm run build` produces a production bundle next to the source, and `npm run check` runs the typecheck, lint, tests, and path guard that CI runs.

## Licence

MIT — see [LICENSE](LICENSE).
