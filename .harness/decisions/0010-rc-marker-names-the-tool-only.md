---
id: 0010
title: cs appends a marked PATH export to the user's shell rc; the marker names the tool only
status: Accepted
date: 2026-11-04
supersedes: 0009
---

# 0010: cs appends a marked PATH export to the user's shell rc; the marker names the tool only

## Context

Launchers live in `~/.config/cs/bin`, which is in no default PATH, so every user had to edit their
rc file by hand. Decision 0009 made cs do it. That decision put the path in the marker comment —
`# Added by @jjuidev/cs, ~/.config/cs/bin/` — so the block carried the path twice: once in the
comment and once in the export line under it. The path is already there, and a marker that repeats
it goes stale the moment the install location changes. The user corrected the marker to name the
tool only.

## Decision

- cs appends the PATH entry to the user's shell rc on artifact render, and only when ALL hold — the
  bin dir is not already in `PATH`, the rc file has no cs marker yet, and stdout is an interactive
  terminal. A non-interactive run only prints the manual hint; cs never writes an rc file from a
  script or CI.
- Shell detection from `$SHELL`: `*/zsh` → `~/.zshrc`, `*/bash` → `~/.bashrc`, `*/fish` →
  `~/.config/fish/config.fish` (fish syntax `fish_add_path`); unknown/empty shell → no write, hint
  only.
- The marker cs looks for, and the one it writes, is exactly `# Added by @jjuidev/cs`.
- The appended block is exactly two lines, appended at the end of the file, never written twice:

```sh
# Added by @jjuidev/cs
export PATH="$HOME/.config/cs/bin:$PATH"
```

- Removal is manual (the user's choice): `remove`/`reset` never touch the rc file; the stray line is
  harmless once launchers are gone.

> "the marker comment drops the path. The block is now EXACTLY: # Added by @jjuidev/cs" (user,
> 2026-11-04)
> "Lên plan để detect user SHELL và để export PATH có marker" (user, 2026-11-04)
> "[Uninstall] Chưa xử lý tại thời điểm hiện tại, coi như tự client gỡ." (user, 2026-11-04)

## Options considered

| Option                     | Consequence                                            |
| -------------------------- | ------------------------------------------------------ |
| Marker names the tool only | One copy of the path; the marker survives a move       |
| Marker names tool and path | The comment goes stale when the install location moves |

## Consequences

- Easier: `claude-<profile>` works in a new shell with no manual step; re-running never duplicates;
  the rc file states one path.
- Harder: cs writes to a file it does not own — mitigated by marker, append-only and the TTY guard.
  A rc file written by the earlier cs carries the old marker; the new marker is a prefix of the old
  one, so that file still matches and no second block is appended.
- Enforced by: rc-path service tests (the marker string, the two-line block, the shell map, the
  PATH check) and the ensure-bin-path tests (append once, second run writes nothing).
