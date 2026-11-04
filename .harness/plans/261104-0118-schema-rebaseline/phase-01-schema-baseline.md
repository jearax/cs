# Phase 01: Schema baseline and migration removal

## Context

`cs` went public with no external users, so the v1→v2→v3 migration chain only serves files that
live on one machine. Decision 0012 re-baselines the schema to 1 and removes the chain; this phase
owns the code and the tests that prove the new behaviour.

## Requirements

- `CURRENT_SCHEMA_VERSION = 1`; a newly created config is written with `schemaVersion: 1`.
- The `claude`→`profiles` key fallback, the legacy `[1m]` auto-env strip and the `.bak`-on-migration
  write are gone; a load reads the key `profiles` only.
- Kept untouched: the `.corrupt` handling of an unusable file, mode `0600`, the owned-keys rewrite
  (`toCsConfig`), and every command behaviour.

## Files

| File | Action |
| ---- | ------ |
| `src/modules/profiles/constants/profile.constant.ts` | `CURRENT_SCHEMA_VERSION = 1`, the schema history comment replaced by the baseline note |
| `src/modules/profiles/services/storage.service.ts` | migration path removed; a load reads `profiles` only, a file without it is unusable; the load never rewrites the file |
| `src/modules/profiles/types/profile.type.ts` | `RawCsConfig` drops the `claude` key |
| `src/modules/profiles/constants/paths.constant.ts` | `csConfigBackupPath` removed — the `.bak` file no longer exists |
| `tests/profiles-storage.service.test.ts` | migration tests deleted; the three new cases added |

## Steps

1. Pin the constant, then strip the three migration branches from `loadCsConfig`.
2. Delete the migration tests and write the new ones: a fresh config is stamped `1`, a file that
   keeps the profiles under `profiles` is read as it is, a file that keeps them under `claude` is
   not migrated — it is kept at `cs.json.corrupt` and cs starts from the default profile.

## Validation

- `pnpm test` — the storage suite covers the three cases and the rest of the suite stays green.
- `pnpm lint && pnpm typecheck` — no unused import or dead constant is left behind.

## Risk & rollback

- A `claude`-keyed file now fails loudly instead of migrating; the file content is kept at
  `cs.json.corrupt`, so the manual conversion the decision asks for stays possible.
- Rollback: `git revert` of the change.
