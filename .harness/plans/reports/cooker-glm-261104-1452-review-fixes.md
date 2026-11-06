# Report: cooker-glm — review-fix plan 261104-1450 (F1–F11, decisions 0021/0022)

Date: 2026-11-04 · Branch: main · No commit (planner owns commits)

## Phase 1 — credential leak (F1, F5)

- `mask-token.util.ts`: tokens of 9–12 characters now show only a 4-character head (`abcd****`)
  — the head-8/tail-4 windows no longer overlap. `tests/mask-token.util.test.ts` (new): boundary
  tests at 1/2/8/9/10/11/12/13/long, plus "never returns the full token" for lengths 1–40 and a
  9–12 no-tail-exposure loop.
- `storage.service.ts` `readLiveDefault`: the `token` field is masked via `maskToken` before it
  can reach a help line. `config -h` test: with a default record carrying `<fake-token>`, the
  help contains `API token (default: "sk-seed-...oken")` and the raw token appears nowhere.

## Phase 2 — write integrity (F2, F4, F6)

- `src/core/utils/atomic-write.util.ts` (new): `atomicWriteFile` — same-directory `<path>.tmp`
  write, mode enforced, then rename. Applied to `cs.json` (`writeJsonFile`), `settings.json`,
  profile artifacts and alias launchers; their per-site mkdir/chmod/write sequences are gone.
- F4 (decision 0021): `readClaudeSettings` refuses a file that does not parse
  (`~/.claude/settings.json is not valid JSON. Fix or remove it — cs changed nothing.`); missing
  reads as empty (created on first write); valid reads preserve user keys.
  `tests/claude-settings.service.test.ts` (new): valid-file key preservation, missing-as-empty,
  corrupt refusal, atomic write with no `.tmp` residue, plus `cs use` against a corrupt file
  (refused, file byte-identical) and against a valid file (model/permissions preserved, env
  written). Storage test asserts no `.tmp` residue after `saveCsConfig`.
- F6: `config.service` renders artifacts before `saveCsConfig` on both the update and the
  show-create path; `remove.service` removes the artifact before committing `cs.json` — matching
  the `use.service` order. (Ordering is not directly testable without fault injection; noted in
  the plan as covered by review.)

## Phase 3 — behavior and lows (F7, F8, F9, F11)

- F7: `detectActiveProfile` identifies an oauth-only profile (empty URL, decision 0008) solely by
  `CLAUDE_CODE_OAUTH_TOKEN`; such profiles are excluded from the both-empty rule so a wrong oauth
  token cannot match. `tests/active-profile.service.test.ts` (new): api match, oauth match,
  wrong-oauth-token no-match.
- F8: `cs env` guards non-TTY stdin with `cs env needs an interactive terminal.` (exit 1) —
  `cs env < /dev/null` can no longer hang; the dead duplicated `isText(key)` guard is removed
  (F11). Command test asserts stderr + exit 1; the set/unset flows stay covered by the existing
  service-level tests.
- F9: `cli.ts` installs process guards inside `main()` (once-flag, so tests never accumulate
  listeners): EPIPE on stdout ends silently with exit 0; `uncaughtException`/`unhandledRejection`
  route into `reportFatalError` (exit 1, no raw stack unless `CS_DEBUG`).
- F11 lows: the numbered corrupt backup (`cs.json.corrupt.1`, never a silent overwrite of an older
  backup) with the notice naming the actual path + storage test; `alias.command` prints
  `result.launcherPath` instead of recomputing it; `install.sh` resolves a relative
  `CS_INSTALL_DIR` against the invocation `$PWD` (never inside the deleted temp clone), surfaces
  clone stderr, and copies atomically through a temp file + `mv -f`; the architecture scanner's
  import regex now also matches parenthesised `import('...')` forms.

## Phase 4 — CI (F3, decision 0022)

- `.github/workflows/ci.yml`: push + pull_request, ubuntu-latest, Node 24.11, pnpm via
  `pnpm/action-setup@v4` (reads `packageManager`), then `pnpm install --frozen-lockfile` and
  `pnpm lint && pnpm typecheck && pnpm test`.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — 22 files, **242/242 pass**; `pnpm build` green.
- tmp-`$HOME` smoke of the built bundle: with a default record carrying a token, `config -h`
  contains zero occurrences of the raw token and the masked line
  `API token (default: "sk-very-...2345")`; with `{ broken` as `settings.json`, `cs use` prints
  the refusal and the file stays byte-identical.
- `/antislop-code` applied to the pending diff: every added comment is a one-to-three-line why at
  the fix site (atomic helper, normalize step, oauth rule, guards); no slop.

## Not checked

- The GitHub workflow itself (runs on GitHub, not locally) and a real-TTY `cs env` flow — both
  are the user/planner side per the standing boundary.
- F10's PATH-note behaviour after `$PWD` resolution is unverified in a real install; the script
  passes `sh -n` and the logic is a pure case branch.
