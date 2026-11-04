# Report: cooker-glm — models catalog removal (decision 0019, plan 261104-1156)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

`cs models`, the `Known models:` hint and the models constant are gone; the durable dot-form note
now lives in the README and a `cs config --help` example. The rest of decision 0017 (`cs env`
autocomplete + `env-catalog.constant.ts`) is untouched.

## Changes

- Deleted: `src/commands/models/`, its registration in `src/cli.ts`,
  `src/modules/profiles/constants/models.constant.ts`, `tests/models.command.test.ts`.
- `src/core/ui/profile.ui.ts`: `knownModelsLine()` removed; the config show path prints only the
  profile fields again.
- `src/commands/config/config.command.ts`: `addHelpText('after')` example —
  `cs config -n claude -s claude-sonnet-4.7 stores claude-sonnet-4-7 (dot form converted); append [1m] for the 1M window.`
- Tests: config help test asserts the example is present and `Known models` is absent; the config
  show test asserts no `Known models` line. `denormalizeModelId` behaviour test untouched.
- `README.md`: `cs models` row and section removed; the dot-form note moved into the `cs config`
  section (dotted ID pastes as-is, only `claude-` IDs convert, `[1m]` for the 1M window).

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 211/211 — three models tests
  removed with the feature), `pnpm build` — pass.
- Plan smoke in a tmp `$HOME`: `cs models` → `Error: unknown command 'models'`; `cs config -n
  default | grep -ci "known models"` → 0; `cs config -h` carries the dot-form example.
- `antislop-code` applied: this task's diff adds no comments (pure removal plus the help-text
  string); nothing to trim. No changes after the last full-gate run.

## Not checked

- Nothing; the removed surfaces are asserted absent by the smoke and the updated tests.
