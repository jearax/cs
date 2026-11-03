# Report: Role aliases — `cs alias <name> <profile>`

Plan: [../261104-0039-role-aliases/plan.md](../261104-0039-role-aliases/plan.md)
Decision: [../../decisions/0011-role-aliases.md](../../decisions/0011-role-aliases.md)
Date: 2026-11-04

Decision 0011 is implemented. `cs alias <name> <profile>` writes a launcher and records the alias in
the `aliases` map of `cs.json`; the launcher is re-pointed with the same command, the aliases of a
removed profile are cleaned with it, and `cs reset` clears the whole map. The full gate is green
and the behaviour was smoke-tested in a temporary HOME only — the real `~/.config/cs` and
`~/.claude` were never touched, and the real `claude` binary was never invoked.

## What shipped

| File | Change |
| ---- | ------ |
| `src/modules/profiles/types/profile.type.ts` | `CsConfig.aliases?: Record<string, string>` — additive, no schema bump |
| `src/modules/profiles/services/storage.service.ts` | the alias map: `listAliases`, `findAliasTarget`, `setAlias`, `removeAlias`; `toCsConfig` now carries `aliases` over |
| `src/modules/profiles/services/alias-launcher.service.ts` | new — renders one alias launcher, removes it, finds the aliases of a profile, re-renders them |
| `src/modules/profiles/services/render-artifacts.service.ts` | re-renders every alias launcher that targets the profile being rendered |
| `src/commands/alias/alias.command.ts` + `services/alias.service.ts` | new — `cs alias <name> <profile>` |
| `src/commands/config/services/config.service.ts` | refuses a profile name that an alias owns |
| `src/commands/{use,env}/services/*.service.ts` | pass the alias map to the renderer, so a changed profile re-renders its aliases |
| `src/commands/remove/services/remove.service.ts` | drops the aliases that pointed at the removed profile, deletes their launchers, reports them |
| `src/commands/reset/services/reset.service.ts` | clears the whole alias map and every alias launcher, reports them |
| `src/commands/list/**` | the alias rows `name → profile` |
| `src/modules/profiles/checks/profile-name.check.ts` | `validateProfileName(name, label)` — the message names the kind of name |
| `src/cli.ts` | registers the command |
| `tests/alias.command.test.ts` | new — 9 cases |
| `tests/alias-launcher.service.test.ts` | new — 8 cases |
| `tests/profiles-storage.service.test.ts` | the alias map round trip and the accessors |
| `README.md`, `.harness/docs/cs-project-overview.md` | the alias section, the `Role alias` term |

The ownership rule is the one the decision settles: `bin/` holds both the profile launchers and
the alias launchers, and the registry in `cs.json` says which is which. Nothing parses a filename
to decide what it owns.

## The judgement calls

**The collision guard works in both directions.** The decision states that an alias name may not
be a profile name. The other direction is the same invariant, so `cs config -n planner` is
refused while the alias `planner` exists — otherwise the profile render would overwrite the alias
launcher and silently break the alias. The cost: an alias name stays taken until the profile it
points at is removed (there is no unalias command, by decision). The error names the way out.

**`cs alias` renders the target when it has no artifact yet.** The launcher points at
`~/.config/cs/profiles/<target>.json`, so a target without a rendered artifact would leave a
dangling launcher. The artifact is rendered in that case only, which keeps `cs alias planner
default` from creating a `claude-default` launcher as a side effect.

**The re-render is idempotent by construction.** The launcher content is the path of the target
artifact, so re-rendering it after a profile change rewrites the same line. The propagation is
wired anyway (`renderProfileArtifacts` takes the alias map and re-renders the launchers of the
profile it renders), because it is what keeps an alias correct if the launcher ever carries more
than a path — and because the plan asks for it at the three render sites.

**Two wording choices.** The positional placeholder of the alias is `<name>` and the target is
`<profile>`, as the plan and the brief write them — the plan's public contract was not changed.
The list row uses `→` (the plan's table uses it too).

## Validation — real output

### The gate

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,tsx,tsx}"
EXIT=0

$ pnpm typecheck
$ tsc --noEmit
EXIT=0

$ pnpm test
 Test Files  18 passed (18)
      Tests  194 passed (194)
   Duration  524ms (tests 58%, imports 25%, server 4%)

$ pnpm build
✔ Build complete in 20ms
```

### The smoke — a temporary HOME, fake tokens

```
$ export H=$(mktemp -d /tmp/cs-alias-XXXXXX)
$ HOME=$H node dist/cli.mjs config -n work -u https://x.example.com -t fake-token-123
Profile "work" updated.
  Settings: ~/.config/cs/profiles/work.json
  Launcher: ~/.config/cs/bin/claude-work

$ HOME=$H node dist/cli.mjs alias planner work
Alias "planner" created at profile "work".
  Launcher: ~/.config/cs/bin/claude-planner

$ cat $H/.config/cs/bin/claude-planner
#!/bin/sh
exec claude --settings ~/.config/cs/profiles/work.json

$ HOME=$H node dist/cli.mjs alias planner other
Alias "planner" re-pointed at profile "other".

$ cat $H/.config/cs/bin/claude-planner
#!/bin/sh
exec claude --settings ~/.config/cs/profiles/other.json

$ HOME=$H node dist/cli.mjs alias work other          # collision: a profile named work exists
└  Alias "work" collides with the profile of the same name.
   To finish:
     $ cs remove work
   ↳ Pick another alias name, or remove the profile first.
(exit 1)
```

Dangling cleanup and the reset:

```
$ HOME=$H node dist/cli.mjs alias planner work
$ HOME=$H node dist/cli.mjs alias cooker work
$ HOME=$H node dist/cli.mjs remove work
Profile "work" removed.
Removed aliases: planner, cooker

$ ls $H/.config/cs/bin          # both alias launchers are gone
$ HOME=$H node dist/cli.mjs reset
Reset complete. Active profile: default
$ node -e "…cs.json.aliases"   # null — the map is empty
```

`cs list` ends with the alias rows:

```
Aliases:

  planner → other
```

## Not checked

- The real shell: the launchers were never executed, and `claude` was never invoked. The README
  note about a zsh alias shadowing a PATH binary is a documented recommendation, not a measured
  behaviour.
- `cs env` is interactive and was not exercised against a pty; the propagation there is covered
  by the same renderer path the other commands use.
- The `~/.config/cs/cs.json` of the real machine was never read or written.

## Harness review

- `memory` — the profile line now names the alias launcher and its owner (the `aliases` map, not
  the filename in `bin/`); the positional-noun line and the option-order line were merged into one
  command-declaration line, which also records that `cs alias <name> <profile>` is the exception.
- `docs/cs-project-overview.md` — the `Role alias` term states the ownership rule and the trap:
  the cleanup scan lists `bin/` by filename, so an alias launcher reads as a profile name.
- `cs-command-test` — a new step: a smoke of the built bundle runs against a temp HOME too, one
  command per invocation, never the real `claude` binary.
- The standing rule the user sent mid-turn (tmp HOME, fake tokens, never the real environment) was
  already in memory; the skill now repeats it where the smoke is described.

## Open questions

- The alias name is sticky: it is freed only by removing the profile it points at, or by
  `cs reset`. If a `cs unalias <name>` ever becomes wanted, it is a one-line map deletion plus the
  launcher removal — but decision 0011 rules it out for now.
- `.harness/MEMORY.md` sits at 4780 of its 4800 characters after the review, so the
  harness-curate skill should run before the next feature lands.
