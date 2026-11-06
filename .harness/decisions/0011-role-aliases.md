---
id: 0011
title: Role aliases — cs alias <name> <profile> re-points a launcher with one command
status: Superseded by 0024
date: 2026-11-04
supersedes: none
---

# 0011: Role aliases — `cs alias <name> <profile>` re-points a launcher with one command

## Context

The user's Herdr workflow (`jk-herdr-kickoff`) launches planner and cooker Claude sessions through
the exec defaults `claude-planner` / `claude-cooker` — hand-maintained `.zshrc` aliases wrapping
`claude --settings <profile>`. Switching a role to a different profile means editing the rc file by
hand, and the user does it often. cs already renders `claude-<profile>` launchers; an alias layer
turns the role entry point into cs-managed state, re-pointable with one command.

## Decision

- `cs alias <name> <profile>` writes the launcher `~/.config/cs/bin/claude-<name>` pointing at the
  target profile's rendered artifact, and records `{<name>: <profile>}` in cs.json's `aliases` map
  (additive optional field — no schema bump).
- Re-pointing overwrites the map entry and re-renders the launcher — that is the removal story too:
  there is no unalias command; pointing an alias elsewhere (including `default`) is how it changes.
- Re-render propagation: when a profile changes (`config`, `use`, `env`), every alias targeting it
  re-renders — same flow the env command already has, one registry lookup added.
- `cs remove <profile>` cleans dangling aliases targeting it: launcher deleted, map entry dropped,
  both reported in the output.
- An alias name that collides with an existing profile name is rejected (one name, one launcher,
  one behaviour). Alias names pass the same validation as profile names.
- `default` gets no special-casing: it is the pre-seeded profile that always exists, `cs use default`
  already works, and `cs alias planner default` is an ordinary re-point. No `claude-default`
  launcher is required — bare `claude` is already the global write's entry point.
- `cs list` shows aliases as `name → profile` lines; `cs reset` clears the map and the launchers.

> "Tôi biết là tôi có khả năng tương ứng, nhưng tôi có nhu cầu chuyển cooker|planner profile khá
> nhiều." (user, 2026-11-04)
> "[Default] …vẫn là cs use default (kể cả không có claude-default… cũng được á, vì claude default
> trong ngữ cảnh sử dụng chỉ là 'claude')" (user, 2026-11-04)
> "[Quản lý] Chỉ có thể alias, tại vì default cũng sẽ có, tương đương kiểu `cs alias planner
default`, `cs alias cooker default`" (user, 2026-11-04)

## Options considered

| Option                        | Consequence                                              |
| ----------------------------- | -------------------------------------------------------- |
| cs-managed role aliases       | One command re-points a role; launchers survive kickoffs |
| Hand-maintained zshrc aliases | Status quo — rc edits by hand on every switch            |
| Special-cased `default` alias | Duplicated the pre-seeded profile's meaning              |

## Consequences

- Easier: `jk-herdr-kickoff` defaults keep working unchanged; switching a role's credentials is one
  command; the hand-written zshrc aliases retire.
- Harder: alias and profile namespaces must stay separate (collision check); cleanup gains a registry lookup.
- Enforced by: alias command tests, propagation tests, and the remove/reset cleanup tests.
