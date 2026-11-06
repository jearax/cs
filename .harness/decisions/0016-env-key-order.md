---
id: 0016
title: Env keys render in alphabetical order — profile artifact and global write alike
status: Superseded by 0018
date: 2026-11-04
supersedes: none
---

# 0016: Env keys render in alphabetical order — profile artifact and global write alike

## Context

The env block previously kept insertion order (endpoint → token → oauth → models → `[1m]` keys),
which scattered the `CLAUDE_CODE_*` keys across the block and depended on the renderer's build
sequence. The user wants a stable, deterministic order in both the rendered profile artifact and
the global settings write — which is one renderer, so one place to fix.

## Decision

The renderer sorts the final env map alphabetically (A→Z, plain string comparison) before
returning it. Both delivery targets consume the sorted object, so the profile artifact, the global
`settings.json` write and the `cs env` user extras all land in the same order. Adding a key never
requires deciding a position.

> "[Sort] Alphabetical (A→Z)" (user, 2026-11-04, chosen over semantic grouping by preview)

## Options considered

| Option            | Consequence                                                |
| ----------------- | ---------------------------------------------------------- |
| Alphabetical      | Deterministic, diff-friendly, zero maintenance on new keys |
| Semantic grouping | More readable groups, but every new key needs a position   |

## Consequences

- Easier: stable diffs between renders; related keys are found by prefix at one glance.
- Harder: credentials and endpoints are no longer adjacent (cosmetic).
- Enforced by: renderer order tests.
