# Cooker report — merge the alias and ls tabs

Plan: `.harness/plans/261111-0950-merge-alias-and-ls-tabs/plan.md` (phase 01)
Date: 2026-11-11

## What changed

### `site/src/components/Terminal/Terminal.tsx`

- `TerminalHistoryEntry` gains `clear?: boolean` (JSDoc: a typed `clear` follows the entry's
  output and wipes the screen before the next entry; entries up to and including it form one
  page). `TerminalTab.clearBetween` is removed.
- Blocks carry `clear` from their entry. `paging` now engages when the variant is `animated`,
  at least one block has `clear`, and reduced motion is off.
- Pages are computed as block-index groups split after each `clear` block; a trailing empty
  group (a `clear` on the very last block) is dropped. `page` indexes into that list; each
  page's blocks keep the cumulative timeline and the blank lines between blocks. A page that
  ends at a cleared block gets the synthetic `clear` row (prompt reused from the cleared
  block) appended; the last page has none.
- Unchanged by design: page state and its resets, `CLEAR_MS`, the `clear` row's
  `animationend` step, the advance gate on the last page only, and the caret hand-off
  (`--caret-until`), which still runs within each multi-block page.

### `site/src/pages/Home/Home.constant.ts`

- `config`: `clearBetween` dropped; each mapped history entry carries `clear: true`. Four
  pages, one profile each — behaviour identical to before.
- The `alias` and `ls` tabs merged into one `alias` tab: comment
  `Pin the launchers, then list everything cs keeps`, both `ALIAS_BLOCKS` as history (the
  second with `clear: true`), then `command: 'cs ls'` with `LIST_TRANSCRIPT`, `advance: 2000`,
  prompt `~` with no git. Tabs are now `['config', 'alias', 'use']`.

### `site/src/components/Terminal/Terminal.test.tsx`

- The paging suite moved from `clearBetween: true` on the tab to `clear: true` on the history
  entry; all six existing tests keep their coverage (page isolation, wipe timing, advance
  gating, replay/switch resets, autoplay return, static + reduced-motion fallback).
- New test: a page holding two blocks before its `clear` — page 1 shows both runs, the shared
  comment and the `clear` row with the third command absent from the DOM; after the clear
  row's `animationend`, page 2 shows only the third run and the comment.

### `site/src/pages/Home/components/Hero/Hero.test.tsx`

- Expected labels are `['config', 'alias', 'use']`.
- The replay-on-switch test now clicks the `alias` tab and proves both halves of the merged
  tab render (`cs alias planner claude` and `Aliases:`).

## Gate output

`cd site && pnpm typecheck && pnpm lint && pnpm test`:

- `tsc --noEmit` — pass
- eslint + stylelint — pass (two round-trips: lint demanded a block-bodied `some` callback
  and prettier formatting on the multiline `paging` condition)
- `vitest run` — 26 files, 127 tests, all passing

Step 6: ran the `antislop-code` skill over the diff's comments — no violations found, no
comments changed after the green gate run, so the gate result stands for the final source.

## Decision follow-up

Plan section "Constraints" asks for a new decision recording this change; the planner writes
it (cooker did not).

## Unverified

- Browser behaviour at full animation speed (the suite runs under `prefers-reduced-motion`
  with events dispatched by hand, per the established site-animation test approach).
- The real `~` environment — all verification is the vitest suite; no smoke of the built CLI
  was in scope (site-only change).
- No commit made, per instruction; the working tree keeps the prior uncommitted work intact
  (verified implicitly by the suite covering both the Terminal and CLI-facing tests in the
  repo's normal flow — no file outside the phase's owned list was touched).
