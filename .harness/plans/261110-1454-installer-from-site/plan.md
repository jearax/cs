---
title: "Installer downloads the release bundle from the site"
description: "Port jss-devtools' installer back to cs: scripts/install.sh downloads cli.mjs + checksums.txt from cs.jjuidev.com/releases/latest, verifies sha256, installs to ~/.cs/<version>/ with a shim — replacing the clone+build installer. Plus README install section."
status: pending
priority: P1
effort: 3-4h
issue: none
branch: main
decision: none
created: 2026-11-10
---

# Plan: installer from the site (xia --port from jss-devtools)

## Source manifest (xia phase 1)

| Item | Value |
| ---- | ----- |
| Source repo | `/Users/tandm/Documents/jearax/npm/jss-devtools` @ `8d68349` (main) — MIT, same owner |
| Scoped source files | `scripts/install.sh` (the whole pattern), `tests/install.test.ts` (test shape) |
| Target | `scripts/install.sh` (rewrite), `tests/install.test.ts` (new), `README.md` (install section) |

## Why

cs's installer today clones the repo and builds with pnpm — slow and needs git+pnpm. jss-devtools
serves a checksummed release bundle from its site (`/releases/latest/cli.mjs` +
`/releases/latest/checksums.txt`, produced by `scripts/stage-release.mjs`) and the installer
downloads, verifies and installs it with no toolchain beyond node+curl/wget+sha256. The landing
site (parallel plan `261110-1447-cs-landing-site`, cooker) builds the image that serves those
files. This plan ports the installer side.

## Ownership boundary (parallel work — do not cross)

- **You own:** `scripts/install.sh`, `tests/install.test.ts`, `README.md` (install section only).
- **The other cooker owns:** `site/`, `docker/`, `ci/`, `.github/workflows/ci.yml`,
  `scripts/stage-release.mjs`, root `package.json`, ignore files. Do not edit those.

## Changes

| File | Action |
| ---- | ------ |
| `scripts/install.sh` | REWRITE on the jss-devtools pattern: everything in functions, runs from the last line (truncated download runs nothing). `MIN_NODE_VERSION="24.11.0"` (keep in step with `engines.node`). Default `CS_BASE_URL="https://cs.jjuidev.com/releases/latest"`, `CS_HOME` default `~/.cs`, `CS_BIN_DIR` default `~/.local/bin`, shim name `cs`. Download `cli.mjs` + `checksums.txt`, verify sha256 (sha256sum or shasum), run `node cli.mjs --version` as a smoke check, validate the version string (digits/dots, three parts), install to `~/.cs/<version>/cli.mjs` via tmp+mv, write the wrapper shim, PATH hint per shell. `-h/--help` usage; any other argument is an error. Prefix messages `cs-install:`. Nothing is written before the download is verified. |
| `tests/install.test.ts` | NEW — port the shape of jss-devtools `tests/install.test.ts` adapted to cs: MIN_NODE_VERSION equals `engines.node` floor (the test holds script and manifest together), env overrides (`CS_BASE_URL`, `CS_HOME`, `CS_BIN_DIR`), checksum mismatch leaves nothing behind, wrapper runs the bundle with node, usage/argument errors. Serve the bundle from a local fixture dir via `CS_BASE_URL=file://`-style or a local http fixture as the source test does — read the source test and follow its approach. |
| `README.md` | Install section: primary command becomes `curl -fsSL https://cs.jjuidev.com/install.sh | sh`; requirements line updated (node >= 24.11, curl or wget, sha256sum or shasum); mention `CS_INSTALL_DIR` is replaced by `CS_BIN_DIR`/`CS_HOME` envs; keep a short "Or from source" block (git clone + pnpm build + link). Do not touch other sections. |

## Product facts

- `cs --version` exists (banner + version, `src/cli.ts`), version `0.1.0`.
- The site domain does not exist yet — the URL is still correct to ship; it goes live when the user
  deploys the image from the parallel plan. Until then a real install fails at download with the
  installer's clear error. Accepted.
- Keep POSIX sh (CI shellchecks it with `--shell=sh`).

## Steps

1. Read source `scripts/install.sh` + `tests/install.test.ts` fully; port the installer with cs
   naming and envs.
2. Port/adapt the test; run it.
3. README install section.
4. Validation, antislop-code on the pending diff, report.

## Safety

- Never run the installer against the real `HOME`. Tests and smoke runs use a tmp `HOME=$H`
  (per `.harness/docs/smoke-temp-home.md`); a real run would write `~/.local/bin/cs` and clobber
  the user's working install.
- Do not touch `src/`, `tests/` other files, or any file in the ownership boundary above.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm vitest run tests/install.test.ts
sh -n scripts/install.sh
# Smoke against a local staged release, tmp HOME only:
node scripts/stage-release.mjs dist/cli.mjs   # may not exist yet (other cooker) — stage via the
                                              # same two files: release/cli.mjs + checksums.txt
H=$(mktemp -d); HOME="$H" CS_BASE_URL="file://$PWD/release/latest" sh scripts/install.sh
HOME="$H" "$H/.local/bin/cs" --version
```

If `scripts/stage-release.mjs` is not merged yet, produce `release/cli.mjs` + `checksums.txt` in
the test fixture instead; do not create `scripts/stage-release.mjs` yourself.

## Risk & rollback

- **Low-medium.** Installer is a served artifact, not runtime code; the CLI is untouched.
- Until the domain is live the public URL fails — accepted by the user's deploy decision.
- Old env `CS_INSTALL_DIR` disappears; README documents the new envs. Rollback: `git revert`.
