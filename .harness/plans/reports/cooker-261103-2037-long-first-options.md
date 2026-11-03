# Report: long-first option declarations

- Date: 2026-11-03
- Plan: `.harness/plans/261103-2037-long-first-options/plan.md`
- Scope: display-only rewrite of `cs config`'s option declarations, short-first → long-first
- Commit: none (the plan asked for no commit)

## Outcome

Every paired option on `cs config` now declares the long form first, so the help table reads
`--name, -n <name>` and matches the root command's `--version, -v` / `--help, -h`. Parsing is
unchanged: commander splits the flag string on the comma, so `-n` and `--name` still mean the same
option and every existing invocation keeps working.

## Changes

| File | Change |
| ---- | ------ |
| `src/commands/config/config.command.ts` | the six paired declarations flipped to `--long, -s`; `--oauth-token` and `--haiku` unchanged (no short form) |
| `tests/config.command.test.ts` | new case: the help output lists every option long-first |
| `.harness/docs/code-standards.md` | the CLI section gained the convention: an option declares the long form first, and one with no short form declares the long form alone |
| `README.md` | no change needed — see below |

The plan asked for "flag-text assertions in tests" to be updated, but no test asserted the option
text: the existing suite drives the CLI with flags and asserts on output, exit codes and files, so
nothing had to be rewritten. The new case locks the declaration in place instead.

## Verification

Full gate green:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- `eslint`: clean
- `tsc --noEmit`: clean
- `vitest run`: 14 files, 147 tests passed (the global setup also rebuilds the bundle)
- `tsdown`: `dist/cli.mjs` built

The built bundle:

```
$ node dist/cli.mjs config --help
Options:
  --name, -n <name>      Profile name (default: "default")
  --url, -u <url>        API base URL
  --token, -t <token>    API token
  --oauth-token <token>  Claude Code login token (CLAUDE_CODE_OAUTH_TOKEN)
  --haiku <model>        Haiku model
  --sonnet, -s <model>   Sonnet model
  --opus, -o <model>     Opus model
  --fable, -f <model>    Fable model
  --help, -h             Display help for command
```

Every paired option reads `--long, -s <value>`, and the two options without a short form print the
long form alone.

## Notes and judgement calls

- **README.** The flag table already prints the long form in its own column, with the alias in a
  separate `Alias` column, so it was never short-first and needed no edit. The example command
  below the table uses short flags (`cs config -n glm -u ... -t <token>`); the plan scoped the
  README to the flag table, and that example also mirrors the CLI's own error hints
  (`Set a URL with -u <url>`, `Clear one with -t "" or --oauth-token ""`), so it was left alone.
  Rewriting the example to the long form would be a docs-only follow-up if the user wants the
  README to lead with the long names.
- **The test assertion.** Commander styles each help term separately, so the ANSI codes sit between
  the words of a term; a contiguous match on `--name, -n <name>` would fail against styled output.
  The test strips the VT control characters first (`stripVTControlCharacters` from `node:util`) and
  then matches the term, so it holds in a terminal and in CI alike.
- **Root command untouched.** `--version, -v` and `--help, -h` were already long-first, and the
  option order in the help table still follows the declaration order.

## Not checked

- No end-to-end run against the real `~/.config/cs`; the smoke read the built bundle's help only,
  which touches no profile store.
- The other uncommitted work in the working tree (the `list` rename, `--oauth-token`, the removal of
  `cs use --file`) was already present before this change and was left alone.

## Unresolved questions

None.
