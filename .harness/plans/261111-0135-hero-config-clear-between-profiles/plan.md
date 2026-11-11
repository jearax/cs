---
title: "Hero config tab clears the screen between profiles"
description: "The animated config tab types `clear` after each profile's output and wipes the screen before the next profile."
status: completed
priority: P2
effort: 2h
branch: main
tags: [site, frontend, terminal]
blockedBy: []
blocks: []
created: 2026-11-11
---

# Hero config tab clears the screen between profiles

## Outcome

In the hero's `config` tab, each `cs config` run gets its own screen. The sequence for each
profile is: type the command, reveal its verbatim output, type `clear` at the prompt, wipe the
screen, then start the next profile. The last profile (minimax) ends without a `clear`, and the
tab advances as it does today.

User choice (2026-11-11), from two options: "Gõ lệnh `clear`". The other option, a silent wipe
with no typed command, was rejected.

## Constraints

- The output is the verbatim CLI run. It was re-captured on 2026-11-11 with
  `dist/cli.mjs` in a fake HOME, through a pty with `FORCE_COLOR=1`, and it matches
  `CONFIG_TRANSCRIPT` line for line, so **the transcript text does not change**. `cs config`
  prints no ANSI codes. Do not edit `site/src/constants/transcripts.constant.ts` data.
- Typed commands stay as they are in `CONFIG_BLOCKS`.
- The static variant and `prefers-reduced-motion` show the full transcript, as today: all
  blocks, no `clear` rows. Content is never hidden behind an animation that may not run (see the
  comment in `styles.module.css`).
- The reveal pacing stays CSS-driven (`--at` → animation-delay). The page step is the only new
  JS timer, gated by an `animationend` event, the same way `onRevealEnd` gates `advance`.
- The `# comment` line stays on every page. It is the tab's caption, not typed output.
- `fixedBody` already pins the height, so a page change must not shift the layout.

## Non-goals

- The alias, ls and use tabs keep accumulating as today.
- No new transcript lines, and no change to the CLI.
- No refactor of `Terminal.tsx` beyond what paging needs. A small extracted helper is fine if it
  keeps the file readable.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | [Terminal paging with a typed `clear`](phase-01-terminal-clear-paging.md) | completed |

## Acceptance criteria

1. Animated, with `clearBetween`: the first page shows only the comment, block 0 (claude) and a
   `~ ❯ clear` row. Block 1 is not in the DOM.
2. When the `clear` row's typing animation ends, block 0 and that row disappear after a short
   lag, and block 1 starts typing from time 0 on an empty screen (comment kept).
3. The last page (minimax) has no `clear` row. Its last line's `animationend` still triggers
   `advance` to the next tab, and pages before the last never trigger `advance`.
4. A replay, a tab click or an autoplay advance resets the tab to page 0.
5. Static variant and reduced motion render all four blocks and no `clear` rows (current
   behaviour, current tests pass unchanged).
6. `cd site && pnpm typecheck && pnpm lint && pnpm test` passes. Snapshot updates are allowed
   only where the DOM legitimately changed; say which ones in the report.
