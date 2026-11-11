---
title: Alias PATH notice aligned to the launcher column; hero alias transcript re-captured without PATH lines
date: 2026-11-10
summary: "Padded binPathNoticeLines labels, rewrote PATH notice test assertions, re-captured ALIAS_TRANSCRIPT in a PATH-ready fake HOME"
---

# Alias PATH notice aligned to the launcher column; hero alias transcript re-captured without PATH lines

## What happened
- `binPathNoticeLines` (src/core/ui/artifact.ui.ts) printed `  PATH: ` with the value at column 8 while `  Launcher: ` put values at column 12, so the alias tail block read crooked. All three wordings now print `  PATH:     ` (label padded to the shared 10-wide column); `cs config` gets the same column for free via `showBinPathNotice`.
- The site hero alias tab showed two PATH lines a first-ever setup prints; the user named them as extra. `ALIAS_TRANSCRIPT` re-captured verbatim in a fake HOME whose PATH already held `$H/.config/cs/bin` — status `already-in-path` prints nothing, so each run is banner + `Launcher:` line only, exactly as planned. Nothing hand-trimmed.
- Test assertions rewritten positively: the two `not.toContain('PATH: added')`-style checks (vacuous after the padding change) collapsed into one `not.toContain('PATH:')`; the two `toContain` checks updated to the padded strings.

## Decision
- Followed plan 261111-0150 as written; no product decisions made. One flaky site test run occurred right after a comment-only edit; two consecutive full re-runs passed 125/125, recorded as flake, failing test name not captured.

## Next steps
- Report at `.harness/plans/reports/cooker-261111-0150-alias-output.md`; ping planner. No commit (as instructed).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
