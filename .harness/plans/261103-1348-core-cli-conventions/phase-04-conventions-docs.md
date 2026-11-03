# Phase 04: Code standards doc

## Context

The conventions the architecture rules enforce need one written home (user's ak-docs init run
established `.harness/docs/` as the docs home and already delivered the project overview and the
CLAUDE.md project block). This phase documents the now-enforced rules once the code exists, so the
doc matches enforced reality instead of intent.

## Requirements

- One doc, `.harness/docs/code-standards.md`, owning engineering choices the architecture test
  enforces plus the testing policy.

## Files

| File | Action |
| ---- | ------ |
| `.harness/docs/code-standards.md` | new — role-suffix table (adapted: no `modules/` rows), import rules (`@/` alias, `../` banned, extensionless), exit-code scheme, `CliError` contract, output-layer rules, testing policy (tests at root, fixture-per-rule, bundle smoke test), definition of done (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) |
| `.harness/docs/README.md` | add its index row |
| `.harness/MEMORY.md` | add the pointer line |

## Steps

1. Author `.harness/docs/code-standards.md` per `doc-content-rules.md`: point, do not paraphrase —
   link `tests/support/architecture-rules.ts` as the contract, the table is a copy and the code wins.
2. Update the index and memory pointer in the same change.

## Validation

- Every rule documented exists in `tests/support/architecture-rules.ts`; no rule exists only in prose.
- `pnpm lint` passes (prettier formats markdown via lint-staged on commit).

## Risk & rollback

- Doc drift: the architecture test is the contract; the doc says so explicitly.
- Rollback: delete the file and its index/memory rows.
