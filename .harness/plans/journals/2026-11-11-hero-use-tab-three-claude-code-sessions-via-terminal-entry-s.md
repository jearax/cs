---
title: "Hero use tab: three Claude Code sessions via Terminal entry screens"
date: 2026-11-11
summary: "Implemented plan 261111-1046 phases 01-02: Terminal per-entry screens and gapless tab, ClaudeCodeScreen single-session rewrite, USE_TRANSCRIPT; gate green 138/138"
---

# Hero use tab: three Claude Code sessions via Terminal entry screens

## What happened

Cooked `.harness/plans/261111-1046-hero-use-tab-claude-sessions/` (phases 01+02, site/ only).

- `Terminal.tsx`: `TerminalHistoryEntry` gained `screen`/`screenMs`; `TerminalTab` gained `gap`; a screen block renders its wrapper at `lineEnd + FIRST_LINE_LAG_MS` and the next block starts at `+ screenMs + GAP_MS`; ResizeObserver now watches every `.screen` on the page (dep `page` added); caret hand-off moved from the `.command[data-last='false']` CSS selector to a `data-caret-off` attribute so the last command also hands its caret to a tab-level screen.
- `ClaudeCodeScreen.tsx`: rewritten to one required `session` (`claude` | `planner` | `cooker`), no cycling/`useState`/`setInterval`; each session ends with `/exit` typed in the input; `CLAUDE_SESSION_MS = 7000` exported and used for `screenMs` and `advance`.
- `Home.constant.ts`: use tab now `gap: false`, no prompt overrides (default `my-app git:(main)`), three paged sessions (clear after claude and planner), cooker ends the tab.
- `transcripts.constant.ts`: `USE_TRANSCRIPT` copied verbatim from the phase file.
- Tests: 4 new Terminal tests, new `ClaudeCodeScreen.test.tsx` (3 sessions, banned-strings check), Hero use-tab assertions rewritten.

Gate: `cd site && pnpm typecheck && pnpm lint && pnpm test` — green, 138/138 in 27 files. Antislop on changed-file comments: clean. Reported DONE to the herdr planner.

## Traps hit

- The Terminal spacer literal is a real U+00A0, not a plain space; it displays identically in Read output and a scripted rewrite silently replaced it with ASCII space, failing the verbatim blank-line test. Never rebuild "space-looking" literals by retyping them in a verbatim file.
- `getByText('claude')` is ambiguous: ShellCommand nests a `ShellCommand_program` span inside the command line span, so exact text matches twice — use `.first()`.
- One flake in the paging autoplay-loop test ("starts at page 0 again…"); re-run passed, per `.harness/docs/site-terminal.md`.

## Decision

None new — the planner writes the decision for the use-tab paging per the plan's constraint note.

## Next steps

Planner reviews the use tab on the running dev server (port 5173) and writes the decision.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
