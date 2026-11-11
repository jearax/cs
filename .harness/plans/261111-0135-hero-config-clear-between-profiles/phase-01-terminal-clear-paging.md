---
phase: 01
title: "Terminal paging with a typed clear"
status: completed
---

# Phase 01: Terminal paging with a typed `clear`

## Files

You may modify:
- `site/src/components/Terminal/Terminal.tsx`
- `site/src/components/Terminal/styles.module.css` (only if needed)
- `site/src/components/Terminal/Terminal.test.tsx`
- `site/src/pages/Home/Home.constant.ts`
- `site/src/pages/Home/components/Hero/Hero.test.tsx` and snapshots, only if the DOM changed

Do not modify: `site/src/constants/transcripts.constant.ts`, anything outside `site/`.

## Design

1. **API.** Add `clearBetween?: boolean` to `TerminalTab`, with a JSDoc line. When it is true,
   the tab plays its blocks (history entries plus the final command) one page at a time.
2. **Pages.** Page `i` is block `i`. Every page except the last ends with an extra command row:
   the same prompt as the block, with the command `clear`. It uses the existing command-row
   markup, so it types with `terminal-type` and carries the caret.
3. **Timeline.** Each page's timeline starts at 0. Reuse the existing timeline computation on the
   page's blocks (`[block, clearRow]`) instead of on the whole tab.
4. **Stepping.** Keep `page` state. When the `clear` row's command line fires `animationend`
   (the typing animation, not the caret's infinite one), wait `CLEAR_MS` (about 400ms), then set
   `page + 1`. Clear the timer on unmount, page change, tab change and replay. The `onRevealEnd`
   advance logic must only run on the last page.
5. **Reset.** `page` returns to 0 whenever `active` or `run` changes. Include `page` in React keys
   so a new page remounts and its animations restart. Scroll to the top on a page change, as the
   existing `scrollTop` effect does for `run`/`active`.
6. **Fallback.** Paging is on only when the variant is `animated` and reduced motion is off
   (`window.matchMedia('(prefers-reduced-motion: reduce)')`, the check the file already uses).
   Otherwise render the full transcript exactly as today.
7. **Hero.** In `Home.constant.ts`, set `clearBetween: true` on the `config` tab. Update its
   comment: the profiles now each get their own screen.

## Steps

1. Implement 1–6 in `Terminal.tsx`.
2. Apply 7.
3. Tests in `Terminal.test.tsx` (real browser via vitest-browser-react). Dispatch `animationend`
   directly, as the existing "keeps the last revealed element gating the tab advance" test does.
   Cover acceptance criteria 1–5 of `plan.md`.
4. Run `cd site && pnpm typecheck && pnpm lint && pnpm test`.
5. Run the `antislop-code` skill over the pending diff (comments only), then re-run step 4.

## Report

Write a report to `.harness/plans/reports/cooker-261111-0135-hero-config-clear.md` with what
changed, the test output summary, any snapshot updates and why, and anything left unverified.
Then ping the planner:
`herdr agent prompt planner 'cooker: phase 01 done, report at <path>'`.
Do not commit.
