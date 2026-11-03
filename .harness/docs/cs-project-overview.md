# cs — project overview

Product intent, confirmed boundaries and terminology. The code is the authority for behaviour;
this file records only what code cannot express. Decisions live in
[`../decisions/README.md`](../decisions/README.md); the old CLI's behaviour map lives in
[cs-cli-feature-inventory.md](./cs-cli-feature-inventory.md).

## What cs is

`cs` (code switch) switches Claude Code between API providers and model sets through named
profiles stored locally and written into `~/.claude/settings.json`. macOS-first: the old CLI was
macOS-only by choice, and no cross-platform request exists.

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

- **Profile** — a named provider/model set: url, token, haiku, sonnet, opus, fable, plus optional
  per-profile env overrides.
- **Login mode** — a profile with an empty url and token; Claude Code then uses its own `/login`.
  A token without a URL is invalid in every mode.
- **`[1m]` marker** — a suffix on a model ID opting the profile into the 1M context window. It is
  a cs marker, never sent to the API, and its env defaults are derived at switch time, not stored.
- **Owned keys** — the `settings.json` keys cs itself added (tracked in cs's own config); the only
  keys cs may ever remove from that file.
- **Behavioural reference** — `/Users/tandm/Documents/jearax/npm/cs-cli`, read-only. Its code is
  never copied into this repository.
