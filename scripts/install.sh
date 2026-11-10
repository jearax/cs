#!/bin/sh
# Installs the cs CLI for the current user, without sudo:
#   curl -fsSL https://cs.jjuidev.com/install.sh | sh
# Everything lives in functions and runs from the last line, so a truncated download runs nothing.
set -eu

# Keep in step with `engines.node` in package.json: a served script cannot read the manifest.
MIN_NODE_VERSION="24.11.0"

DEFAULT_BASE_URL="https://cs.jjuidev.com/releases/latest"

say() {
	printf 'cs-install: %s\n' "$1"
}

err() {
	printf 'cs-install: error: %s\n' "$1" >&2
	exit 1
}

usage() {
	cat <<EOF
Usage: install.sh [--help]

  (no argument)  install the CLI for the current user

Requires node >= ${MIN_NODE_VERSION}, curl or wget, and sha256sum or shasum.

Environment:
  CS_BASE_URL  where the bundle is downloaded from
               (default ${DEFAULT_BASE_URL})
  CS_HOME      where the CLI is installed (default ${HOME}/.cs)
  CS_BIN_DIR   where the cs command is written (default ${HOME}/.local/bin)
EOF
}

need_cmd() {
	for cmd in "$@"; do
		command -v "$cmd" >/dev/null 2>&1 || err "need '$cmd' (command not found)"
	done
}

# The path lands inside double quotes in the shim, so a shell would still read these characters there.
escape_for_shell() {
	printf '%s' "$1" | sed 's/[\\"$`]/\\&/g'
}

download() {
	if command -v curl >/dev/null 2>&1; then
		curl -fsSL "$1" -o "$2"
	elif command -v wget >/dev/null 2>&1; then
		wget -qO "$2" "$1"
	else
		err "need curl or wget to download the CLI"
	fi
}

sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | cut -d ' ' -f 1
	else
		shasum -a 256 "$1" | cut -d ' ' -f 1
	fi
}

# Compares versions numerically, so "24.9.0" is below "24.11.0".
version_ge() {
	awk -v found="$1" -v wanted="$2" 'BEGIN {
		split(found, a, ".");
		split(wanted, b, ".");
		for (i = 1; i <= 3; i++) {
			if (a[i] + 0 > b[i] + 0) { exit 0; }
			if (a[i] + 0 < b[i] + 0) { exit 1; }
		}
		exit 0;
	}'
}

check_node() {
	found="$(node --version 2>/dev/null || echo unknown)"
	found="${found#v}"

	version_ge "$found" "$MIN_NODE_VERSION" ||
		err "node >= ${MIN_NODE_VERSION} is required (found ${found})"
}

# Digits and dots for the core, and an optional `-suffix` for a prerelease: the value ends up in
# a path, so nothing that could reach outside the install directory is allowed.
is_version() {
	core="$1"
	suffix=""
	has_suffix=0

	case "$core" in
	*-*)
		core="${core%%-*}"
		suffix="${1#*-}"
		has_suffix=1
		;;
	esac

	case "$core" in
	'' | *[!0-9.]* | .* | *. | *..*) return 1 ;;
	esac

	if [ "$has_suffix" -eq 1 ]; then
		case "$suffix" in
		'' | *[!0-9A-Za-z.-]* | .* | *. | *..*) return 1 ;;
		esac
	fi

	[ "$(printf '%s' "$core" | tr -cd '.' | wc -c | tr -d '[:space:]')" = "2" ]
}

path_hint() {
	case ":${PATH:-}:" in
		*":${BIN_DIR}:"*) return 0 ;;
	esac

	say "${BIN_DIR} is not on your PATH. Add it:"

	case "${SHELL:-sh}" in
		*/zsh) say "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.zshrc" ;;
		*/bash) say "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.bashrc" ;;
		*/fish) say "  fish_add_path ${BIN_DIR}" ;;
		*) say "  export PATH=\"${BIN_DIR}:\$PATH\"" ;;
	esac
}

install_cli() {
	need_cmd node mktemp chmod mkdir mv rm rmdir cut grep tr wc awk sed
	command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1 ||
		err "need curl or wget to download the CLI"
	command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 ||
		err "need sha256sum or shasum to verify the download"
	check_node

	tmp="$(mktemp -d)"
	target=""
	shim_tmp=""
	# A failure between the first write and the last leaves nothing usable behind: the temp
	# files go, and the version directory goes only while it is still empty.
	cleanup() {
		rm -rf "$tmp"

		if [ -n "$shim_tmp" ]; then
			rm -f "$shim_tmp"
		fi

		if [ -n "$target" ]; then
			rmdir "$target" 2>/dev/null || true
		fi
	}
	trap cleanup EXIT
	trap 'exit 1' INT TERM

	say "downloading from ${BASE_URL}"
	download "${BASE_URL}/cli.mjs" "${tmp}/cli.mjs" || err "download of cli.mjs failed"
	download "${BASE_URL}/checksums.txt" "${tmp}/checksums.txt" || err "download of checksums.txt failed"

	# The entry is keyed by file name, so a checksum file that lists a path still matches.
	expected="$(awk '{ for (i = 2; i <= NF; i++) { n = split($i, part, "/"); if (part[n] == "cli.mjs" || part[n] == "*cli.mjs") { print $1; exit } } }' "${tmp}/checksums.txt")"
	actual="$(sha256_of "${tmp}/cli.mjs")"

	[ -n "$expected" ] || err "checksums.txt has no entry for cli.mjs"
	[ -n "$actual" ] || err "could not read the checksum of cli.mjs"
	[ "$expected" = "$actual" ] || err "checksum mismatch for cli.mjs (expected ${expected}, got ${actual})"

	version="$(node "${tmp}/cli.mjs" --version)" || err "the downloaded bundle failed to run"
	is_version "$version" || err "the downloaded bundle reports an invalid version '${version}'"

	# Nothing is written before the download is verified, so a failure leaves no install behind.
	target="${INSTALL_HOME}/${version}"
	mkdir -p "$target" "$BIN_DIR"
	mv "${tmp}/cli.mjs" "${target}/.cli.mjs.$$.tmp"
	mv "${target}/.cli.mjs.$$.tmp" "${target}/cli.mjs"

	# The wrapper runs the file, not a symlink to it, so the CLI never has to resolve a link.
	shim_tmp="${BIN_DIR}/.cs.$$.tmp"
	printf '#!/bin/sh\nexec node "%s" "$@"\n' "$(escape_for_shell "${target}/cli.mjs")" >"$shim_tmp"
	chmod 755 "$shim_tmp"
	mv "$shim_tmp" "$SHIM"
	shim_tmp=""

	say "installed cs ${version} to ${target}"
	path_hint
}

main() {
	: "${HOME:?cs-install: HOME is not set}"

	BASE_URL="${CS_BASE_URL:-$DEFAULT_BASE_URL}"
	INSTALL_HOME="${CS_HOME:-${HOME}/.cs}"
	BIN_DIR="${CS_BIN_DIR:-${HOME}/.local/bin}"

	# The shim carries the install path, so a relative one would resolve against whatever
	# directory the user happens to run it from.
	case "$INSTALL_HOME" in
	/*) ;;
	*) INSTALL_HOME="$PWD/$INSTALL_HOME" ;;
	esac

	case "$BIN_DIR" in
	/*) ;;
	*) BIN_DIR="$PWD/$BIN_DIR" ;;
	esac

	# A trailing slash would double up in the shim path and hide the directory from the PATH check.
	INSTALL_HOME="${INSTALL_HOME%/}"
	BIN_DIR="${BIN_DIR%/}"
	[ -n "$INSTALL_HOME" ] || INSTALL_HOME="/"
	[ -n "$BIN_DIR" ] || BIN_DIR="/"

	SHIM="${BIN_DIR}/cs"

	case "${1:-}" in
	-h | --help)
		usage
		;;
	'')
		install_cli
		;;
	*)
		err "unexpected argument '$1' (this installer takes no arguments)"
		;;
	esac
}

main "$@"
