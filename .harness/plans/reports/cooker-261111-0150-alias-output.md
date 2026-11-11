# Cooker report — alias output alignment and the hero alias tab

Plan: `.harness/plans/261111-0150-alias-output-alignment-and-hero-path/plan.md` — phase 01 complete, no blockers.
Date: 2026-11-11 · Mode: `--auto` · No commit made (as instructed).

## What changed

1. **`src/core/ui/artifact.ui.ts`** — `binPathNoticeLines` pads all three PATH wordings
   (`added`, `entry is in`, `not written`) to `  PATH:     ` so the value starts at the same
   column as `  Launcher: `. Block comment updated to state the 10-wide label column.
2. **`tests/ensure-bin-path.service.test.ts`** — the two `toContain` checks rewritten to the
   new padded strings; the two vacuous `not.toContain('PATH: added')` / `not.toContain('PATH: not written')`
   checks replaced with one stronger `not.toContain('PATH:')`, which fails if any notice prints.
   No other test file asserts a PATH notice string (`alias.command.test.ts` has none).
3. **`site/src/constants/transcripts.constant.ts`** — `ALIAS_TRANSCRIPT` replaced with the fresh
   capture (no PATH lines); header comment now says the alias runs had the bin dir on PATH
   already. `CONFIG_TRANSCRIPT`, `CONFIG_BLOCKS` and `site/src/components/Terminal/*` untouched.

## Verbatim captured alias output

Captured per plan: fake `HOME` (mktemp -d), profiles `claude` and `glm` created first,
pty with `TIOCSWINSZ 24x80`, `FORCE_COLOR=1`, `SHELL=/bin/zsh`, `PATH="$H/.config/cs/bin:$PATH"`,
`$H` trimmed to `~`:

```
Alias "planner" created at profile "claude".
  Launcher: ~/.config/cs/bin/claude-planner

Alias "cooker" created at profile "glm".
  Launcher: ~/.config/cs/bin/claude-cooker
```

No PATH line appeared in either run (status `already-in-path` prints nothing), matching the
plan's expectation; nothing was hand-trimmed. `\r\n` pty line endings normalized to `\n` per
the existing transcript convention; the alias output carries no ANSI codes.

## Gate results

- Root `pnpm typecheck && pnpm lint && pnpm test`: **pass** — 24 files, 298 tests.
- Site `pnpm typecheck && pnpm lint && pnpm test`: **pass** — 26 files, 125 tests.
- One site test run failed between the comment edit and the re-run; the output was truncated
  before the failing test name was captured. Two consecutive full re-runs passed 125/125, and
  the intervening change was comment-only, so this is recorded as a flake (the site suite has
  timing-sensitive animation tests), not a regression. Unverified: which test flaked.
- `antislop-code` ran over the pending diff (comments only): the artifact.ui.ts block comment
  was compressed to two content lines; no code touched. Gates re-run after, all green.

## Not checked

- Real `~/.config/cs` / `~/.claude` — smoke used a temp HOME only, per the harness rule.
- `cs config` output with the new padding (shares `showBinPathNotice`) is covered by the root
  test suite, not visually re-smoked; the column math is identical to the alias path.
- Scratchpad capture script left at `/private/tmp/cs-alias-capture/`.
