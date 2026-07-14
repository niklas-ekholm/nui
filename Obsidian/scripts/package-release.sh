#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OBSIDIAN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${OBSIDIAN_DIR}/dist"
VERSION="$(python3 - <<'PY' "${OBSIDIAN_DIR}/plugin/manifest.json"
import json
import sys
with open(sys.argv[1], encoding="utf-8") as handle:
    print(json.load(handle)["version"])
PY
)"

STARTER_DIR="${DIST_DIR}/nui-starter-vault"
PLUGIN_ZIP="${DIST_DIR}/nui-plugin-${VERSION}.zip"
THEME_ZIP="${DIST_DIR}/nui-theme-${VERSION}.zip"
STARTER_ZIP="${DIST_DIR}/nui-starter-vault-${VERSION}.zip"

mkdir -p "${DIST_DIR}"

"${SCRIPT_DIR}/build-starter-vault.sh" "${STARTER_DIR}"

echo "Creating plugin zip..."
PLUGIN_STAGE="${DIST_DIR}/.stage-plugin"
rm -rf "${PLUGIN_STAGE}"
mkdir -p "${PLUGIN_STAGE}/nui"
rsync -a \
	"${OBSIDIAN_DIR}/plugin/manifest.json" \
	"${OBSIDIAN_DIR}/plugin/main.js" \
	"${OBSIDIAN_DIR}/plugin/styles.css" \
	"${PLUGIN_STAGE}/nui/"
(
	cd "${PLUGIN_STAGE}"
	zip -qr "${PLUGIN_ZIP}" nui
)
rm -rf "${PLUGIN_STAGE}"

echo "Creating theme zip..."
THEME_STAGE="${DIST_DIR}/.stage-theme"
rm -rf "${THEME_STAGE}"
mkdir -p "${THEME_STAGE}/NUI"
rsync -a \
	"${OBSIDIAN_DIR}/theme/manifest.json" \
	"${OBSIDIAN_DIR}/theme/theme.css" \
	"${THEME_STAGE}/NUI/"
if [[ -d "${OBSIDIAN_DIR}/theme/fonts" ]]; then
	rsync -a "${OBSIDIAN_DIR}/theme/fonts/" "${THEME_STAGE}/NUI/fonts/"
fi
(
	cd "${THEME_STAGE}"
	zip -qr "${THEME_ZIP}" NUI
)
rm -rf "${THEME_STAGE}"

echo "Creating starter vault zip..."
(
	cd "${DIST_DIR}"
	zip -qr "${STARTER_ZIP}" nui-starter-vault
)

echo "Release artifacts:"
echo "  ${PLUGIN_ZIP}"
echo "  ${THEME_ZIP}"
echo "  ${STARTER_ZIP}"
