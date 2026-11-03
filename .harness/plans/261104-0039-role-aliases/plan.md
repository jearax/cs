---
title: "Role aliases: cs alias <name> <profile>"
description: "cs-managed launcher aliases (planner, cooker, ...) re-pointable with one command; registry in cs.json, re-render propagation, dangling cleanup."
status: pending
priority: P2
effort: 2h
issue: none
branch: main
tags: [cli, profiles]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Plan: role aliases (decision 0011)

## Overview

`cs alias <name> <profile>` writes the launcher `~/.config/cs/bin/claude-<name>` pointing at the
target profile's rendered artifact and records it in cs.json's `aliases` map. The Herdr kickoff
skill's defaults (`claude-planner` / `claude-cooker`) then become cs-managed: switching a role's
profile is one command, no rc edits. No unalias command — re-pointing (including to `default`) is
the lifecycle; `cs remove`/`reset` clean dangling aliases with a report.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/types/profile.type.ts` | `CsConfig` gains `aliases?: Record<string, string>` |
| `src/modules/profiles/services/storage.service.ts` | alias map accessors (set, remove, all) via `toCsConfig` |
| `src/modules/profiles/services/alias-launcher.service.ts` | new — render one alias launcher (`claude-<alias>` → target artifact path), list aliases whose target is a given profile |
| `src/modules/profiles/services/render-artifacts.service.ts` | after profile artifacts render, re-render every alias launcher targeting that profile |
| `src/commands/alias/alias.command.ts` + `services/alias.service.ts` | new command: `cs alias <name> <profile>` — validates both names, rejects alias==profile-name collision, target must exist, writes map + launcher |
| `src/commands/remove/` + `reset/` services | dangling cleanup: drop map entries + delete `claude-<alias>` launchers, report what was cleaned |
| `src/commands/list/` | `name → profile` alias rows |
| `src/cli.ts` | register the alias command |
| `tests/alias.command.test.ts` | new — set, re-point, collision reject, target missing reject |
| `tests/alias-launcher.service.test.ts` | new — launcher content points at target artifact; propagation on target change; dangling cleanup on remove/reset |
| `README.md` | alias section |
| `.harness/docs/cs-project-overview.md` | terminology: Role alias |

## Steps

1. Registry + pure alias-launcher service, tests first.
2. Alias command; collision and missing-target guards.
3. Propagation wiring at the three render sites; remove/reset cleanup.
4. `cs list` rows + README.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs config -n work -u https://x.com -t tok
HOME=$H node dist/cli.mjs alias planner work && cat $H/.config/cs/bin/claude-planner
HOME=$H node dist/cli.mjs alias planner other      # re-point: content changes
HOME=$H node dist/cli.mjs remove work              # dangling: alias cleaned + reported
HOME=$H node dist/cli.mjs alias planner work       # collision check: alias 'work' when profile 'work' exists → reject
```

## Risk & rollback

- The bin/ ownership question is settled by the registry: cs distinguishes alias launchers from
  profile launchers via `aliases` in cs.json, never by filename guessing.
- Rollback: single-commit-sized; `git revert` restores it.
