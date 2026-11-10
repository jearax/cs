# Cooker report — hero terminal profiles (plan 261110-1635)

Status: DONE_WITH_CONCERNS

## What changed

- Smoke run first: all four `cs config` commands, two `cs alias` commands, `cs list`, `cs use claude`
  captured from `dist/cli.mjs` in a tmp HOME with the plan's dummy tokens, `FORCE_COLOR=1`, through a
  pty. Rendered artifacts read from the same HOME (global settings.json, profiles/claude.json,
  profiles/glm.json, both launchers). Nothing invented; tmp HOME prefix trimmed to `~`.
- `transcripts.constant.ts` — CONFIG_TRANSCRIPT (four profile outputs), ALIAS_TRANSCRIPT (trimmed
  launcher paths), LIST_TRANSCRIPT (full ls with aliases); old CONFIG/USE/CURRENT transcripts removed.
- `Home.constant.ts` — tabs now config / alias / ls / use; `cs current` tab removed. Tab 4 keeps
  `cs use claude` in history, types `claude`, and shows the Claude Code screen. Typed commands in
  the config tab follow the final "Command style" ruling: the help's Usage form `cs config [options]`
  for all four; profiles differ by their real output. Other tabs keep natural commands.
- `ClaudeCodeScreen.tsx` — parameterized by session (global / planner / cooker); content aligned to
  the real artifacts: global = official url, empty token → /login; planner = claude.json one-session
  file; cooker = glm base url + glm-5.3-flash[1m]. Auto-cycles the three surfaces every 8s; fixed
  `session` prop pins one. Screen no longer references harness onboarding.
- Tests: Hero tabs/labels/screen assertions, Terminal transcript list updated. 112/112 green;
  lint + typecheck green. Visual: light/dark desktop, config/use tabs and solid band button
  screenshot-checked; mobile verified in the previous band round (nothing wider added).

## Also in this round (planner's follow-up)

- "All nine commands" upgraded to the solid recipe at lg size using the design system's own token
  utilities (`bg-primary`/`hover:bg-primary-hover`, h-12 px-6 text-label-lg). `Button` has no
  href/asChild and variants are not exported, so the link carries the recipe's utilities.

## Concern for planner (queued per user instruction)

The interleaved tab-1 pacing (command → its output → pause → next command) is NOT implementable in
the current Terminal: `history` entries carry no output, and the animated reveal types all commands
first, then reveals every line sequentially. Delivering it needs a component change (e.g. optional
`lines` per history entry + a pacing gap in the reveal timeline). Per instruction, no new animation
was invented; the current tab shows the four Usage commands then the four verbatim outputs.

Not committed, per instruction.

## Follow-up: interleaved Terminal (planner-approved component change)

`Terminal.tsx` now renders the transcript as one interleaved document: every `TerminalHistoryEntry`
carries its own `lines`, and the DOM order is command → its output → blank → next command. The
reveal is still one CSS timeline — the component computes one cumulative millisecond cursor
(typing 700ms, first line lag 150ms, 70ms a line, 1300ms gap between blocks) and lands it on each
element as `--at`; every `animation-delay` reads `var(--at)`, so there is no JS timer and no new
animation engine. Replay (run remount), autoplay + advance, reduced-motion finished state,
scroll-follow, and the `data-reveal-end`/last-element advance gate are unchanged. `history` also
became a plain `Terminal` prop for single-transcript windows.

Hero data: `transcripts.constant.ts` exports `CONFIG_BLOCKS`/`ALIAS_BLOCKS` (per-command outputs,
verbatim smoke output; config keeps the Usage-form typed commands, alias keeps natural commands).

Tests: three new browser tests — DOM order interleaved, blanks only between blocks, and the
advance gate (the suite runs under `prefers-reduced-motion: reduce`, so the test dispatches the
reveal's `animationend` on the last element to exercise the gate). 115/115 green; lint + typecheck
green. Visual pass: light/dark desktop + mobile (no horizontal scroll), screenshots in the plan
dir. Not committed.
