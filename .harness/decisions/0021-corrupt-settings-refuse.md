---
id: 0021
title: A corrupt settings.json is refused with an error, never overwritten
status: Accepted
date: 2026-11-04
---

# 0021: A corrupt settings.json is refused with an error, never overwritten

## Context

The code review found that `readClaudeSettings` turns an unreadable or corrupt `~/.claude/settings.json`
into `{}`, so the next `cs use` silently drops every user key (permissions, hooks, …). Unlike cs.json,
there is no `.corrupt` recovery path, and no test covered preservation either. `settings.json` is a file
Claude Code also owns, so the policy needed a user decision.

## Decision

- When `~/.claude/settings.json` exists but is unreadable or not valid JSON, `cs use` refuses: it exits
  with an error naming the file, prints a notice that the file could not be parsed, and writes nothing.
  The user fixes the file by hand.
- A missing file stays the current behavior: cs creates it.
- A valid JSON file keeps the current behavior: user keys are preserved, only `env` and
  `disableClaudeAiConnectors` are replaced.

> "[settings.json corrupt thì xử lý thế nào (F4)?] = Refuse + notice" (user, 2026-11-04)

## Options considered

| Option                   | Consequence                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| Refuse + notice (chosen) | No silent data loss; the user stays in control of their file     |
| Backup `.corrupt`        | Automatic, but cs then writes over a file it does not solely own |
| Ignore (status quo)      | Simplest, but drops user keys silently                           |

## Consequences

- Easier: no silent loss of hand-written settings.
- Harder: a corrupt file blocks `cs use` until the user fixes it — the error must say so clearly.
- Enforced by: tests that pre-write a corrupt and a valid `settings.json` before `cs use`.
