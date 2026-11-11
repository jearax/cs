---
title: "Hero use tab: three Claude Code sessions, each ended with /exit and a typed clear"
description: "The use tab pages through cs use claude → claude, claude-planner and claude-cooker, each a realistic Claude Code screen in ~/my-app that types /exit before the shell clears."
status: completed
priority: P2
effort: 3h
branch: main
tags: [site, frontend, terminal]
blockedBy: []
blocks: []
created: 2026-11-11
---

# Hero use tab: three Claude Code sessions

## Outcome

The hero `use` tab tells one story in three pages, each separated by a typed `clear`, like the
config tab:

| Page | Shell commands (prompt `my-app git:(main) ✗`) | Claude Code screen |
|------|-----------------------------------------------|--------------------|
| 1 | `cs use claude` with its verbatim output, then `claude` | session on the `claude` profile |
| 2 | `claude-planner` | session on the planner launcher (`claude` profile) |
| 3 | `claude-cooker` | session on the cooker launcher (`glm` profile) |

In every screen the user types `Hi, are you OK? What is your model?`, Claude answers with its
model, then the user types `/exit`. Back at the shell, pages 1 and 2 type `clear`; page 3 ends the
tab and the loop advances as today.

User's words: "cs use claude (không cần line trống so với my-app)"; "cwd ở ~/my-app / brand main,
model theo profile/alias, giả lập usage cho sinh động, prompt say hello kiểu "Hi, are you ok, what
is your model?", màn hình không có "--settings ", "hay profile global", "login pendding" gì đâu nha
- tốt nhất là dùng output thực tế"; "Mỗi profile có command "/exit" và "clear" để qua profiles
khác".

Planner's reading, confirmed by the user ("Đúng rồi, cứ làm vậy nhé"):
- "No blank line": every command runs at the default prompt (`my-app`, branch `main`), and this
  tab has no blank spacer line between blocks.
- The prompt text is the user's sentence with spelling fixed: `Hi, are you OK? What is your
  model?`.
- "Real output": `cs use claude` output is the verbatim CLI capture. The Claude Code screen keeps
  the real Claude Code layout (header, conversation, input box, status line) and drops every
  invented line.

## Design

- **Terminal** (phase 01): a history entry may carry its own `screen` plus `screenMs`, the time
  the screen needs before the shell resumes. A tab may turn off the blank spacer line between
  blocks (`gap: false`). The final command keeps the existing `tab.screen` path and its
  `data-reveal-end` advance gate.
- **ClaudeCodeScreen** (phase 02): one session per render, chosen by a required `session` prop
  (`'claude' | 'planner' | 'cooker'`); no internal cycling. Its own timeline ends with `/exit`
  typed in the input box.
- **Data** (phase 02): `USE_TRANSCRIPT` in `transcripts.constant.ts`, the verbatim `cs use claude`
  output captured with the bin dir on PATH (no PATH line). The planner supplies it in the phase.

## Constraints

- Transcripts stay verbatim captures; never hand-edit CLI output (`.harness/docs/site-terminal.md`).
- Config and alias tabs must not change behaviour or look (their blank spacer lines stay).
- Reduced motion and the static variant show the whole transcript, every screen in its final
  state, with no `clear` rows.
- Decisions 0028, 0031, 0034 still hold. The planner writes the new decision.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | [Terminal: per-entry screens and a gapless tab](phase-01-terminal-entry-screens.md) | completed |
| 02 | [ClaudeCodeScreen sessions and the use tab data](phase-02-claude-code-sessions.md) | completed |

## Acceptance criteria

1. Use tab, animated, page 1: comment, `cs use claude`, its eight output lines, `claude`, the
   claude session screen ending with `/exit`, then `clear`. No blank spacer lines. Pages 2 and 3
   are not in the DOM.
2. Page 2 shows `claude-planner` and the planner screen, then `clear`. Page 3 shows
   `claude-cooker` and the cooker screen, and no `clear`.
3. No screen contains `--settings`, `global`, `/login` or `pending`. Each screen shows cwd
   `~/my-app`, branch `main` and the session's model: `claude-sonnet-5-5[1m]` for claude and
   planner, `glm-5.3-flash[1m]` for cooker.
4. The tab advances to `config` after page 3, as today.
5. Config and alias tabs are unchanged (their tests still pass untouched).
6. At any moment of the use tab only one caret blinks (user: "còn lỗi pointer blink nữa, đang có
   nhiều pointer").
7. `cd site && pnpm typecheck && pnpm lint && pnpm test` passes.
