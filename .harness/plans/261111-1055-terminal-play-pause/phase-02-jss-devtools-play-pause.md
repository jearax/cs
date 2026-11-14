---
phase: 02
title: "jss-devtools: the same control"
status: completed
---

# Phase 02: jss-devtools play/pause

Repository: `~/Documents/jearax/npm/jss-devtools`. Read its `CLAUDE.md` first; its site
commands and conventions apply. Starts after phase 01 is reviewed.

## Files

You may modify or create, all under `site/src/components/Terminal/`:
- `Terminal.tsx`, `styles.module.css`, `Terminal.test.tsx`
- `pausable-timeout.ts` and `pausable-timeout.test.ts` (copied from cs phase 01)

Nothing else in jss-devtools.

## Differences from cs (read before porting)

- jss-devtools' `Terminal.tsx` has no paging and no clear wait: the only timer is `advanceTimer`.
- It keeps `autoplay` (a tab pick stops the loop; replay restarts it). Keep that behaviour; the
  pause toggle is independent of `autoplay`.
- Port from cs's finished files, then diff against the jss-devtools file being replaced so nothing
  jss-specific is lost (`.claude/skills/cross-repo-port/SKILL.md` in cs).

## Requirements

Same as cs phase 01, items 1 to 3, minus the clear timer: the advance timer pauses and resumes;
the CSS rule and the button are identical; replay and tab picks set `paused` to `false`.

## Tests

- Copy `pausable-timeout.test.ts`.
- `Terminal.test.tsx`: the toggle renders before replay and flips label and `data-paused`; paused
  before the advance timer fires (dispatch the last line's `animationend`, pause, wait past
  `advance`), the tab has not changed; after play it advances (poll, 3000ms); replay while paused
  clears `data-paused`; present next to replay under reduced motion.

## Validation

`pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
from the jss-devtools root. No commits. Do not open a browser or start a dev server.
