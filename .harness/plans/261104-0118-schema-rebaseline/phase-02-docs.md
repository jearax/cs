# Phase 02: Storage documentation

## Context

The README describes the storage layout for the user, and the harness memory carries the fact for
the next session. Both still describe the migration chain that phase 01 removed.

## Requirements

- The README says the file is schema version 1, that cs migrates nothing, and that an old-shape
  file is kept at `cs.json.corrupt` for a manual conversion.
- The memory line replaces the migration line; the memory file stays inside its 4800-char limit.

## Files

| File | Action |
| ---- | ------ |
| `README.md` | storage section: schema version 1, no migration, old-shape files convert by hand |
| `.harness/MEMORY.md` | the migration line replaced by the schema-1 line |

## Steps

1. Rewrite the README paragraph after the storage table.
2. Replace the memory line in place — the limit is 4800 chars, so the replacement must not grow the
   file.

## Validation

- `wc -c .harness/MEMORY.md` stays at or under 4800.
- `npx prettier --write README.md` keeps the Markdown tables aligned.

## Risk & rollback

- The README claims a loud failure for an old-shape file; the storage test is the contract for it.
- Rollback: `git revert` of the change.
