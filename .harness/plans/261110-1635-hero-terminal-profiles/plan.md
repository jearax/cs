---
title: "Hero terminal: four provider profiles, alias tab, ls tab, use tab"
description: "Rework the hero Terminal tabs: tab 1 configures claude/claude-company/glm/minimax from real CLI output, tab 2 creates the planner+cooker aliases, tab 3 is cs ls, tab 4 is cs use claude (cs current removed); the Claude Code screens demo global claude, claude-planner and claude-cooker."
status: pending
priority: P1
effort: 3-4h
issue: none
branch: main
decision: none
created: 2026-11-10
---

# Plan: hero terminal shows the real profile story

## Overview

The hero terminal currently demos generic config/use/current transcripts. The user specified the
exact story it must tell: configure four provider profiles, create the planner/cooker aliases,
list everything, then `cs use claude` globally — and the Claude Code screens must show the three
real usage surfaces (global `claude`, `claude-planner`, `claude-cooker`).

Files: `site/src/constants/transcripts.constant.ts` (tab transcripts),
`site/src/pages/Home/components/ClaudeCodeScreen/` (screens), Hero tab config
(`site/src/pages/Home/constants/` or Hero constant), their tests.

## Tab spec

### Tab 1 — `config`

Four commands, run in this order; every line of output comes from a REAL smoke run (tmp `HOME`,
dummy tokens), not invented. **Reality rule:** the CLI prints the profile record right after EACH
command — the transcript must interleave command → that profile's output → one blank line, then a
1–2s pause, then the next command. Never all commands typed in a row with one output block at the
end; that is not what the CLI does. Use the Terminal's `history` entries (one per command, each
with its own real output) plus the reveal pacing so each profile block appears sequentially.

1. `cs config --name 'claude'` — no flags: the missing `claude` profile auto-seeds from the
   default record (decision 0015) and shows it.
2. `cs config --name 'claude-company' --oauth-token <claude-login-token>`
3. `cs config --name 'glm' --url 'https://api.z.ai/api/anthropic' --token <glm-token> --haiku 'glm-5.3-flash[1m]' --sonnet 'glm-5.3-flash[1m]' --opus 'glm-5.3-flash[1m]'`
4. `cs config --name 'minimax' --url 'https://api.minimax.io/anthropic' --token <minimax-key> --haiku 'MiniMax-M3.1-Flash[1m]' --sonnet 'MiniMax-M3.1-Flash[1m]' --opus 'MiniMax-M3.1-Flash[1m]'`

Tokens in the smoke run are dummy per-provider placeholders — the provider's own key prefix plus
"your-", truncated so nothing looks real. The CLI masks tokens in its own show output;
keep the masked form the real run printed.

**Command style (user, final):** the typed command in the config tab is the help **Usage** form
itself — `cs config [options]` — for every profile entry; the real per-profile OUTPUT beneath is
what tells the four profiles apart. Do not spell out flags in the typed line. The other tabs keep
their natural short commands (`cs alias planner claude`, `cs ls`, `cs use claude`). The OUTPUT
below each command stays the real captured output.

### Tab 2 — `alias`

Aligned with the profiles tab 1 created:

- `cs alias planner claude`
- `cs alias cooker glm`

Real output from the smoke run (the `~/.config/cs/bin/claude-...` launcher lines; trim the tmp
HOME prefix to `~`).

### Tab 3 — `ls`

`cs list` output after tabs 1–2: default first, then the profiles A→Z (decision 0023), rendered
marks, and the planner/cooker aliases.

### Tab 4 — `use`

`cs use claude` — global activation. **Remove the `cs current` tab.**

## Claude Code screens

Three screens, each aligned to the real rendered artifacts from the same smoke run:

| Screen | Story | Aligned settings |
| ------ | ----- | ---------------- |
| `claude` | Global use after `cs use claude` | `~/.claude/settings.json` written globally — official url + oauth token of the `claude` profile |
| `claude-planner` | Alias launcher | `claude --settings ~/.config/cs/profiles/claude.json` one-session shape |
| `claude-cooker` | Alias launcher | glm base url + glm model ids from `profiles/glm.json` |

## Constraints

- All output captured from `dist/cli.mjs` in a tmp `HOME` with the dummy tokens above — never the
  real `~/.config/cs`, `~/.claude`, or a real token (see `.harness/docs/smoke-temp-home.md`).
- Banner/TTY-only output: use the Python pty smoke pattern (cs-command-test skill) where the plain
  pipe output differs.
- Keep ANSI parsing as-is (`parseAnsi`) — capture with `FORCE_COLOR=1` like the existing
  transcripts.
- Tab count stays 4 (config, alias, ls, use) so the loop/replay behaviour from the landing port is
  untouched; only transcripts, tab labels and screens change.
- Tests: update Hero/transcript/ClaudeCodeScreen tests to the new tabs and screens; no test may
  assert invented output.

## Steps

1. Smoke run: seed the four profiles + two aliases in a tmp HOME, capture every command's real
   output (pty where needed), and read the three rendered artifacts (global settings.json,
   profiles/claude.json, profiles/glm.json) and the two launchers.
2. Rewrite `transcripts.constant.ts` tabs + labels; remove the `current` tab.
3. Rewrite the ClaudeCodeScreen contents to the three aligned screens.
4. Update tests; run site lint/typecheck/test; visual pass light/dark + mobile; antislop-code on
   the diff; report.

## Validation

```bash
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test
pnpm --dir site dev   # manual: 4 tabs loop, replay, reduced motion, light/dark
```

## Risk & rollback

- Low: content-only change inside the site; no component logic touched. Rollback: `git revert`.
