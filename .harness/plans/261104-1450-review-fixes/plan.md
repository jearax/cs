# Plan: fix the verified code-review findings

Created 2026-11-04 after the full codebase review (three reviewers + planner verification).
User-approved scope: **all findings, three waves, security first**. Decisions in force:
0021 (corrupt settings.json → refuse + notice), 0022 (GitHub Actions CI).

Evidence: `.harness/plans/reports/code-review-261104-1443-synthesis.md` (F1–F11 with file:line),
plus the three source reports in the same folder.

## Phase 1 — Credential leak (F1, F5) — security, smallest and most urgent

- F1: the help renderer must never print a raw credential. Mask the value inside `readLiveDefault`
  when the field is `token` (mask via `maskToken`), or stop attaching live-default to `--token`
  entirely — pick the smaller diff that keeps `--url` and model IDs live. Add a CLI test: with a
  default record holding a token, `cs config --help` output contains no raw token and contains the
  masked form.
- F5: fix `maskToken` so no token length is fully exposed (short tokens `<= 8` already collapse to
  `xx****`; the 9–12 overlap must go). Add length-boundary tests (9, 12, 13, long).

## Phase 2 — Write integrity (F2, F4, F6)

- F2: atomic writes everywhere cs writes: `cs.json`, `settings.json`, profile artifacts, launchers.
  Write to `<path>.tmp` in the same directory, then `rename`. No lockfile in this pass.
- F4 (decision 0021): corrupt `settings.json` → refuse with a clear error, write nothing. Missing
  file → create. Valid file → preserve user keys (unchanged behavior), now with tests that pre-write
  both a valid file (keys preserved) and a corrupt one (refused).
- F6: commit ordering — `config.service` renders artifacts before saving cs.json; `remove.service`
  removes artifact + launcher before saving. Match the order `use.service` already uses.

## Phase 3 — Behavior and lows (F7, F8, F9, F11)

- F7: `detectActiveProfile` must also match on `CLAUDE_CODE_OAUTH_TOKEN` when the profile has no url.
- F8: `cs env` guards non-interactive stdin (clear error + exit 1) and gains command tests for the
  set/unset flows that do not need a TTY.
- F9: `cli.ts` adds EPIPE handling and `uncaughtException`/`unhandledRejection` handlers (exit 1,
  message without a raw stack unless `CS_DEBUG`).
- F11 lows, batched: remove the dead duplicate guard in `env.command.ts:120-130`; guard
  `.corrupt` against silent overwrite; `alias.command` uses `result.launcherPath`; install.sh
  (resolve `CS_INSTALL_DIR` to absolute, surface clone errors, atomic `cp`); architecture scanner
  `import()` bypass hardening if small.

## Phase 4 — CI (F3, decision 0022)

- `.github/workflows/ci.yml`: on push + pull_request, Node 24.11, `pnpm install --frozen-lockfile`,
  `pnpm lint && pnpm typecheck && pnpm test` (test includes the bundle build).

## Verification

`pnpm lint` + `pnpm test` (the vitest global setup builds the bundle, so green tests prove the
build). The user alone tests the real environment afterwards.

## Non-goals

No lockfile, no cross-platform work, no launcher cleanup migration, no dependency changes.
