---
title: "Creation-time default params for cs config"
description: "Creating a new profile inherits unspecified fields from the current default record (url/token/models participate); updates unchanged; guards run after inheritance."
status: pending
priority: P2
effort: 1h
issue: none
branch: main
decision: 0015
created: 2026-11-04
---

# Plan: creation-time default params (decision 0015)

## Overview

When `cs config` creates a NEW profile, every field flag not passed inherits that field from the
current `default` profile's record (fallback: OFFICIAL constant). Updating an existing profile
keeps the current partial-update semantics. Decision 0008 guards run on the effective record
after inheritance.

## Changes

| File | Action |
| ---- | ------ |
| `src/commands/config/services/config.service.ts` | creation path: effective = `{ ...EMPTY, ...defaultRecord, ...updates }` instead of `{ ...EMPTY, ...existing, ...updates }`; update path unchanged; both token guards (exclusivity + token-without-url) run after the merge |
| `tests/config.command.test.ts` | new — creation with `-t` only inherits url from default; creation with no model flags inherits models; update path does NOT inherit; changing `default` then creating uses the NEW values (live source); guards fire after inheritance (e.g. `-t` + `--oauth-token` still rejected) |
| `README.md` | creation-default-params note |

## Steps

1. Inheritance in the creation path; tests per matrix.
2. README note.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs config -n claude -t sk-key     # url + models inherited from default
HOME=$H node dist/cli.mjs config -n claude               # shows the full official line, user's token
HOME=$H node dist/cli.mjs config -n claude -s m2         # update: only sonnet changes
```

## Risk & rollback

- A stray value in `default` propagates into new profiles — the default record is the source, and
  the user owns it.
- Rollback: `git revert` of the single commit.
