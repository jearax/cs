# Report: cooker-glm — autocomplete free-text fix (decision 0017 contract repair)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Root cause

The static options array made clack autocomplete a pure filter: Enter could only confirm an
option from the list, so a non-catalog key could never be committed — the "free-text typing stays
allowed" contract was not met in the real-env test.

## Fix

- `env.service.ts`: `buildSetKeyOptionsFor(search)` — the catalog, plus (only when the
  uppercased, trimmed input matches `[A-Z][A-Z0-9_]*` and is not already a catalog value) a
  prepended dynamic option `{ label: 'Use "<KEY>"', value: <KEY> }` so Enter confirms the custom
  key. Empty/invalid/duplicate input returns the catalog unchanged.
- `setKeyOptionsGetter` — the dynamic-options-getter form clack calls with the prompt as `this`.
  Note for future work: the search property is `this.userInput`, not `this.search` (planner's
  guess); confirmed against clack's own bundled `path()` example in
  `@clack/prompts@1.8.1/dist/index.mjs`, which reads `this.userInput` inside an options getter.
- `env.command.ts`: SET passes the getter; UNSET stays strict (static options from the scope's
  actual keys — unset of a non-existent key stays meaningless).
- Interactive validation still enforces the pattern, so Enter on garbage keeps erroring.

## Tests (`env.command.test.ts`, +4)

- Valid custom key prepends the dynamic option, catalog intact after it.
- Input is uppercased for value and label; the getter itself honours `this.userInput`.
- A catalog-matching search adds no duplicate/`Use "…"` option.
- Empty, non-pattern and invalid-first-char inputs return the catalog alone.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 215/215), `pnpm build` — pass.
- Unit-level only, per the task: the prompt interaction itself is still user-exercised on a real
  TTY (type a custom key, see `Use "…"` appear, press Enter).
- `antislop-code` applied: three JSDoc contract comments (one–two lines); no slop.

## Not checked

- The live clack prompt on a real terminal (standing rule: only the user runs the real env).
