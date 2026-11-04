---
id: 0014
title: 'The profile name `claude` auto-seeds from the default record when missing, and stays removable'
status: Superseded by 0015
date: 2026-11-04
supersedes: none
---

# 0014: The profile name `claude` auto-seeds from the default record when missing, and stays removable

## Context

`cs config --name claude` on a machine without that profile answered `Profile "claude" not found`
plus a create hint. The user expects the name `claude` to always resolve: it is the "official
Anthropic" profile, and its record should start as the default record's (the OFFICIAL Claude 5.5
line) instead of blank.

## Decision

- Resolving the profile name `claude` when it does not exist auto-seeds it: the record starts as a
  copy of the current `default` profile's record (falling back to the OFFICIAL constant if
  `default` is missing). Seeding happens on the resolution paths (`cs config`, `cs use`); `cs list`
  stays passive and shows only what exists.
- The seeded profile is editable and removable like any other — no `default`-tier protection. If
  removed, the next resolution re-seeds it (seed-on-missing is the rule, not a one-time event).
- Other profile names keep the blank-start rule; only `claude` carries this behaviour.

> "Tôi đang nghĩ case `cs config --name 'claude'` … Cho phép config thay vì lỗi … Sẽ lấy record
> như default." (user, 2026-11-04, with the not-found screenshot)
> "[Protection] Seed nhưng remove được" (user, 2026-11-04)

## Options considered

| Option                                 | Consequence                                           |
| -------------------------------------- | ----------------------------------------------------- |
| Seed-on-missing, removable             | Always resolvable, still deletable; resurrects seeded |
| Second protected seed (like `default`) | Two immutable officials; removal blocked              |
| Hint-only change                       | No magic, but the user still types six fields by hand |

## Consequences

- Easier: `cs use claude` / `cs alias planner claude` always resolve to the official line.
- Harder: `cs remove claude` does not stick — the name self-heals; deleting it only means deleting
  it for now.
- Enforced by: storage/resolve tests (seed on first resolution, copy of default, remove → re-seed).
