---
id: 0034
title: The hero terminal keeps auto-advancing after the reader picks a tab
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0034: The hero terminal keeps auto-advancing after the reader picks a tab

## Context

Picking a tab (click or arrow keys) switched autoplay off for good, so the picked tab stayed on
its last screen. The user picked the config tab, watched it end on minimax, and reported that it
never moved on to the next tab.

## Decision

Picking a tab replays that tab from the start; when its replay ends, the loop moves on to the next
tab as it does without a pick. There is no state in which the tabs stop advancing.

> "Hiện tại, tab 1 present xong (xong config minimax), không tự chuyển sang tab 2" (user, 2026-11-11)
>
> [Chosen option:] "Có bấm, muốn vẫn tự chuyển" (user, 2026-11-11)

## Options considered

| Option                    | Consequence                                        |
| ------------------------- | -------------------------------------------------- |
| Keep looping after a pick | The hero always moves; a pick is a replay          |
| Stop the loop on a pick   | The reader controls the view, but it freezes there |

## Consequences

- Easier: the hero never sits on a finished screen.
- Harder: a reader who wants to study one tab must re-pick it or use replay.
- Enforced by: `site/src/components/Terminal/Terminal.test.tsx` ("keeps looping after the reader
  picks a tab").
