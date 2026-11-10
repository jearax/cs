#!/bin/sh
# Usage: ci/smoke-site-image.sh IMAGE
#
# The routes are checked against the bytes that ship. The installer itself is exercised by its own
# test suite in scripts/, not here: this script only checks that the image serves it.
set -eu

image="${1:?usage: smoke-site-image.sh IMAGE}"

fail() {
	printf 'smoke-site-image: %s\n' "$1" >&2
	exit 1
}

status_of() {
	curl -sS -o /dev/null -w '%{http_code}' "$1" || true
}

header_of() {
	curl -sS -o /dev/null -D - "$1" | tr -d '\r' | grep -i "^$2:" | head -n 1 | cut -d ' ' -f 2-
}

expect_status() {
	actual="$(status_of "$1")"
	[ "$actual" = "$2" ] || fail "$1 answered $actual, expected $2"
}

expect_header() {
	actual="$(header_of "$1" "$2")"
	case "$actual" in
		*"$3"*) return 0 ;;
	esac

	fail "$1 answered '$2: $actual', expected it to contain '$3'"
}

container="$(docker run -d --rm -p 127.0.0.1::80 "$image")"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT INT TERM

port="$(docker port "$container" 80/tcp | cut -d ':' -f 2)"
base="http://127.0.0.1:${port}"

attempt=0
while [ "$attempt" -lt 60 ]; do
	[ "$(status_of "$base/")" = "200" ] && break
	attempt=$((attempt + 1))
	sleep 0.5
done

expect_status "$base/" "200"
expect_header "$base/" "Content-Type" "text/html"
# The docs paths are answered with the same shell, so a docs page survives a reload.
expect_status "$base/docs" "200"
expect_header "$base/docs" "Content-Type" "text/html"
expect_status "$base/docs/" "200"
expect_status "$base/docs/install" "200"
# Only the home page, the docs, the robots file, the installer and the two release files answer.
expect_status "$base/vi/home" "404"
expect_status "$base/docsomething" "404"
expect_status "$base/install.sh" "200"
expect_header "$base/install.sh" "Content-Type" "text/plain"
expect_header "$base/install.sh" "Cache-Control" "no-cache"
expect_status "$base/releases/latest/cli.mjs" "200"
expect_header "$base/releases/latest/cli.mjs" "Cache-Control" "no-cache"
expect_status "$base/releases/latest/checksums.txt" "200"
expect_header "$base/releases/latest/checksums.txt" "Cache-Control" "no-cache"
expect_status "$base/robots.txt" "200"
expect_status "$base/nope" "404"
expect_status "$base/releases/latest/" "404"

# The home page is a single page application, so it points at hashed assets that must be served.
asset="$(curl -fsSL "$base/" | grep -o 'assets/[^"]*\.js' | head -n 1)"
[ -n "$asset" ] || fail "the home page references no JavaScript asset"
expect_status "$base/$asset" "200"
expect_header "$base/$asset" "Cache-Control" "immutable"
expect_status "$base/assets/there-is-no-such-asset.js" "404"

printf 'smoke-site-image: every route answers as specified\n'
