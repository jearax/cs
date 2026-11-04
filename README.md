# cs

> CS — Claude code switch. Switch Claude Code between API providers and model sets from one command.

`cs` stores named profiles (base URL, token, model IDs) in `~/.config/cs/cs.json` and hands the
active one to Claude Code in two ways:

- **global** — `cs use <profile>` writes `~/.claude/settings.json` and makes the profile the active one.
- **file** — every profile also renders `~/.config/cs/profiles/<name>.json`, a settings-shaped
  artifact. Claude Code loads that file for one session only.

Both targets are produced by the same renderer, so a profile behaves the same either way.

**macOS only.** Requires Node.js >= 24.11.0.

## Install

```bash
pnpm install
pnpm build
pnpm link
```

`pnpm link` puts `cs` on your PATH.

## Quick start

```bash
# Create a profile
cs config -n work -u https://api.anthropic.com -t sk-ant-...

# Switch to it, globally
cs use work

# See what is active
cs current
```

## Commands

| Command                     | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `cs config`                 | Create or update a profile (no flags = show it)                    |
| `cs use <profile>`          | Activate a profile; writes the global settings, renders the files  |
| `cs current`                | Show the active profile and the profiles that have a rendered file |
| `cs list` (`ls`)            | List all profiles                                                  |
| `cs remove <profile>`       | Delete a profile (`default` cannot be removed)                     |
| `cs reset`                  | Delete every profile except `default`, restore its official values |
| `cs env`                    | Interactive editor for extra env vars (global or per-profile)      |
| `cs alias <name> <profile>` | Point a role alias launcher at a profile                           |

Run `cs <command> --help` for full usage.

## `cs config`

| Flag            | Alias | Description                       |
| --------------- | ----- | --------------------------------- |
| `--name`        | `-n`  | Profile name (default: `default`) |
| `--url`         | `-u`  | API base URL                      |
| `--token`       | `-t`  | API token                         |
| `--oauth-token` | —     | Claude Code login token           |
| `--haiku`       | —     | Haiku model ID                    |
| `--sonnet`      | `-s`  | Sonnet model ID                   |
| `--opus`        | `-o`  | Opus model ID                     |
| `--fable`       | `-f`  | Fable model ID                    |

```bash
cs config -n glm -u https://open.bigmodel.cn/api/anthropic -t <token> \
  -s glm-4.6 -o glm-4.6
```

Flags are partial — an omitted flag keeps its current value. A new profile is created from the
current `default` record: every flag you do not pass inherits that field from `default`, so
`cs config -n claude -t <key>` alone yields the official endpoint and model line with your key
(function default params). Updating an existing profile never re-inherits — omitted flags keep the
profile's own values, and later changes to `default` do not propagate.

Omit `--fable` and it mirrors `--opus`, since most providers expose no fable tier. Pass `--fable`
to set it apart.

A dotted model ID a provider prints — `claude-opus-4.7` — can be pasted as-is: cs config stores
the dash form `claude-opus-4-7` (only `claude-` IDs; `gpt-4.1` keeps its dots). Append `[1m]` to
any model ID for the 1M context window.

Leave both `--url` and `--token` empty to let Claude Code use its own `/login` authentication. A
token without a URL is rejected.

`--oauth-token` holds a Claude Code login token. It is valid without a URL, but a profile
carries one credential: the API token and the oauth token exclude each other.

| Blocked combination            | Why                                    | Fix                                      |
| ------------------------------ | -------------------------------------- | ---------------------------------------- |
| `--token` without `--url`      | the token would reach the official API | set `-u <url>`, or clear it with `-t ""` |
| `--token` with `--oauth-token` | two credentials in one profile         | clear one: `-t ""` or `--oauth-token ""` |

`-h` is the help flag on every command, so the Haiku model has no short form.

## How a profile is delivered

`cs use <profile>` renders the profile files and writes `~/.claude/settings.json`, recording the
profile as the active one:

```
Switched to profile "work".
  ...
  Settings: ~/.config/cs/profiles/work.json
  Command:  claude --settings ~/.config/cs/profiles/work.json
```

Every profile that changes is re-rendered, so the files never drift from `cs.json`.

### The launchers

Profiles render no launcher: `cs alias` is the only thing that creates one — `~/.config/cs/bin/claude-<alias>`,
a one-line script:

```sh
#!/bin/sh
exec claude --settings ~/.config/cs/profiles/work.json
```

The launcher holds no secret — the token stays in the profile file it points at. If an older cs
version left `claude-<profile>` launchers in `bin/`, delete them by hand once; cs no longer makes
or removes them.

To launch a profile without an alias, run the command `cs use` prints, or add an alias.

That folder is in no default PATH, so the first time cs creates a launcher in a terminal it appends
the entry to your shell rc — `~/.zshrc`, `~/.bashrc` or `~/.config/fish/config.fish`, picked from
`$SHELL`:

```sh
# Added by @jjuidev/cs
export PATH="$HOME/.config/cs/bin:$PATH"
```

The marker keeps a second run from writing it again. Open a new shell and the launcher works by
name:

```bash
claude-planner
```

A run that is not a terminal — a script, a CI job — never touches your rc file. It prints the line
to add instead:

```bash
echo 'export PATH="$HOME/.config/cs/bin:$PATH"' >> ~/.zshrc
```

Removing the entry is manual: `cs remove` and `cs reset` leave your rc file alone.

## 1M context: the `[1m]` suffix

Append `[1m]` to any model ID to opt that profile into a 1M context window:

```bash
cs config -n work -s 'claude-sonnet-5-5[1m]'
```

| Profile has `[1m]` | Env written                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| yes                | `CLAUDE_CODE_DISABLE_1M_CONTEXT=0`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` |
| no                 | `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`                                            |

The marker is a `cs` marker and is never sent to the API. The env is derived on every render and
never stored, so a value you set with `cs env` always wins.

## `cs alias <name> <profile>`

A role alias is a second launcher for a profile — `claude-planner`, `claude-cooker` — for the roles
you launch by name. It points at the same rendered artifact, so an alias carries no secret of its
own:

```bash
cs alias planner work
cs alias cooker work
```

```
Alias "planner" created at profile "work".
  Launcher: ~/.config/cs/bin/claude-planner
```

Switching a role to another profile is one command — the alias is re-pointed and the launcher is
re-rendered:

```bash
cs alias planner other
```

There is no `unalias`: re-pointing is the whole lifecycle. `cs alias planner default` is an
ordinary re-point at the pre-seeded profile, and no `claude-default` launcher is created for it.

Rules:

- An alias name may not be a profile name, and a profile name may not be an alias name — one name,
  one launcher. An alias name stays taken until the profile it points at is removed.
- The target profile must exist.
- `cs remove <profile>` drops the aliases that pointed at it and reports them.
- `cs reset` clears every alias and its launcher.
- `cs list` shows the aliases as `name → profile`.

If you keep a role in your shell rc, delete it: a zsh alias shadows the launcher on the PATH, so
the shell alias wins and the cs-managed launcher never runs.

```bash
# ~/.zshrc — remove this
alias claude-planner='claude --settings ~/.config/cs/profiles/work.json'
```

## `cs env`

`cs env` is interactive: pick the scope (global or one profile), the action (set or unset), the
key and the value. A key must match `[A-Z][A-Z0-9_]*`. The value is never printed back.

Setting a key suggests a curated catalog of well-known Claude Code env vars (each with a
one-line description; the keys cs derives from `[1m]` carry an "overrides cs" note) — free-text
typing stays allowed. Removing a key suggests only the keys actually set in the chosen scope.

## Where things live

| Path                                | What it is                                       |
| ----------------------------------- | ------------------------------------------------ |
| `~/.config/cs/cs.json`              | The profiles, the active profile, the global env |
| `~/.config/cs/profiles/<name>.json` | A rendered profile, settings-shaped              |
| `~/.config/cs/bin/claude-<alias>`   | The launcher of a role alias                     |
| `~/.claude/settings.json`           | The global settings, written by `cs use`         |

`cs.json` and the rendered profiles hold your token, so they are written with the mode `0600`.

`cs.json` is schema version 1 and keeps the profiles under `profiles`. cs does not migrate an older
file: a file that keeps them under `claude` is not a cs config, so cs reports it, keeps it at
`~/.config/cs/cs.json.corrupt` and starts from the default profile. Convert such a file by hand if
you want those profiles back.

## Development

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## License

MIT
