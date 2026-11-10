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
