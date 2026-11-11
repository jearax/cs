---
id: 0035
title: The hero use tab pages through three Claude Code sessions, each ended with /exit and a typed clear
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0035: The hero use tab pages through three Claude Code sessions, each ended with /exit and a typed clear

## Context

The use tab typed `cs use claude` with no output, then `claude`, and one screen cycled through the
global session and both launchers. The screen showed invented lines (`--settings`, `global`,
`/login pending`, a profile question) and several carets blinked at once.

## Decision

- Three pages separated by a typed `clear`: `cs use claude` with its verbatim output then `claude`;
  `claude-planner`; `claude-cooker`. No blank line between blocks; every command runs at the
  default `my-app git:(main)` prompt.
- Each screen is one Claude Code session in `~/my-app` on `main`, with the model of its profile and
  simulated usage. The user types `Hi, are you OK? What is your model?`, the model answers with its
  model ID, then `/exit` is typed.
- The screen carries no `--settings`, `global`, `/login`, `pending` or invented dialog. Only one
  caret blinks at a time.

> "cs use claude (không cần line trống so với my-app)" (user, 2026-11-11)
>
> "cwd ở ~/my-app / brand main, model theo profile/alias, giả lập usage cho sinh động, prompt say hello kiểu "Hi, are you ok, what is your model?", màn hình không có "--settings ", "hay profile global", "login pendding" gì đâu nha - tốt nhất là dùng output thực tế." (user, 2026-11-11)
>
> "Mỗi profile có command "/exit" và "clear" để qua profiles khác" (user, 2026-11-11)
>
> "Đúng rồi, cứ làm vậy nhé" (user, 2026-11-11, confirming the planner's reading above)

## Options considered

| Option                                 | Consequence                                              |
| -------------------------------------- | -------------------------------------------------------- |
| Three pages, one session each (chosen) | Each typed command matches the screen it opens           |
| One `claude` command cycling 3 screens | The launchers appear under a command that never ran them |

## Consequences

- Easier: the tab reads as a real shell session, like the config and alias tabs.
- Harder: the screen's timing (`CLAUDE_SESSION_MS`) and the tab's `screenMs`/`advance` must move
  together.
- Enforced by: `site/src/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen.test.tsx`,
  `site/src/pages/Home/components/Hero/Hero.test.tsx`.
