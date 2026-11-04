# Report: cooker-glm — suggestion UX (decision 0017, plan 261104-1055)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

`cs env` suggests keys through clack `autocomplete` (curated catalog for SET, actually-set keys
for UNSET); `cs config` show prints a `Known models:` hint; the new `cs models` command lists the
catalog with the dot-form/`[1m]` notes. Descriptions verified against the official docs
(code.claude.com/docs/en/env-vars) before writing the catalog.

## Changes

- `src/modules/profiles/constants/env-catalog.constant.ts` (new): `ENV_CATALOG`, 10 hand-curated
  entries `{key, description, managedByCs?}`, sorted; the two keys cs derives from `[1m]` carry
  `managedByCs`, rendered as an "(overrides cs)" hint suffix. No `ANTHROPIC_BASE_URL`/`AUTH_TOKEN`.
- `src/modules/profiles/constants/models.constant.ts` (new): `KNOWN_MODELS` — the four official
  IDs.
- `src/commands/env/services/env.service.ts`: `buildSetKeyOptions()` (label = value = key, hint =
  description) and `buildUnsetKeyOptions(scope, profileName)` (keys actually present in the
  scope's env, data-driven). Pattern validation stays in the command.
- `src/commands/env/env.command.ts`: the key prompt is now `autocomplete` for both actions
  (free-text typing still allowed, `[A-Z][A-Z0-9_]*` validate unchanged, `completeOnTab`). UNSET
  with no keys in the scope prints "No env keys set in <target>." instead of an empty prompt.
- `src/core/ui/profile.ui.ts` + `src/commands/config/config.command.ts`: the show path prints
  `knownModelsLine()` after the profile fields.
- `src/commands/models/models.command.ts` (new) + registration in `src/cli.ts`: lists
  `KNOWN_MODELS` plus the note that a dotted ID (`claude-opus-4.7`) is normalized to the dash form
  and `[1m]` opts into the 1M window.
- Tests: `tests/env-catalog.constant.test.ts` (sorted/unique/valid keys, no credential keys, the
  overrides-cs flag only on the derived pair), option-builder tests in
  `tests/env.command.test.ts`, `tests/models.command.test.ts` (models output, config hint, help).
- `README.md`: commands table row, `cs env` suggestions note, `cs models` section.

## Deviation from the plan's key list (resolved, flagged)

The plan listed `DISABLE_ERROR_TELEMETRY`; the official env-vars docs name that key
`DISABLE_ERROR_REPORTING` and have no `DISABLE_ERROR_TELEMETRY`. The catalog carries
`DISABLE_ERROR_REPORTING` — suggesting a non-existent key would break at Claude Code runtime.
Flagging in case the planner wants it under a different name.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (20 files, 214/214), `pnpm build` — pass.
- tmp-`$HOME` smoke: `cs models` prints the four IDs plus the dot/`[1m]` note; `cs config` show
  prints the `Known models:` hint line. The autocomplete prompts are interactive — covered by the
  option-building unit tests; exercised manually by the user per the plan.
- `antislop-code` applied: the only comments are one-line JSDoc contracts on the builders, the
  hint helper, and the two constants (source-citation + managed-note); no slop, no changes after
  the last full-gate run.

## Not checked

- The interactive clack flow on a real TTY (per plan, the user exercises it manually).
- The catalog's long-tail accuracy beyond the 10 curated keys (hand-maintained by design).
