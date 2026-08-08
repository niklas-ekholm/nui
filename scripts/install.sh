#!/usr/bin/env bash
#
# Install NUI into an Obsidian vault.
#
#   ./install.sh /path/to/vault      install into one vault
#   ./install.sh --all               install into every vault listed in
#                                    ~/.config/nui/vaults, one path per line
#
# This script installs whatever payload sits beside it, so the same command
# works whichever release zip it came out of: the plugin zip, the theme zip, or
# the full vault zip. It writes only the files it ships.
#
# It never touches:
#   - data.json in the target vault. That is the vault's own NUI settings. It is
#     backed up before anything is written and restored if the install fails.
#   - notes, attachments, or .base files
#   - appearance.json. If the theme is not selected, the instruction is printed.
#   - workspace.json
#
# Options:
#   --force   install even when Obsidian appears to have the vault open
#   --dry-run print what would be written, write nothing
#   --help
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FORCE=0
DRY_RUN=0
ALL=0
TARGETS=()

PLUGIN_FILES=(main.js manifest.json styles.css)
THEME_FILES=(theme.css manifest.json)

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }

usage() {
	sed -n '3,26p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

# ------------------------------------------------------------------ arguments

while [[ $# -gt 0 ]]; do
	case "$1" in
		--all) ALL=1; shift ;;
		--force) FORCE=1; shift ;;
		--dry-run) DRY_RUN=1; shift ;;
		-h|--help) usage; exit 0 ;;
		-*) die "unknown option: $1" ;;
		*) TARGETS+=("$1"); shift ;;
	esac
done

# ------------------------------------------------------------------- payload

# The three shapes a payload can arrive in. The full-vault zip carries its
# files under .obsidian/, which is what lets that zip both open as a new vault
# and serve as an updater for an existing one.
#
# A MiniNUI payload is the same shapes under different names — plugin id
# `mininui`, theme folder `MiniNUI` — so that both can sit in one vault. The
# folder names found here are the ones written into the vault; nothing else in
# this script knows which edition it is installing.
PLUGIN_SRC=""
THEME_SRC=""
PLUGIN_DIR_NAME="nui"
THEME_DIR_NAME="NUI"
EDITION="NUI"

for name in nui mininui; do
	if [[ -f "${SCRIPT_DIR}/${name}/main.js" ]]; then
		PLUGIN_SRC="${SCRIPT_DIR}/${name}"
	elif [[ -f "${SCRIPT_DIR}/.obsidian/plugins/${name}/main.js" ]]; then
		PLUGIN_SRC="${SCRIPT_DIR}/.obsidian/plugins/${name}"
	else
		continue
	fi
	PLUGIN_DIR_NAME="${name}"
	break
done

if [[ -z "${PLUGIN_SRC}" && -f "${SCRIPT_DIR}/main.js" && -f "${SCRIPT_DIR}/manifest.json" ]]; then
	PLUGIN_SRC="${SCRIPT_DIR}"
	# A bare payload names itself in its manifest.
	if grep -q '"id"[[:space:]]*:[[:space:]]*"mininui"' "${SCRIPT_DIR}/manifest.json"; then
		PLUGIN_DIR_NAME="mininui"
	fi
fi

for name in NUI MiniNUI; do
	if [[ -f "${SCRIPT_DIR}/${name}/theme.css" ]]; then
		THEME_SRC="${SCRIPT_DIR}/${name}"
	elif [[ -f "${SCRIPT_DIR}/.obsidian/themes/${name}/theme.css" ]]; then
		THEME_SRC="${SCRIPT_DIR}/.obsidian/themes/${name}"
	else
		continue
	fi
	THEME_DIR_NAME="${name}"
	break
done

if [[ -z "${THEME_SRC}" && -f "${SCRIPT_DIR}/theme.css" ]]; then
	THEME_SRC="${SCRIPT_DIR}"
	if grep -q '"name"[[:space:]]*:[[:space:]]*"MiniNUI"' "${SCRIPT_DIR}/manifest.json" 2>/dev/null; then
		THEME_DIR_NAME="MiniNUI"
	fi
fi

if [[ "${PLUGIN_DIR_NAME}" == "mininui" || "${THEME_DIR_NAME}" == "MiniNUI" ]]; then
	EDITION="MiniNUI"
fi

if [[ -z "${PLUGIN_SRC}" && -z "${THEME_SRC}" ]]; then
	die "found no NUI or MiniNUI payload beside this script. Run it from an unzipped release."
fi

read_version() {
	# Reads "version" out of a manifest without needing node or python.
	local manifest="$1"
	[[ -f "${manifest}" ]] || { printf 'absent'; return; }
	local version
	version="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${manifest}" | head -1)"
	printf '%s' "${version:-unknown}"
}

PLUGIN_VERSION="none"
THEME_VERSION="none"
[[ -n "${PLUGIN_SRC}" ]] && PLUGIN_VERSION="$(read_version "${PLUGIN_SRC}/manifest.json")"
[[ -n "${THEME_SRC}" ]] && THEME_VERSION="$(read_version "${THEME_SRC}/manifest.json")"

# --------------------------------------------------------------- vault checks

obsidian_config() {
	if [[ -f "${HOME}/Library/Application Support/obsidian/obsidian.json" ]]; then
		printf '%s' "${HOME}/Library/Application Support/obsidian/obsidian.json"
	elif [[ -f "${HOME}/.config/obsidian/obsidian.json" ]]; then
		printf '%s' "${HOME}/.config/obsidian/obsidian.json"
	fi
}

obsidian_running() {
	pgrep -x Obsidian >/dev/null 2>&1 || pgrep -x obsidian >/dev/null 2>&1
}

# True when Obsidian is running and its config lists this vault as open. Both
# have to hold: a registered vault is not necessarily an open one.
#
# The config is one line of JSON. Splitting it into innermost { ... } records
# gives one record per vault, so the path and the open flag can be required to
# sit in the same record. Vault paths routinely contain spaces — "Mobile
# Documents" on any iCloud vault — so nothing here may strip whitespace.
vault_is_open() {
	local vault="$1" config record
	obsidian_running || return 1
	config="$(obsidian_config)"
	[[ -n "${config}" ]] || return 1

	while IFS= read -r record; do
		case "${record}" in
			*"\"path\":\"${vault}\""*|*"\"path\": \"${vault}\""*) ;;
			*) continue ;;
		esac
		case "${record}" in
			*'"open":true'*|*'"open": true'*) return 0 ;;
		esac
	done < <(grep -o '{[^{}]*}' "${config}" 2>/dev/null)

	return 1
}

# ------------------------------------------------------------------- install

install_one() {
	local vault="$1"
	vault="${vault%/}"

	[[ -d "${vault}" ]] || die "not a directory: ${vault}"
	[[ -d "${vault}/.obsidian" ]] || die "not an Obsidian vault (no .obsidian): ${vault}"

	info ""
	info "Vault: ${vault}"

	if vault_is_open "${vault}"; then
		if (( FORCE )); then
			warn "Obsidian has this vault open. Continuing because --force was given."
		else
			die "Obsidian has this vault open. Quit Obsidian first, or pass --force.
       Writing under a live sync agent produces conflicted copies of main.js."
		fi
	elif obsidian_running; then
		warn "Obsidian is running. If this vault is open in it, quit first."
	fi

	local plugin_dir="${vault}/.obsidian/plugins/${PLUGIN_DIR_NAME}"
	local theme_dir="${vault}/.obsidian/themes/${THEME_DIR_NAME}"
	local data_json="${plugin_dir}/data.json"
	local backup=""

	# data.json is the one file an updater can destroy irrecoverably. Copy it
	# aside before touching anything, and put it back if any write fails.
	if [[ -f "${data_json}" ]]; then
		backup="$(mktemp -t nui-data.json)"
		cp "${data_json}" "${backup}"
	fi

	restore_and_die() {
		if [[ -n "${backup}" && -f "${backup}" ]]; then
			cp "${backup}" "${data_json}" 2>/dev/null || true
			rm -f "${backup}"
			warn "install failed; restored the previous data.json"
		fi
		die "failed while writing to ${vault}"
	}

	if [[ -n "${PLUGIN_SRC}" ]]; then
		local before
		before="$(read_version "${plugin_dir}/manifest.json")"
		info "  plugin  ${before} -> ${PLUGIN_VERSION}"
		if (( ! DRY_RUN )); then
			mkdir -p "${plugin_dir}" || restore_and_die
			for file in "${PLUGIN_FILES[@]}"; do
				[[ -f "${PLUGIN_SRC}/${file}" ]] || continue
				cp "${PLUGIN_SRC}/${file}" "${plugin_dir}/${file}" || restore_and_die
			done
		fi
	fi

	if [[ -n "${THEME_SRC}" ]]; then
		local before
		before="$(read_version "${theme_dir}/manifest.json")"
		info "  theme   ${before} -> ${THEME_VERSION}"
		if (( ! DRY_RUN )); then
			mkdir -p "${theme_dir}" || restore_and_die
			for file in "${THEME_FILES[@]}"; do
				[[ -f "${THEME_SRC}/${file}" ]] || continue
				cp "${THEME_SRC}/${file}" "${theme_dir}/${file}" || restore_and_die
			done
		fi
	fi

	# The backup exists only to be restored on failure. Getting here means the
	# writes succeeded and the original file was never touched.
	[[ -n "${backup}" ]] && rm -f "${backup}"

	if [[ -f "${data_json}" ]]; then
		info "  settings kept (data.json untouched)"
	fi

	if [[ -n "${THEME_SRC}" ]]; then
		local appearance="${vault}/.obsidian/appearance.json"
		if ! grep -q "\"cssTheme\"[[:space:]]*:[[:space:]]*\"${THEME_DIR_NAME}\"" "${appearance}" 2>/dev/null; then
			info "  next: Settings -> Appearance -> Themes -> ${THEME_DIR_NAME}"
		fi
	fi

	if [[ -n "${PLUGIN_SRC}" ]]; then
		local community="${vault}/.obsidian/community-plugins.json"
		if ! grep -q "\"${PLUGIN_DIR_NAME}\"" "${community}" 2>/dev/null; then
			info "  next: Settings -> Community plugins -> enable ${EDITION}"
		fi
	fi
}

# --------------------------------------------------------------------- run

REGISTRY="${HOME}/.config/nui/vaults"

if (( ALL )); then
	[[ ${#TARGETS[@]} -eq 0 ]] || die "--all takes no vault paths"
	[[ -f "${REGISTRY}" ]] || die "no vault registry at ${REGISTRY}
       Create it with one vault path per line."
	while IFS= read -r line || [[ -n "${line}" ]]; do
		line="${line%%#*}"
		line="$(printf '%s' "${line}" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
		[[ -z "${line}" ]] && continue
		TARGETS+=("${line/#\~/${HOME}}")
	done <"${REGISTRY}"
	[[ ${#TARGETS[@]} -gt 0 ]] || die "${REGISTRY} lists no vaults"
elif [[ ${#TARGETS[@]} -eq 0 ]]; then
	usage
	exit 1
fi

info "${EDITION} installer"
[[ -n "${PLUGIN_SRC}" ]] && info "  payload: plugin ${PLUGIN_VERSION}"
[[ -n "${THEME_SRC}" ]] && info "  payload: theme ${THEME_VERSION}"
(( DRY_RUN )) && info "  dry run — nothing will be written"

for target in "${TARGETS[@]}"; do
	install_one "${target}"
done

info ""
if (( DRY_RUN )); then
	info "Dry run complete. ${#TARGETS[@]} vault(s) would be updated."
else
	info "Done. ${#TARGETS[@]} vault(s) updated."
fi
