# Cooker report — installer from the site (plan 261110-1454)

Status: DONE_WITH_CONCERNS
Plan: `.harness/plans/261110-1454-installer-from-site/plan.md`
Ownership: `scripts/install.sh`, `tests/install.test.ts`, `README.md` (install section)

## What changed

| File | Change |
| ---- | ------ |
| `scripts/install.sh` | Rewritten on the jss-devtools pattern: download `cli.mjs` + `checksums.txt`, verify sha256, smoke-run `--version`, install to `~/.cs/<version>/cli.mjs`, write the `cs` wrapper to `~/.local/bin/cs` |
| `tests/install.test.ts` | New — 34 tests over a local release HTTP fixture |
| `README.md` | Install section rewritten (install section only) |
| `tsconfig.json` | `exclude` gained `site` — see below |

The clone-and-build installer is gone. `CS_INSTALL_DIR` is gone with it; `CS_BASE_URL`, `CS_HOME`
and `CS_BIN_DIR` replace it.

## Evidence

```
pnpm lint        → clean
pnpm typecheck   → clean
pnpm test        → 24 files, 297 tests passed
pnpm build       → dist/cli.mjs 201.01 kB
sh -n scripts/install.sh → ok
shellcheck --shell=sh scripts/install.sh → clean (v0.11.0, the version CI pins)
```

Smoke, tmp `HOME` only, no real env touched:

- `CS_BASE_URL="file://$R/latest"` install → `installed cs 0.1.0 to $H/.cs/0.1.0`, tree is exactly
  `$H/.cs/0.1.0/cli.mjs` + `$H/.local/bin/cs`, and `$H/.local/bin/cs --version` prints `0.1.0`.
- Default paths (`CS_HOME`/`CS_BIN_DIR` unset) → `~/.cs/0.1.0/cli.mjs` and `~/.local/bin/cs`.
- Tampered `checksums.txt` → exit 1 with `checksum mismatch`, and the tmp HOME stays empty.
- `checksums.txt` with no `cli.mjs` entry → exit 1, nothing written.
- A bundle that prints a non-version → exit 1 with `invalid version`, nothing written.
- A `HOME` containing spaces → installs and runs.
- An unset `HOME` → exit 1 before any work.
- A fresh HOME with no `.local/bin` → the installer creates it.
- A second install over an existing one → succeeds, the shim still runs.
- The shim, a symlink to the shim, and the bundle directly → all print `0.1.0`.

## Review round 1 (code-reviewer subagent) — findings and fixes

One High finding was real and was a regression against the old installer, which had exactly this
guard and my port dropped it:

- **High — a relative `CS_HOME`/`CS_BIN_DIR` produced a broken shim while the installer reported
  success.** The shim carried a relative path, so `cs` failed from every directory but the install
  one. Fixed: the install paths are absolutized before they are written, and a test locks it. The
  test was checked against the pre-fix installer — it fails there and passes now.
- **Medium — a mid-install failure left the version directory and the temp files behind.** Fixed:
  an `EXIT` trap removes the temp files and removes the version directory while it is still empty.
- **Medium — the checksum parser matched only a bare `cli.mjs`,** so a file listing `release/cli.mjs`
  or the `*cli.mjs` binary marker of `sha256sum` was rejected with a misleading message. Fixed: the
  entry is matched by file name; three layouts are tested.
- **Medium — `sha256_of` swallowed a failing tool,** because the pipeline's status was `cut`'s.
  Fixed: the tool is checked before the download, and an empty digest is an error of its own.
- **Low — fixed temp file names collided between two concurrent installs.** Fixed: the PID is in
  the name.
- **Low — the shim embedded the install path unescaped,** so a `$` or a quote in the path broke it.
  Fixed: the path is escaped for the shell, and a `$` in the path was verified to still run.
- **Low — a trailing slash on the install path broke the PATH check.** Fixed: the trailing slash
  is stripped.

**Medium — prereleases were uninstallable.** The plan said "validate the version string
(digits/dots, three parts)", which would refuse a `1.0.0-rc.1` release. The version goes into a
path, so the check has to block traversal, not prereleases: the core must be digits and dots, and
an optional `-suffix` is now allowed. Path traversal is still refused, and both directions are
tested. **Open question for the planner: does cs intend to publish prereleases?** If not, the
looser rule is harmless; if yes, it was needed.

## Notes for the planner

1. **`tsconfig.json` is one line outside the plan's ownership list.** The parallel site cooker
   added `site/`, and the root `tsconfig.json` has `include: ["**/*"]`, so `pnpm typecheck` read the
   site's TSX and failed on 20+ errors in files neither of us owns. jss-devtools excludes `site` in
   its root tsconfig for exactly this reason; I applied the same one-word exclude. Revert it if the
   site cooker prefers a different fix — but the repo-wide gate is red without it.

2. **The site's install copy is now stale, and it is the site cooker's file.**
   `site/src/pages/Docs/pages/Install/Install.tsx` still says the installer "checks git, Node.js
   and pnpm, clones the repository, builds and copies `cs` to `~/.local/bin`" and "The installer
   clones the repository anyway". `site/src/constants/cli.constant.ts` lists `git` and `pnpm` in
   `REQUIREMENTS`. Under the new installer neither is true — it needs curl/wget + sha256 only, and
   it never clones. The site cooker should update both, or tell me to.

3. **The install URL 404s until the domain is live** — accepted under decision 0026.

4. **`scripts/stage-release.mjs` does not exist yet** (site cooker's file). The installer accepts
   `<sha256>  cli.mjs` and the two other common layouts, so whatever the site stages will parse —
   but the site must serve `GET /releases/latest/cli.mjs` and `GET /releases/latest/checksums.txt`.

   **Update — the site cooker landed that file while this report was being written.** I staged the
   real release with it (`node scripts/stage-release.mjs dist/cli.mjs`) and installed from the
   result: the installer parses the staged `checksums.txt` and installs. The contract holds on both
   sides. The CI shellcheck step they added runs `shellcheck --shell=sh` at v0.11.0 — the same
   version and flags I validated locally, and it passes.

5. **The site cooker's `NODE_FLOOR` is `>= 24.11.0` while `engines.node` is `>=24.11.0`** — the
   values agree, but the formats differ. `tests/install.test.ts` holds the *script* and the
   *manifest* together; I left the site constant out of the test because that file belongs to the
   other cooker and it is still moving.

## Not checked

- A real install against `https://cs.jjuidev.com` — the domain does not exist yet.
- The site's served `install.sh` matching this one — the image `COPY` is the site cooker's step.
- Windows and Linux: cs is macOS-first, and the installer is POSIX sh.
