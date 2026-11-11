---
phase: 01
title: "Per-entry clear and the merged tab"
status: completed
---

# Phase 01: Per-entry clear and the merged tab

## Files

You may modify:
- `site/src/components/Terminal/Terminal.tsx`
- `site/src/components/Terminal/Terminal.test.tsx`
- `site/src/pages/Home/Home.constant.ts`
- `site/src/pages/Home/components/Hero/Hero.test.tsx`
- `site/src/components/Terminal/styles.module.css`, only if needed

Do not modify: `site/src/constants/transcripts.constant.ts`, anything outside `site/`.

## Current state (read before editing)

- `Terminal.tsx` builds `blocks` from `tab.history` plus the final command. Paging today:
  `paging` (around line 142) uses `tab?.clearBetween`, and `pageBlocks` takes `blocks[page]`
  plus a synthetic `clear` block. The `clear` row is marked `data-clear-command`.
- The caret hand-off: each command's last line gets `--caret-until` set to the next block's `at`
  within the rendered timeline. Keep it working inside multi-block pages.
- `Home.constant.ts`: `config` tab uses `clearBetween: true`. The `alias` tab has
  `history: [ALIAS_BLOCKS[0]]` and `command: ALIAS_BLOCKS[1].command`. The `ls` tab has
  `command: 'cs ls'` and `lines: LIST_TRANSCRIPT`.

## Steps

1. In `Terminal.tsx`, replace `clearBetween` with `TerminalHistoryEntry.clear`. Carry `clear`
   into each block. Compute pages as arrays of block indexes split after each `clear` block;
   `page` indexes into that list. `pageBlocks` is that page's blocks, plus a `clear` row when the
   page's last block has `clear`. Update the JSDoc and comments to match.
2. In `Home.constant.ts`:
   - `config`: drop `clearBetween`; add `clear: true` to each mapped history entry. Update its
     code comment.
   - Replace the `alias` and `ls` tabs with one tab: label `alias`, comment
     `Pin the launchers, then list everything cs keeps`, history = the two alias blocks (the
     second with `clear: true`), `command: 'cs ls'`, `lines: LIST_TRANSCRIPT`, `advance: 2000`,
     `prompt` `~` with no git, as the other tabs use.
3. Tests in `Terminal.test.tsx`: move the existing paging tests to the per-entry API, keeping
   their coverage. Add one test for a page with two blocks before a `clear` (acceptance criteria
   2–3 of `plan.md`), dispatching `animationend` as the existing paging tests do.
4. `Hero.test.tsx`: the expected labels become `['config', 'alias', 'use']`. The test that clicks
   the `ls` tab must click a tab that still exists and still prove a replay on switch.
5. Run `cd site && pnpm typecheck && pnpm lint && pnpm test`.
6. Run the `antislop-code` skill on the pending diff (comments only), then re-run step 5.

## Report

Write `.harness/plans/reports/cooker-261111-0950-merge-alias-ls.md` with what changed, the gate
output, and what is unverified. Then ping:
`herdr agent prompt planner 'cooker: merge plan done, report at <path>'`. Do not commit.
