---
phase: 01
title: "Terminal: per-entry screens and a gapless tab"
status: completed
---

# Phase 01: Terminal: per-entry screens and a gapless tab

## Files

You may modify:
- `site/src/components/Terminal/Terminal.tsx`
- `site/src/components/Terminal/Terminal.test.tsx`
- `site/src/components/Terminal/styles.module.css`, only if needed

Do not modify anything else in this phase.

## Current state (read before editing)

- `TerminalHistoryEntry` has `prompt`, `command`, `comment` (shown under the output), `lines`,
  `clear`. `TerminalTab` has `screen` (rendered once, after the whole timeline, in a wrapper with
  `--at: endAt` and `data-reveal-end`), `advance` and `clearWait`.
- `blocks` is built from `history` plus the final command. Each block's timeline: command typing
  (`TYPE_MS` per physical line), `FIRST_LINE_LAG_MS`, output lines (`LINE_MS` each), optional
  comment (`COMMENT_LAG_MS`), then `GAP_MS`.
- After every block but the last, a blank spacer `<p className={styles.line}>{' '}</p>` renders.
- Pages split after entries with `clear: true`; a synthetic `clear` block ends each page but the
  last. Its typing `animationend` plus `clearWait ?? CLEAR_MS` moves to the next page.
- The advance gate (`onRevealEnd`) uses `[data-reveal-end]` or the body's last child.
- A `ResizeObserver` keeps the body scrolled to the bottom while the first `.screen` grows.
- The `ClaudeCodeScreen` CSS times its turns from `--screen-at`, which the `.screen` wrapper sets
  from `--at`.

## Requirements

1. `TerminalHistoryEntry` gains:
   - `screen?: ReactNode`: a full-screen program's view, shown after this entry's command instead
     of output lines. JSDoc it like `TerminalTab.screen`.
   - `screenMs?: number`: how long the screen runs before the shell resumes (the next block's
     command starts after it). Required in practice when `screen` is set; default `0`.
2. A block with a screen renders, after its command row, a wrapper `div` with
   `className={cn(styles.line, styles.screen)}` and `--at` set to the moment the command finishes
   typing plus `FIRST_LINE_LAG_MS`. It does **not** get `data-reveal-end`; only the tab-level
   screen keeps that marker. The next block starts at that moment plus `screenMs` plus `GAP_MS`.
3. `TerminalTab` gains `gap?: boolean` (default `true`). When `false`, no blank spacer line renders
   between blocks. Config and alias tabs do not set it and must look exactly as before.
4. The scroll-to-bottom `ResizeObserver` observes every `.screen` on the current page, not only the
   first.
5. Reduced motion and the static variant: every entry screen renders in place (its final state,
   as the tab-level screen does today), and no `clear` rows render.
6. One blinking caret at a time (user: "còn lỗi pointer blink nữa, đang có nhiều pointer"). A
   command row followed by a screen hands its caret off when the screen appears (its
   `--caret-until` is the screen's `--at`), for entry screens and the tab-level screen alike. An
   entry screen's own caret goes out when the next block's command row appears: set
   `--caret-until` on the entry screen wrapper to the next block's `at`, so the screen's CSS can
   stop its caret then (phase 02 wires the screen side).
7. Keep everything else as it is: paging, `clearWait`, the caret hand-off (`--caret-until`), the
   advance gate on the last page only, the comment under output, scroll follow.

## Tests (in `Terminal.test.tsx`, follow the existing paging helpers)

- An entry with `screen` renders the screen node after that entry's command row, and the next
  block's command row comes after the screen.
- With `gap: false`, no blank spacer `<p>` (text `' '`) renders between blocks; without it, the
  spacer is there (an existing test may already cover the default; do not duplicate).
- A paged tab whose first page ends with an entry screen: the `clear` row follows the screen, and
  dispatching the clear line's `animationend` moves to the next page (poll with a 3000ms timeout).
- An entry screen does not carry `data-reveal-end`.
- The command row before a screen gets `--caret-until` equal to the screen's `--at`; an entry
  screen wrapper gets `--caret-until` equal to the next block's `--at`.

## Validation

`cd site && pnpm typecheck && pnpm lint && pnpm test` all pass. Existing tests pass unmodified.
