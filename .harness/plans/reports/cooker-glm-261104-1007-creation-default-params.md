# Report: cooker-glm — creation-time default params (decision 0015, plan 261104-1007)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Step 0 — discard the superseded seed task

The decision-0014 task was stopped before any file edit (only plan/decision/constant reads), and
`git status` at the start of this task showed no `src/` or `tests/` changes — nothing to
`git checkout` or delete. The tree carried only planner-owned `.harness/` entries.

## Outcome

Creating a new profile with `cs config` fills every unspecified field from the current `default`
record (fallback: the OFFICIAL constant); updating an existing profile keeps the current
partial-update semantics; the decision-0008 guards run on the effective record after inheritance.

## Change

- `src/commands/config/services/config.service.ts` (`runConfig`, update path): the effective
  record base is now `existing ?? findProfile(config, 'default') ?? OFFICIAL_PROFILE` instead of
  `existing` alone, so a creation merges `{ EMPTY, defaultRecord, flags }` — flags win, url and
  token participate. For an existing profile the base stays `existing`, so nothing changes there.
  The persisted write is `upsertProfile(config, name, existing === undefined ? effective : update)`.
  Both guards (`hasTokenWithoutUrl`, `hasBothTokens`) keep running on `effective` after the merge,
  unchanged in position.
- No name is special-cased; the generic rule covers `default` itself too (it always exists, so the
  rule never fires for it in practice).

## Tests (`tests/config.command.test.ts`, 23 in file)

Updated for the new semantics:

- "creates a profile from the flags": unspecified `haiku` now inherits `claude-haiku-5-5[1m]`
  instead of asserting blank.
- "rejects a token without a url" → "…on the record after inheritance": the default's url is
  cleared first, so the inherited record has no url and the guard still fires — this is the
  guards-after-inheritance case.

New per the plan matrix:

- "fills creation from the default record when only a token is passed" — `claude` with `-t` only:
  official url, official model line, user token.
- "does not inherit on an update when the default record has moved on" — update path keeps the
  profile's own values.
- "creates from the live default record, not a snapshot" — default edited first, creation
  inherits the new values.
- "fires the both-tokens guard on the inherited record" — `-t` + `--oauth-token` with no `-u`:
  the inherited official url satisfies the url guard, and the both-tokens guard still rejects.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (18 files, 202/202), `pnpm build` — pass.
- Plan smoke in a tmp `$HOME` (fake token, deleted afterwards):
  1. `cs config -n claude -t <fake>` — created; `cs config -n claude` shows the official URL and
     model line with the user's token (masked).
  2. `cs config -n claude -s glm-4.6` — update; only sonnet changes, the rest keeps its values
     (asserted by the update test).
- README updated: creation inherits from the live `default` record; updates never re-inherit.

## Comment hygiene (planner follow-up)

`antislop-code` applied to the pending diff: one comment block in `config.service.ts` ran three
lines with a restating third line — tightened to two lines (the inheritance rule and the
update rule), code untouched. No other comments in the diff. Full gate re-run after the pass:
lint, typecheck, 202/202 tests, build — all green. Standing instruction noted as applying to
future tasks too.

Planner hygiene follow-up: the `(decision 0015)` reference was removed from the same comment —
code comments do not cite decision IDs (user standing rule, now recorded in
`.harness/docs/code-standards.md`). The why stays in the comment. Gate re-run: green, 202/202.

## Not checked

- A real-environment run (only the user tests the real HOME, per the standing rule).
