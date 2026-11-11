---
id: 0033
title: cs remove|rm takes several profiles; every name is checked first, and one bad name removes nothing
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0033: cs remove|rm takes several profiles; every name is checked first, and one bad name removes nothing

## Context

`cs remove <profile>` took one name (decision 0025 kept its arguments unchanged when it added `rm`).
The user asked for `cs rm x y z …`. `cs alias rm a b` already accepts several names with an
all-or-nothing check (decision 0024).

## Decision

- `cs remove <profile...>` (alias `rm`) accepts one or more names. Duplicates count once.
- Every name is validated before anything is removed: an invalid name, `default`, or a name that
  does not exist exits 1 and removes nothing.
- Each removed profile prints its own `Profile "<name>" removed.` line, followed by
  `Removed aliases: …` when aliases pointed at it. `cs.json` is written once.
- Help shows `<profile...>`; the example stays the single-name form, as with `cs alias rm`.

> "Scout và kiểm tra effort cho việc improve command `cs rm x y z ...` cùng 1 lúc nhiều profile" (user, 2026-11-11)
>
> "Approve" (user, 2026-11-11, accepting all-or-nothing validation and the `alias rm` help form)

## Options considered

| Option                  | Consequence                                            |
| ----------------------- | ------------------------------------------------------ |
| All-or-nothing (chosen) | A typo leaves the set untouched; matches `cs alias rm` |
| Remove the valid names  | Partial state after a typo; differs from `cs alias rm` |

## Consequences

- Easier: cleaning up several profiles is one command.
- Harder: an artifact removal failing mid-loop can leave earlier artifacts gone while `cs.json`
  still lists them; `cs use`/`cs config` re-renders them.
- Enforced by: `tests/remove.command.test.ts` ("several profiles at once").
