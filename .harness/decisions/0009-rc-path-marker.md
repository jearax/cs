---
id: 0009
title: cs appends a marked PATH export to the user's shell rc automatically
status: Superseded by 0010
date: 2026-11-04
supersedes: none
---

# 0009: cs appends a marked PATH export to the user's shell rc automatically

## Context

Launchers live in `~/.config/cs/bin`, which is in no default PATH, so every user had to edit their
rc file by hand. The user decided cs should do it: detect the shell, append a marked export line,
and skip silently once present. Removing the line later is left to the user — no uninstall command.

## Decision

- Trigger: on artifact render, only when ALL hold — the bin dir is not already in `PATH`, the rc
  file has no cs marker yet, and stdout is an interactive terminal. Non-interactive runs only print
  the manual hint; cs never writes an rc file from a script or CI.
- Shell detection from `$SHELL`: `*/zsh` → `~/.zshrc`, `*/bash` → `~/.bashrc`, `*/fish` →
  `~/.config/fish/config.fish` (fish syntax `fish_add_path`); unknown/empty shell → no write, hint only.
- The appended block is exactly two lines and is never written twice:

```sh
# Added by @jjuidev/cs, ~/.config/cs/bin/
export PATH="$HOME/.config/cs/bin:$PATH"
```

- Removal is manual (user's choice): `remove`/`reset` never touch the rc file; the stray line is
  harmless once launchers are gone.

> "Lên plan để detect user SHELL và để export PATH có marker, dạng `# Added by @jjuidev/cs, ~/.config/cs/bin/`" (user, 2026-11-04)
> "[Trigger] Tự động khi render"; "[Uninstall] Chưa xử lý tại thời điểm hiện tại, coi như tự client gỡ." (user, 2026-11-04)

## Options considered

| Option                      | Consequence                                                    |
| --------------------------- | -------------------------------------------------------------- |
| Auto-append with marker     | Zero-step onboarding; cs touches a personal file once, visibly |
| Dedicated `cs path` command | Full control, but one more step for every machine              |
| Auto + ask first time       | Safer, but blocks the render on a prompt                       |

## Consequences

- Easier: `claude-<profile>` works in a new shell with no manual step; re-running never duplicates.
- Harder: cs writes to a file it does not own — mitigated by marker, append-only, and TTY guard.
- Enforced by: rc-path service tests (mapping, marker idempotency, PATH-check) and CLI tests.

## Amendment 2026-11-04: shorter marker

Approved by the user on 2026-11-04 while the implementation was in flight. The marker comment
drops the path — the export line below it already names it, and `@jjuidev/cs` alone stays unique
to grep for.

```sh
# Added by @jjuidev/cs
export PATH="$HOME/.config/cs/bin:$PATH"
```

> "OK hiểu, nhưng bỏ ~/.config/cs/bin/ đi, dài dòng, ai chả biết." (user, 2026-11-04)
