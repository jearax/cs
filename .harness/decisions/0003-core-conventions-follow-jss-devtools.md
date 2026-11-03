---
id: 0003
title: Core layout, role suffixes, exit codes and the @/ alias follow jss-devtools
status: Accepted
date: 2026-11-03
supersedes: none
---

# 0003: Core layout, role suffixes, exit codes and the @/ alias follow jss-devtools

## Context

The conventions port (plan 261103-1348-core-cli-conventions) made jss-devtools' core conventions
enforceable in `cs`: an architecture test (`tests/support/architecture-rules.ts`, one negative
fixture per rule) now rejects files outside the role-suffix layout, `process.exit` or global
handlers outside the entry point, and parent-relative or extension imports. The harness rule says
`.harness/decisions/` is the only product policy, so the enforced rules need a record. The
reference records them as ADRs 0023 (exit codes), 0024 (layout and rules) and 0025 (import alias).

## Decision

- `src/` holds `cli.ts` (the only file that owns process exit and global handlers), `core/`
  (shared, imports no command), and one folder per command under `commands/` when commands land.
- Every file name carries its role suffix (`.command.ts`, `.service.ts`, `.ui.ts`, `.util.ts`,
  `.constant.ts`, `.error.ts`, `.type.ts`, …); the full table in `.harness/docs/code-standards.md`
  is a copy — `tests/support/architecture-rules.ts` is the contract.
- Exit codes are 0 (ok) and 1 (failure); an expected failure throws `CliError` with an optional
  hint; anything else is a crash rendered by the entry, never exit 0.
- Imports use the `@/` alias to leave a folder, stay `./` inside one, are parent-relative never,
  and carry no file extension.

> "IMHO, plan to scaffold structure, comventions, docs,... for common / core CLI, refs to
> jss-devtools, use ak:xia skill." (user, 2026-11-03)
> "[Chọn] Theo jss-devtools (Recommended)…" (user, 2026-11-03, decision 0002)

## Options considered

| Option                 | Consequence                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| Adopt as one record    | One place states the policy; the test remains the contract                 |
| Three separate records | Mirrors the reference ADR numbering; more files than a CLI this size needs |
| No record              | Violates the harness rule that unrecorded policy is a comment              |

## Consequences

- Easier: any future command inherits an enforced shape instead of inventing one; scripts can rely
  on exit 0 meaning success.
- Harder: a new role suffix or a `modules/` layer means touching the scanner and its fixtures, not
  just creating folders.
- Enforced by: `tests/architecture.test.ts` and the CLI tests.
