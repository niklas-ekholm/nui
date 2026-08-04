# Changelog

All notable changes to NUI — the plugin, the theme, and the example vault, which
share one version number.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
NUI uses [semantic versioning](https://semver.org/spec/v2.0.0.html). While the
version stays below 1.0.0, expect breaking changes in minor releases.

## [Unreleased]

## [0.2.5] — 2026-08-04

### Added

- **Navigation new-note control**: the Navigation embed's files row gets a **+** button for creating notes in the current folder.
- **Week tracker 3**: scrolls across a year of weeks with a **Today** control; unified scroll layout with a today line and sticky habit tags.
- **Timeline nested project folders**: folder hubs with dates group on the timeline at any nesting depth — replaces the old superproject grouping.
- New timeline notes scroll into view and open rename without shifting the visible date range.
- Live Preview embed source selection can be dismissed via margin click or **Escape**.

### Changed

- Timeline bar rows align with week tracker styling — circled date markers on the centerline, endpoint insets, selection seams, nested folder subproject rows, and XL h1 row sizing.
- Timeline chrome is scoped more tightly.
- **Hide embed edit buttons** wins over theme rules and applies immediately from settings.

### Fixed

- `install-remote.sh` on macOS bash 3.2 with empty arguments under `set -u`.

## [0.2.4] — 2026-08-04

### Added

- **Nested properties**: nested YAML objects and arrays render as a collapsible tree in the in-document Properties block (Settings → Nested properties).
- **Selection formatting toolbar** (desktop): bold, italic, heading, and code controls when text is selected.
- Properties rows show an **×** on hover that clears (removes) that property from frontmatter.
- Empty properties info button adds a property instead of only expanding an empty block.
- `Daily.base` with `#today`, `#yesterday`, and `#tomorrow` views (`label` + `dayOffset` on List: Daily Note Link).
- Product docs under `docs/` (NUI docs naming); example vault code sample [[Archive search patterns]].

### Changed

- Headings and Bases embeds use `0` vertical padding so blank lines in source own the gap.
- Daily note link view renamed to **List: Daily Note Link**; Today moved from `Navigation.base` to `Daily.base`.
- Blockquotes use h3-scale body type and a thin left rule (`--nui-border-color`) instead of oversized serif pull-quote styling — partial; Live Preview first-line alignment and source-mode interaction remain open (#15).

### Fixed

- Properties info button beside the note title no longer shows Obsidian's default button border or shadow (#12).
- Fenced code blocks in Live Preview no longer inherit heading or link typography; only syntax highlighting colours apply (#14).
- Properties block no longer covers descenders of the note title (`--n-properties-margin-block-start`).
- Moving the cursor onto an embed no longer shifts the document for the `![[…]]` source row — the source overlays the embed at low opacity.
- Clicking non-interactive areas of an embed places the cursor at the end of the embed line.

## [0.2.3] — 2026-07-31

### Changed

- Example vault habit day notes use `YYYY-MM-DD Habit.md` filenames, matching what the trackers create.

### Removed

- OKF space support (`okf_version` hub frontmatter and automatic `index.md` sidecars), plus the example vault's `okf-wiki` demo.

## [0.2.2] — 2026-07-31

### Added

- `scripts/install-remote.sh`: fetches, verifies, and installs a release into a vault you already have, in one command, without downloading a zip by hand first. With no vault path, installs into the current directory.
- `scripts/install-remote-vault.sh`: fetches and unpacks the demo vault the same way, for trying NUI without an existing vault. With no directory, unpacks into the current directory.

## [0.2.1] — 2026-07-30

### Added

- **Collapse properties** setting: the info icon beside a note title toggles whether properties stay visible, and the choice persists across notes.
- Timeline and task-list embed pipe filter by responsibility (e.g. `![[Note|responsibility]]`).
- **Select all occurrences** and **add cursors to line ends** editor commands.
- Hotkeys aligned across the plugin and example vault: opt-in defaults `Mod+Alt+` `` (show or hide chrome) and `Mod+Escape` (go to parent folder); example-vault bindings `Mod+` `` (toggle source mode), `Mod+Alt+↑`/`↓`, `Mod+D`, `Mod+Shift+L`, `Alt+Shift+I`, and `Alt+Shift+↑`/`↓` for multi-cursor commands.

### Changed

- Example vault directory renamed to `vault-example/`; `Contents.base` renamed to `Navigation.base`.
- Collapsible properties use a Lucide **info** icon with sizing tuned to align beside the note title.
- Task list text renders wikilinks with reading-view body copy styling.

### Fixed

- Responsibility embed pipe filtering resolves from the host note and works for tasks and multi-embed notes.
- Timeline embeds clip horizontal overflow.
- `Mod+Escape` go-to-parent-folder behaviour.
- Multi-cursor carets blink in sync.

## [0.2.0] — 2026-07-27

The first published release. Plugin, theme, and example vault move into one
repository and start on a single version number, clearing the theme's earlier
`0.1.1` and the plugin's `0.1.0`.

### Added

- Example vault at `vault-example/`, which is also the development vault. Ships in the
  release zip ready to open, with the plugin and theme already installed.
- `install.sh`, shipped inside every release zip. It detects its own payload —
  plugin files, a theme folder, or a full vault — and installs whatever it
  finds into a target vault without touching that vault's `data.json`,
  its content, or its workspace layout.
- Release automation on pushes to `prod`, producing a vault zip, a plugin-only
  zip, a theme-only zip, and `SHA256SUMS`.
- `scripts/check-vault.mjs`, which verifies that every view type used by a
  `.base` file in the example vault is one the plugin actually registers.

### Changed

- The theme no longer bundles the `Bookish` typefaces. Blockquotes fall back to
  a Georgia system stack; Settings → Appearance → Font still overrides it for
  anyone with their own licensed copies.
- `check-no-personal-paths.mjs` now takes directories to scan and runs over the
  example vault as well as the plugin source.

### Removed

- The release-branch mirror workflow, which duplicated plugin and theme sources
  onto branches that were never merged back.

[unreleased]: https://github.com/niklas-ekholm/nui/compare/v0.2.5...HEAD
[0.2.5]: https://github.com/niklas-ekholm/nui/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/niklas-ekholm/nui/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/niklas-ekholm/nui/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/niklas-ekholm/nui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/niklas-ekholm/nui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/niklas-ekholm/nui/releases/tag/v0.2.0
