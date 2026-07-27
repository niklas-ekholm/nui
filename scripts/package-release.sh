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
THEME="${ROOT}/vault/.obsidian/themes/NUI"

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
	cd "${ROOT}/vault"
	find . \
		-name ".DS_Store" -prune -o \
		-name "workspace.json" -prune -o \
		-name "workspace-mobile.json" -prune -o \
		-name "graph.json" -prune -o \
		-type f -print
) | while IFS= read -r file; do
	mkdir -p "${VAULT_STAGE}/$(dirname "${file}")"
	cp "${ROOT}/vault/${file}" "${VAULT_STAGE}/${file}"
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
