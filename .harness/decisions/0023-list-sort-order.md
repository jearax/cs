---
id: 0023
title: cs list shows default first, then profiles A→Z; aliases A→Z
status: Accepted
date: 2026-11-06
supersedes: none
---

# 0023: cs list shows default first, then profiles A→Z; aliases A→Z

## Context

`cs list` printed profiles and aliases in `cs.json` key insertion order, which reads as random once
a setup grows. Profiles carry no timestamps, so a recency order is not available without a schema
change.

## Decision

`cs list` prints the `default` profile first, then the other profiles by name A→Z
(case-insensitive). The Aliases section is sorted by alias name A→Z the same way. The order is a
display concern of `cs list`; the stored `cs.json` order and other commands are unchanged.

> "default trước, rồi A→Z" … "[Aliases:] Có, sort A→Z" (user, 2026-11-06)

## Options considered

| Option                           | Consequence                                       |
| -------------------------------- | ------------------------------------------------- |
| default first, then A→Z (chosen) | Stable; does not move when `cs use` switches      |
| active first, default, A→Z       | Active is visible at once, but the order shifts   |
| Pure A→Z                         | Simplest; `default` lands wherever its name falls |

## Consequences

- Easier: a long list is scannable and its order is predictable.
- Harder: insertion order is no longer visible anywhere in the CLI.
- Enforced by: `tests/list.command.test.ts`.
