---
title: "Rename the positional argument placeholder <name> to <profile>"
description: "Align `cs use` and `cs remove` help placeholders with the domain noun; display-only change, no behaviour change."
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

# Plan: positional placeholder `<name>` → `<profile>`

## Overview

`cs use <name>` and `cs remove <name>` pass a profile's name, but the domain noun is "profile"
(decision 0008's matrix, the overview terminology). Rename the commander positional placeholder so
the help table reads `use <profile>` / `remove <profile>` and commander's own error message says
`missing required argument 'profile'`. Display-only: no logic, no storage, no flag changes.

## Changes

| File | Change |
| ---- | ------ |
| `src/commands/use/use.command.ts` | `.command('use <name>')` → `.command('use <profile>')`; the argument description keeps its wording but may drop "name" duplication |
| `src/commands/remove/remove.command.ts` | same for `remove <name>` |
| `tests/*` | update any assertion on the placeholder text, the missing-argument message, or the help table |
| `README.md` | commands table rows for `use` and `remove` |

Not touched: `--name` option on `config` (an option flag, a different surface), the inventory doc
(old CLI map, stays as reference), internal variable names (cosmetic only where the compiler forces it).

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node dist/cli.mjs --help                     # shows `use <profile>` / `remove <profile>`
HOME=$(mktemp -d) node dist/cli.mjs use 2>&1 | head -2   # missing required argument 'profile', exit 1
```

## Rollback

Single-commit-sized change; `git revert` restores it.
