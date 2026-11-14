# cs — project overview

Product intent, confirmed boundaries and terminology. The code is the authority for behaviour;
this file records only what code cannot express. Decisions live in
[`../decisions/README.md`](../decisions/README.md); the old CLI's behaviour map lives in
[cs-cli-feature-inventory.md](./cs-cli-feature-inventory.md).

## What cs is

`cs` (package `@jjuidev/cs`) — **Claude code switch** — switches Claude Code between API providers
and model sets through named profiles. `cs use` writes the global `~/.claude/settings.json`; the
rendered profile files and the `claude-<alias>` launchers are the `claude --settings` delivery
(decision 0013 — only an alias creates a launcher). macOS-first: the old CLI was macOS-only
by choice, and no cross-platform request exists.

## Confirmed boundaries

- **Rewrite, not a port.** `cs-cli` is a behavioural reference only; `cs` may diverge wherever the
  user chooses. A workflow is ported only when the user names it (decision 0001).
- **Toolchain follows jss-devtools.** pnpm, exact-pinned dependencies, tsdown single ESM bundle,
  Node `>=24.11.0` (decision 0002) — a deliberate breaking change versus published
  `@jjuidev/cs@0.3.x`, accepted by the user.

## Non-goals

- No cross-platform support unless the user asks for it.
- Claude Code only: no other tool's settings files are read or written today.

## Terminology

- **Profile** — a named provider/model set: url, token, haiku, sonnet, opus, fable, an optional
  oauth token, plus optional per-profile env overrides.
- **Login mode** — a profile with an empty url and token; Claude Code then uses its own `/login`.
  A token without a URL is invalid in every mode.
- **OAuth token** — the Claude Code login token of a profile (`--oauth-token`), written as
  `CLAUDE_CODE_OAUTH_TOKEN`. It is a login credential, not an API token, so it is valid without a
  URL; it and the API token are mutually exclusive — one credential per profile (decision 0008).
  Only a hand-edited `cs.json` can hold both, and the renderer passes them through as they are.
- **`[1m]` marker** — a suffix on a model ID opting the profile into the 1M context window. It is
  a cs marker, never sent to the API, and its env defaults are derived at switch time, not stored.
- **Owned keys** — the `settings.json` keys cs itself added (tracked in cs's own config); the only
  keys cs may ever remove from that file.
- **Role alias** — a second launcher for a profile (`claude-planner`), re-pointable with
  `cs alias <name> <profile>` and removable with `cs alias remove|rm <alias...>` (decision 0024).
  The map in cs.json owns it, never the filename in `bin/`, which holds alias launchers only — a
  profile renders its artifact, never a launcher (decision 0013). Alias and profile names are
  independent: an alias may share a profile's name, whatever its target (decision 0037).
- **Behavioural reference** — [cs-cli-feature-inventory.md](./cs-cli-feature-inventory.md), the
  frozen behaviour map of the old CLI. No cs-cli checkout exists beside this repository, and its
  code is never copied in.
