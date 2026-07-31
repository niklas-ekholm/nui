# Changelog

All notable changes to NUI — the plugin, the theme, and the example vault, which
share one version number.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
NUI uses [semantic versioning](https://semver.org/spec/v2.0.0.html). While the
version stays below 1.0.0, expect breaking changes in minor releases.

## [Unreleased]

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

[unreleased]: https://github.com/niklas-ekholm/nui/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/niklas-ekholm/nui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/niklas-ekholm/nui/releases/tag/v0.2.0
