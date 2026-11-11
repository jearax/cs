---
phase: 02
title: "ClaudeCodeScreen sessions and the use tab data"
status: completed
---

# Phase 02: ClaudeCodeScreen sessions and the use tab data

Depends on phase 01 (entry `screen`/`screenMs`, tab `gap`).

## Files

You may modify:
- `site/src/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen.tsx`
- `site/src/pages/Home/components/ClaudeCodeScreen/styles.module.css`
- `site/src/pages/Home/Home.constant.ts` (the `use` tab only)
- `site/src/constants/transcripts.constant.ts` (add `USE_TRANSCRIPT` only; copy the lines below
  exactly)
- `site/src/pages/Home/components/Hero/Hero.test.tsx`
- a new `site/src/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen.test.tsx`

Do not touch the config or alias tabs, nor any other transcript.

## Data

`USE_TRANSCRIPT`, the verbatim `cs use claude` output captured in a temp HOME with the bin dir on
PATH (so no PATH line), launcher prefix trimmed to `~`:

```ts
export const USE_TRANSCRIPT: readonly string[] = [
	'Switched to profile "claude".',
	'URL:    https://api.anthropic.com',
	'Haiku:  claude-haiku-5-5[1m]',
	'Sonnet: claude-sonnet-5-5[1m]',
	'Opus:   claude-opus-5-5[1m]',
	'Fable:  claude-fable-5-1[1m]',
	'Settings: ~/.config/cs/profiles/claude.json',
	'Command:  claude --settings ~/.config/cs/profiles/claude.json'
];
```

## The use tab (`Home.constant.ts`)

- `label: 'use'`, `comment: 'Switch globally or use aliases, then open Claude Code'` (unchanged).
- `gap: false`. No `prompt` overrides anywhere in this tab: every command uses the default prompt
  (`my-app`, `git:(main)`).
- `history`:
  1. `cs use claude`, `lines: USE_TRANSCRIPT`.
  2. `claude`, `screen: <ClaudeCodeScreen session="claude" />`, `screenMs` = the screen's own
     length (below), `clear: true`.
  3. `claude-planner`, `screen` with `session="planner"`, `screenMs`, `clear: true`.
- Final `command: 'claude-cooker'`, `screen` with `session="cooker"`; keep `advance`, set to the
  cooker screen's length plus about 2s.
- Build the screens with `createElement` as today (the file is `.ts`).

## ClaudeCodeScreen

Rewrite to one session per render, no internal cycling, no `useState`/`setInterval`.

- Props: `session: 'claude' | 'planner' | 'cooker'` (required), plus `div` props.
- Per-session data, one record each:

  | session | model | usage (Session · Weekly) | context |
  |---------|-------|--------------------------|---------|
  | claude | `claude-sonnet-5-5[1m]` | `12.4% (03:41)` · `8.2% (5d 6h)` | `18.2k/1.0M (2%)` |
  | planner | `claude-sonnet-5-5[1m]` | `12.9% (03:39)` · `8.3% (5d 6h)` | `18.6k/1.0M (2%)` |
  | cooker | `glm-5.3-flash[1m]` | `3.1% (04:52)` · `1.4% (6d 20h)` | `16.9k/1.0M (2%)` |

- Layout, top to bottom (keep the real Claude Code look and the existing visual classes):
  1. Header: `Claude Code v2.1.321`, then the model, then `~/my-app`. Nothing else on these lines.
  2. User turn: `❯ Hi, are you OK? What is your model?` (typed in the input first, then sent into
     the log, as today).
  3. Answer turn: `● I'm doing well, thanks! I'm running on <model>.`
  4. Input box: after the answer, `/exit` types in the input; the caret stays after it. That is
     the screen's last step.
  5. Status line: `cwd: ~/my-app ⎇ main`; `Model: <model> Thinking: on Context: <context>`;
     `Session: <usage> · Weekly: <usage>`; last line `? for shortcuts`.
- Remove: the `☐ Profile` question block, the `Bash(cs current)` turn, the `Reading/Loaded
  …settings` line, the `⏵⏵ … launcher` / `/login pending` mode line, any `--settings`, `global`,
  `profile:`, `/login`, `pending`, `launcher` text.
- Timing: keep the `--t` / `--screen-at` mechanism. Suggested beats from the screen's appearance:
  prompt types at 1s (45ms a char), sends about 0.4s after; answer at about 4.4s; `/exit` starts
  typing at about 5.6s. Export the screen's total length as a constant (for example
  `CLAUDE_SESSION_MS`, about 7000) and use it for `screenMs` and `advance`.
- Reduced motion: everything shows in its final state (the input shows `/exit`).
- One caret at a time: the screen's input caret (and any other caret inside the screen) uses the
  same hand-off as the terminal: a second animation `terminal-caret-off`-style keyframe that hides
  it from `calc(var(--caret-until) * 1ms)` when the wrapper sets `--caret-until` (phase 01). With no
  `--caret-until` (the last page) the caret keeps blinking. Only one caret may blink on screen at
  any moment of the use tab.

## Tests

- `ClaudeCodeScreen.test.tsx`: for each session, the model text and `~/my-app`, `main`, the prompt
  and `/exit` render; none of `--settings`, `global`, `/login`, `pending`, `launcher` appear in
  `textContent`.
- `Hero.test.tsx`: the use tab, under the suite's reduced motion, shows `cs use claude`, the
  `Switched to profile "claude".` line, `claude`, `claude-planner`, `claude-cooker`, and no
  `clear` row. Adjust any existing assertion that pinned the old screen text.

## Validation

`cd site && pnpm typecheck && pnpm lint && pnpm test` all pass. Do not open a browser or start a
dev server: the planner owns the browser and checks the tab on the running server (port 5173).
