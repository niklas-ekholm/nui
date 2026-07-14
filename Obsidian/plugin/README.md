# NUI Plugin

NUI layouts and behaviour for Obsidian — custom Bases views, habits, navigation, and editor commands.

## Install

### From release zip

1. Download `nui-plugin-<version>.zip`
2. Unzip → copy the `nui` folder to your vault's `.obsidian/plugins/nui/`
3. Settings → Community plugins → enable **NUI Plugin**
4. Reload Obsidian

### From this repo

Copy `manifest.json`, `main.js`, and `styles.css` to `.obsidian/plugins/nui/` in your vault.

## Features

### Bases views

- **Timeline** — time axis for dated notes
- **Year Tracker** — year-at-a-glance tracking
- **Week Tracker: 3** — three-week habit grid
- **Picture Gallery**, **Card: S**, **Card: L**, **List: Files**, **List: Folders**

### Editor commands

| Shortcut (macOS) | Command |
|------------------|---------|
| ⌥⌘↑ | Add cursor on line above |
| ⌥⌘↓ | Add cursor on line below |
| ⌘D | Add next match to selections |
| ⌥⇧↑ | Copy line up |
| ⌥⇧↓ | Copy line down |

## Development

Source of truth: NipaNotes iCloud vault (`.obsidian/plugins/nui/`).

```bash
npm install
npm run dev      # watch build → NipaNotes
npm run build    # production build
npm run sync     # copy to repo for sharing
npm run release  # create dist zips
```

Build tooling reads/writes the NipaNotes plugin path via `esbuild.config.mjs`.

## Starter vault

For a turnkey demo with bases and sample notes, use the [starter vault](../starter-vault/README.md).
