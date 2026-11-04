# Report: cooker-glm — default note cleanup (planner cleanup, no decision file)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Change

- `config.command.ts`: `DEFAULT_SOURCE_NOTE` and its `defaultValueDescription` attachments on
  url/token/haiku/sonnet/opus/fable are gone — those options carry bare descriptions again; no
  parenthetical renders for them. `--name` keeps its real commander `.default('default')`, so
  `(default: "default")` still renders through the configureHelp handler. The Examples block is
  unchanged and remains the single place documenting the creation-time inheritance.
- `tests/config.command.test.ts`: the note-text assertion is replaced by a negative assertion —
  the help must not contain `copied from the "default" profile on creation`; the
  `(default: "default")` and Examples assertions stay.

Note for the planner: decision 0020's second bullet still names that hint text as part of the
decision; the cleanup you directed supersedes it — worth a one-line edit in the decision file on
your side.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 219/219), `pnpm build` — pass.
- tmp-`$HOME` smoke of `cs config -h`: only `--name` carries a parenthetical; the other options
  render bare; the Examples block prints as before.
- `antislop-code` applied: the diff adds no comments. No changes after the gate.

## Not checked

- Nothing; the removed rendering is asserted absent by the updated test.
