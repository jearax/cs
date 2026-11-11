# Cooker report — phase 01: Terminal paging with a typed `clear`

Plan: `.harness/plans/261111-0135-hero-config-clear-between-profiles/plan.md`
Status: DONE

## What changed

- `site/src/components/Terminal/Terminal.tsx`
  - `TerminalTab` gains `clearBetween?: boolean` with a JSDoc line.
  - New `page` state (`useState(0)`), reset to 0 at every transition point — tab click, tab
    keyboard nav, replay button, and the autoplay `advance` timer — so the reset is batched into
    the same render as the switch and a stale page can never paint. An earlier derived-state
    design (page keyed on `active`+`run`) was replaced: the tuple repeats its old value when the
    autoplay loop cycles back to a tab, which resurrected a stale page.
  - When `clearBetween` is set, the variant is `animated` and reduced motion is off
    (`matchMedia('(prefers-reduced-motion: reduce)')`, the check the file already used), the
    timeline is computed over one block per page instead of the whole tab, so each page restarts
    at time 0. Every page but the last appends a `clear` command row that reuses the block's
    prompt and the existing command-row markup (types with `terminal-type`, carries the caret,
    marked `data-clear-command`).
  - `onAnimationEnd` handler: when the `clear` row's command line fires `animationend` (typed
    element itself, `nativeEvent.pseudoElement` empty — not the caret's infinite pseudo-element
    loop), a `CLEAR_MS` (400ms) timer advances the page. Pages before the last return early, so
    they never schedule the tab advance; the last page falls through to the unchanged
    `onRevealEnd`. Clear timer is cancelled on unmount and on `active`/`run`/`page` change.
  - `page` added to the comment, fragment, command-line and output-line React keys, so each page
    remounts and its animations restart; `page` added to the scroll-to-top effect deps.
  - Non-paging paths (static variant, reduced motion, other tabs) render the whole transcript
    exactly as before.
- `site/src/pages/Home/Home.constant.ts` — the `config` tab gets `clearBetween: true`; its
  comment is now `Create the four provider profiles, one screen each`.
- `site/src/components/Terminal/Terminal.test.tsx` — new `paging with a typed clear` describe
  with six tests (below). Tests stub `window.matchMedia` so the component's reduced-motion query
  answers "no preference" (paging engages) while the suite's real `reducedMotion: 'reduce'`
  keeps CSS animations off and every `animationend` manually dispatched.

## Verification

`cd site && pnpm typecheck && pnpm lint && pnpm test` — all green: 26 test files, 125 tests
passed (was 99 + 6 new Terminal paging tests, and 2 renders added inside one of them).

Test coverage mapped to plan acceptance criteria:

1. First page shows comment + block 0 + `clear` row; block 1 absent from the DOM — test
   "types one block, then clear…".
2. `clear` typing end wipes the screen after the lag; block 1 starts at time 0 with the comment
   kept — test "wipes the screen when the clear command finishes typing".
3. Pages before the last never advance (output `animationend` on page 0 leaves the tab on `one`
   after 400ms); last page has no `clear` row and its last line advances the tab — test "never
   advances from a page before the last…".
4. Replay and tab switch reset to page 0 — test "returns to page 0 on a replay and on a tab
   switch"; autoplay advance reset (tab two's ending hands back to tab one at page 0) — test
   "starts at page 0 again when the autoplay loop comes back around".
5. Static variant and the suite's own reduced motion render all blocks with no `clear` rows —
   test "keeps the whole transcript without clear rows…".
6. Gates pass (see above).

All existing tests pass unchanged; all six criteria verified in a real Chromium via
vitest-browser-react, dispatching `animationend` directly as the plan prescribed.

## Snapshot updates

None. No component in the touched surface uses snapshot tests, and no existing test changed.

## Notes

- Per the planner's mid-run note, `styles.module.css` holds the planner's own edit
  (`terminal-type` fill mode `backwards`); it was kept untouched by me. I made no CSS changes —
  the clear row reuses `.commandRow`/`.commandLine` markup and inherits that fix.
- `antislop-code` was run over the pending diff (comments only): trimmed the duplicated paging
  block comment to one line and the test-stub comment to three lines; the `clearBetween` JSDoc
  matches the file's existing JSDoc style and stayed. Gates re-run green afterwards.
- The working tree also carries concurrent work from other agents that this phase did not touch
  and did not revert: CLI config command/service + their tests, decision 0028/0029 drafts,
  harness docs/memory, and `site/src/constants/transcripts.constant.ts`. Nothing was committed.
- Unverified: the animated behaviour in a real browser outside the test harness (real timing of
  the typed `clear` at desktop width); the harness suite runs under reduced motion by design.
