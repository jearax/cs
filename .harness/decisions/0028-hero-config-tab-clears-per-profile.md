---
id: 0028
title: The hero config tab gives each profile its own screen, separated by a typed clear
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0028: The hero config tab gives each profile its own screen, separated by a typed clear

## Context

The hero's `config` tab stacked all four `cs config` runs on one scrolling screen. The user wanted
each profile shown on its own, with the CLI's verbatim output kept.

## Decision

In the animated `config` tab, each profile's block plays on an empty screen. After its output, the
prompt types `clear` and the screen wipes before the next profile. The last profile ends without
`clear`. The static variant and reduced motion keep the full transcript.

> "Giờ tôi muốn cs config cho các profile, giờ mỗi profile clear thay vì ghi liên tục, output thật của CLI nhé." (user, 2026-11-11)
>
> [Chosen option:] "Gõ lệnh `clear`" (user, 2026-11-11)

## Options considered

| Option        | Consequence                                              |
| ------------- | -------------------------------------------------------- |
| Typed `clear` | Reads as a real terminal; one extra typed step a profile |
| Silent wipe   | Shorter, but the screen changes with no visible cause    |

## Consequences

- Easier: each profile's output reads alone, with no scrolling.
- Harder: `Terminal` gains paging state on top of its CSS timeline.
- Enforced by: `site/src/components/Terminal/Terminal.test.tsx` (plan
  `.harness/plans/261111-0135-hero-config-clear-between-profiles/`)
