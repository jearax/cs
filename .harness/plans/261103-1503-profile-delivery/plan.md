---
title: "Port the cs-cli profile flow with dual delivery (global + --settings file)"
description: "Port the seven profile commands onto the new skeleton with decision 0004's dual delivery: global write default, rendered profile files and claude-<profile> launchers opt-in."
status: pending
priority: P1
effort: 2d
issue: none
branch: main
tags: [cli, profiles]
blockedBy: []
blocks: [project:261103-1503-harness-module]
created: 2026-11-03
---

# Plan: Port the cs-cli profile flow (đợt 1)

## Overview

Port the old CLI's profile behaviour (full map:
[`.harness/docs/cs-cli-feature-inventory.md`](../../docs/cs-cli-feature-inventory.md)) onto the new
skeleton as a `modules/profiles/` feature, adding decision 0004's dual delivery: the global
`~/.claude/settings.json` write stays the `cs use` default (zero breaking change), and each profile
also renders a settings-shaped file under `~/.config/cs/profiles/` plus a launcher script
`~/.config/cs/bin/claude-<profile>`. Named for porting by decision 0001: the user named this
workflow on 2026-11-03. The harness module port is đợt 2, a separate plan.

## Phases

| Phase | File | Objective |
| ----- | ---- | --------- |
| 01 | [phase-01-profiles-module.md](./phase-01-profiles-module.md) | `modules/profiles/`: storage + settings renderer, unit-tested against the behaviour map |
| 02 | [phase-02-config-use-commands.md](./phase-02-config-use-commands.md) | `config` and `use` commands (global default, `--file` opt-in), render on change |
| 03 | [phase-03-remaining-commands.md](./phase-03-remaining-commands.md) | `current`, `ls`, `remove`, `reset`, `env` + artifact/launcher cleanup |
| 04 | [phase-04-launchers-e2e-docs.md](./phase-04-launchers-e2e-docs.md) | Launcher generation, e2e flow, user-facing README |

## Constraints (in force)

- Decisions 0001–0004 apply; `.harness/docs/cs-cli-feature-inventory.md` is the behaviour contract
  for everything ported (copy behaviours deliberately, flag every deviation in the report).
- Layout rules enforced by `tests/support/architecture-rules.ts` — commands wire CLI, module
  services return data and print nothing, output goes through `core/ui`.
- The old repo (`/Users/tandm/Documents/jearax/npm/cs-cli`) is read-only reference; its code is
  never copied — behaviour is ported per the inventory.

## Non-goals

- Harness module port (đợt 2, separate plan).
- No schema migration of existing user cs.json beyond what the old migration v1→v2 needs (the old
  code already handles v1→v2; port it).
- No `cs run`/spawn, no rc-file editing, no CI/release pipeline.

## Final verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node dist/cli.mjs --help                     # shows the seven commands
HOME=$(mktemp -d) node dist/cli.mjs config -n work -u https://example.com -t sk-test -s m1 && \
  HOME=$HOME node dist/cli.mjs use work --file && \
  ls ~/.config/cs/profiles/                  # work.json exists, bin/claude-work executable
```

## Rollback

Phases land as commits on `main`; the conventions commit `f3a80d5` is the recovery point.
