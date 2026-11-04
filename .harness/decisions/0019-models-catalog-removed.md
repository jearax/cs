---
id: 0019
title: 'The models catalog is removed — model IDs are provider-specific and drift'
status: Accepted
date: 2026-11-04
supersedes: 0017
---

# 0019: The models catalog is removed — model IDs are provider-specific and drift

## Context

Decision 0017 shipped a curated models catalog as `cs models` plus a "Known models" hint in
`cs config` show. On review the user found it of little use: cs profiles live mostly on
third-party providers (GLM, MiniMax), whose model IDs churn constantly — a static official-only
catalog goes stale and misleads. The one durable piece of knowledge is the dot-form ↔ dash-form
conversion, which does not need a command.

## Decision

- The `cs models` command, the "Known models" hint in `cs config` show, and the models catalog
  constant are removed.
- The dot-form ↔ dash-form note moves to durable places that never drift: the README and a
  `cs config --help` example.
- The rest of decision 0017 is unchanged and stays in force: the `cs env` autocomplete (curated
  env-catalog for SET, existing keys for UNSET) remains.

> "Kiểm tra decision nào quyết định `cs models` … tôi thấy không hữu ích lắm, vì còn những (nhiều)
> model của provider khác." (user, 2026-11-04)
> "[Chốt] Bỏ cả (Recommended)" (user, 2026-11-04)

## Options considered

| Option                      | Consequence                                                |
| --------------------------- | ---------------------------------------------------------- |
| Remove catalog + command    | No stale list to maintain; the durable note keeps its home |
| Keep the hint, drop command | Hint still shows an official-only list on every show       |
| Expand to multi-provider    | Endless churn against fast-moving provider catalogs        |

## Consequences

- Easier: nothing to curate; README + help carry only the evergreen note.
- Harder: users on the official line lose the in-terminal reminder of the exact IDs.
- Enforced by: absence asserted in the config/ui tests (no Known-models line, no models command).
