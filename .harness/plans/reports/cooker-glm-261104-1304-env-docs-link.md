# Report: cooker-glm — env SET docs reference line (user request, no decision file)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

The `cs env` SET flow prints `Reference: https://code.claude.com/docs/en/env-vars` (via clack
`log.info`, plain auto-linked URL text) before the Env key autocomplete prompt. The UNSET flow
stays without the hint — its options are data-driven.

## Change

- `env-catalog.constant.ts`: `ENV_DOCS_URL` — one home for the catalog's source URL; the catalog
  JSDoc now points at the constant instead of repeating the URL.
- `env.service.ts`: `envDocsHintLine()` returns `Reference: <ENV_DOCS_URL>` (pure string, so the
  line is unit-testable without driving the interactive prompt).
- `env.command.ts`: SET branch prints the hint via `log.info` right after the action select,
  before the key prompt.
- Tests: the catalog test asserts the constant is the official URL; a new two-line describe
  asserts the hint line's exact text.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 218/218), `pnpm build` — pass.
- `antislop-code` applied: two one-line JSDoc contracts; no slop. No changes after the gate.

## Not checked

- The rendered hint on a real TTY (clack `log.info` styling is user-exercised, per standing rule).

## Addition (user decision): catalog narrows to the cs-managed pair

With the docs-link hint in place, `ENV_CATALOG` now holds EXACTLY the two `managedByCs` entries —
`CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_DISABLE_1M_CONTEXT` — the keys cs itself interacts
with. `CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `CLAUDE_CODE_SUBAGENT_MODEL` and `MAX_THINKING_TOKENS` are
dropped (pure pass-through; the docs reference covers them). The SET autocomplete therefore
offers the two managed suggestions plus the dynamic custom option for anything else — free-text
behaviour unchanged.

Tests updated: the catalog test asserts the exact two-key keep-list; the SET options test asserts
the two values and that both hints carry the "overrides cs" note (the plain-entry assertion went
away with the plain entries); the getter's catalog-match test moved to a surviving key
(`CLAUDE_CODE_DISABLE_1M_CONTEXT`); the dynamic custom-option tests are unchanged in behaviour.

Verification: full gate green — lint, typecheck, 218/218 tests, build. `antislop-code` applied:
only the constant's JSDoc contract changed; no slop. No commit.
