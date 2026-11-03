---
title: "Declare config options long-first, like jss-devtools"
description: "Rewrite cs config option flags from short-first to long-first (--name, -n) matching the reference convention; display-only."
status: completed
priority: P3
effort: 0.5h
issue: none
branch: main
tags: [cli, ux]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Plan: long-first option declarations

## Overview

jss-devtools declares every option long-first (`'--yes, -y'`, `'--force, -f'`), and cs's root
already does (`'--version, -v'`, `'--help, -h'`). Only `cs config`'s seven options are
short-first, so its help table shows `-n, --name <name>` while every other flag reads long-first.
Rewrite the declaration strings — commander prints them verbatim; parsing is unchanged either way.

## Changes

| File | Change |
| ---- | ------ |
| `src/commands/config/config.command.ts` | `-n, --name` → `--name, -n`; same for `--url/-u`, `--token/-t`, `--sonnet/-s`, `--opus/-o`, `--fable/-f`; `--oauth-token` and `--haiku` have no short form and stay as-is |
| `tests/config.command.test.ts` (and any test asserting the flags text) | update assertions |
| `.harness/docs/code-standards.md` | add the convention line: options declare the long form first (`--name, -n`), no short form when none exists |
| `README.md` | flag table rows if they print the short-first form |

Not touched: root `--version`/`--help` (already long-first), option order in the help table
(declaration order, unchanged), any parsing behaviour.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node dist/cli.mjs config --help   # every paired option reads `--long, -s <value>`
```

## Rollback

Single-commit-sized; `git revert` restores it.
