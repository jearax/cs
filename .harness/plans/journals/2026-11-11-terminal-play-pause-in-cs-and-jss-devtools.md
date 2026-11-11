---
title: Terminal play/pause in cs and jss-devtools
date: 2026-11-11
summary: "Implemented plan 261111-1055: pause/play toggle beside the hero replay button on both landing sites; both site gates green."
---

# Terminal play/pause in cs and jss-devtools

## What happened
Implemented plan 261111-1055-terminal-play-pause on both sites (cs and jss-devtools, phase 01 then 02).

- New `site/src/components/Terminal/pausable-timeout.ts` in each repo: a `usePausableTimeout` hook (`start/clear/pause/resume`) that keeps the remaining milliseconds on pause and reschedules exactly that rest. First version reset the paused flag inside `clear()`, which made a job started while paused run immediately — the hook test caught it; the flag belongs to the window, not the job.
- `Terminal.tsx`: `paused` state, `data-paused` on the root, both timers routed through the helper, tab picks and replay set paused false.
- CSS: one rule `.root[data-paused='true'] *::before/::after { animation-play-state: paused !important }`. Plain specificity lost in the real browser: every `animation` shorthand resets the play state implicitly and out-ranked the pause selector — the test asserting computed `animation-play-state` caught it. `!important` chosen over triple-attribute specificity hacks because it is order-independent.
- Tests: fake-timer hook tests, clear-wait hold/resume, advance-wait hold/resume, toggle label + `data-paused`, replay-while-paused plays, screen animation freeze via computed style.

## Decision
`!important` on the pause rule (project CSS had none before): a freeze-everything state override must beat any future animation shorthand, not win a source-order tie.

## Next steps
Planner verifies visually on the running dev server (port 5173); commits are the planner's call (cooker was told not to commit).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
