---
title: harness writing traps
kind: topic
sources: [.harness/decisions/README.md, .harness/MEMORY.md]
---

# Harness writing traps

> Decisions and harness prose have checks that a plain edit can silently break.

## How it works

The session-start hook injects the decisions in force from each decision file's frontmatter
`status:`, not from the index table. `jss-devtools harness doctor` checks memory size, decision
count, learned skills and secret-shaped values in every harness file.

## Rules

- Superseding a decision: set the old file's `status:` to `Superseded by NNNN` as well as its index
  row, or the hook keeps injecting it as in force.
- A `|` in a decision title is written `\|` in the `.harness/decisions/README.md` row; a bare `|`
  splits a column and Prettier re-aligns the whole table around the broken row. Rebuild the table
  from `git show HEAD:.harness/decisions/README.md` if that happens.

## Traps

- The doctor secret check fires on prose too: a token field shown with an assigned literal, even an
  empty one, reports `holds a secret-shaped value`. Describe the value in words. A note about the
  trap can trip it again if it quotes the pattern.
- Doctor is a compiled binary: to find the flagged text, run it against the file one line at a
  time (restore the file afterwards with `git checkout`).
- A blind string replace of a fake token (for example in reports) also hits file names that contain
  it; check `git diff -U0` straight after.

## Verify

```bash
jss-devtools harness doctor
```
