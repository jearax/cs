---
title: "Launchers are aliases-only"
description: "Profiles render artifacts only; cs alias is the single launcher creator; bin/ mirrors the aliases map."
status: pending
priority: P2
effort: 1h
issue: none
branch: main
decision: 0013
created: 2026-11-04
---

# Plan: alias-only launchers (decision 0013)

## Overview

Stop auto-rendering `claude-<profile>` launchers. A profile renders only its artifact; `cs alias`
is the only launcher creator; `bin/` mirrors the `aliases` map.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/services/render-artifacts.service.ts` | drop the launcher write + the launcher fields from `ProfileArtifacts` (keep artifact write, mode 0600) |
| `src/commands/*/services/*` + `core/ui` | remove the `Launcher:` output line and the launcher paths from results (config/use/env) |
| `src/modules/profiles/services/artifact-cleanup.service.ts` | `cs remove` no longer deletes `claude-<profile>` launchers (only alias launchers via the registry); `listArtifactProfiles` reads the artifacts dir only |
| `src/commands/reset/` service | clears the alias map + alias launchers only |
| `src/commands/alias/` | unchanged behaviour; output keeps its `Launcher:` line |
| `tests/*` | render tests: artifact only; alias tests: launcher present; remove/reset cleanup tests updated |
| `README.md` | launchers come from `cs alias`; profiles render `--settings` artifacts only; stale launchers from older versions are removed by hand |

## Steps

1. Renderer slim-down + type updates; output lines.
2. Cleanup/ownership adjustments; alias flow untouched.
3. Tests + README.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs config -n work -u https://x.com -t tok   # no Launcher line, no bin/ entry
HOME=$H node dist/cli.mjs alias rw work && ls $H/.config/cs/bin/   # claude-rw only
HOME=$H node dist/cli.mjs remove work                              # alias cleaned + reported
```

## Risk & rollback

- Launchers left by older versions in the user's real `bin/` become unmanaged — README tells the
  user to delete them by hand once.
- Rollback: `git revert` of the single commit.
