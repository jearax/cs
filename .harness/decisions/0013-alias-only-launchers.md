---
id: 0013
title: Only aliases create launchers — profiles render artifacts only
status: Accepted
date: 2026-11-04
supersedes: none
---

# 0013: Only aliases create launchers — profiles render artifacts only

## Context

With `cs alias` in place, auto-rendering a `claude-<profile>` launcher for every profile creates a
second, unmanaged population in `~/.config/cs/bin/` — mostly launchers nobody runs (`claude-default`
duplicates bare `claude`, which is what `cs use` writes). The user settled the policy while testing.

## Decision

- A profile renders only its artifact (`~/.config/cs/profiles/<name>.json`) — no launcher, no
  launcher line in command output.
- `cs alias <name> <profile>` is the only thing that creates a launcher (`bin/claude-<name>`).
  `bin/` mirrors the `aliases` map exactly; ownership is decided by the registry, never by filename.
- The alias-collision guard stays: an alias may not carry a profile's own name.
- `cs remove <profile>` stops deleting `claude-<profile>` launchers (cs never made them); it keeps
  cleaning dangling alias launchers. `cs reset` clears the alias map and alias launchers only.
- Launchers left behind by older versions in `bin/` are not cs-owned any more; the user removes
  them by hand once.
- `cs list`'s rendered marker keeps meaning "the artifact exists".

> "Nhưng tôi có confuse như sau, mình có command `cs alias` vậy có cần generate mặc định bin dạng
> claude-<profile> không?" (user, 2026-11-04)
> "[Chốt] Bỏ auto launcher (Recommended)" (user, 2026-11-04)

## Options considered

| Option                      | Consequence                                        |
| --------------------------- | -------------------------------------------------- |
| Aliases only                | bin/ == aliases map; one mechanism owns launchers  |
| Keep auto profile launchers | Two populations, clutter on every profile creation |
| Auto off + --launcher flag  | Flexible, but a second path for the same outcome   |

## Consequences

- Easier: launcher ownership has one home (the aliases map); no orphan cleanup for profiles.
- Harder: parallel use of a profile without an alias means passing `--settings` by hand or adding
  an alias — one deliberate step instead of a free file.
- Enforced by: render tests (artifact only) and alias tests (launcher present).
