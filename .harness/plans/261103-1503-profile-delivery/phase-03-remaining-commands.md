# Phase 03: current, ls, remove, reset, env

## Context

Five commands remain from the inventory. Their old behaviour carries over, extended with decision
0004's artifact/launcher lifecycle: `remove`/`reset` clean cs-owned files, `current`/`ls` surface
the rendered artifacts.

## Requirements

- `current`: old meaning preserved (stored `currentProfile`, else reverse-detect from global
  settings); additionally lists profiles that have a rendered `profiles/<name>.json`.
- `ls`: old behaviour + a marker for profiles with artifacts (presentation-only extension; flag any
  deviation in the report).
- `remove <name>`: old guards (`default` not removable; removing active clears `currentProfile`)
  plus artifact + launcher deletion via the cleanup service.
- `reset`: old behaviour (keep only OFFICIAL `default`, activate it) plus cleaning cs-owned entries
  in `profiles/` and `bin/` (ownership marker: the `claude-<profile>` launcher naming).
- `env`: interactive (@clack), old flow (scope → set/unset → `[A-Z][A-Z0-9_]*` key → value, never
  print a raw value); after changing a profile with artifacts, re-render that profile's artifact +
  launcher.

## Files

| File | Action |
| ---- | ------ |
| `src/commands/current/`, `ls/`, `remove/`, `reset/`, `env/` | new command folders per the decision-0003 layout (`*.command.ts` + `services/*.service.ts`) |
| `src/modules/profiles/services/artifact-cleanup.service.ts` | new — deletes `profiles/<name>.json` + `bin/claude-<profile>`, only for names matching a valid profile name |
| `tests/current.command.test.ts` | current: stored, reverse-detect, rendered-list line |
| `tests/ls.command.test.scopes` | — (placeholder row: see tests list below) |

## Tests

- `tests/current.command.test.ts`, `tests/ls.command.test.ts`, `tests/remove.command.test.ts`,
  `tests/reset.command.test.ts`, `tests/env.command.test.ts`.

## Steps

1. Port each command + service, tests first per inventory row.
2. Cleanup goes through `artifact-cleanup.service.ts`; commands never touch fs directly.
3. `env` re-renders the affected profile's artifacts after a set/unset.

## Validation

```bash
pnpm typecheck && pnpm test -- current,ls,remove,reset,env && pnpm build
```

## Risk & deletion safety

- `remove`/`reset` touch `~/.config/cs/bin/` — never delete anything not matching
  `claude-<valid-profile-name>` and `profiles/<valid-profile-name>.json`.
- Rollback: delete the command folders, the cleanup service, and their test files.
