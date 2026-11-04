---
title: "Suggestion UX: env autocomplete + models catalog"
description: "Clack autocomplete for cs env (curated catalog for set, existing keys for unset); models catalog hint in config show + cs models command."
status: pending
priority: P2
effort: 2h
issue: none
branch: main
decision: 0017
created: 2026-11-04
---

# Plan: suggestion UX (decision 0017)

## Overview

`cs env` gains clack-autocomplete suggestions (curated catalog for SET, existing keys for UNSET);
`cs config` show gains a known-models hint and a new `cs models` command lists the catalog.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/constants/env-catalog.constant.ts` | new — curated env-var entries `{key, description, managedByCs?}` (~10-12 keys: `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_DISABLE_1M_CONTEXT` (managed note), `CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `CLAUDE_CODE_SUBAGENT_MODEL`, `ANTHROPIC_SMALL_FAST_MODEL`, `MAX_THINKING_TOKENS`, `DISABLE_TELEMETRY`, `DISABLE_ERROR_TELEMETRY`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_AUTOUPDATER`), sourced from the official env-vars docs |
| `src/modules/profiles/constants/models.constant.ts` | new — official model IDs (`claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`) + the `[1m]` suffix note |
| `src/commands/env/services/env.service.ts` | SET: clack `autocomplete` over catalog options (label = key, hint = description; free-text allowed, pattern validation unchanged); UNSET: `autocomplete` over keys present in the chosen scope |
| `src/commands/config/services/config.service.ts` + `core/ui/profile.ui.ts` | show path prints a `Known models:` hint line from the catalog |
| `src/commands/models/` (+ `src/cli.ts`) | new `cs models` command: lists catalog + the dot-form ↔ dash-form note (`denormalizeModelId`) |
| `tests/env.command.test.ts`, `tests/models.command.test.ts` (+ catalog tests) | options built from catalog; unset options = existing scope keys; models output |
| `README.md` | the suggestion UX note |

## Steps

1. Catalogs + tests; 2. env flow autocomplete (set + unset); 3. config hint + `cs models`; 4. README.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs models                       # catalog + note
HOME=$H node dist/cli.mjs config -n work               # Known models hint present
```

(The autocomplete prompts themselves are interactive — covered by option-building unit tests; the
prompt flow is exercised manually by the user.)

## Risk & rollback

- Catalog drift from Claude Code docs — hand-maintained by design; the source is cited in the constant.
- Rollback: `git revert` of the single commit.
