---
title: "Port jss-devtools core CLI conventions into cs"
description: "Scaffold the cs CLI skeleton (entry, core layer, enforced conventions, tsdown build, root tests/) following jss-devtools; no cs-cli feature port."
status: completed
priority: P2
effort: 6h
issue: none
branch: main
tags: [cli, toolchain, architecture]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Plan: Port jss-devtools core CLI conventions into cs

## Overview

Give `cs` the same skeleton quality as the reference repo `/Users/tandm/Documents/jearax/npm/jss-devtools`:
a commander entry point, a `core/` layer with `CliError` and exit codes, role-suffix file naming
enforced by an architecture test with negative fixtures, a tsdown single-bundle build, tests at the
repo root, and conventions documented once in `.harness/docs/`. Product commands are **not** in
scope — decision 0001 gates every cs-cli workflow port on the user naming it first.

Accepted decisions (xia challenge, user 2026-11-03):

- Tests live in `tests/` at the repo root (reference style), not colocated in `src/`.
- `.harness/` is the only docs/decisions home; no `docs/` tree is created.
- CLI parser: commander 15 + `@clack/prompts` (reference ADR 0004; citty was probed and rejected there).
- Build: tsdown, exact-pinned (decision 0002; reference ADR 0005).

## Phases

| Phase | File | Objective |
| ----- | ---- | --------- |
| 01 | [phase-01-tsdown-toolchain.md](./phase-01-tsdown-toolchain.md) | Replace the tsc build with tsdown; wire deps and scripts |
| 02 | [phase-02-cli-entry-and-core.md](./phase-02-cli-entry-and-core.md) | `src/cli.ts` entry + `core/` (exit codes, `CliError`, package facts) |
| 03 | [phase-03-architecture-rules-and-tests.md](./phase-03-architecture-rules-and-tests.md) | Architecture rules with negative fixtures; move tests to `tests/`; ESLint import rules |
| 04 | [phase-04-conventions-docs.md](./phase-04-conventions-docs.md) | Code-standards doc (conventions doc) — authored after the rules are enforced; overview + CLAUDE.md already delivered by the ak-docs init run |

## Constraints (in force)

- Decisions 0001 (no cs-cli port without user naming it) and 0002 (jss-devtools packaging) apply.
- Every new dependency is pinned to an exact version (reference rule).
- Never edit `.harness/templates/`, `.harness/bin/`, `.harness/core/`, or `harness-*`/`ak-*` skills.
- Cooker implements; planner reviews. Harness never commits — report done, commit is a separate step.

## Non-goals

- No cs-cli command port (`config`, `use`, …) — gated by decision 0001.
- No `src/modules/` layer — cs has no second feature that needs it yet; add with the first module.
- No CI, release pipeline, or npm publishing.
- No banner art port — `cs` adopts the reference's help/version structure, banner polish comes with the first command.

## Final verification (after all phases)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node dist/cli.mjs --help     # prints help
node dist/cli.mjs --version  # prints 0.0.0
node dist/cli.mjs            # bare run prints help, exit 0
```

Failure of any command is a failed phase, not a note.

## Rollback

Each phase is one commit-sized unit on `main`; `git revert` of the phase commit restores it.
The scaffold commit `ac76f67` is the recovery point.
