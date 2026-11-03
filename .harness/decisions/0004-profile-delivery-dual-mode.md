---
id: 0004
title: Global write stays the default; --settings files and claude-<profile> launchers are opt-in
status: Superseded by 0007
date: 2026-11-03
supersedes: none
---

# 0004: Global write stays the default; --settings files and claude-<profile> launchers are opt-in

## Context

Claude Code's `--settings` flag loads a settings JSON file for one session, overriding only the
keys it sets (verified against the official CLI reference, 2026-11-03). That enables a non-invasive
delivery for cs profiles, alongside the old global `~/.claude/settings.json` write.

## Decision

- `~/.config/cs/cs.json` remains the source of truth (raw profiles, `currentProfile`, global env).
- `cs config`/`cs use` also render `~/.config/cs/profiles/<name>.json` — a settings-shaped artifact
  rebuilt on every profile change (`[1m]` env stays derived at render time, per decision on the old
  logic; env precedence unchanged).
- cs generates one launcher script per profile at `~/.config/cs/bin/claude-<profile>` that runs
  `exec claude --settings ~/.config/cs/profiles/<name>.json`; the user adds that folder to PATH once.
- `cs use <name>` keeps the old global write as its default (zero breaking change); `--file` renders
  and prints the launch command without touching global settings.
- `cs current` keeps its meaning and additionally lists profiles that have a rendered file.
- `cs remove`/`cs reset` clean the matching artifact and launcher.

> "Giữ `cs use global` (cố gắng ít breaking changes), khi `cs config` sẽ lưu khác 1 chút và lưu theo
> profiles, có thể là ~/.config/cs/profiles/ + generate alias theo profiles." (user, 2026-11-03)
> "[Chọn] Theo A, nhưng tôi nghĩ format là claude-<profile>" (user, 2026-11-03)
> "[Chọn] Mặc định global, --file opt-in (Recommended)"; "[Chọn] Giữ nghĩa cũ + liệt kê thêm" (user, 2026-11-03)

## Options considered

| Option                        | Consequence                                            |
| ----------------------------- | ------------------------------------------------------ |
| Global default + file opt-in  | Old users keep their habit; the file mode grows by use |
| File default, --global opt-in | Safer for settings, but breaks every existing habit    |
| Shell rc aliases              | No PATH edit, but cs edits personal rc files           |
| cs spawns claude              | One-command UX, but cs owns TTY passthrough complexity |

## Consequences

- Easier: profiles coexist; global settings is touched only in global mode; launchers need no rc edits.
- Harder: two render targets (global write, profile artifact) must stay behaviourally identical —
  one renderer service feeds both.
- Enforced by: renderer unit tests (precedence matrix) and CLI tests once implemented.
