---
id: 0012
title: 'Schema re-baselined to 1 — the migration chain is removed from the code'
status: Accepted
date: 2026-11-04
supersedes: none
---

# 0012: Schema re-baselined to 1 — the migration chain is removed from the code

## Context

`cs` just went public with zero external users, so the v1→v2→v3 migration chain only serves files
that no longer exist outside this one machine. The user pinned `CURRENT_SCHEMA_VERSION` to 1 in an
experiment and the CLI still ran correctly on current data — confirming the chain is dead weight.
Re-baselining now is cheap; later it will not be.

## Decision

- `CURRENT_SCHEMA_VERSION = 1`; newly created configs are written with `schemaVersion: 1` (the
  field stays, so a future migration has a marker to read).
- All migration code is removed: the `claude`→`profiles` key fallback, the legacy `[1m]` auto-env
  strip, and the `.bak`-on-migration backup. Reading expects the key `profiles`; anything else is
  not cs's problem any more.
- Kept untouched: the `.corrupt` handling for unparseable files, mode `0600`, the owned-keys
  rewrite (`toCsConfig`), and every command behaviour.
- The user owns their own data side: converting or resetting any file left in an old shape is done
  by hand, outside cs.

> "Ý là đặt lại 1 trong phía code đi, phía của tôi để tôi test, tự tôi đặt." (user, 2026-11-04)

## Options considered

| Option              | Consequence                                                |
| ------------------- | ---------------------------------------------------------- |
| Re-baseline to 1    | Dead migration code gone; the repo starts clean            |
| Keep the chain (v3) | Old `.bak` files stay readable; code nobody needs lives on |

## Consequences

- Easier: one schema, no history to carry; future migrations (if ever) start from this marker.
- Harder: a `claude`-keyed file now fails loudly instead of migrating — accepted, the only old
  files are the user's and they own the conversion.
- Enforced by: the storage tests, rewritten for schema 1.
