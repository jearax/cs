# Report: positional placeholder `<name>` → `<profile>`

- Date: 2026-11-03
- Plan: `.harness/plans/261103-2031-positional-profile-arg/plan.md`
- Scope: display-only rename of the commander positional placeholder on `cs use` and `cs remove`
- Commit: none (the plan asked for no commit)

## Outcome

`cs use` and `cs remove` now take the domain noun as their positional placeholder. The help table
reads `use <profile>` / `remove <profile>`, and commander's own missing-argument error says
`missing required argument 'profile'`. No logic, storage, flag or exit-code behaviour changed.

## Changes

| File | Change |
| ---- | ------ |
| `src/commands/use/use.command.ts` | `.command('use <name>')` → `.command('use <profile>')` |
| `src/commands/remove/remove.command.ts` | `.command('remove <name>')` → `.command('remove <profile>')` |
| `tests/use.command.test.ts` | two new cases: the missing-argument message and the `<profile>` placeholder in `cs use --help` |
| `tests/remove.command.test.ts` | two new cases: the missing-argument message and the `<profile>` placeholder in `cs remove --help` |
| `README.md` | the two commands-table rows, plus the two prose lines that show the command invocation (`cs use <profile>`) |

No test asserted the old placeholder, so nothing had to be rewritten; the new cases lock the new
wording in.

Untouched, as the plan required: the `--name` option on `cs config` (a different surface), the
old-CLI inventory doc `.harness/docs/cs-cli-feature-inventory.md`, the `<name>` placeholders that
denote a *file name* in the README path table (`~/.config/cs/profiles/<name>.json`,
`~/.config/cs/bin/claude-<name>`), and the internal variable names.

## Verification

Full gate green:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- `eslint`: clean
- `tsc --noEmit`: clean
- `vitest run`: 14 files, 146 tests passed (the global setup also rebuilds the bundle)
- `tsdown`: `dist/cli.mjs` built

Manual checks against the built bundle:

```
$ node dist/cli.mjs --help
  use <profile>     Switch to a profile
  remove <profile>  Remove a profile

$ HOME=$(mktemp -d) node dist/cli.mjs use
Error: missing required argument 'profile'

Usage: cs use <profile> [options]
```

Same error and usage line for `cs remove`. Both commands exit **1** on the missing argument
(checked separately, since a pipeline reports the exit code of its last stage).

## Notes and judgement calls

- **README prose.** The plan listed the commands table; the same README also shows the invocation
  in prose (`cs use <name>` in the delivery bullet and in "How a profile is delivered"). Those two
  lines were updated as well — leaving them would have shipped a README that contradicts its own
  table. The README was then run through Prettier so the table columns stay aligned.
- **Regression tests.** The plan's validation names the missing-argument wording, so both commands
  got a test for it and one for the help placeholder. The help assertion uses `toContain('<profile>')`
  rather than the whole `use <profile>` term, because commander styles each term separately and the
  ANSI escape codes would break a contiguous match.

## Not checked

- No end-to-end run against the real `~/.config/cs`; every smoke used a temp `HOME`.
- The other uncommitted work in the working tree (the `list` rename, the `--oauth-token` option,
  the removal of `cs use --file`) was already present before this change and was left alone.

## Unresolved questions

None.
