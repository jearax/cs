# Site hero terminal

Traps for `site/src/components/Terminal/` and the hero transcripts in
`site/src/constants/transcripts.constant.ts`.

## Transcripts

- Every output line is a verbatim CLI capture: `dist/cli.mjs` in a tmp HOME with dummy tokens,
  through a pty with `FORCE_COLOR=1`. A line is dropped only after the user names it; planner
  pre-emptive trimming was rejected twice. To change what the CLI prints, change the capture env
  (for example, put the bin dir on `PATH`), not the text.
- `cs config` prints no ANSI even with `FORCE_COLOR=1`.
- Typed command lines differ by surface: band cards and docs code blocks use the help Usage form
  (`cs config [options]`); the hero types full-flag commands, one flag per line with ` \`.

## Animation

- The reveal is CSS-paced (`--at` → `animation-delay`). Never rely on a finished animation's end
  value: Chrome settled `steps()` one step short (clipping the last character) and a discrete
  `visibility` step on `visible`. Use `fill-mode: backwards` so a finished line takes its natural
  layout, or constant `from, to` keyframes. This holds for every typed animation, the
  `ClaudeCodeScreen` input included: its `/exit` rendered `/exi` with `both`.
- Paging (`clear` on a history entry) keeps `page` in state and resets it at every transition
  point: tab click, keyboard nav, replay, autoplay advance. Deriving it from a `(tab, run)` tuple
  resurrects stale pages when the autoplay loop revisits a tab.
- The pause freeze rule (`data-paused`) must carry `!important`: every `animation` shorthand resets
  `animation-play-state` implicitly, so a normal selector loses the cascade in the browser and in a
  computed-style test. It is the site CSS's only `!important` — keep it that way on purpose.
- The blank spacer between blocks is a real U+00A0 literal in `Terminal.tsx`; it displays as a
  plain space in file reads, so a rewrite that retypes it as ASCII space silently breaks the
  blank-line test. Patch such a file by splice, not by retyping its literals.

## Tests

- The suite runs with `reducedMotion: 'reduce'`, so CSS never fires `animationend`. Stub
  `matchMedia` for the component's own motion check, dispatch `animationend` by hand, and gate on
  `pseudoElement` or a data attribute: keyframe names are hashed by CSS modules.
- `getByText` on a typed command matches twice — the command line span and the nested
  `ShellCommand_program` span carry the same exact text; use `.first()`.
- A lone failure that passes on re-run is a flake; re-run before diagnosing.

## Scroll follow is an allowlist

The body scrolls on `animationstart` only for `.line` and `.commandRow` (`onLineAppear`). A new
row type that animates in must join that list, or a tall page leaves it below the fold.

## Line width budget

At the desktop hero width the terminal body fits about 68 monospace characters. A screen or
transcript line longer than that wraps; the Claude Code status lines were trimmed to fit (no
context bar, `18k/1.0M (2%)`). Measure in the browser before adding to a long line.
