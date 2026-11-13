---
id: 0037
title: Alias and profile names are independent — an alias may share a profile's name
status: Accepted
date: 2026-11-13
supersedes: none
---

# 0037: Alias and profile names are independent — an alias may share a profile's name

## Context

The collision guard came from 0011, when every profile rendered its own `bin/claude-<profile>` and
an alias of the same name wrote the same file. 0013 removed profile launchers, so a profile owns
only `profiles/<name>.json` and an alias only `bin/claude-<alias>`; no command resolves a name in
both registries. The guard then blocked the natural `cs alias glm glm`. This decision replaces the
guard line carried in 0013 and 0024; the rest of those decisions stays in force.

## Decision

- `cs alias <name> <profile>` accepts a name that is also a profile, whatever the target.
- `cs config -n <name>` creates a profile whose name an alias already uses; the alias keeps its target.

> "B: bỏ guard hoàn toàn" (user, 2026-11-13)

## Options considered

| Option                  | Consequence                                              |
| ----------------------- | -------------------------------------------------------- |
| Drop the guard (chosen) | Simplest; `claude-glm` may run another profile by choice |
| Allow only `glm → glm`  | Blocks the mismatch, one more rule in two places         |
| Keep the guard          | The launcher for profile `glm` needs another name        |

## Consequences

- Easier: `cs alias <profile> <profile>` gives a profile its own launcher.
- Harder: an alias `glm → kimi` beside a profile `glm` is legal; `cs list` is the only signal.
- Enforced by: `tests/alias.command.test.ts`, `tests/config.command.test.ts`,
  `tests/alias-launcher.service.test.ts`.
