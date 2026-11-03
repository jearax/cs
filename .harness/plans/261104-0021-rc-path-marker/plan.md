---
title: "Auto-append the cs bin PATH entry to the user's shell rc"
description: "Detect the shell from $SHELL, append a marked export line on first artifact render (TTY only), idempotent via marker."
status: completed
priority: P2
effort: 1h
issue: none
branch: main
tags: [cli, ux]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Plan: auto-append rc PATH entry (decision 0009)

## Overview

`~/.config/cs/bin` is in no default PATH. cs now detects the user's shell from `$SHELL`, appends a
two-line marked block to the matching rc file on first artifact render — only when the dir is not
in `PATH`, the marker is absent, and stdout is an interactive terminal — and prints a notice.
Non-interactive runs print the manual hint instead of writing.

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/services/rc-path.service.ts` | new — pure logic: map `$SHELL` → rc path (`*/zsh`→`~/.zshrc`, `*/bash`→`~/.bashrc`, `*/fish`→`~/.config/fish/config.fish` + fish-syntax block), build the two-line block, detect the marker in file content |
| `src/modules/profiles/services/ensure-bin-path.service.ts` | new — orchestrator: check `PATH` (split `:`), read rc (if exists), append when all conditions hold; returns a result object the command renders |
| `src/commands/*/services/*.service.ts` (config/use/env) | call the orchestrator after `renderProfileArtifacts`; pass the notice through the result to the command, rendered via `core/ui` |
| `src/core/ui/artifact.ui.ts` (or terminal.ui) | notice line: `PATH entry added to ~/.zshrc — open a new shell to pick it up` / the manual hint for non-interactive |
| `tests/rc-path.service.test.ts` | new — mapping table (zsh/bash/fish/unknown), marker detection, block content (exact two lines) |
| `tests/ensure-bin-path.service.test.ts` | new — tmp HOME: appends once, second call no-op, skips when PATH already contains the dir, no write when marker present elsewhere in file |
| `README.md` | the new behaviour + the manual line for scripts |
| `.harness/docs/code-standards.md` | nothing — module service pattern already documented |

## Blocks (exact content)

```sh
# Added by @jjuidev/cs
export PATH="$HOME/.config/cs/bin:$PATH"
```

Fish variant (same marker): `fish_add_path $HOME/.config/cs/bin`

(Amendment 2026-11-04: marker is `# Added by @jjuidev/cs` — the path was dropped from the comment; see decision 0010.)

## Steps

1. Pure service first, tests per the mapping table, then the orchestrator.
2. Wire into the three render call sites; notice text through `core/ui`.
3. TTY guard uses the existing `isInteractive()` from `core/ui/terminal.ui.ts`.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$(mktemp -d) node dist/cli.mjs config -n work -u https://x.com -t <test-token>
# bin/ not in PATH + no marker + non-TTY run => hint printed, rc untouched
# (a pty run must append the block exactly once; second config run appends nothing)
```

## Risk & rollback

- cs writes a file it does not own — append-only, marker-guarded, TTY-guarded; never truncate.
- Rollback: delete the two services and their call sites; the rc line stays harmless.
