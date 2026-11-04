# Report: cooker-glm — schemaVersion restamp (decision 0012 follow-up)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Task

In `src/modules/profiles/services/storage.service.ts`, the save/rewrite path preserved a stale
higher `schemaVersion` via `Math.max(parsed.schemaVersion ?? CURRENT_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION)`.
Per decision 0012 the stamp must always reflect the shape cs actually wrote.

## Change

- `storage.service.ts` (`loadCsConfig`, ~line 123): dropped the `Math.max` guard; every load now
  returns the config stamped `CURRENT_SCHEMA_VERSION` (1), so any subsequent `saveCsConfig` writes
  the baseline. Reads stay read-only — the on-disk file is restamped at the next write, matching
  the existing contract that `loadCsConfig` does not rewrite a readable file.
- `tests/profiles-storage.service.test.ts`: new test "restamps a stale schema version to 1 on the
  next write" — a raw file stamped `schemaVersion: 3` loads as schemaVersion 1 and, after
  `saveCsConfig`, the file on disk carries `schemaVersion: 1`.

## Verification

Full gate green (commands run, output seen):

- `pnpm lint` — pass
- `pnpm typecheck` (`tsc --noEmit`) — pass
- `pnpm test` — 18 files, 194/194 passed (includes the new restamp test)
- `pnpm build` (tsdown → `dist/cli.mjs`) — pass

Simulated-environment rule respected: tests run under `useTempHome()` tmp `$HOME`; no real
`~/.config/cs`, `~/.claude`, or the real `claude` binary was touched. No commit made.

## Not checked

- No manual CLI smoke (the change is covered at the storage-service level; a `cs use` smoke was
  not requested for this task).
