---
title: "Phase 01: hero config tab pages profiles with a typed clear"
date: 2026-11-10
summary: "Cooked plan 261111-0135: Terminal clearBetween paging shipped green; derived page state replaced after an autoplay-cycle bug"
---

# Phase 01: hero config tab pages profiles with a typed clear

## What happened
Implemented phase 01 of `.harness/plans/261111-0135-hero-config-clear-between-profiles/`:
the hero `config` tab now plays one `cs config` profile per page — each page but the last ends
with a typed `clear` row whose `animationend` (typing element, not the caret pseudo-element)
schedules a 400ms wipe to the next page; the last page advances the tab as before. Static
variant and reduced motion keep the full transcript.

Two bugs found by tests, both real design lessons:
1. First cut sliced `pageBlocks` to a single block even when paging was off — the reduced-motion
   and static fallbacks silently rendered one block. The fallback path must render `blocks`, not
   a page.
2. The derived-state design (page keyed on `active`+`run`) breaks when the autoplay loop cycles
   back to a tab: the tuple repeats its old value, resurrecting the stale page. Replaced with
   explicit `setPage(0)` at every transition point (tab click, keyboard nav, replay, advance
   timer), batched by React so no stale frame paints.

Planner edited `styles.module.css` mid-run (`terminal-type` fill `backwards`); kept untouched —
the clear row reuses `.commandRow`/`.commandLine` and inherits the fix.

## Decision
Reset paging state explicitly at transition points instead of deriving it from a tab/run
tuple — tuples repeat on cyclic autoplay, epochs of state do not.

## Next steps
- Report at `.harness/plans/reports/cooker-261111-0135-hero-config-clear.md`; planner pinged.
- Real-browser timing of the typed clear at desktop width is unverified (suite runs under
  reduced motion by design).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
