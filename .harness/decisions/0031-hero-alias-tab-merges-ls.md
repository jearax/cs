---
id: 0031
title: The hero alias tab plays the alias runs, a typed clear, then cs ls — no separate ls tab
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0031: The hero alias tab plays the alias runs, a typed clear, then cs ls — no separate ls tab

## Context

The hero had four tabs: config, alias, ls, use. The ls tab showed the state the alias runs had
just produced, so the two read as one story split in two.

## Decision

The hero has three tabs: `config`, `alias`, `use`. The `alias` tab shows both `cs alias` runs on
one screen, types `clear`, then shows `cs ls`. Its comment is
`Pin the launchers, then list everything cs keeps`. A typed `clear` is a per-entry choice, so a
screen can hold several commands (this extends decision 0028, which stays in force).

> "tabs alias vs tab ls gộp thành 1, khi present của alias xong, clear xong ls" (user, 2026-11-11)
>
> [Chosen option:] "alias + comment nối" (user, 2026-11-11)

## Options considered

| Option                       | Consequence                                       |
| ---------------------------- | ------------------------------------------------- |
| `alias` + one joined comment | Three short tab labels; one comment for the story |
| `alias` + a comment per page | Keeps the old copy; needs per-page comments       |
| Label `alias / ls`           | Names both commands; a wider tab bar              |

## Consequences

- Easier: the alias tab ends on the result the reader just built.
- Harder: `Terminal` pages are groups of blocks, split by `clear` on a history entry.
- Enforced by: `site/src/pages/Home/components/Hero/Hero.test.tsx` (tab labels) and
  `site/src/components/Terminal/Terminal.test.tsx` (multi-block page). Plan:
  `.harness/plans/261111-0950-merge-alias-and-ls-tabs/`.
