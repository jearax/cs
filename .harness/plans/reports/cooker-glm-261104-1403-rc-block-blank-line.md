# Report: cooker-glm — rc block blank-line separator

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

The rc block cs appends is now preceded by exactly one blank line, whatever the rc file ended
with: `export FOO=1\n\n# Added by @jjuidev/cs\nexport PATH=...\n`.

## Change

- `rc-path.service.ts`: `resolveRcTarget`'s block carries its own leading blank line —
  `` `\n${RC_PATH_MARKER}\n${exportLine}\n` ``.
- `ensure-bin-path.service.ts`: before writing, the rc content is normalized to exactly one
  trailing newline (`content.endsWith('\n')` strips one; a file without one gains it; an empty
  file gets no prefix), and the write is `writeFile(base + block)` — not `appendFile`. The
  appendFile form was a real defect the new test caught: `base` re-contains the old content, so
  appending it doubled the rc (`export FOO=1export FOO=1...`); caught by an assertion diff during
  this task, debugged with a temporary log, fixed, log removed.

## Tests

- `rc-path.service.test.ts`: block assertions updated to the leading-blank-line form (zsh + fish).
- `ensure-bin-path.service.test.ts`: the content test renamed to "separates the block from the rc
  content with one blank line" (expected `export FOO=1\n\n# Added...`); new test "keeps one blank
  line when the rc file already ends with a newline" (normalize path); the empty-file, second-run,
  fish and CLI interactive tests updated for the leading newline.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 220/220), `pnpm build` — pass.
- `antislop-code` applied: one why-comment on the normalize step; no slop.

## Not checked

- A real-shell rc write (user exercises the real environment, per the standing rule).
