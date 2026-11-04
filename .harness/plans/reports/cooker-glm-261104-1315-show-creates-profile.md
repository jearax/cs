# Report: cooker-glm — show creates missing profile (decision 0020) + help polish

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Trigger

The user re-ran the decision-0014 use case (`cs config --name claude` on a missing profile) and hit
`Profile "claude" not found` — the gap left after 0015 superseded 0014: no decision covered a bare
show on a missing name. Settled with the user over two questions:

- The show **creates** the profile with creation defaults, persists it, and shows it.
- The behaviour applies to **every name**, consistent with 0015 (no special case).
- Help hints must name the source explicitly: `copied from the "default" profile on creation`.
- `--oauth-token`'s help text drops the `(CLAUDE_CODE_OAUTH_TOKEN)` detail.
- Planner follow-up: enrich `cs alias` help (concept + example + re-point note).

Recorded as **decision 0020** (`.harness/decisions/0020-show-creates-missing-profile.md`), index row added.

## Changes

- `config.service.ts`: `applyProfileRecord` helper extracted (alias guard + default-record merge +
  credential guards — shared by the flag path and the show path); the show branch now creates the
  missing profile through the same helper, saves, renders the artifact, and returns kind
  `created`. `ConfigResult.kind` gains `'created'`.
- `config.command.ts`: `DEFAULT_SOURCE_NOTE` = `copied from the "default" profile on creation`
  (replacing the "inherited" wording); `--oauth-token` description is now `Claude Code login token`;
  the `created` kind prints `Profile "<name>" created with the "default" record.` above the fields.
- `alias.command.ts`: description now `Create or re-point the claude-<name> launcher: a standalone
  claude command bound to a profile`, plus an `addHelpText('after')` example with the re-point note.
- `README.md`: the `cs config` section documents show-creates (and the alias refusal); the alias
  section and commands row use the standalone-command wording.
- Tests: show-create asserts the exact record in cs.json (the user's target JSON) + the rendered
  artifact exists; new alias-refusal-on-show test; help assertions updated to the new note text and
  bare oauth description.

## Verification

- Full gate green after each step: lint, typecheck, 219/219 tests, build.
- tmp-`$HOME` smoke: `cs config -n claude` prints `created with the "default" record` + the official
  line; cs.json holds exactly the user's target record; `config -h` shows the new hints and the bare
  oauth line; `alias -h` shows the new description and example.
- `antislop-code` applied: no new comments beyond the moved why-comments in the service; clean.

## Not checked

- Nothing beyond the standing real-env boundary (the user runs the real HOME).

## Addition (planner scope expansion): examples pattern ported from jss-devtools

- `src/core/ui/help-examples.ui.ts` (new): `examplesText(rows)` — the `Examples:` block helper
  ported from the reference repo's same-named file (aligned columns, dim `$`, cyan command,
  `helpTitle('Examples:')`); the import adapts to the `@/core/ui/terminal.ui` path.
- `EXAMPLE_ROWS` + `addHelpText('after', examplesText(...))` added to config (3 rows: creation
  inheritance, show-creates, dot-form note folded in from the previous single-line example), use,
  alias (2 rows carrying the launcher concept + re-point), remove, reset. `current` and `list`
  skipped — examples would add no information.
- README stays consistent: its `cs config`/`cs alias` sections already carry the same examples in
  code-block form; the alias commands row now reads "Create or re-point the `claude-<name>`
  launcher for a profile".
- Tests: the config help test asserts `Examples:` + the folded dot-form row (`Stores
  claude-sonnet-4-7 (dot form converted)`); the alias help test asserts the examples block and
  both rows.

Verification: full gate green — lint, typecheck, 219/219 tests, build; tmp-`$HOME` smoke renders
the aligned `Examples:` blocks for config and alias. `antislop-code` applied: one JSDoc line on
the ported helper; no slop. No commit.
