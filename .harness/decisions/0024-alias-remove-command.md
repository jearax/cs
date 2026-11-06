---
id: 0024
title: cs alias remove|rm <alias...> deletes one alias; the rest of role aliases stands
status: Accepted
date: 2026-11-06
supersedes: 0011
---

# 0024: `cs alias remove|rm <alias...>` deletes one alias; the rest of role aliases stands

## Context

Decision 0011 had no unalias command: an alias changed only by re-pointing, and vanished only with
its profile. With two aliases on one profile there was no way to drop just one; re-pointing to
`default` leaves the launcher and the `cs list` line behind.

## Decision

- `cs alias remove <alias>` (alias `rm`, full name primary as with `list`/`ls`) deletes the alias
  entry in `cs.json` and its launcher `claude-<alias>`. The target profile, its artifact and other
  aliases are untouched.
- Several names are accepted (`cs alias rm a b`), but help shows the single-alias form. Every name is
  validated first; an unknown one removes nothing and exits 1.
- `cs alias <name> <profile>` stays as is; `remove` and `rm` are rejected as alias names.
- Carried over from 0011 unchanged: re-pointing overwrites and re-renders; profile changes re-render
  their aliases; `cs remove <profile>` cleans dangling aliases; alias/profile name collisions are
  rejected; `default` is not special-cased; `cs list` shows `name → profile`; `cs reset` clears all.

> "Nếu học theo bộ command của docker, thì lệnh `cs alias remove|rm <alias>` là chuẩn đúng không?"
> "lệnh đầy đủ là chính, lệnh ngắn là alias, ví dụ: list vs ls. Có support cho remove nhiều alias
> liên tục, nhưng đó không phải usecase chính (hiển thị ở help)" (user, 2026-11-06)

## Options considered

| Option                             | Consequence                                          |
| ---------------------------------- | ---------------------------------------------------- |
| `cs alias remove\|rm` (chosen)     | Docker-like verb; shorthand create kept; 2 reserved  |
| `cs alias <name> --remove`         | No reserved names, but `<profile>` turns optional    |
| `cs alias add/rm` subcommands only | Cleanest grammar; breaks `cs alias <name> <profile>` |
| Overload `cs remove <name>`        | No new syntax; one verb doing two jobs               |

## Consequences

- Easier: one alias can go without touching its profile or sibling aliases.
- Harder: alias names `remove` and `rm` are reserved.
- Enforced by: `tests/alias.command.test.ts`.
