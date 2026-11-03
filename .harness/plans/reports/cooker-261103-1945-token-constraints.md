# Report: One token per profile (decision 0008)

Decision: [../../decisions/0008-token-constraints.md](../../decisions/0008-token-constraints.md)
Matrix: [../../docs/auth-modes.md](../../docs/auth-modes.md)
Date: 2026-11-03

Decision 0008 is implemented and the full gate is green. No commit was made.

## What shipped

| # | Change | Files |
| - | ------ | ----- |
| 1 | `cs config` rejects a profile that would hold both `--token` and `--oauth-token` | `src/modules/profiles/checks/token-exclusivity.check.ts` (new), `src/commands/config/services/config.service.ts` |
| 2 | `cs use` keeps only the `hasTokenWithoutUrl` guard — unchanged | `src/commands/use/services/use.service.ts` (untouched) |
| 3 | The renderer stays tolerant: a hand-edited `cs.json` with both tokens still renders both env keys | `src/modules/profiles/services/render.service.ts` (untouched) |
| 4 | The rejection and the four allowed combos are covered by tests | `tests/config.command.test.ts`, `tests/profiles-render.service.test.ts` |
| 5 | The constraint is documented | `README.md` |

### The guard

`hasBothTokens` is a pure predicate next to the existing `hasTokenWithoutUrl`, in
`src/modules/profiles/checks/token-exclusivity.check.ts`:

```ts
export const BOTH_TOKENS_HINT = 'Clear one with -t "" or --oauth-token "".';
```

The predicate checks both tokens non-empty (full signature in `src/modules/profiles/checks/token-exclusivity.check.ts`).

The check runs on the **effective** profile — the stored profile merged with the flags of this
run — so it also catches an `--oauth-token` added on top of a profile that already carries a token,
not only the two flags passed together. The `cs config` service throws:

```
Profile "work" cannot have both --token and --oauth-token.
   ↳ Clear one with -t "" or --oauth-token "".
```

An empty value clears a token (`-t ""` or `--oauth-token ""`), so the remedy in the hint is the
way out of the error. The `hasTokenWithoutUrl` guard still runs first and still governs the
token-without-URL case.

### The tests

- `tests/config.command.test.ts`: the two-token call is rejected, the profile is not written, an
  `--oauth-token` added to a profile that already has a token is rejected, and clearing the api
  token with `-t ""` in the same call makes the oauth token acceptable.
- `tests/profiles-render.service.test.ts`: one test per allowed combo (url only, url + token,
  url + oauth token, oauth token only) asserts the three credential env keys, and a separate test
  keeps the renderer's tolerance for a hand-edited profile holding both tokens.

## Validation — real output

### The gate

```
$ pnpm lint
$ eslint "{src,lib{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,tsx}"
EXIT=0

$ pnpm typecheck
$ tsc --noEmit
EXIT=0

$ pnpm test
 Test Files  14 passed (14)
      Tests  142 passed (142)
   Duration  483ms (tests 58%, import 21%, transform 18%, worker 3%)

$ pnpm build
ℹ dist/cli.mjs  171.92 kB │ gzip: 44.42 kB
✔ Build complete in 19ms
EXIT=0
```

### The smoke, on a temp HOME (`HOME=$H node dist/cli.mjs …`)

```
== both tokens ==
│
└  Profile "work" cannot have both --token and --oauth-token.
   ↳ Clear one with -t "" or --oauth-token "".
exit=1
== token only ==
Profile "work" updated.
exit=0
== add oauth on top ==
│
└  Profile "work" cannot have both --token and --oauth-token.
   ↳ Clear one with -t "" or --oauth-token "".
exit=1
== api token cleared via -t
Profile "work" updated.
exit=0
```

A hand-edited `cs.json` holding both tokens (written by hand, not by `cs config`) still runs and
still renders both env keys — the tolerance of decision 0008:

```
use exit=0
base url key: true | api token key: true | oauth token key: true
```

## Deviations from the brief

- The brief asked for the guard "next to the existing `hasTokenWithoutUrl` check". It is placed
  there, **after** it: a profile with a token and no URL still reports the URL error first, so the
  message that is shown depends on which constraint the profile breaks first. Both errors are
  correct; the order is not covered by a decision.
- The brief asked to keep the render tests for the allowed combos. The test that asserted the
  renderer writes both token env keys was kept and renamed
  (`renders both token env keys for a hand-edited profile holding both tokens`) because decision
  0008 makes that tolerance an explicit invariant, and it is reachable through a hand-edited
  `cs.json`.
- `pnpm lint:fix` and `pnpm prettier --write` were needed on the touched files: the repo's
  `autofix/object-curly-newline` rule and prettier disagree on a nested object literal, and the
  autofixed shape is the one both accept.

## Not checked

- The real-world behaviour of each combo in Claude Code (`/status`, the `claude --settings`
  launcher path) belongs to the user, per decision 0008.
- No CI workflow was added and nothing was published.

## Harness knowledge changed

- None. `.harness/MEMORY.md` already carries the decision 0008 line, and
  `.harness/docs/auth-modes.md` already describes the matrix this change enforces.

## Open items for the planner and the user

- A `cs.json` written before this guard keeps both tokens until the next `cs config`; `cs use`
  does not police it, on purpose.
- The error is raised by `cs config` only, so a script that writes `cs.json` directly bypasses it.

Status: DONE
Summary: Decision 0008 is implemented and the full gate is green — `pnpm lint`, `pnpm typecheck`, `pnpm test` (142 tests, 14 files) and `pnpm build` — plus a temp-HOME smoke that rejects `--token` with `--oauth-token` (both in one call and an oauth token added on top of an existing token), accepts the same profile once the api token is cleared with `-t ""`, and still renders both env keys for a hand-edited `cs.json` holding both tokens.
Concerns: the `hasTokenWithoutUrl` guard still fires before the new one, so a profile with a token and no URL reports the URL error first; the guard lives only in `cs config`, so anything that writes `cs.json` directly bypasses it.
