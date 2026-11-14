---
title: "Terminal play/pause button beside replay, in cs and jss-devtools"
description: "A play/pause toggle next to the replay button freezes the whole hero terminal (CSS animations and pending timers) and resumes it where it stopped, on both landing sites."
status: completed
priority: P3
effort: 3h
branch: main
tags: [site, frontend, terminal]
blockedBy: [261111-1046-hero-use-tab-claude-sessions]
blocks: []
created: 2026-11-11
---

# Terminal play/pause

## Outcome

The hero terminal's tab strip has a play/pause button immediately left of the replay button, on
both sites:

- cs: `~/Documents/jearax/npm/cs/site`
- jss-devtools: `~/Documents/jearax/npm/jss-devtools/site`

Pause freezes everything the window is doing at that instant: typing, line reveals, carets, the
Claude Code screen, the wait after a typed `clear`, the wait before the next tab. Play resumes from
the exact same point. Nothing restarts.

Purpose: a visitor pauses the hero to read a sample command at their own pace, then plays on.

User's words: "tôi muốn có 1 button play/pause ở cạnh button reload của terminal"; "Sửa chung cho
site ở `~/Documents/jearax/npm/jss-devtools` luôn."; "mục đích / chủ ý thiết kế là để
client pause / play để xem command mẫu ở terminal"; "Pause/Play nằm bên trái Reload"; "Luôn hiện
cùng Reload, toggle Pause/Play"; "Pause thì dừng Screen" (the Claude Code screen freezes too).

## Behaviour

| Case | Behaviour |
|------|-----------|
| Icon and label | Playing: lucide `Pause`, `aria-label="Pause the transcript"`. Paused: lucide `Play`, `aria-label="Play the transcript"`. Same size and style as replay. |
| Position | Left of replay; replay keeps the far right. |
| Shown when | Always with replay: the same condition (`replay` prop and the animated variant), reduced motion included. |
| Replay while paused | Restarts the transcript and plays. |
| Tab pick while paused | Shows that tab from the start and plays. |
| Persistence | None; a page load always plays. |

## Design

- **CSS**: the window root gets `data-paused="true"` while paused; one rule sets
  `animation-play-state: paused` on every descendant and its `::before`/`::after`. Delays
  (`animation-delay`) freeze too, because a paused animation's delay does not count down. The
  Claude Code screen's turns are CSS animations under the same root, so they freeze with it.
- **Timers**: every `setTimeout` the Terminal schedules (cs: the advance timer and the clear wait;
  jss-devtools: the advance timer) goes through one small pausable-timeout helper that records the
  remaining time on pause and reschedules it on play. No other timer may run while paused.
- jss-devtools still stops autoplay on a tab pick (its own decision); this plan does not change
  that.

## Phases

| # | Phase | Repo | Status |
|---|-------|------|--------|
| 01 | [cs: play/pause](phase-01-cs-play-pause.md) | cs | completed |
| 02 | [jss-devtools: the same control](phase-02-jss-devtools-play-pause.md) | jss-devtools | completed |

Phase 02 ports phase 01's helper and CSS into jss-devtools and diffs against the file it replaces
(cs `.claude/skills/cross-repo-port/SKILL.md`).

## Acceptance criteria (each site)

1. The button sits left of replay, toggles its icon and `aria-label`, and is keyboard-focusable
   with the same focus ring.
2. Pausing mid-typing freezes the command text and caret; playing finishes it from there.
3. Pausing during a wait (cs: after a typed `clear`; both: before the next tab) holds the page or
   tab for as long as it stays paused, and the remaining wait runs after play.
4. Replay and a tab pick while paused both play.
5. The button renders wherever replay renders, reduced motion included.
6. Pausing during a Claude Code screen freezes the screen too (typing, turns, caret).
7. Each site's gate passes: cs `cd site && pnpm typecheck && pnpm lint && pnpm test`;
   jss-devtools `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test &&
   pnpm --dir site build`.
