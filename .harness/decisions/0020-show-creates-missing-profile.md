---
id: 0020
title: 'cs config show on a missing name creates the profile with creation defaults — for every name'
status: Accepted
date: 2026-11-04
supersedes: none
---

# 0020: `cs config` show on a missing name creates the profile with creation defaults — for every name

## Context

After decision 0015, `cs config -n <name>` with no flags on a missing profile still answered
`Profile "<name>" not found` — the user hit it with `cs config --name claude` and asked why the
use case still failed. Show-on-missing was a gap no decision covered: 0015 covers creation flags,
0014 (auto-seed of one name) was superseded before implementation.

## Decision

- `cs config -n <name>` with no update flags on a name that does not exist **creates the profile**
  with the same defaults a creation applies (copy of the current `default` record), persists it to
  `cs.json`, renders its artifact, and then shows it. No name is special-cased — every name
  behaves the same, consistent with 0015.
- The output names the creation (`Profile "<name>" created`), so a read is distinguishable from a
  plain show. The alias-collision guard applies: a name taken by an alias still refuses.
- Help hints on the creation flags render the live value they would inherit: e.g.
  `Sonnet model (default: "claude-sonnet-5-5")`, read from the current default record at render time.

> "Sau lệnh đó, tôi muốn cs.json có profile như này `\"claude\": { … }`" (user, 2026-11-04)
> "[Mọi tên] (user, 2026-11-04, choosing every name over claude-only)"

## Options considered

| Option                  | Consequence                                               |
| ----------------------- | --------------------------------------------------------- |
| Show creates (chosen)   | `cs config -n <name>` always resolves; one rule, no cases |
| Keep not-found (0015)   | The gap stayed: a bare show on a new name always errored  |
| claude-only auto-create | Special-cased one name, against the 0015 spirit           |

## Consequences

- Easier: the name always resolves; a typo'd show creates a stray profile that `cs remove` cleans.
- Harder: `cs config` can no longer be used to test existence — read the table or `cs list`.
- Enforced by: config tests (created-on-show record, alias guard on show, help default rendering).
