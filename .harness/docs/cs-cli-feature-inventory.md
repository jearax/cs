# cs-cli feature inventory (behavioural reference)

Complete behaviour map of the old `cs-cli` v0.3.1 (~1,150 LOC, bun + citty + @clack/prompts +
consola + figlet); no checkout of it exists any more, this file is the only reference. Per
decision 0001 this is a reference, not a compatibility contract: copy behaviours deliberately,
not by default.

## Domain model

- `~/.config/cs/cs.json` (mode 0600): `{ schemaVersion, claude: {name → Profile}, currentProfile,
env (global), ownedClaudeSettingsKeys }`
- Profile: `url, token, haiku, sonnet, opus, fable, env?`
- Two seeds: `default` starts as OFFICIAL (`https://api.anthropic.com` + Claude 5.5 line, all
  `[1m]`); a `cs config` profile starts EMPTY (all fields blank, nothing inherited from `default`)
- Target file: `~/.claude/settings.json` (mode 0600)

## Commands

| Command                       | Behaviour                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config -n -u -t -h -s -o -f` | Partial update (omitted flag keeps value). No flags = show (token masked). New profile starts blank. `--fable` omitted mirrors `--opus`. Model IDs pass through `denormalizeModelId` (Copilot dot form → dash form for `claude-*` only). Rejects token-without-URL (login mode). Name: `^[a-zA-Z0-9_-]+$`, no path separators, blocks `__proto__`/`prototype`/`constructor`                |
| `use <name>`                  | Name validated, profile must exist, legacy token-without-url guard. Replaces the whole `env` block in settings.json (sync, not merge — profile isolation). Order: 7 `ANTHROPIC_*` fields → derived `[1m]` defaults → extraEnv (global + profile, last wins). Sets `disableClaudeAiConnectors: true` always, tracked in `ownedClaudeSettingsKeys`. Writes settings.json first, then cs.json |
| `current`                     | `currentProfile` from cs.json; if missing/deleted, reverse-detects by matching `ANTHROPIC_BASE_URL` + token against all profiles in settings.json                                                                                                                                                                                                                                          |
| `ls`                          | All profiles, `*` marks active, token masked                                                                                                                                                                                                                                                                                                                                               |
| `remove <name>`               | `default` cannot be removed. Removing the active profile clears `currentProfile`                                                                                                                                                                                                                                                                                                           |
| `reset`                       | Keeps only `default`, restored to OFFICIAL values, then activates it. Lists removed names                                                                                                                                                                                                                                                                                                  |
| `env`                         | Interactive (@clack): scope (global/profile) → set/unset → key must match `[A-Z][A-Z0-9_]*` → value. Never prints a raw value                                                                                                                                                                                                                                                              |

## `[1m]` context marker

- Suffix on any model ID; a cs marker, never sent to the API
- Derived on every `cs use`, never persisted (schema v2): with `[1m]` →
  `CLAUDE_CODE_DISABLE_1M_CONTEXT=0` + `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000`; without →
  `DISABLE_1M_CONTEXT=1`. Global/profile `cs env` values override the derivation
- Migration v1→v2 strips legacy persisted auto-env from every `profile.env`, backing up
  `cs.json.bak` (0600) first; a deliberate `AUTO_COMPACT_WINDOW=1000000` is stripped too

## Non-obvious details

- `findProfile` uses `Object.hasOwn` so a profile named `toString` cannot resolve via prototype
- `maskToken`: empty → `<not set>`; ≤8 chars → `fi****`; else `first8...last4`
- `resolveTokenForWrite` is an identity function (vestigial placeholder)
- `ownedClaudeSettingsKeys` limits what cs may remove from settings.json to keys it added
- Empty url+token profile = Claude Code `/login` mode: settings get empty ANTHROPIC_* values
- Banner (figlet) shows on bare `cs`, `cs --help` and `cs <command> --help`, once per process
- Library exports (`index.ts`) re-export command definitions for reuse
