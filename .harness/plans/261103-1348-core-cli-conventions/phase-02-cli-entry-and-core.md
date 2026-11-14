# Phase 02: CLI entry and core layer

## Context

`src/` holds only a placeholder `src/main.ts`. The reference enforces one entry that owns process
decisions and a `core/` that imports no command. cs-cli's old entry (citty) is not portable — the
parser decision is commander (reference ADR 0004, citty rejected there).

## Requirements

- One entry, `src/cli.ts`, that builds the commander program, owns `process.exitCode` and global
  handlers; nothing else touches process state.
- `core/` holds exit codes, `CliError`, package facts — shared, imports no command, wires no CLI.
- No product command is registered (decision 0001): bare run, `--help`, `--version` work.

## Files

| File | Action |
| ---- | ------ |
| `src/cli.ts` | new — port of `~/Documents/jearax/npm/jss-devtools/src/cli.ts`, adapted: `PACKAGE` constant supplies name/description/version; no subcommand registration (register functions come with each future command); keep the `exitOverride` program option and the `CommanderError` / `CliError` / fatal error paths |
| `src/core/constants/exit-code.constant.ts` | new — `ExitCode = { ok: 0, failure: 1 }` |
| `src/core/constants/package.constant.ts` | new — reads the package facts (`scripts/package-info.mjs`) |
| `src/core/errors/cli.error.ts` | new — port from the reference `src/core/errors/cli.error.ts` |
| `src/core/ui/terminal.ui.ts` | new — minimal port: `renderError` (stderr), `isInteractive` guard; do NOT port spinner/tasks yet |
| `src/main.ts` | delete (the placeholder) |
| `tests/cli.test.ts` | new — port of the reference `tests/cli.test.ts`, adapted: bare run shows help, `--version` prints the package version, a `CliError` from a command path renders to stderr with exit 1 (use `exitOverride` + injected argv) |

## Steps

1. Port `exit-code.constant.ts`, `cli.error.ts`, `package.constant.ts` from the reference.
2. Port `cli.ts` adapted (no subcommands, no banner beyond what `core/ui` provides).
3. Delete `src/main.ts`.
4. Write `tests/cli.test.ts` using the reference test as the model; reuse `exitOverride`.

## Validation

```bash
pnpm typecheck
pnpm build && node dist/cli.mjs --version   # prints 0.0.0
node dist/cli.mjs                            # help, exit 0
pnpm test                                    # cli.test.ts green
```

## Risk & rollback

- `package.constant.ts` must read facts once (reference "one fact, one home"); if the reference's
  define-based approach does not survive the port, read `package.json` via `createRequire` at
  runtime and keep package.json out of `files` — state the deviation in the report.
- Rollback: delete the new files; `src/main.ts` returns from the scaffold commit.
