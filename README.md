# @jjuidev/cs

> CS — code switch. Switch Claude Code between API providers and model sets from one command.

`cs` stores named profiles (base URL, token, model IDs) and writes the active one into
`~/.claude/settings.json` so Claude Code picks it up.

**macOS only.** Requires Node.js >= 18.

## Install

```bash
npm install -g @jjuidev/cs
```

## Quick start

```bash
# Create a profile
cs config -n work -u https://api.anthropic.com/v1 -t sk-ant-...

# Switch to it
cs use work

# See what is active
cs current
```

## Commands

| Command | Description |
|---------|-------------|
| `cs config` | Create or update a profile (no flags = show it) |
| `cs use <name>` | Activate a profile, write it to Claude settings |
| `cs current` | Show the active profile |
| `cs ls` | List all profiles |
| `cs remove <name>` | Delete a profile (`default` cannot be removed) |
| `cs reset` | Delete every profile except `default`, restore its official values |
| `cs env` | Interactive editor for extra env vars (global or per-profile) |

Run `cs <command> --help` for full usage.

## `cs config`

| Flag | Alias | Description |
|------|-------|-------------|
| `--name` | `-n` | Profile name (default: `default`) |
| `--url` | `-u` | API base URL |
| `--token` | `-t` | API token |
| `--haiku` | `-h` | Haiku model ID |
| `--sonnet` | `-s` | Sonnet model ID |
| `--opus` | `-o` | Opus model ID |
| `--fable` | `-f` | Fable model ID |

```bash
cs config -n glm -u https://open.bigmodel.cn/api/anthropic -t <token> \
  -s glm-4.6 -o glm-4.6
```

Flags are partial — omitted fields keep their current value.

Leave both `--url` and `--token` empty (the `default` profile does) to let Claude Code use its own
`/login` authentication. A token without a URL is rejected.

> Unknown flags are silently ignored. `--sonet` is not `--sonnet`; a typo means the field
> is left untouched, and a brand-new profile falls back to its default model.

## 1M context: the `[1m]` suffix

Append `[1m]` to any model ID to opt that profile into a 1M context window:

```bash
cs config -n work -s 'claude-sonnet-5[1m]'
```

| Profile has `[1m]` | Default env written |
|---|---|
| yes | `CLAUDE_CODE_DISABLE_1M_CONTEXT=0`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` |
| no | `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` |

Without `[1m]`, `cs` explicitly disables the 1M window. The suffix is a `cs` marker, not
part of the model ID sent to the API — your account still needs access to that context tier.

These are defaults computed on every `cs use`. Any value you set with `cs env` (global or
profile) overrides them, e.g. a profile `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` survives
model changes.

## What `cs use` writes

Into `~/.claude/settings.json` under `env`:

| Variable | Source |
|----------|--------|
| `ANTHROPIC_BASE_URL` | profile `url` |
| `ANTHROPIC_AUTH_TOKEN` | profile `token` |
| `ANTHROPIC_DEFAULT_MODEL` | profile `sonnet` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | profile `haiku` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | profile `sonnet` |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | profile `opus` |
| `ANTHROPIC_DEFAULT_FABLE_MODEL` | profile `fable` |

Then, later wins: `[1m]` defaults → global `cs env` → profile `cs env`.

`cs use` **replaces** the `env` block rather than merging it, so keys left over from a
previous profile are cleared. Profiles stay isolated from each other.

For a profile with empty URL and token, `cs use` also sets top-level
`"disableClaudeAiConnectors": true`. Switching to a profile with a URL or token removes it again,
but only if `cs` added it — a value you set yourself is left alone.

## `cs env`

Interactive. Pick a scope (global or one profile), then set or unset a key.

- Keys must match `[A-Z][A-Z0-9_]*`
- Profile env overrides global env; both override the `[1m]` defaults
- Values are never echoed back to the terminal

## Files

| Path | Contents |
|------|----------|
| `~/.config/cs/cs.json` | Profiles, active profile, global env |
| `~/.config/cs/cs.json.bak` | Copy taken before a one-time format migration |
| `~/.claude/settings.json` | Claude Code settings that `cs` writes into |

Both are written with mode `0600`.

## License

MIT
