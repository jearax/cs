# Phase 03: Architecture rules, tests at root, ESLint import rules

## Context

The reference enforces its layout with a test, not a comment: a scanner
(`tests/support/architecture-rules.ts`) plus one negative fixture per rule
(`tests/fixtures/architecture/`). The scaffold has no such enforcement. Tests move to the repo
root in this phase (user decision, 2026-11-03).

## Requirements

- Every rule from the ported set has a negative fixture that breaks exactly that rule.
- The scanner resolves `@/` imports the same as relative ones.
- Tests live under `tests/` at the repo root.

## Files

| File | Action |
| ---- | ------ |
| `tests/support/architecture-rules.ts` | new — port of the reference scanner; rule set for cs's current structure: `file-role-suffix`, `core-imports-no-command`, `command-imports-no-other-command`, `commander-in-command-files-only`, `clack-in-ui-layer-only`, `output-in-ui-layer-only`, `child-process-in-runner-only`, `no-process-exit-outside-entry-point`, `no-global-process-handlers-outside-entry-point`. Defer the `runner-in-adapters-only` and modules-layer rules until cs gains an adapter/module |
| `tests/fixtures/architecture/` | new — port the fixture tree adapted to cs's folders; one fixture per rule, each breaking exactly that rule |
| `tests/architecture.test.ts` | new — port of the reference suite (real-tree scan + fixture-per-rule + alias unit checks) |
| `tests/cli.test.ts` | new — already specified in phase 02; lands here if not earlier |
| `src/main.test.ts` | delete (placeholder test) |
| `vitest.config.ts` | `include: ['tests/**/*.test.ts']`; alias `@/` → `src/` (see the reference vitest config for the alias mechanism) |
| `tsconfig.json` | switch `include` to `["**/*"]` with the reference's exclude list (`node_modules`, `dist`, `coverage`, `plans`, `.agentkit`) so tests type-check |
| `eslint.config.mjs` | add the reference's `no-restricted-imports` patterns (`../*` banned, extensionless imports banned); exempt `tests/fixtures/**`; extend the lint glob to `tests/` |
| `.harness/plans/...` | nothing |

## Steps

1. Port the scanner and rules; adapt fixture paths to cs's folder set (no `modules/` fixtures).
2. Port `tests/architecture.test.ts`.
3. Move test layout: delete `src/main.test.ts`, update `vitest.config.ts`, `tsconfig.json`.
4. ESLint: import rules + fixtures exemption + glob.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test
# proof of enforcement: a rule break must fail the suite —
# temporarily add a process.exit to a core file, run pnpm test, see the architecture test fail, revert
```

## Risk & rollback

- The scanner is the largest single port (~the reference's whole support file). Port, do not
  rewrite: every deviation from the reference scanner is a potential hole.
- `noUncheckedIndexedAccess` etc. apply to the scanner too — expect type fixes during the port.
- Rollback: delete `tests/`, restore `src/main.test.ts`, revert the three config files.
