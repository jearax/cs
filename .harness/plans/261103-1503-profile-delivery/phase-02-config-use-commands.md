# Phase 02: config and use commands

## Context

The renderer and storage service exist (phase 01). Commands wire them to the CLI, keeping the old
interactive defaults and adding decision 0004's `--file` mode to `use`.

## Requirements

- Old behaviour per the inventory: partial-update flags, show-on-no-flags, token masking, name
  validation, token-without-URL guard on both commands, `--fable` mirrors `--opus` on create, model
  IDs through `denormalizeModelId`, confirmations listing all six fields.
- `cs use <name>` (default) renders artifact + launcher AND performs the old global write.
- `cs use <name> --file` renders artifact + launcher, prints the launch command; global untouched.

## Files

| File | Action |
| ---- | ------ |
| `src/commands/config/config.command.ts` | new — commander wiring, flags `-n -u -t -h -s -o -f`; no flags = show (masked); errors via `CliError` with hints |
| `src/commands/config/services/config.service.ts` | new — arg validation + orchestration; prints nothing |
| `src/commands/use/use.command.ts` | new — positional name, `--file` flag |
| `src/commands/use/services/use.service.ts` | new — orchestrates render + (default only) global write; prints nothing |
| `src/modules/profiles/services/render-artifacts.service.ts` | new — writes `profiles/<name>.json` (0600) + launcher (0755), returns the launch command text for `--file` |
| `tests/config.command.test.ts` | new — show/update/fable-mirror/token-without-URL/name-validation paths |
| `tests/use.command.test.ts` | new — global mode writes settings.json, `--file` leaves global untouched, both render artifacts |

## Steps

1. Tests first per inventory row, then the service, then the command wiring.
2. `use` default = render artifacts + old global write; `--file` = render artifacts only, print command.
3. Artifact writes go through `render-artifacts.service.ts` so both commands share one implementation.

## Validation

```bash
pnpm typecheck && pnpm test -- config,use && pnpm build
```

## Risk & rollback

- Highest-risk behaviour: default `use` now does global write + artifact render — a wrong renderer
  breaks real user settings. The phase-01 precedence matrix is the guard.
- Rollback: delete the two command folders and their test files.
