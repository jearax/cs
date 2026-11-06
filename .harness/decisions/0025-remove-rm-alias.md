---
id: 0025
title: cs remove answers to rm, full name primary
status: Accepted
date: 2026-11-06
supersedes: none
---

# 0025: `cs remove` answers to `rm`, full name primary

## Context

`cs alias remove|rm` (decision 0024) and `cs list|ls` pair a full command name with a short alias.
`cs remove <profile>` had no short form, so the two removal verbs were spelled differently.

## Decision

`cs remove <profile>` also answers to `cs rm <profile>`. `remove` stays the primary name in help, as
with `list`/`ls`; behaviour, arguments and output are unchanged.

> "plan update alias cho command `cs remove|rm`" (user, 2026-11-06)

## Options considered

| Option              | Consequence                                     |
| ------------------- | ----------------------------------------------- |
| `rm` alias (chosen) | Matches `ls` and `cs alias rm`; one-line change |
| Keep `remove` only  | Inconsistent with the alias removal verb        |

## Consequences

- Easier: the same short verb removes a profile and an alias.
- Harder: nothing; `rm` was not a command before.
- Enforced by: `tests/remove.command.test.ts`.
