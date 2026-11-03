---
id: 0005
title: -h means help on every command; flags lose their old cs-cli short forms
status: Accepted
date: 2026-11-03
supersedes: none
---

# 0005: -h means help on every command; flags lose their old cs-cli short forms

## Context

The old CLI's `cs config` used `-h` for the Haiku model ID, but the repo's code standards (following
jss-devtools ADR 0004, where the user standardised `-h|--help` and `-v|--version` for every CLI)
reserve `-h` for help. Commander 15 could support both, so the question was UX, not feasibility.

## Decision

`-h` is help on every command, including `cs config`. The Haiku model is set with the long form
`--haiku` only — no short flag. This is a deliberate, user-approved deviation from the old CLI's
flag table in `.harness/docs/cs-cli-feature-inventory.md`.

> "[Chọn] -h = help mọi nơi (chuẩn jss-devtools)" (user, 2026-11-03, asked while cooker was blocked
> on the flag question)

## Options considered

| Option                      | Consequence                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `-h` = help everywhere      | Consistent with the repo standard; breaks the old `-h` habit    |
| Both (`-h` haiku on config) | Backwards compatible, but `-h` means two things across commands |

## Consequences

- Easier: one help convention across every command and every CLI of the toolchain.
- Harder: users of `@jjuidev/cs@0.3.x` who scripted `-h <model>` must switch to `--haiku`.
- Enforced by: the command wiring (`-h` never declared as a flag option) and code-standards.
