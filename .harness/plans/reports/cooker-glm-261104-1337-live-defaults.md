# Report: cooker-glm — live default values in config help + wording

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

`cs config -h` renders the LIVE values of the current `default` record for url/token/haiku/sonnet/
opus/fable — e.g. `Sonnet model (default: "claude-sonnet-5-5[1m]")` — while `--name` keeps its
static `(default: "default")`, `--token` renders nothing when the inherited value is empty, and
`--oauth-token` stays bare. The `[1m]` note reads `add [1m] if the model supports it and you need
it` (the user's final wording).

## Change

- `storage.service.ts`: `readLiveDefault(field)` — a synchronous read for help rendering only;
  a missing file, missing field or empty value yields `undefined`. `LiveDefaultField` names the
  six fields.
- `config.command.ts`: `liveOption(flags, description, field)` stamps the field onto the commander
  Option as `csLiveDefault`; applied to url/token/haiku/sonnet/opus/fable. Registration stays
  read-free — the read happens only when help renders.
- `cli.ts`: the `optionDescription` handler resolves `csLiveDefault` lazily (after
  `defaultValueDescription` and static `defaultValue` in precedence) and stringifies the live
  value. The option carries a custom property, so the handler casts through `unknown` (commander's
  `Option` has no index signature).
- Wording: config Examples row is `['cs config -n work -s claude-sonnet-5-5', 'Sonnet model; add
  [1m] if the model supports it and you need it']` — the user's final phrasing (superseding the
  intermediate "if you want" variant).
- Tests: the help test seeds cs.json first (the live defaults need a record), then asserts the
  sonnet/url live parentheticals and the absent token parenthetical.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 219/219), `pnpm build` — pass.
- tmp-`$HOME` smoke: `config -h` shows live url/models from the default record, bare token, static
  `--name`, bare `--oauth-token`.
- `antislop-code` applied: the updated handler comment (why) and a one-line JSDoc on `liveOption`;
  no slop.

## Not checked

- Nothing beyond the standing real-env boundary.

## Addition (user refinements during the task)

- Final `[1m]` wording: `add [1m] if the model supports it and you need it` (went through
  "append ... for the 1M window" → "if you want" → this).
- Profile names in the config Examples use role-style names (`planner`, `work`) — `claude` as a
  profile name collided visually with the `claude` binary; the other commands' examples already
  used role names. No `cs config -n claude` remains in any example.
