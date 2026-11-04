---
title: "Auto-seed the `claude` profile from the default record"
description: "Resolving profile `claude` when missing seeds it as a copy of the default record (editable, removable, re-seeds on next resolve)."
status: cancelled
priority: P2
effort: 1h
issue: none
branch: main
decision: 0014
created: 2026-11-04
---

# Plan: the `claude` profile auto-seed (decision 0014)

## Overview

Profile name `claude` always resolves: when missing, it is seeded as a copy of the current
`default` record (fallback: OFFICIAL constant). Seeded profiles are editable and removable;
removal does not stick (next resolution re-seeds). `cs list` stays passive.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/services/` (resolve path used by config/use) | new seed step: resolving `claude` when missing → copy `default`'s record (fallback OFFICIAL), persist, return it — one shared helper so config and use behave identically |
| `tests/profiles-storage.service.test.ts` (or the resolve test file) | new — first resolve seeds a copy of default; edit survives; remove → next resolve re-seeds; `default` missing → OFFICIAL fallback; other names do NOT auto-seed |
| `README.md` | the `claude` profile note |

## Steps

1. Shared resolve helper + seed logic; tests per the matrix.
2. README note.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs config -n claude        # seeded from default, not "not found"
HOME=$H node dist/cli.mjs remove claude >/dev/null
HOME=$H node dist/cli.mjs config -n claude        # re-seeded
HOME=$H node dist/cli.mjs config -n nope          # still "not found" (other names unchanged)
```

## Risk & rollback

- A read command (`config -n claude`) now writes cs.json (the seed) — accepted, consistent with
  the lazy-create-on-load behaviour.
- Rollback: `git revert` of the single commit.
