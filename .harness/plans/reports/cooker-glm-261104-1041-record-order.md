# Report: cooker-glm — canonical profile-record order + global-write doc (no decision file)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Item 1 — canonical record order

- `src/modules/profiles/services/storage.service.ts`: new `canonicalProfile` builder — a record is
  serialized as `url, token, oauthToken, haiku, sonnet, opus, fable, env`, so `oauthToken` sits
  directly under `token`. oauthToken and env are conditionally spread, so they are omitted
  entirely when unset (safe under `exactOptionalPropertyTypes`, no `oauthToken: undefined`).
  `upsertProfile` runs every merge through it, so the save path always writes canonical records.
- `tests/profiles-storage.service.test.ts`: new test "saves profile records in canonical field
  order" — three records through one save: with oauth+env (full 8-key order), with env but no
  oauth (oauth omitted, env last), and bare (6 fields only). Key lists asserted explicitly.
- First implementation placed oauthToken after `fable` (the test caught it); corrected to the
  conditional-spread form, which keeps the key at its canonical position.

## Item 2 — global-write doc

- `global-write.service.ts` doc comment now states: `disableClaudeAiConnectors` is set
  unconditionally because the user needs connectors disabled even in mixed login+env scenarios
  (user, 2026-11-04); `ownedClaudeSettingsKeys` is a write-only ownership ledger with no consumer
  today — kept, do not remove.

## Verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (18 files, 204/204), `pnpm build` — pass.
- tmp-`$HOME` smoke (fake tokens): `jq '.profiles | keys_unsorted'` on the saved `cs.json` —
  with `--oauth-token`: `url, token, oauthToken, haiku, sonnet, opus, fable`; plain: the same
  minus `oauthToken`. (Note: `jq keys` sorts alphabetically; `keys_unsorted` shows the real file
  order.) The env-present case is covered by the storage test.
- `antislop-code` applied to this task's diff: two comments — the planner-specified doc extension
  (kept verbatim as instructed) and a one-line JSDoc on the builder stating the field-order
  contract; no slop, no changes after the last full-gate run.

## Not checked

- A real-environment run (only the user tests the real HOME, per the standing rule).
