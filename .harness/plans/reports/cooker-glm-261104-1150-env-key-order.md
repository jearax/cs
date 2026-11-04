# Report: cooker-glm — explicit env key order (decision 0018, supersedes 0016)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

`renderProfileSettings` orders the final env map in the decision's explicit semantic sequence
(endpoint → token → the five model keys → oauth → the two `[1m]` keys); keys outside the list
(user extras) follow alphabetically. Both targets inherit — one renderer.

## Change

- `src/modules/profiles/services/render.service.ts`: `ENV_KEY_ORDER` constant with the ten keys
  in the decision's exact sequence; `compareEnvKeys` ranks by list position, unknown keys rank
  last and tie-break alphabetically; the returned env is `Object.entries(env).sort(comparator)`.
  The JSDoc states the new contract.
- `tests/profiles-render.service.test.ts`: the order test rewritten — same fixtures (oauth,
  `[1m]` opus, profile extras `HTTP_PROXY`/`ZED_EXTRA`, global extra `APP_EXTRA`), expected keys
  now the ten-key sequence followed by the three extras alphabetically.

Two defects caught before the gate went green:

- First comparator used raw `indexOf` ranks — unknown keys rank `-1` and would sort before the
  known block; fixed to rank unknown keys at `ENV_KEY_ORDER.length`.
- Indexing the env literal by a bare `string` key failed under `tsc` (no index signature);
  switched to sorting `Object.entries` directly.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (20 files, 214/214), `pnpm build` — pass.
- tmp-`$HOME` smoke: `jq '.env | keys_unsorted'` on the rendered artifact prints exactly the
  decision's sequence (oauth absent — the profile has none; both `[1m]` keys last). The global
  write shares the renderer, so the same order lands in `~/.claude/settings.json`.
- `antislop-code` applied: only the one-line `ENV_KEY_ORDER` contract JSDoc and the updated
  renderer clause; no slop, no changes after the last full-gate run.

## Not checked

- The interactive/manual paths are unchanged; only output key order moved.

## Addendum (later session): catalog trim + detectShell refactor

Two user-directed items, no decision file:

- **Catalog trim (model + thinking only):** `env-catalog.constant.ts` now holds exactly five
  entries — `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (managedByCs), `CLAUDE_CODE_DISABLE_1M_CONTEXT`
  (managedByCs), `CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `CLAUDE_CODE_SUBAGENT_MODEL`,
  `MAX_THINKING_TOKENS`. Dropped per the user: `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`,
  `DISABLE_AUTOUPDATER`, `DISABLE_ERROR_REPORTING`, `DISABLE_TELEMETRY`, and (a mid-task
  correction) `ANTHROPIC_SMALL_FAST_MODEL` — docs-deprecated. The catalog test gained an exact
  keep-list assertion; the JSDoc states the model-and-thinking scope.
- **detectShell refactor:** the switch/case in `rc-path.service.ts` became an object-lookup map
  `SHELL_BY_NAME: Record<string, RcShell>` with `?? null` on the indexed access
  (noUncheckedIndexedAccess-safe). Behaviour identical; rc-path tests untouched and green.

Verification: full gate green — lint, typecheck, 216/216 tests, build. `antislop-code` applied:
one scope clause added to the catalog JSDoc; no other comments changed. No commit.
