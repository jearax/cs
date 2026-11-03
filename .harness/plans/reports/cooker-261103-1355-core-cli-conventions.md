# Report: Port jss-devtools core CLI conventions into cs

Plan: [../261103-1348-core-cli-conventions/plan.md](../261103-1348-core-cli-conventions/plan.md)
Source manifest: `/Users/tandm/Documents/jearax/npm/jss-devtools` (read-only, unmodified)
Date: 2026-11-03

All four phases landed. Nothing was committed. `jss-devtools` and `.harness/{bin,core,templates}`
were not touched.

## What shipped

| Area                    | Files                                                                                                    | Note                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Toolchain (phase 01)    | `package.json`, `tsdown.config.ts`, `scripts/package-info.mjs`, `scripts/package-info.d.mts`, `tsconfig.json`, `vitest.config.ts` | `tsconfig.build.json` deleted              |
| Entry and core (02)    | `src/cli.ts`, `src/core/constants/{exit-code,package}.constant.ts`, `src/core/errors/cli.error.ts`, `src/core/ui/terminal.ui.ts` | `src/main.ts` deleted                     |
| Rules and tests (03)   | `tests/support/architecture-rules.ts`, `tests/architecture.test.ts`, `tests/fixtures/architecture/**` (13 files), `eslint.config.mjs` | `src/main.test.ts` deleted                |
| Docs (04)              | `.harness/docs/code-standards.md`, `.harness/docs/README.md`, `.harness/MEMORY.md`                         | one doc + index row + memory pointer       |
| Test infrastructure     | `tests/cli.test.ts`, `tests/bundle.test.ts`, `tests/support/{capture-stream,tmp-dir}.ts`, `tests/setup/global-setup.ts` | see deviation 13                        |

`src/` now holds `cli.ts` and a `core/` layer; no product command is registered, so the CLI exposes
only `--help`, `--version` and the bare-run help path. Decision 0001 (no cs-cli workflow port) is
untouched.

## Validation — real output

### `pnpm install`

```
dependencies:
+ @clack/prompts 1.8.1
+ commander 15.0.0

devDependencies:
- tsc-alias 1.9.10
+ tsdown 0.23.1 (0.23.2 is available)
- tsx 4.23.15

Done in 2s using pnpm v11.24.0
```

`pnpm install --frozen-lockfile` afterwards: `Already up to date` — the lockfile matches
`package.json`, so pinning the existing ranges to exact versions changed no resolved dependency.

### `pnpm lint`

```
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
EXIT=0
```

### `pnpm typecheck`

```
$ tsc --noEmit
EXIT=0
```

### `pnpm test`

```
ℹ 1 files, total: 105.80 kB
✔ Build complete in 10ms

 Test Files  3 passed (3)
      Tests  35 passed (35)
   Duration  365ms
```

The build output above the test summary is `tests/setup/global-setup.ts` running tsdown, so a green
`pnpm test` also proves the build.

### `pnpm build`

```
ℹ entry: src/cli.ts
ℹ target: node24
ℹ tsconfig: tsconfig.json
ℹ Build start
ℹ Granting execute permission to dist/cli.mjs
ℹ dist/cli.mjs  105.80 kB │ gzip: 25.39 kB
✔ Build complete in 12ms
```

### Smoke

```
$ node dist/cli.mjs --help
Usage: cs [options]

Switch Claude Code between API providers and model sets

Options:
  --version, -v   Output the version number
  --help, -h      Display help for command

Commands:
  help [command]  Display help for command
exit=0

$ node dist/cli.mjs --version
0.0.0
exit=0

$ node dist/cli.mjs            # bare run
Usage: cs [options]
...
exit=0
```

`node dist/cli.mjs nope` exits 1 with `Error: too many arguments. Expected 0 arguments but got 1:
nope.` on stderr — cs registers no subcommand yet, so commander reports the operand as an excess
argument rather than an unknown command. The bundle suite asserts that exit code.

### Proof that the rules bite

A `process.exit(0)` was appended to `src/core/ui/terminal.ui.ts`, the suite was run, and the line was
reverted:

```
     × finds no violation in the real src tree 6ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
+     "rule": "no-process-exit-outside-entry-point",
 Test Files  2 failed (2)
      Tests  1 failed | 15 passed (16)
```

After the revert: `Test Files 2 passed (2) / Tests 25 passed (25)`.

## Deviations from the plan, and why

1. **Phases 01 and 02 landed together for the build.** The plan anticipated this: tsdown's entry is
   `src/cli.ts`, which phase 02 creates, so `pnpm build` cannot pass at the end of phase 01 on its
   own. Phase 01's own validation (`pnpm install`, lint, typecheck) was green before phase 02 started.
2. **`tsconfig.build.json` deleted.** It configured `tsc` emit for `dist/main.js`; with tsdown as the
   builder it was dead configuration pointing at a deleted entry. Leaving it would have been a trap.
3. **`scripts/package-info.d.mts` added.** Without it, `tsc` fails with `TS7016: Could not find a
   declaration file for module './scripts/package-info.mjs'` in `tsdown.config.ts` and
   `vitest.config.ts`. The reference carries the same declaration file beside the same `.mjs`.
4. **Every dependency is pinned to an exact version.** The plan's phase-01 requirement says
   "Dependencies stay exact-pinned; no floating ranges", but cs shipped with `^` ranges. The
   existing devDependencies were pinned to the version already installed, so the lockfile's resolved
   set is unchanged (`pnpm install --frozen-lockfile` reports up to date).
5. **`"prepare": "husky"` kept, not the reference's `pnpm build && husky`.** The plan did not list
   it, and a `prepare` that builds would make `pnpm install` depend on a buildable `src/cli.ts`,
   coupling install order to the source tree. `"start"` was repointed from `node dist/main.js` to
   `node dist/cli.mjs`, which the deletion of `src/main.ts` made necessary.
6. **No banner.** The reference's `banner.ui.ts` and `banner.constant.ts` were not ported — the plan
   lists banner art as a non-goal. `--version` therefore prints the bare version.
   `CS_DEBUG=1` replaces the reference's `JSS_DEBUG=1`.
7. **Rule set is the nine rules phase 03 listed.** The `src/modules/` rules
   (`core-imports-no-module`, `module-imports-no-command`, `module-imports-no-other-module`,
   `entry-imports-own-module-and-core-only`) and `runner-in-adapters-only` are deferred until cs has
   a module and an adapter, as the plan states. The scanner still carries the `importSpecifiers` and
   `logicalTargetOf` helpers those rules need.
8. **Fixtures use synthetic command names `alpha` and `beta`,** and keep relative imports. `@/`
   points at the real `src/`, where the fixture targets do not exist, so a fixture that used `@/`
   would break `pnpm typecheck`. The reference follows the same rule; the fixture names are synthetic
   so they do not imply a cs-cli workflow port (decision 0001).
9. **`eslint.config.mjs` needed one change, not three.** The `no-restricted-imports` patterns (`../*`
   banned, extensionless banned) and a lint glob that already covers `tests/` were already in cs. The
   missing piece was the `tests/fixtures/**` exemption, which is now in the config.
10. **`tsconfig.json` excludes `.harness`** — cs's equivalent of the reference's `plans` and
    `.agentkit` excludes, since `.harness/` holds the harness's own tooling.
11. **`.prettierignore` extended with `.harness/plans/` and `.agentkit/`.** Prettier was reformatting
    the plan and AgentKit files that belong to other tools. The reference excludes `plans/` for the
    same reason. The files this change created are Prettier-clean.
12. **`src/main.ts` and `src/main.test.ts` deleted** (phases 02 and 03). The placeholder printed
    "Hello from cs" and is replaced by the commander entry.
13. **A bundle smoke test was added, and it is outside the phase file tables.**
    `tests/bundle.test.ts`, `tests/support/tmp-dir.ts` and `tests/setup/global-setup.ts` exist
    because phase 04 requires the conventions doc to describe a "bundle smoke test", and phase 04's
    own validation forbids a rule that exists only in prose. The suite runs `dist/cli.mjs` in a
    temp directory with no `node_modules` beside it, so a runtime dependency left unbundled fails
    the suite rather than the user's machine. The global setup builds the bundle first, which makes
    `pnpm test` prove the build.

## What was not checked

- No CI workflow was added (a non-goal); the gate above was run locally.
- `pnpm format` was not run over the whole repository. `pnpm exec prettier --check .` reports one
  remaining file, `.harness/docs/cs-cli-feature-inventory.md`, which was already unformatted before
  this work and belongs to the earlier ak-docs run; it was left alone rather than reformatted
  behind its owner's back.
- Nothing was published and no release was cut (a non-goal).

## Open items for the planner and the user

- **No decision record covers the policy this port creates.** Exit codes 0/1 and the `CliError`
  contract, the `src/core` + `src/commands/<name>/` layout with role suffixes, and the `@/` alias
  are now cs policy enforced by a test. The reference records each as an ADR (0023, 0024, 0025); cs
  has no equivalent, and `.harness/decisions/` holds only 0001 and 0002. The plan did not ask for
  decision files, so none were written — but the harness rule is that `.harness/decisions/` is the
  only product policy, and a rule with no record is a comment. Worth three decision files
  (0003 exit codes, 0004 layout and rules, 0005 import alias) or one combined record.
- **`@clack/prompts` is declared but not imported yet.** It joins the bundle with the first command
  that prompts. It was added because the dependency matrix names it and the
  `clack-in-ui-layer-only` rule needs it installed for its fixture to type-check.
- **The plan's `status` frontmatter is still `pending`.** It was left for the planner's review
  rather than marked done by the implementer.

## Harness knowledge changed

- `.harness/MEMORY.md`: three stale lines corrected (the `tsc`/`tsc-alias` build, tests living in
  `src/`, the root-level `.ts` include rule, and the `src/main.ts` entry point all no longer hold),
  and one pointer line added for the layout rules and the conventions doc.
- `.harness/docs/README.md`: index row for `code-standards.md`.
- `.harness/docs/code-standards.md`: new. It documents the layout, the import rules, the exit-code
  scheme, the `CliError` contract, the output-layer rules and the testing policy, and it says
  explicitly that `tests/support/architecture-rules.ts` is the contract and the table is a copy.

Status: DONE_WITH_CONCERNS
Summary: All four phases of the plan landed and the full gate is green — `pnpm lint`, `pnpm typecheck`, `pnpm test` (35 tests, including the architecture suite with one negative fixture per rule and a bundle smoke test) and `pnpm build` into `dist/cli.mjs`, plus the `--help` / `--version` / bare-run smoke. The reference conventions were ported by adaptation, not transplant; nothing was committed and no cs-cli feature was ported (decision 0001).
Concerns: The port creates product policy (exit codes, layout, import alias) that no cs decision record covers yet — the reference has ADRs for each, so cs likely wants decision files 0003–0005. A bundle smoke test and its global setup were added beyond the phase file tables because phase 04 required the doc to describe one and forbade prose-only rules.
