---
phase: 01
title: "cs: play/pause"
status: completed
---

# Phase 01: cs play/pause

Starts only after plan 261111-1046 (use tab sessions) is completed: both edit `Terminal.tsx`.

## Files

You may modify or create:
- `site/src/components/Terminal/Terminal.tsx`
- `site/src/components/Terminal/styles.module.css`
- `site/src/components/Terminal/Terminal.test.tsx`
- `site/src/components/Terminal/pausable-timeout.ts` (new) and its test
  `site/src/components/Terminal/pausable-timeout.test.ts`

Nothing else.

## Requirements

1. `pausable-timeout.ts`: a small helper (a hook such as `usePausableTimeout`, or a plain factory
   used through a ref) with `start(fn, ms)`, `clear()`, `pause()`, `resume()`. `pause()` stops the
   pending timeout and keeps the remaining milliseconds; `resume()` schedules the rest. `start`
   while paused stores the job and runs nothing until `resume()`.
2. `Terminal.tsx`:
   - State `paused` (default `false`). The root element gets `data-paused={paused}`.
   - Route `advanceTimer` and `clearTimer` through the helper. Pausing pauses both; playing
     resumes both. The existing cancel-on-switch effect still clears them.
   - Render the toggle before the replay button, under exactly the same condition as replay
     (always shown together, reduced motion included). Icons from `lucide-react`: `Pause`
     while playing, `Play` while paused; `size={13}`, `aria-hidden`, class `styles.replayIcon`.
     `aria-label` is `Pause the transcript` / `Play the transcript`.
   - Replay and every tab pick (click and keyboard) set `paused` to `false`.
3. `styles.module.css`:
   - The toggle reuses `.replay`'s look. Only the first of the two buttons carries `ml-auto`, so
     the pair sits at the right edge together; keep the replay's vertical centring.
   - `.root[data-paused='true'] *, .root[data-paused='true'] *::before,
     .root[data-paused='true'] *::after { animation-play-state: paused; }` (express it the way the
     file writes other rules).

## Tests

- `pausable-timeout.test.ts` with fake timers: runs after `ms`; `pause` at 40% then advancing far
  past `ms` does not run it; `resume` runs it after the remaining 60%; `clear` cancels; `start`
  while paused waits for `resume`.
- `Terminal.test.tsx` (stub motion on, as the paging tests do):
  - The pause button renders before replay; clicking it flips the label to `Play the transcript`
    and sets `data-paused="true"` on the root; clicking again restores both.
  - Paused before the clear wait elapses: after dispatching the clear line's `animationend`,
    pause; wait longer than `CLEAR_MS`; the page has not changed; play; the next page appears
    (poll, 3000ms timeout).
  - Replay while paused clears `data-paused`.
  - Under reduced motion (the suite default) the pause button is present next to replay.
  - A Claude Code screen inside a paused root has its animations paused (check
    `getAnimations()` play state or computed `animation-play-state` on a screen element).

## Validation

`cd site && pnpm typecheck && pnpm lint && pnpm test`. Do not open a browser or start a dev server;
the planner checks on the running server.
