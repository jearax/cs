---
title: "Remove the models catalog (decision 0019)"
description: "Drop cs models, the Known-models hint and the models constant; move the dot-form note to README and config --help examples."
status: pending
priority: P2
effort: 1h
issue: none
branch: main
decision: 0019
created: 2026-11-04
---

# Plan: remove the models catalog (decision 0019)

## Changes

| File | Action |
| ---- | ------ |
| `src/commands/models/` + registration in `src/cli.ts` | delete |
| `src/modules/profiles/constants/models.constant.ts` | delete |
| `src/commands/config/` + `core/ui/profile.ui.ts` | remove the `Known models:` hint line from the show path |
| `src/commands/config/config.command.ts` | add an `addHelpText('after')` example carrying the dot-form note: `cs config -n claude -s claude-sonnet-4.7` stores `claude-sonnet-4-7` (dot form converted); append `[1m]` for the 1M window |
| `tests/models.command.test.ts` + catalog tests | delete; config tests: assert the hint line is gone |
| `README.md` | models section now carries the dot-form note; `cs models` references removed |

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs models 2>&1 | head -1        # unknown command
HOME=$H node dist/cli.mjs config -n default | grep -ci "known models"   # 0
HOME=$H node dist/cli.mjs config -h | grep -i "dot"    # the example carries the note
```

## Risk & rollback

- Pure removal; rollback: `git revert` of the single commit.
