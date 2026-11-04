---
id: 0015
title: 'Creating a profile fills unspecified fields from the default record (function default params)'
status: Accepted
date: 2026-11-04
supersedes: 0014
---

# 0015: Creating a profile fills unspecified fields from the default record (function default params)

## Context

The user tested `cs config --name claude` with partial flags and found the unspecified fields came
out empty. The expectation is function-style default parameters: a new profile inherits whatever
the flags leave unspecified from the current `default` record — not an auto-seed of one special
name (decision 0014, superseded before implementation), and not the blank-start rule inherited
from the old CLI's 0.3.0 change.

## Decision

- Creating a NEW profile: any field flag not passed inherits that field from the current `default`
  profile's record (fallback: the OFFICIAL constant). `url` and `token` participate — so
  `cs config -n claude -t <key>` alone yields the official endpoint plus the user's key, which
  satisfies the decision-0008 guard naturally.
- Updating an EXISTING profile: unchanged — omitted flags keep the profile's current values.
  Defaults apply only at creation.
- Applies to every profile name; no name is special-cased. The `default` profile itself always
  exists, so creation-defaulting never applies to it.
- Explicit flags always win; inheritance happens once, at creation — it never re-applies later.
- The decision-0008 guards (`token` without `url`, both tokens together) run on the effective
  record AFTER inheritance, exactly as before.

> "Vấn đề là cho phép tôi config khi không đầy đủ flags, tức là giống như default params của 1 fn á." (user, 2026-11-04)
> "…Sẽ lấy record như default." (user, 2026-11-04)

## Options considered

| Option                            | Consequence                                              |
| --------------------------------- | -------------------------------------------------------- |
| Inherit at creation (chosen)      | `fn default params` semantics; new profiles are complete |
| Auto-seed one special name (0014) | Special-cased a name instead of the general rule         |
| Blank-start (status quo)          | New profiles incomplete until every flag is typed        |

## Consequences

- Easier: `cs config -n claude -t <key>` produces a complete official profile; model lines never
  need retyping.
- Harder: creating a profile no longer guarantees blank fields — a stray value in `default`
  propagates into every new profile until corrected.
- Enforced by: config service tests (creation inheritance, update no-inheritance, guards-after-inheritance).
