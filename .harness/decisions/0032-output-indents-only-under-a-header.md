---
id: 0032
title: CLI output indents a line only under a `Label: name` header; after a sentence banner it is flush-left
status: Accepted
date: 2026-11-11
supersedes: 0030
---

# 0032: CLI output indents a line only under a `Label: name` header; after a sentence banner it is flush-left

## Context

Decision 0030 made `cs alias` flush-left but kept the two-space indent for `cs config`, `cs use`
and `cs env`. The user then showed `cs config -n claude --fable …` printing `Profile "claude"
updated.` followed by indented `Settings:`/`Command:` lines with no header above them, and asked
for every command with that shape to be fixed.

## Decision

A line is indented by two spaces only when it sits under a `Label: name` header line
(`Profile: claude`, `Active: claude`). Lines that follow a sentence banner (`… created at …`,
`… updated.`, `Switched to profile …`, `Saved … to …`) start at column 0. Labels keep their
padding (`Settings: `, `Command:  `, `PATH:     `). The helpers take the indent from the caller:
`profileFieldLines`, `artifactLines` and `showBinPathNotice` default to two spaces.

> "Kiểm tra lại các command của cs, chỗ nào output chưa hợp lý về thụt lề / thụt dòng như này thì fix luôn." (user, 2026-11-11, with a screenshot of `cs config … --fable` printing indented Settings/Command under `Profile "claude" updated.`)

## Options considered

| Option                             | Consequence                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| Indent only under a header         | One rule for every command; `cs list`/`current` keep their tree |
| Add a `Profile:` header everywhere | Keeps the indent, but a longer output on each update            |

## Consequences

- Easier: one rule to apply to any new command output.
- Harder: callers must pass `''` when they print after a banner.
- Enforced by: `tests/use.command.test.ts`, `tests/config.command.test.ts` and
  `tests/alias.command.test.ts` (flush-left lines, no indented line after a banner).
