# NUI

NUI design system for Obsidian — plugin, theme, starter vault, and build tooling.

Repo: [github.com/niklas-ekholm/nui](https://github.com/niklas-ekholm/nui)

## Quick start (recipients)

Download `nui-starter-vault-<version>.zip` from [Releases](https://github.com/niklas-ekholm/nui/releases), unzip, and open the folder as a vault in Obsidian.

## Development

Day-to-day source lives in the NipaNotes iCloud vault. Build and sync tooling is in `Obsidian/plugin/`. See [Obsidian/README.md](Obsidian/README.md).

```bash
git clone git@github.com:niklas-ekholm/nui.git
cd nui/Obsidian/plugin
npm install
npm run build && npm run sync && npm run release
```
