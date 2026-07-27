# Installing NUI

NUI ships as three zips. This file describes all of them; the copy inside each
release zip describes only that zip's payload.

| Zip | Contains |
| --- | --- |
| `nui-v<version>.zip` | A complete vault, plugin and theme already installed, with demo content |
| `nui-plugin-<version>.zip` | `nui/main.js`, `nui/manifest.json`, `nui/styles.css` |
| `nui-theme-<version>.zip` | `NUI/theme.css`, `NUI/manifest.json` |

Verify a download against `SHA256SUMS` from the same release:

```bash
shasum -a 256 -c SHA256SUMS --ignore-missing
```

## Trying NUI without touching an existing vault

Unzip `nui-v<version>.zip`, then in Obsidian choose **Open folder as vault** and
pick the unzipped folder. The plugin and theme are already in place and the
vault has around forty notes of demo content, so every view has something to
show. Obsidian will ask you to trust the vault, because it contains a plugin.

This is the recommended way to see what NUI does. Nothing here touches any vault
you already have.

## Installing into a vault you already have

Every zip contains the same `install.sh`, which installs whatever payload sits
beside it:

```bash
./install.sh /path/to/vault
```

Run it from the unzipped folder. It reports the versions it found and the
versions it wrote. To update several vaults at once, list their paths one per
line in `~/.config/nui/vaults` and run:

```bash
./install.sh --all
```

**Quit Obsidian first.** The installer refuses to run against a vault Obsidian
has open. On iCloud Drive or Obsidian Sync, writing while a sync agent is
watching the folder produces conflicted copies of `main.js`.

### What the installer will and will not touch

It writes only these files:

```
.obsidian/plugins/nui/main.js
.obsidian/plugins/nui/manifest.json
.obsidian/plugins/nui/styles.css
.obsidian/themes/NUI/theme.css
.obsidian/themes/NUI/manifest.json
```

It never touches:

- **`.obsidian/plugins/nui/data.json`** — your NUI settings. The installer backs
  it up before writing anything and restores it if the install fails.
- Your notes, attachments, or `.base` files.
- `.obsidian/appearance.json`. If the NUI theme is not selected yet, the
  installer prints the instruction rather than editing the file.
- `.obsidian/workspace.json` — your pane layout.

Settings survive upgrades by design: NUI merges saved settings key by key
against its defaults, so a vault can sit untouched for a year and still open
cleanly on a much later version.

## Installing by hand

If you would rather not run a script, copy the files yourself. `.obsidian` is
hidden in Finder — press `Cmd-Shift-.` to show it, or use the terminal.

**Plugin.** Copy the `nui` folder from the zip to `<vault>/.obsidian/plugins/`,
so that `<vault>/.obsidian/plugins/nui/main.js` exists. If a `data.json` is
already there, leave it. Then enable **NUI** under Settings → Community plugins.
You may need to restart Obsidian or use Settings → Community plugins → the
reload icon before it appears.

**Theme.** Copy the `NUI` folder from the zip to `<vault>/.obsidian/themes/`,
so that `<vault>/.obsidian/themes/NUI/theme.css` exists. The folder name must
stay `NUI` — it has to match the `name` in `manifest.json`. Then select **NUI**
under Settings → Appearance → Themes.

## Requirements

Obsidian 1.10 or later for the plugin, which is where the Bases view API became
public. The theme works from 1.5.0.

The plugin declares `isDesktopOnly: false` and runs on iOS and Android. The
installer is a shell script and is desktop-only; on mobile, sync the vault from
a desktop instead.

## Uninstalling

Disable the plugin under Settings → Community plugins and switch the theme back
under Settings → Appearance, then delete `.obsidian/plugins/nui/` and
`.obsidian/themes/NUI/`. Your notes are plain Markdown and are unaffected —
except that `.base` files still referencing NUI view types will show an
unknown-view message until you point those views at something else.
