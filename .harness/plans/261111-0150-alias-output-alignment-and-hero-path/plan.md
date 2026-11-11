---
title: "cs alias output aligns its tail lines; the hero alias tab drops the PATH lines"
description: "Pad the PATH notice label to the Launcher/Settings column, and re-capture the hero alias transcript in a fake env whose PATH already holds the bin dir."
status: completed
priority: P2
effort: 1h
branch: main
tags: [cli, site, alias]
blockedBy: []
blocks: []
created: 2026-11-11
---

# cs alias output alignment and the hero alias tab

## Outcome

1. **CLI.** The tail lines under a command's banner share one value column. Today `Launcher:`,
   `Settings:` and `Command:` put their value at column 12 (two-space indent plus a 10-wide
   label), but the PATH notice prints `  PATH: …` with its value at column 8, so the alias output
   reads crooked:

   ```
   Alias "planner" created at profile "claude".
     Launcher: ~/.config/cs/bin/claude-planner
     PATH: added to ~/.zshrc — open a new shell to pick it up
   ```

   After the fix:

   ```
   Alias "planner" created at profile "claude".
     Launcher: ~/.config/cs/bin/claude-planner
     PATH:     added to ~/.zshrc — open a new shell to pick it up
   ```

   This applies to all three PATH wordings in `binPathNoticeLines` (`added`, `entry is in`,
   `not written`). `cs config` shares `showBinPathNotice`, so it gets the same column for free.

2. **Site.** The user's real run of `cs alias xass claude` prints only the banner and the
   `Launcher:` line, because their PATH already holds the bin dir (status `already-in-path`, which
   prints nothing). The hero alias tab shows two PATH lines that only a first-ever setup prints.
   The user named them as extra ("alias ở tab Terminal đang thừa PATH"). Re-capture the alias
   transcript in a fake env whose `PATH` already contains `$H/.config/cs/bin`, so the CLI itself
   prints no PATH line. The transcript stays a verbatim capture; it is not hand-trimmed.

## Constraints

- Smoke only with a temp `HOME` and dummy tokens, never the real `~/.config/cs` or `~/.claude`
  (`.harness/docs/smoke-temp-home.md`). Export `HOME=$H` once for the whole chain.
- The PATH notice needs a real TTY: capture through a Python pty with a window size set
  (`TIOCSWINSZ`) and `FORCE_COLOR=1`, as the `cs-command-test` skill describes.
- Keep the PATH wording itself unchanged. Only the label padding changes.
- Do not touch `site/src/components/Terminal/*` or the `CONFIG_*` data in
  `site/src/constants/transcripts.constant.ts`: those were just finished and reviewed.

## Non-goals

- No change to when the PATH notice prints, and no change to `ensure-bin-path.service.ts` logic.
- No change to `scripts/install.sh` output.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | [Align the PATH label and re-capture the alias transcript](phase-01-align-path-and-recapture.md) | completed |

## Acceptance criteria

1. `binPathNoticeLines` returns `  PATH:     <text>` for every status that prints, so the value
   starts at the same column as `  Launcher: `.
2. Tests assert the new strings positively. Today's `not.toContain('PATH: added')` checks would
   pass vacuously after the change, so they must be rewritten to the new text.
3. `ALIAS_TRANSCRIPT` is a fresh verbatim capture with no PATH line, run in a fake HOME where
   `PATH` already contains `$H/.config/cs/bin`. Profiles `claude` and `glm` exist first.
4. Its header comment says how it was captured (PATH already holding the bin dir).
5. `pnpm typecheck && pnpm lint && pnpm test` at the repo root, and the same three in `site/`,
   all pass.
