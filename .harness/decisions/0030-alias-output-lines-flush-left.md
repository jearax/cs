---
id: 0030
title: cs alias prints its Launcher and PATH lines flush-left, aligned with its banner
status: Superseded by 0032
date: 2026-11-11
supersedes: none
---

# 0030: cs alias prints its Launcher and PATH lines flush-left, aligned with its banner

## Context

`cs alias` printed its banner at column 0 and `  Launcher:` (and `  PATH:`) indented by two,
with no header line to indent under. `cs config` indents its tail lines under a `Profile: <name>`
header, so the indent reads right there but crooked after the alias banner.

## Decision

`cs alias` and `cs alias remove` print `Launcher:` and `PATH:` at column 0, the same column as
the banner. Labels stay padded to one 10-wide column (`PATH:     `). Commands whose tail lines sit
under an indented block (`cs config`, `cs use`, `cs env`) keep the two-space indent.

> "Lỗi 2 logs chưa thẳng hàng của `cs alias` vẫn còn." (user, 2026-11-11)
>
> [Chosen option:] "Bỏ thụt đầu dòng" (user, 2026-11-11)
>
> "FYI, cả alias thật và tab alias luôn" (user, 2026-11-11)

## Options considered

| Option                        | Consequence                                 |
| ----------------------------- | ------------------------------------------- |
| Flush-left lines              | Aligned with the banner; no extra line      |
| Add an `Alias: <name>` header | Keeps the indent, but one more line per run |

## Consequences

- Easier: alias output reads as one aligned block.
- Harder: the PATH notice takes its indent from the caller (`showBinPathNotice(outcome, indent)`).
- Enforced by: `tests/alias.command.test.ts` and `tests/ensure-bin-path.service.test.ts`, which
  assert the lines right after a newline.
