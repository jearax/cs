---
id: 0036
title: The hero terminal has a play/pause toggle left of replay that freezes everything, the Claude Code screen included
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0036: The hero terminal has a play/pause toggle left of replay that freezes everything, the Claude Code screen included

## Context

A visitor could only watch the hero transcript at its own pace or replay it. The same Terminal
component ships on the jss-devtools site.

## Decision

- A play/pause toggle sits immediately left of replay and always renders with it (reduced motion
  included). It shows Pause while playing and Play while paused.
- Pause freezes typing, reveals, carets, the Claude Code screen and every pending wait; play
  resumes from the same point. Replay and a tab pick play again. Nothing is persisted.
- The jss-devtools site carries the same control.

> "tôi muốn có 1 button play/pause ở cạnh button reload của terminal" (user, 2026-11-11)
>
> "Sửa chung cho site ở `…/jss-devtools` luôn." (user, 2026-11-11)
>
> "mục đích / chủ ý thiết kế là để client pause / play để xem command mẫu ở terminal" (user, 2026-11-11)
>
> "Pause/Play nằm bên trái Reload." "Luôn hiện cùng Reload, toggle Pause/Play" "Pause thì dừng Screen" (user, 2026-11-11)

## Options considered

| Option                   | Consequence                                          |
| ------------------------ | ---------------------------------------------------- |
| Freeze in place (chosen) | The reader studies a command, then the story goes on |
| Pause only the tab loop  | Typing keeps running; the command still moves away   |

## Consequences

- Easier: a visitor reads any sample command at their own pace.
- Harder: every new timer in the Terminal must go through the pausable timeout helper, and the
  pause CSS rule needs `!important` against animation shorthands.
- Enforced by: `site/src/components/Terminal/Terminal.test.tsx`,
  `site/src/components/Terminal/pausable-timeout.test.ts` (both repositories).
