---
phase: 01
title: "Align the PATH label and re-capture the alias transcript"
status: completed
---

# Phase 01: Align the PATH label and re-capture the alias transcript

## Files

You may modify:
- `src/core/ui/artifact.ui.ts`
- `tests/ensure-bin-path.service.test.ts`, `tests/alias.command.test.ts`, and any other test
  under `tests/` that asserts a PATH notice string
- `site/src/constants/transcripts.constant.ts`: the `ALIAS_TRANSCRIPT` array and the header
  comment only
- Site tests that assert alias transcript lines, if any

Do not modify: `site/src/components/Terminal/*`, `CONFIG_TRANSCRIPT`/`CONFIG_BLOCKS`,
`src/modules/profiles/services/ensure-bin-path.service.ts`, `scripts/install.sh`.

## Steps

1. In `binPathNoticeLines`, change the three `  PATH: ` prefixes to `  PATH:     ` (five spaces
   after the colon), so the value column matches `  Launcher: `. Update the block comment above
   them if its wording no longer fits.
2. Find every assertion on a PATH notice:
   `grep -rn "PATH: " tests site/src --include='*.ts' --include='*.tsx'`. Rewrite each one to the
   new string. Turn `not.toContain('PATH: added')`-style checks into checks that would fail if the
   notice did print, for example `not.toContain('PATH:')`.
3. Run `pnpm test` at the repo root. It rebuilds `dist/cli.mjs`.
4. Capture the alias transcript. Write the capture script as a file in your scratchpad, not
   inline, and use paths as arguments. Inside one subshell with
   `H=$(mktemp -d); export HOME=$H`:
   - create the profiles first: `node dist/cli.mjs config -n claude`, then
     `node dist/cli.mjs config --name glm --url https://api.z.ai/api/anthropic --token your-glm-token --haiku glm-5.3-flash[1m] --sonnet glm-5.3-flash[1m] --opus glm-5.3-flash[1m]`;
   - then run, through a pty (window size set, `FORCE_COLOR=1`, `SHELL=/bin/zsh`,
     `PATH="$H/.config/cs/bin:$PATH"`), `cs alias planner claude` and then `cs alias cooker glm`;
   - trim the `$H` prefix to `~` in the output.
5. Replace `ALIAS_TRANSCRIPT` with that capture, keeping the blank line between the two runs
   that `splitBlocks` splits on. Expect each block to be the banner plus the `Launcher:` line
   only. If a PATH line still appears, stop and report it; do not delete it by hand.
6. Update the header comment of `transcripts.constant.ts` to say the alias runs had the bin dir
   on `PATH` already, as an installed user's shell does.
7. Run `pnpm typecheck && pnpm lint && pnpm test` at the root and in `site/`.
8. Run the `antislop-code` skill over the pending diff (comments only), then re-run step 7.

## Report

Write `.harness/plans/reports/cooker-261111-0150-alias-output.md`. Include what changed, the
verbatim captured alias output, the gate results, and anything left unverified. Then ping:
`herdr agent prompt planner 'cooker: alias plan done, report at <path>'`. Do not commit.
