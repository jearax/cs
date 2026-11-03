# Report: Port the cs-cli profile flow with dual delivery

Plan: [../261103-1503-profile-delivery/plan.md](../261103-1503-profile-delivery/plan.md)
Behaviour contract: [../../docs/cs-cli-feature-inventory.md](../../docs/cs-cli-feature-inventory.md)
Old CLI (read-only reference): `/Users/tandm/Documents/jearax/npm/cs-cli` — no code copied.
Date: 2026-11-03

All four phases landed. The seven commands of the old CLI are ported, decision 0004's dual delivery
is in place, and the full gate is green.

## What shipped

| Phase | Files | Note |
| ----- | ----- | ---- |
| 01 — profiles module | `src/modules/profiles/**` (types, constants, checks, 7 services), `src/core/utils/{mask-token,denormalize-model-id}.util.ts`, `src/core/ui/{profile,artifact,banner}.ui.ts` | one renderer feeds both targets |
| 02 — `config` + `use` | `src/commands/config/**`, `src/commands/use/**` | global write default, `--file` opt-in |
| 03 — the other five | `src/commands/{current,ls,remove,reset,env}/**` | artifact and launcher lifecycle |
| 04 — e2e and docs | `tests/profile-flow.e2e.test.ts`, `README.md`, `CLAUDE.md` | user-facing behaviour documented |
| rules | `tests/support/architecture-rules.ts`, `tests/fixtures/architecture/src/modules/**` | the `src/modules/` role arrives with its rule and its fixture |

The module layout, one file per concern:

```
src/modules/profiles/
├─ constants/paths.constant.ts      every path, resolved from the home directory on each call
├─ constants/profile.constant.ts    OFFICIAL_PROFILE, EMPTY_PROFILE, schema version
├─ checks/profile-name.check.ts     name validation
├─ checks/login-mode.check.ts       token without URL, empty token
├─ services/render.service.ts       the pure renderer — the one source of the env block
├─ services/storage.service.ts      cs.json: load, save, migrate, upsert, remove, reset
├─ services/claude-settings.service.ts   ~/.claude/settings.json read and write
├─ services/global-write.service.ts the global target
├─ services/render-artifacts.service.ts  the artifact and the launcher
├─ services/artifact-cleanup.service.ts  their removal, by valid name only
├─ services/active-profile.service.ts     stored profile, else reverse-detect
├─ services/launcher.service.ts     the launcher script content
└─ types/{profile,settings}.type.ts
```

`render.service.ts` is pure: profile + global env in, settings object out. The global target and
the artifact both consume it, so the two cannot drift.

## Validation — real output

### The gate

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
EXIT=0

$ pnpm typecheck
$ tsc --noEmit
EXIT=0

$ pnpm test
 Test Files  13 passed (13)
      Tests  109 passed (109)
   Duration  511ms (tests 61%, import 21%, transform 16%, workers 2%)

$ pnpm build
ℹ dist/cli.mjs  166.28 kB │ gzip: 42.66 kB
✔ Build complete in 18ms
```

The build line above the test summary is the global setup running tsdown, so a green `pnpm test`
also proves the build.

### Smoke, in a temp HOME

```
$ node dist/cli.mjs --help
  CS - code switch
Usage: cs [command] [options]
...
Commands:
  config [options]      Create or update a profile
  use <name> [options]  Switch to a profile
  current               Show the active profile
  ls                    List all profiles
  remove <name>         Remove a profile
  reset                 Reset to the default profile
  env                   Configure env vars (global or per-profile)
```

```
$ HOME=$H node dist/cli.mjs config -n work -u https://api.anthropic.com -t <test-token>
Profile "work" updated.
  Settings: ~/.config/cs/profiles/work.json
  Launcher: ~/.config/cs/bin/claude-work
  Command:  claude --settings ~/.config/cs/profiles/work.json

$ HOME=$H node dist/cli.mjs use work --file
Profile "work" is ready.
  ...
   The global settings were left untouched.

$ HOME=$H node dist/cli.mjs use work
Switched to profile "work".
  ...
```

The artifact and the launcher, with their modes:

```
$ stat -f "%Lp %N" $H/.config/cs/cs.json $H/.config/cs/profiles/glm.json \
      $H/.config/cs/bin/claude-glm $H/.claude/settings.json
600 .../.config/cs/cs.json
600 .../.config/cs/profiles/glm.json
755 .../.config/cs/bin/claude-glm
600 .../.claude/settings.json

$ cat $H/.config/cs/bin/claude-glm
#!/bin/sh
exec claude --settings ~/.config/cs/profiles/glm.json
```

The `[1m]` derivation, on a profile whose Sonnet carries the marker:

```
$ HOME=$H node dist/cli.mjs config -n work -s 'claude-sonnet-5-5[1m]'
$ grep CLAUDE_CODE $H/.config/cs/profiles/work.json
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "0",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"
```

Every README example was run against the built bundle before the README was written.

### The rules bite

The new `module-imports-no-command` rule and the module role suffixes each have a negative
fixture, and `tests/architecture.test.ts` asserts one violation per fixture — so the module layer
is a rule, not a comment.

## Ported deliberately

Every row of the inventory map is in place: partial update, blank-start profiles, `--fable`
mirrors `--opus`, `denormalizeModelId` (the `claude-*` dot form only), login mode (an empty
url + token is valid, a token without a URL is rejected), name validation (`[a-zA-Z0-9_-]+`, no
path separators, the reserved names blocked), the `[1m]` derivation, the env precedence
(seven `ANTHROPIC_*` fields → derived `[1m]` → global env → profile env, last wins), the
connectors flag, the masked tokens, the `cs.json` v1→v2 migration with its `0600` backup, the
`currentProfile` bookkeeping and the reverse-detection of the active profile.

## Deviations from the old CLI

Every one of these is a behaviour a user of `@jjuidev/cs@0.3.x` can observe.

### Flags

1. **`-h` is help on every command; the Haiku model has no short form.** The old `cs config -h
   claude-haiku-4-5` set the model; now it is `cs config --haiku claude-haiku-4-5`. Decision 0005,
   user-approved 2026-11-03 — the repo standard reserves `-h` for help.
2. **An unknown flag is an error.** The old README promised that unknown flags were silently
   ignored (`--sonet` left the field untouched). Commander rejects them and suggests the right
   flag: `Error: unknown option '--sonet'` / `(Did you mean --sonnet?)`, exit 1.

### Exit codes

3. **Every failure exits 1.** The old CLI printed an error and exited 0. A missing profile, an
   invalid name, a token without a URL and `remove default` now fail with a `CliError`, a hint and
   a next command (decision 0003).

### Output

4. **Plain text through `core/ui`, not consola.** No per-level colours, no boxes; the old CLI
   styled each level through consola.
5. **The banner is one text line, not figlet art.** `CS - code switch` appears in the same three
   places as the old CLI (bare `cs`, `cs --help`, `cs <command> --help`), but no `figlet`
   dependency was added to the bundle.
6. **The bare run prints commander's help**, which lists the seven commands, instead of the old
   hand-written command list and its "Run cs <command> --help for usage" line.

### New behaviour from decision 0004

7. **`cs config` renders the artifact and the launcher.** The old CLI only wrote `cs.json`.
8. **`cs use --file` is new**: it renders both files, prints the launch command, and leaves
   `~/.claude/settings.json` untouched.
9. **`cs use --file` does not change `currentProfile`.** The old `use` always set it. This follows
   decision 0004 ("`cs current` keeps its meaning"), so the file mode does not make a profile
   active in the global settings. Flagging it because the decision does not state it outright.
10. **`cs current` lists the profiles that have a rendered file**, and `cs ls` marks them
    `[rendered]`. Both are presentation-only additions.
11. **`cs remove` deletes the artifact and the launcher** of the profile it removes.
12. **`cs reset` deletes every cs-owned artifact and launcher**, then re-renders and activates
    `default`.
13. **`cs env` re-renders the artifacts it invalidates**: the profile it changed, or every profile
    that has one when the global scope changed.

### Storage hardening

14. **A `cs.json` that cannot be parsed is kept as `cs.json.corrupt`** and replaced by a default
    config, with a notice on stderr. The old CLI printed "File may be corrupted" and overwrote the
    file, losing the profiles silently.
15. **The mode is enforced after every write** (`chmod` on `cs.json`, the `.bak`, the artifact and
    `settings.json`). The old CLI passed the mode to `writeFile`, which only applies when the file
    is created, so a file that already existed kept its old mode.
16. **The profile map is read with `Object.hasOwn` and written with `defineProperty`.** The old CLI
    read it with plain property access outside `findProfile`, so a profile named `toString` could
    resolve to `Object.prototype.toString`, and `__proto__` could not be stored safely.

### Dropped

17. **No library surface.** The old `index.ts` re-exported its command definitions for reuse;
    `cs` ships a CLI only.
18. **The vestigial `resolveTokenForWrite` is gone.** It was an identity function; the renderer
    writes the token directly. The written bytes are identical.

## Deviations from the plan

1. **The module has more services than the phase file listed.** The plan named `storage`,
   `render`, `launcher`, `render-artifacts` and `artifact-cleanup`. Three more carry one concern
   each: `claude-settings.service.ts` (the global file), `global-write.service.ts` (the global
   target) and `active-profile.service.ts` (stored profile, else reverse-detect). The plan's
   `storage.service.ts` would have held three concerns in one file.
2. **Shared helpers live in `core/`.** `mask-token.util.ts` and `denormalize-model-id.util.ts` are
   stateless helpers, and `profile.ui.ts`, `artifact.ui.ts` and `banner.ui.ts` render the terminal
   output. The plan listed no file for them; decision 0003 requires the output to go through
   `core/ui`.
3. **The architecture rule set grew a rule and two fixtures.** `code-standards.md` says a new role
   arrives "in `tests/support/architecture-rules.ts` and in a negative fixture, together". The
   `src/modules/` role brought `module-imports-no-command`, the module role suffixes and the
   fixtures under `tests/fixtures/architecture/src/modules/`.
4. **`tests/ls.command.test.scopes` was a placeholder row.** The real file is
   `tests/ls.command.test.ts`.
5. **`tests/env.command.test.ts` drives the service, not the prompt flow.** `cs env` is
   interactive and the test run has no TTY, so the file covers the key pattern, the set and unset
   paths, the re-render and the promise that the value never reaches the output. The prompt flow
   itself is not covered by a test.

## What was not checked

- The interactive `cs env` prompt flow was never driven by a human in this session; only its
  service was tested.
- `claude-work` was not executed: the launcher calls the `claude` binary, which is not installed
  here. The script content and its mode were verified.
- No CI workflow was added (a non-goal); the gate above was run locally.
- Nothing was published and no release was cut (a non-goal).
- `pnpm format` was not run over the whole repository: it would rewrite the Markdown tables of
  `.harness/docs`, which belong to their own owner.

## Open items for the planner and the user

- **`cs use --file` and `currentProfile`** is the one behaviour this plan did not state outright.
  The reading implemented here follows decision 0004 ("`cs current` keeps its meaning"), so the
  file mode leaves the active profile alone. Say the word if the intent was the opposite.
- **The old CLI's library exports are gone** with no replacement. If a consumer needs the command
  definitions as a module, that is a new decision.
- **The banner is a text line, not ASCII art.** If the figlet banner is wanted back, it is a
  dependency decision (the old `figlet` and `consola` are not in `cs`).

## Harness knowledge changed

- `.harness/MEMORY.md`: the flag convention (`-h` is help, `--haiku` has no short form) and the
  artifact and launcher paths were added; the stale "too many arguments" line was corrected to the
  wording commander now uses, and a line about the rendered profiles was added.
- `.harness/decisions/0005-help-flag-standard.md` and its index row were written by the planner
  while this work was in flight; the implementation follows that record.
- `CLAUDE.md`: the project block now names the dual delivery and points at decision 0004.

Status: DONE_WITH_CONCERNS
Summary: All four phases of the plan landed and the full gate is green — `pnpm lint`, `pnpm typecheck`, `pnpm test` (109 tests, 13 files, including the architecture suite with a negative fixture per rule) and `pnpm build` into `dist/cli.mjs` — plus a temp-HOME smoke of every command and every README example. The seven cs-cli commands are ported with one renderer feeding both delivery targets, decision 0004's dual delivery is in place, and the deviations from the old CLI are listed above, with decision 0005 (`-h` is help everywhere) applied.
Concerns: `cs use --file` does not set `currentProfile` — decision 0004 does not state this outright and the plan did not cover it, so the reading needs a confirmation; the interactive `cs env` prompt flow has no automated test because the suite runs without a TTY; and the old CLI's library exports are dropped without a replacement.
