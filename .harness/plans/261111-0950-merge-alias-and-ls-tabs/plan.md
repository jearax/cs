---
title: "Hero merges the alias and ls tabs: the alias runs, a typed clear, then cs ls"
description: "Pages become groups of blocks split by a per-entry clear, so one tab can show two alias runs, clear, then cs ls."
status: completed
priority: P2
effort: 2h
branch: main
tags: [site, frontend, terminal]
blockedBy: []
blocks: []
created: 2026-11-11
---

# Merge the alias and ls tabs

## Outcome

The hero has three tabs: `config`, `alias`, `use`. The `alias` tab plays
`cs alias planner claude` and `cs alias cooker glm` on one screen with their output, types `clear`,
wipes the screen, then plays `cs ls` with `LIST_TRANSCRIPT`. The tab comment is
`Pin the launchers, then list everything cs keeps`.

User's words: "tabs alias vs tab ls gộp thành 1, khi present của alias xong, clear xong ls".
Chosen option for the label and comment: "alias + comment nối".

## Design

Today paging is tab-level (`TerminalTab.clearBetween`): one block per page. A page must now hold
several blocks. Move the flag to the entry:

- Remove `clearBetween` from `TerminalTab`. Add `clear?: boolean` to `TerminalHistoryEntry`, with
  a JSDoc line: a typed `clear` follows this entry's output and wipes the screen before the next
  entry.
- Pages are the blocks split after each entry that has `clear: true`. A page's blocks keep the
  normal cumulative timeline and the blank line between blocks. A page that ends with a cleared
  entry gets the typed `clear` row appended. The last page has no `clear` row.
- Paging is on when the variant is `animated`, reduced motion is off, and at least one entry has
  `clear: true`. The fallback (static, reduced motion) is unchanged: the whole transcript, no
  `clear` rows.
- Everything else is kept as it is: page state, its resets, the `clear` row stepping on
  `animationend`, `CLEAR_MS`, the advance gate on the last page only, and the caret hand-off
  (`--caret-until`).
- `config` tab: each of its three history entries gets `clear: true`. Its behaviour stays exactly
  as today (one profile per page).

## Constraints

- Transcript data does not change. `LIST_TRANSCRIPT` and `ALIAS_BLOCKS` are verbatim captures of
  the same fake-HOME run that follows the config tab.
- Typed command for ls stays `cs ls`.
- Decision 0028 (typed `clear` between profiles) still holds. Record this change as a new
  decision; the planner writes it.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | [Per-entry clear and the merged tab](phase-01-per-entry-clear-and-merged-tab.md) | completed |

## Acceptance criteria

1. Hero tabs are exactly `['config', 'alias', 'use']`.
2. Animated alias tab, first page: comment, both alias blocks with their output and the blank
   line between them, then a `clear` row. `cs ls` is not in the DOM.
3. After the `clear` row's typing `animationend` plus `CLEAR_MS`, the second page shows the
   comment and the `cs ls` block with every `LIST_TRANSCRIPT` line. The alias blocks are gone.
4. The config tab behaves as before: four pages, one profile each, `clear` on the first three.
5. Static and reduced motion show the whole transcript with no `clear` rows.
6. `cd site && pnpm typecheck && pnpm lint && pnpm test` passes.
