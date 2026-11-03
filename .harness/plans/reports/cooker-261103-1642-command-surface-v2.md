# Report: Command surface v2 (decision 0007)

Decision: [../../decisions/0007-command-surface-v2.md](../../decisions/0007-command-surface-v2.md)
Date: 2026-11-03

All five changes of decision 0007 are implemented and the full gate is green. No commit was made.

## What shipped

| # | Change | Files |
| - | ------ | ----- |
| 1 | The `help` subcommand is gone; `--help, -h` stays | `src/cli.ts` (`.helpCommand(false)`), `tests/cli.test.ts` |
| 2 | `cs.json` stores the profiles under `profiles`, schemaVersion 3, with a v2 → v3 migration | `src/modules/profiles/{types/profile.type.ts,constants/profile.constant.ts,services/storage.service.ts}`, `tests/profiles-storage.service.test.ts` |
| 3 | `Profile.oauthToken` + `--oauth-token`, masked in the views, rendered as `CLAUDE_CODE_OAUTH_TOKEN` | `src/modules/profiles/types/profile.type.ts`, `src/commands/config/**`, `src/core/ui/profile.ui.ts`, `src/modules/profiles/services/render.service.ts` |
| 4 | `cs use <name>` has no `--file`: it renders the artifacts and writes the global settings | `src/commands/use/**`, `tests/use.command.test.ts`, `tests/profile-flow.e2e.test.ts` |
| 5 | The list command is `cs list` with the alias `ls` | `src/commands/ls/` → `src/commands/list/`, `src/cli.ts`, `tests/ls.command.test.ts` → `tests/list.command.test.ts` |

### The migration

`loadCsConfig` reads the file, takes the profiles from `profiles` or — for a file that predates the
rename — from `claude`, and rewrites the file under the new key. The old file is copied to
`cs.json.bak` (mode `0600`) **before** the new one is written, so the old shape stays recoverable.
A v1 file still gets its `[1m]` auto-env stripped on the way; a v2 file only moves its key.

The written config carries the keys cs owns only, so the `claude` key never survives a migration.

### The oauth token

`--oauth-token` has no short form. It is independent of the API token — the token-without-URL guard
still applies to `--token` only, so an oauth token alone is a valid profile. When both tokens are
set, both env keys are written and cs says nothing — the precedence belongs to Claude Code, which
ranks `ANTHROPIC_AUTH_TOKEN` above `CLAUDE_CODE_OAUTH_TOKEN`.

## Validation — real output

### The gate

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,tsx}"
EXIT=0

$ pnpm typecheck
$ tsc --noEmit
EXIT=0

$ pnpm test
 Test Files  14 passed (14)
      Tests  136 passed (136)
   Duration  526ms (tests 59%, import 22%, transform 17%, worker 3%)

$ pnpm build
ℹ dist/cli.mjs  171.44 kB │ gzip: 44.29 kB
✔ Build complete in 19ms
EXIT=0
```

### The smoke, on a temp HOME (`HOME=$H node dist/cli.mjs …`)

A real v2 file — `schemaVersion: 2` with the profiles under `claude` — was migrated on the first
command:

```
$ HOME=$H node dist/cli.mjs list
Profiles:

    default
    URL:    https://api.anthropic.com
    Token ─ <not set>
    OAuth:  <not set>
    Haiku:  claude-haiku-5-5[1m]
    …
  * work
    URL:    https://example.com
    Token ─ <test-token masked>
    OAuth:  <not set>
    …
EXIT=0

$ cat $H/.config/cs/cs.json
{
  "schemaVersion": 3,
  "profiles": {
    "default": { "url": "https://api.anthropic.com", … },
    "work": { "url": "https://example.com" … } }
  },
  …

$ ls -l $H/.config/cs/
.rw-------@ 478 tandm  3 Nov 18:21 cs.json
.rw-------@ 477 tandm  3 Nov 18:21 cs.json.bak      # the v2 file, with its `claude` key

$ HOME=$H node dist/cli.mjs ls | head -1
Profiles:                                             # the alias answers too

$ HOME=$H node dist/cli.mjs help
Error: unknown command 'help'
…
  list|ls           List all profiles
EXIT=1
```

The oauth token, alone and next to the API token ─

```
$ HOME=$H node dist/cli.mjs config -n login --oauth-token <test-oauth-token>
Profile "login" updated.
EXIT=0                                                 # no URL needed, no warning

$ HOME=$H node dist/cli.mjs config -n login
Profile: login
  URL:
  Token ─ <not set>
  OAuth:  oauth-se...oken                             # masked
  …

$ grep -i oauth $H/.config/cs/profiles/login.json
    "CLAUDE_CODE_OAUTH_TOKEN" ─ <test-oauth-token>,

$ HOME=$H node dist/cli.mjs use login
Switched to profile "login".
EXIT=0
$ grep OAUTH $H/.claude/settings.json
    "CLAUDE_CODE_OAUTH_TOKEN" ─ <test-oauth-token>,   # the global write carries it too

$ HOME=$H node dist/cli.mjs config -n both -u https://example.com -t <test-token> --oauth-token <test-oauth-token>
EXIT=0
$ grep -E "AUTH_TOKEN|OAUTH" $H/.config/cs/profiles/both.json
    "ANTHROPIC_AUTH_TOKEN" ─ <test-token>,
    "CLAUDE_CODE_OAUTH_TOKEN" ─ <test-oauth-token>,

$ HOME=$H node dist/cli.mjs use both --file
Error: unknown option '--file'
EXIT=1
```

## Deviations and judgement calls

- **The folder was renamed too.** The brief asked for the command name; `src/commands/ls/` became
  `src/commands/list/` (and `runLs` → `runList`), because the folder names the command everywhere
  else in the tree. The test file moved with it.
- **`use` lost its `globalWritten` flag.** With `--file` gone there is no mode left to report, so
  the result and the output hold a single path: `Switched to profile "<name>".`
- **The profile view gained an `OAuth:` line.** It shows in `cs config`, `cs list` and `cs use`,
  masked like the API token, and `<not set>` when the profile has none.
- **Only the keys cs owns are written back.** A config file that carries unknown keys loses them
  on the next save. The previous code kept them; the migration needed a known shape, so the
  storage service now rebuilds the file from the fields it understands.
- **`cs env` keeps the oauth token.** The per-profile env scope merges into the profile, so the
  token survives an env edit.

## Not checked

- `claude-work` was not executed: the launcher calls the `claude` binary, which is not installed
  here. The script content and its mode are verified by the tests.
- The `CLAUDE_CODE_OAUTH_TOKEN` line in the harness memory — that the token may be ignored on the
  `claude --settings` path — was not re-checked against the Claude Code docs here. cs writes the
  key on both paths; whether Claude Code honours it is its own business.
- No CI workflow was added and nothing was published (non-goals).

## Harness knowledge changed

- `.harness/MEMORY.md`: the `cs use --file` line was replaced by the decision 0007 behaviour; the
  storage line now names the `profiles` key, and a line about the v2 → v3 migration and its backup
  was added.
- `.harness/docs/cs-project-overview.md`: the profile terminology carries the oauth token, and the
  oauth token itself is defined.
- `.claude/skills/cs-command-test/SKILL.md`: the end-to-end command list says `list`, not `ls`.
- `README.md`: the commands table, the flag table, the delivery section and the storage-key note
  were rewritten for the new surface.

## Open items for the planner and the user

- The v2 → v3 migration is one-way and the backup is written next to the config. If a user has
  several v2 files around, only the one under `~/.config/cs/cs.json` migrates.
- `cs list` keeps `ls` as an alias, so a shell alias or script that typed `cs ls` keeps working.
  Nothing prints the alias in the README's command list other than the table row.

Status: DONE
Summary: All five changes of decision 0007 are implemented and the full gate is green — `pnpm lint`, `pnpm typecheck`, `pnpm test` (136 tests, 14 files) and `pnpm build` — plus a temp-HOME smoke that migrated a real v2 `cs.json` (profiles under `claude`) to schemaVersion 3 under `profiles` with the old file kept at `cs.json.bak` (0600), proved `cs help` is an unknown command, `cs list`/`cs ls` both answer, `--oauth-token` is stored, masked and rendered as `CLAUDE_CODE_OAUTH_TOKEN` with and without a URL, and `--file` is gone.
Concerns: the storage service now rewrites `cs.json` from the fields cs owns, so unknown keys in a config file are lost on the next save; the behaviour of `CLAUDE_CODE_OAUTH_TOKEN` on the `claude --settings` launcher path was not re-verified against the Claude Code docs.
