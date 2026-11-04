# Report: cooker-glm — alphabetical env key order (decision 0016, plan 261104-1016)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

`renderProfileSettings` sorts the final env map alphabetically (plain code-point comparison)
before returning it. Both delivery targets — the profile artifact and the global settings write —
consume the same sorted object, so they inherit the order automatically. `cs env` user extras and
the oauth token land in the same order as everything else.

## Change

- `src/modules/profiles/services/render.service.ts`: the env literal is built into a local map,
  then returned as `Object.fromEntries(Object.entries(env).sort(...))` with an explicit key
  comparison (`left < right ? -1 : left > right ? 1 : 0`) — the A→Z contract, not locale-aware.
  The JSDoc states the sorted-output contract.
- `tests/profiles-render.service.test.ts`: new test "returns the env keys in alphabetical order" —
  the profile carries an oauth token, an `[1m]` opus (adding `CLAUDE_CODE_AUTO_COMPACT_WINDOW`),
  a profile env with `HTTP_PROXY`/`ZED_EXTRA` and a global env with `APP_EXTRA`; the expected key
  list is written out explicitly (13 keys, A→Z), so the test locks the order rather than
  mirroring the implementation.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (18 files, 203/203), `pnpm build` — pass.
- Plan smoke in a tmp `$HOME`: `cs config -n w -u ... -t <fake>` then `jq '.env | keys'` on the
  artifact prints the keys fully sorted (9 keys, `CLAUDE_CODE_*` grouped by prefix).
- `antislop-code` applied to the pending diff: the only comment is the one-line JSDoc clause
  stating the sorted-output contract — kept; no slop found. Gate was green before the pass and no
  re-run was needed since comments did not change after the last full-gate run.

## Notes

- Consumers read keys by name, so this is a pure output-order change (per the plan's risk note).
- The working tree still holds the uncommitted decision-0015 work alongside this change; both are
  planner-reviewed before any commit.

## Not checked

- A real-environment run (only the user tests the real HOME, per the standing rule).
