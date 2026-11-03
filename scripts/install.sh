#!/bin/sh
# Install cs from source: https://github.com/jearax/cs
#   curl -fsSL https://raw.githubusercontent.com/jearax/cs/main/scripts/install.sh | sh
set -eu

REPO="https://github.com/jearax/cs"
INSTALL_DIR="${CS_INSTALL_DIR:-$HOME/.local/bin}"

say() { printf '%s\n' "$*"; }
die() { printf 'cs install: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is required"
command -v node >/dev/null 2>&1 || die "Node.js is required"
command -v pnpm >/dev/null 2>&1 || die "pnpm is required (npm install -g pnpm)"

NODE_MAJOR=$(node -p 'Number(process.versions.node.split(".")[0])')
NODE_MINOR=$(node -p 'Number(process.versions.node.split(".")[1])')
if [ "$NODE_MAJOR" -lt 24 ] || { [ "$NODE_MAJOR" -eq 24 ] && [ "$NODE_MINOR" -lt 11 ]; }; then
	die "Node.js >= 24.11 is required, found $(node --version)"
fi

SRC=$(mktemp -d)
trap 'rm -rf "$SRC"' EXIT INT TERM

say "Cloning cs..."
git clone --depth 1 "$REPO" "$SRC/cs" >/dev/null 2>&1 || die "cloning failed"

cd "$SRC/cs"

say "Installing dependencies (pnpm)..."
pnpm install --frozen-lockfile --silent || die "pnpm install failed"

say "Building..."
pnpm build --silent || die "build failed"

mkdir -p "$INSTALL_DIR"
cp dist/cli.mjs "$INSTALL_DIR/cs"
chmod 755 "$INSTALL_DIR/cs"

case ":$PATH:" in
	*":$INSTALL_DIR:"*) ;;
	*)
		say ""
		say "NOTE: $INSTALL_DIR is not in your PATH. Add it:"
		say "  export PATH=\"$INSTALL_DIR:\$PATH\""
		;;
esac

say ""
say "cs installed: $INSTALL_DIR/cs"
say "Next steps:"
say "  cs config -n work -u <url> -t <token>"
say "  cs use work"
say "  cs --help"
