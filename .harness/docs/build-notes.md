# Build and install notes

- The Node floor is declared three times: `scripts/install.sh` (MIN_NODE_VERSION), package.json
  `engines.node` and `site/src/constants/cli.constant.ts` (NODE_FLOOR). `tests/install.test.ts`
  holds only the script+manifest pair.
- The installer parses `cs --version` output, so it needs the version alone when piped — the
  banner is TTY-only (`isInteractive`).
- The root tsconfig excludes `site/` — the site project has its own; without it `pnpm typecheck`
  reads site TSX and fails.
- Shellcheck is not installed locally and Docker may be down: fetch the koalaman release tarball
  to /tmp and run the binary with `--shell=sh`.
- The installer's checksum entry is a contract with `scripts/stage-release.mjs` (the site cooker's
  file). Both sides were checked against a real staged release.
- The site mirrors the installer: `site/src/constants/cli.constant.ts` REQUIREMENTS and the Install page (paths, envs, uninstall) restate `scripts/install.sh` facts. When the installer changes, update the site copy in the same change.
- The vendored `@jjuidev/react` exports `Button` only as a `<button>` (no href prop), and its variants module is not in the package exports. A link that needs a button's look carries the recipe's token utilities itself — no restyled one-off components.
- The site `Terminal` reveals one timeline per tab: every `history` command types first, then all `lines` reveal sequentially. A history entry carries no output of its own, so a command→output→command demo needs a component change, not just new tab data.
- The site test suite runs Chromium with `reducedMotion: 'reduce'`, so nothing ever animates there: a test for animation-gated behaviour (Terminal's tab advance) must dispatch the reveal's `animationend` on the end element itself, with `bubbles: true` for React's delegation.
- Demo command strings drift: the hero got the Usage-form ruling (`cs config [options]`) while the docs page and the commands constant kept their own copies of the long form, each hard-coded. When a display ruling changes, grep the old string across `site/src` — the same command lives in `commands.constant.ts`, page literals and test fixtures. The hero's config-tab rulings flipped three times in one plan; when a ruling is ambiguous on return, ask with rendered previews instead of picking — the user decides in seconds.
