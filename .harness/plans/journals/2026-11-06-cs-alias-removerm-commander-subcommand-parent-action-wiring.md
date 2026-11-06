---
title: "cs alias remove|rm: commander subcommand + parent action wiring"
date: 2026-11-06
summary: Implemented decision 0024 via a commander 15 subcommand under the parent alias command; validate-all-then-remove keeps unknown names atomic; gate 260/260 green
---

# cs alias remove|rm: commander subcommand + parent action wiring

## What happened
Implemented `cs alias remove|rm <alias...>` per decision 0024 (supersedes 0011). Chose commander's subcommand + parent-action wiring over keyword branching: `remove <aliases...>` (alias `rm`) sits under the existing `alias <name> <profile>` command, so commander 15 dispatches the first operand to the subcommand when it matches and falls through to the parent action otherwise. That keeps commander-native `missing required argument` errors, variadic parsing, `-h` on both forms, and the unknown-argument exit 1 without any manual branching.

New service `src/commands/alias/services/alias-remove.service.ts`: trim + dedupe, validate every name, load config, verify every alias exists (unknown → CliError with `cs list` hint, nothing removed), then per alias `removeAlias` + `removeAliasLauncher`, `saveCsConfig` last — a launcher is never orphaned by a failed save. `runAlias` now rejects `remove`/`rm` as alias names (reserved).

## Decision
Subcommand + parent action over one-command keyword branching: branching forces optional args, which loses commander's missing-argument error for the `remove` form and needs synthesized exit codes.

## Next steps
- Working tree left uncommitted per ticket; user commits.
- README updated (command table + alias section); prettier formatted.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
