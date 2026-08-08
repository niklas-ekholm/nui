#!/usr/bin/env bash
#
# Assemble the release artifacts into dist/.
#
#   scripts/package-release.sh
#
# Produces, for the version in ./VERSION:
#
#   dist/nui-v<version>.zip         a ready-to-open vault, plugin and theme installed
#   dist/nui-plugin-<version>.zip   main.js, manifest.json, styles.css
#   dist/nui-theme-<version>.zip    theme.css, manifest.json
#   dist/SHA256SUMS
#
# The same install.sh goes into all three, and each gets an INSTALL.md written
# for its own payload. Run the plugin build first: the vault and plugin zips
# both need plugin/main.js.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${ROOT}/dist"
STAGE="${DIST}/.stage"

VERSION="$(tr -d ' \t\n\r' <"${ROOT}/VERSION")"
[[ -n "${VERSION}" ]] || { echo "error: VERSION is empty" >&2; exit 1; }

PLUGIN="${ROOT}/plugin"
THEME="${ROOT}/vault-example/.obsidian/themes/NUI"

[[ -f "${PLUGIN}/main.js" ]] || {
	echo "error: ${PLUGIN}/main.js is missing — run the production build first:" >&2
	echo "       (cd plugin && node esbuild.config.mjs production)" >&2
	exit 1
}

VAULT_ZIP="${DIST}/nui-v${VERSION}.zip"
PLUGIN_ZIP="${DIST}/nui-plugin-${VERSION}.zip"
THEME_ZIP="${DIST}/nui-theme-${VERSION}.zip"

rm -rf "${DIST}"
mkdir -p "${STAGE}"

# ------------------------------------------------------------------ INSTALL.md

# Shared tail: the rules that hold whatever the payload is.
install_md_tail() {
	cat <<'EOF'

## What this will and will not touch

It writes only the files listed above. It never touches:

- **`.obsidian/plugins/nui/data.json`** — your NUI settings. It is backed up
  before anything is written and restored if the install fails.
- Your notes, attachments, or `.base` files.
- `.obsidian/appearance.json`. If the NUI theme is not selected, the installer
  prints the instruction instead of editing the file.
- `.obsidian/workspace.json` — your pane layout.

**Quit Obsidian first.** The installer refuses to run against a vault Obsidian
has open; writing while a sync agent watches the folder produces conflicted
copies. Pass `--force` to override, `--dry-run` to see what would happen.

To update several vaults at once, list their paths one per line in
`~/.config/nui/vaults` and run `./install.sh --all`.

## Requirements

Obsidian 1.10 or later for the plugin; the theme works from 1.5.0.

## Verifying this download

```bash
shasum -a 256 -c SHA256SUMS --ignore-missing
```
EOF
}

write_plugin_install_md() {
	cat >"$1" <<EOF
# NUI plugin ${VERSION}

This zip contains the NUI plugin only:

\`\`\`
nui/main.js
nui/manifest.json
nui/styles.css
\`\`\`

## Install

\`\`\`bash
./install.sh /path/to/vault
\`\`\`

Then enable **NUI** under Settings → Community plugins.

## Install by hand

Copy the \`nui\` folder into \`<vault>/.obsidian/plugins/\`, so that
\`<vault>/.obsidian/plugins/nui/main.js\` exists. If a \`data.json\` is already
there, leave it — those are your settings. \`.obsidian\` is hidden in Finder;
press \`Cmd-Shift-.\` to show it.
EOF
	install_md_tail >>"$1"
}

write_theme_install_md() {
	cat >"$1" <<EOF
# NUI theme ${VERSION}

This zip contains the NUI theme only:

\`\`\`
NUI/theme.css
NUI/manifest.json
\`\`\`

The theme bundles no typefaces. Blockquotes fall back to a Georgia system
stack; Settings → Appearance → Font overrides it.

## Install

\`\`\`bash
./install.sh /path/to/vault
\`\`\`

Then select **NUI** under Settings → Appearance → Themes.

## Install by hand

Copy the \`NUI\` folder into \`<vault>/.obsidian/themes/\`, so that
\`<vault>/.obsidian/themes/NUI/theme.css\` exists. The folder name must stay
\`NUI\` — it has to match the \`name\` in \`manifest.json\`.

Section 10 of the theme styles the NUI plugin's views. Without the plugin it is
simply inert; nothing else depends on it.
EOF
	install_md_tail >>"$1"
}

write_vault_install_md() {
	cat >"$1" <<EOF
# NUI ${VERSION} — example vault

This zip is a complete Obsidian vault with the plugin and theme already
installed and around forty notes of demo content.

## Open it

In Obsidian, choose **Open folder as vault** and pick this folder. Obsidian will
ask you to trust it, because it contains a plugin. Start at **Start here.md**.

Nothing here touches any vault you already have.

> This vault is deliberately opinionated. Folder-index navigation is on, which
> changes what clicking a folder does. Installed into a vault of your own, NUI
> starts with all of that off.

## Or use it to update a vault you already have

The plugin and theme inside this zip can be installed into another vault:

\`\`\`bash
./install.sh /path/to/other/vault
\`\`\`

It reads the payload out of this vault's \`.obsidian/\` and writes:

\`\`\`
.obsidian/plugins/nui/main.js
.obsidian/plugins/nui/manifest.json
.obsidian/plugins/nui/styles.css
.obsidian/themes/NUI/theme.css
.obsidian/themes/NUI/manifest.json
\`\`\`

This vault's own \`data.json\` is **not** copied across — the target vault keeps
its own settings.
EOF
	install_md_tail >>"$1"
}

# ---------------------------------------------------------------- plugin zip

echo "Packaging plugin ${VERSION}..."
PLUGIN_STAGE="${STAGE}/plugin"
mkdir -p "${PLUGIN_STAGE}/nui"
cp "${PLUGIN}/main.js" "${PLUGIN}/manifest.json" "${PLUGIN}/styles.css" \
	"${PLUGIN_STAGE}/nui/"
cp "${ROOT}/scripts/install.sh" "${PLUGIN_STAGE}/install.sh"
chmod +x "${PLUGIN_STAGE}/install.sh"
write_plugin_install_md "${PLUGIN_STAGE}/INSTALL.md"
(cd "${PLUGIN_STAGE}" && zip -qr "${PLUGIN_ZIP}" .)

# ----------------------------------------------------------------- theme zip

echo "Packaging theme ${VERSION}..."
THEME_STAGE="${STAGE}/theme"
mkdir -p "${THEME_STAGE}/NUI"
cp "${THEME}/theme.css" "${THEME}/manifest.json" "${THEME_STAGE}/NUI/"
cp "${ROOT}/scripts/install.sh" "${THEME_STAGE}/install.sh"
chmod +x "${THEME_STAGE}/install.sh"
write_theme_install_md "${THEME_STAGE}/INSTALL.md"
(cd "${THEME_STAGE}" && zip -qr "${THEME_ZIP}" .)

# ----------------------------------------------------------------- vault zip

echo "Packaging vault ${VERSION}..."
VAULT_STAGE="${STAGE}/vault/nui-vault-${VERSION}"
mkdir -p "${VAULT_STAGE}"

# Copy the vault, minus anything local. workspace files carry someone else's
# pane layout; git ignores them and so does the release.
(
	cd "${ROOT}/vault-example"
	find . \
		-name ".DS_Store" -prune -o \
		-name "workspace.json" -prune -o \
		-name "workspace-mobile.json" -prune -o \
		-name "graph.json" -prune -o \
		-type f -print
) | while IFS= read -r file; do
	mkdir -p "${VAULT_STAGE}/$(dirname "${file}")"
	cp "${ROOT}/vault-example/${file}" "${VAULT_STAGE}/${file}"
done

# The vault ships with the plugin already built into it.
mkdir -p "${VAULT_STAGE}/.obsidian/plugins/nui"
cp "${PLUGIN}/main.js" "${PLUGIN}/manifest.json" "${PLUGIN}/styles.css" \
	"${VAULT_STAGE}/.obsidian/plugins/nui/"

cp "${ROOT}/scripts/install.sh" "${VAULT_STAGE}/install.sh"
chmod +x "${VAULT_STAGE}/install.sh"
write_vault_install_md "${VAULT_STAGE}/INSTALL.md"
cp "${ROOT}/LICENSE" "${VAULT_STAGE}/LICENSE"
(cd "${STAGE}/vault" && zip -qr "${VAULT_ZIP}" .)

# ------------------------------------------------------------------ mini zips

# MiniNUI is NUI without the Bases views: same appearance layer, same commands
# and hotkeys, same editor and navigation behaviour. It is generated here from
# plugin/main.mini.js — build it with:
#
#   (cd plugin && node esbuild.config.mjs production mini)
#
# and never edited by hand. Its plugin id is `mininui` and its theme folder is
# `MiniNUI`, so a vault can hold both editions without a collision. The mini
# plugin and theme go into separate zips for the same reason the NUI ones do.
MINI_PLUGIN_ZIP="${DIST}/mininui-plugin-${VERSION}.zip"
MINI_THEME_ZIP="${DIST}/mininui-theme-${VERSION}.zip"

# Rewrites a manifest's identity without needing node. Everything else in it —
# version, minAppVersion, author — is carried across untouched.
rename_manifest() {
	sed -e 's/"id"[[:space:]]*:[[:space:]]*"nui"/"id": "mininui"/' \
		-e 's/"name"[[:space:]]*:[[:space:]]*"NUI"/"name": "MiniNUI"/' \
		-e 's/"description"[[:space:]]*:[[:space:]]*"[^"]*"/"description": "NUI without the Bases views: the appearance layer, commands, hotkeys, editor tools, and folder-index navigation."/' \
		"$1" >"$2"
}

write_mini_plugin_install_md() {
	cat >"$1" <<EOF
# MiniNUI plugin ${VERSION}

MiniNUI is NUI with the fourteen Bases views left out. Everything else is the
same build from the same source: the commands and their hotkeys, the editor
tools, folder-index navigation, and the appearance settings.

\`\`\`
mininui/main.js
mininui/manifest.json
mininui/styles.css
\`\`\`

It installs as its own plugin (\`mininui\`), so it neither replaces nor conflicts
with a NUI install — but enable only one of the two, or every command appears
twice.

## Install

\`\`\`bash
./install.sh /path/to/vault
\`\`\`

Then enable **MiniNUI** under Settings → Community plugins.

## Install by hand

Copy the \`mininui\` folder into \`<vault>/.obsidian/plugins/\`, so that
\`<vault>/.obsidian/plugins/mininui/main.js\` exists. \`.obsidian\` is hidden in
Finder; press \`Cmd-Shift-.\` to show it.
EOF
	install_md_tail >>"$1"
}

write_mini_theme_install_md() {
	cat >"$1" <<EOF
# MiniNUI theme ${VERSION}

The NUI theme under the name \`MiniNUI\`, so it can sit beside a NUI install:

\`\`\`
MiniNUI/theme.css
MiniNUI/manifest.json
\`\`\`

The theme bundles no typefaces. Blockquotes fall back to a Georgia system
stack; Settings → Appearance → Font overrides it.

## Install

\`\`\`bash
./install.sh /path/to/vault
\`\`\`

Then select **MiniNUI** under Settings → Appearance → Themes.

## Install by hand

Copy the \`MiniNUI\` folder into \`<vault>/.obsidian/themes/\`. The folder name
must stay \`MiniNUI\` — it has to match the \`name\` in \`manifest.json\`.
EOF
	install_md_tail >>"$1"
}

if [[ -f "${PLUGIN}/main.mini.js" ]]; then
	echo "Packaging MiniNUI plugin ${VERSION}..."
	MINI_PLUGIN_STAGE="${STAGE}/mini-plugin"
	mkdir -p "${MINI_PLUGIN_STAGE}/mininui"
	cp "${PLUGIN}/main.mini.js" "${MINI_PLUGIN_STAGE}/mininui/main.js"
	cp "${PLUGIN}/styles.css" "${MINI_PLUGIN_STAGE}/mininui/styles.css"
	rename_manifest "${PLUGIN}/manifest.json" "${MINI_PLUGIN_STAGE}/mininui/manifest.json"
	grep -q '"id": "mininui"' "${MINI_PLUGIN_STAGE}/mininui/manifest.json" \
		|| { echo "error: mini manifest kept the nui id" >&2; exit 1; }
	cp "${ROOT}/scripts/install.sh" "${MINI_PLUGIN_STAGE}/install.sh"
	chmod +x "${MINI_PLUGIN_STAGE}/install.sh"
	write_mini_plugin_install_md "${MINI_PLUGIN_STAGE}/INSTALL.md"
	(cd "${MINI_PLUGIN_STAGE}" && zip -qr "${MINI_PLUGIN_ZIP}" .)

	echo "Packaging MiniNUI theme ${VERSION}..."
	MINI_THEME_STAGE="${STAGE}/mini-theme"
	mkdir -p "${MINI_THEME_STAGE}/MiniNUI"
	cp "${THEME}/theme.css" "${MINI_THEME_STAGE}/MiniNUI/theme.css"
	rename_manifest "${THEME}/manifest.json" "${MINI_THEME_STAGE}/MiniNUI/manifest.json"
	cp "${ROOT}/scripts/install.sh" "${MINI_THEME_STAGE}/install.sh"
	chmod +x "${MINI_THEME_STAGE}/install.sh"
	write_mini_theme_install_md "${MINI_THEME_STAGE}/INSTALL.md"
	(cd "${MINI_THEME_STAGE}" && zip -qr "${MINI_THEME_ZIP}" .)
else
	echo "warning: ${PLUGIN}/main.mini.js is missing — skipping the MiniNUI zips." >&2
	echo "         (cd plugin && node esbuild.config.mjs production mini)" >&2
fi

# ----------------------------------------------------------------- checksums

rm -rf "${STAGE}"

echo "Writing checksums..."
(
	cd "${DIST}"
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum ./*.zip >SHA256SUMS
	else
		shasum -a 256 ./*.zip >SHA256SUMS
	fi
)

echo ""
echo "dist/:"
(cd "${DIST}" && ls -1sh ./*.zip SHA256SUMS | sed 's/^/  /')
