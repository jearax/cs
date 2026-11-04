---
id: 0017
title: 'Suggestion UX: clack autocomplete for env keys and a curated models catalog'
status: Accepted
date: 2026-11-04
supersedes: none
---

# 0017: Suggestion UX — clack autocomplete for env keys and a curated models catalog

## Context

`cs env` required memorising exact env-var names, and `cs config` required memorising exact model
IDs. `@clack/prompts` 1.8.1 ships `autocomplete` natively, so suggestions need no new dependency.
For `cs config` (flag-driven, scriptable), mid-flag autocomplete is impossible without per-shell
completion scripts, so the catalog surfaces as a hint and a listing command instead.

## Decision

- `cs env` SET: the key prompt becomes clack `autocomplete` over a curated constant of well-known
  Claude Code env vars (each with a one-line description; cs-managed keys carry an "overrides cs"
  note). Free-text typing stays allowed; the `[A-Z][A-Z0-9_]*` validation is unchanged.
- `cs env` UNSET: autocomplete over the keys actually present in the chosen scope (global or that
  profile) — always accurate, data-driven.
- `cs config -n <name>` (show) prints a `Known models` hint line from the catalog; a new
  `cs models` command lists the catalog plus the dot-form ↔ dash-form note.
- The catalogs live in constants (curated by hand from the official env-vars documentation);
  no build-time fetching. `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN` are not suggested — cs
  manages them through profiles.
- Interactive config editing stays out of scope for now (flag surface untouched).

> "Khi ở bước set env, tên key tôi không biết được… có cách nào để gợi ý cho client hay không." (user, 2026-11-04)
> "[Catalog] Tôi chọn 1, nếu có hỗ trợ được như vậy, bạn xem giúp tôi luôn case của `cs config`" (user, 2026-11-04)
> "[Config UX] Catalog + hint (Recommended)" (user, 2026-11-04)

## Options considered

| Option                    | Consequence                                            |
| ------------------------- | ------------------------------------------------------ |
| Curated catalog (chosen)  | One constants file to maintain; offline, deterministic |
| Unset-only, no catalog    | Nothing to maintain, but SET keeps requiring memory    |
| Build-time docs fetching  | Always fresh, but adds a network dependency to builds  |
| Interactive config editor | Full UX, but a new flag-surface project                |

## Consequences

- Easier: no memorised names; unset always lists the truth.
- Harder: the catalog is hand-maintained and can drift from Claude Code's docs.
- Enforced by: env command tests (autocomplete options built from catalog/existing keys) and catalog tests.
