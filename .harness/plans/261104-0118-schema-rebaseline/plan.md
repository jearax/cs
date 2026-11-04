---
title: "Re-baseline the config schema to 1"
description: "CURRENT_SCHEMA_VERSION = 1; remove the migration chain (key fallback, auto-env strip, .bak-on-migration); keep .corrupt handling and all command behaviour."
status: completed
priority: P2
effort: 1h
issue: none
branch: main
decision: 0012
created: 2026-11-04
---

# Plan: schema re-baseline (decision 0012)

## Overview

`CURRENT_SCHEMA_VERSION = 1`; newly created configs carry `schemaVersion: 1`. Remove the migration
chain — the `claude`→`profiles` key fallback, the legacy `[1m]` auto-env strip, and the
`.bak`-on-migration backup. Reading expects key `profiles` only. Kept untouched: `.corrupt`
handling for unparseable files, mode `0600`, owned-keys rewrite, all command behaviour, rc-path,
aliases. The user owns converting any old-shape file by hand.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/constants/profile.constant.ts` | `CURRENT_SCHEMA_VERSION = 1` |
| `src/modules/profiles/services/storage.service.ts` | remove the migration path (key fallback `claude`→`profiles`, auto-env strip, `.bak` write); load reads `profiles` only; missing file → fresh default config (schemaVersion 1); unparseable → `.corrupt` + fresh default (unchanged) |
| `src/modules/profiles/types/profile.type.ts` | `RawCsConfig` drops the `claude` key |
| `src/modules/profiles/constants/paths.constant.ts` | `csConfigBackupPath` removed — the `.bak` file no longer exists |
| `tests/profiles-storage.service.test.ts` | remove migration tests; new tests: missing file → fresh v1 default; v3-shape file reads as-is; a `claude`-keyed file is NOT migrated (reads as no profiles / fresh — loud, per decision) |
| `README.md` | storage section: schemaVersion 1, no migration — old-shape files convert by hand |
| `.harness/MEMORY.md` | replace the two migration lines with one: schema 1, no migration chain, old-shape files convert by hand (mind the 4800-char limit) |
| `.harness/docs/cs-project-overview.md` / `code-standards.md` | nothing — they never documented the migration |

## Steps

1. Constant + storage service cleanup; delete migration tests, write the three new ones.
2. README + memory line update.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$(mktemp -d) node dist/cli.mjs list          # fresh HOME → default profile, file stamped schemaVersion: 1
echo '{"schemaVersion":1,"profiles":{}}' > $H/.config/cs/cs.json && HOME=$H node dist/cli.mjs list  # reads as-is
```

## Risk & rollback

- A `claude`-keyed file now reads as an empty profile set (loud consequence, accepted by decision 0012).
- Rollback: `git revert` of the single commit.

## Result

Implemented as planned; no commit yet.

- `CURRENT_SCHEMA_VERSION = 1`. The migration chain is gone from the code: the `claude`→`profiles`
  key fallback, the legacy `[1m]` auto-env strip and the `.bak`-on-migration write, together with the
  now-dead `csConfigBackupPath` and the `claude` key of `RawCsConfig`.
- A load reads the key `profiles` only and never rewrites the file. A missing file gets a fresh
  config stamped `schemaVersion: 1`; a file without a `profiles` key is not a cs config — cs says
  so, keeps the file at `cs.json.corrupt` and starts from the default profile.
- Kept untouched: the `.corrupt` handling, mode `0600`, the owned-keys rewrite (`toCsConfig`) and
  every command behaviour.
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm test` (193 tests, 18 files), `pnpm build`, plus a
  temp-HOME smoke of the built bundle — a fresh HOME is stamped `schemaVersion: 1` with mode `0600`,
  a v3-shape file is read as it is (no `.bak`, no `.corrupt`, file unchanged) and a `claude`-keyed
  file reports, is kept at `cs.json.corrupt` and falls back to the default profile.

One judgement call to confirm: a file that declares a version keeps that version when cs rewrites
it — only a newly created config is stamped `1`. Restamping every write to `1` is a one-line
change if the baseline is preferred.
