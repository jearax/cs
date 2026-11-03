# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.

- `cs` is the from-scratch refactor of `cs-cli` (`/Users/tandm/Documents/jearax/npm/cs-cli`, bun + citty): feature source only, never copy its code. Old commands: `config`, `use`, `current`, `ls`, `remove`, `reset`, `env`.
- `cs` builds with `tsdown` into one ESM bundle `dist/cli.mjs` (decision 0002); `tsc` only type-checks.
- Working layout: planner (this pane) plans and reviews; `cooker` (sibling Herdr pane) implements via `/ak-cook`. Send `/clear` before each new task.
- Dispatch pattern: prompt cooker with `--wait` and no timeout, in the background, and include in the brief "when done, run `herdr agent prompt planner <one-line status>`" so cooker wakes this pane on completion; a timed waiter can die silently before a long cook finishes.

- Scaffolded by jss-devtools 0.0.1 from `../jss-devtools/dist/cli.mjs`; the published
  `@jjuidev/jss-devtools@0.6.4` has no create mode, so `npx … init` fails on an empty folder.
- Tests live in `tests/` at the repo root; `vitest.config.ts` includes `tests/**/*.test.ts` and a
  global setup builds the bundle before any suite runs.
- The layout and its rules are enforced by `tests/support/architecture-rules.ts`, one negative fixture
  per rule; the conventions live in .harness/docs/code-standards.md.
- `scripts/package-info.d.mts` is not optional: `allowJs` is off, so the `.mjs` import in
  `tsdown.config.ts` and `vitest.config.ts` has no types and `tsc` fails TS7016 without it.
- Porting from `jss-devtools`: its `docs/code-standards.md` contradicts its own code (it claims no
  declaration file, yet ships `scripts/package-info.d.mts`); copy the code, not the prose.
- While `cs` registers no subcommand, an unknown argument exits 1 with "too many arguments";
  commander says "unknown command" once the first command lands, and `tests/cli.test.ts` and
  `tests/bundle.test.ts` assert the current wording.
- `.prettierignore` excludes `.harness/plans/` and `.agentkit/`: those files belong to the harness
  and AgentKit, and Prettier's Markdown table realignment rewrites every cell.
- `pnpm-workspace.yaml` sets `strictPeerDependencies` and `engineStrict`, so a dependency whose peers do
  not resolve exactly fails the install instead of warning.
- AgentKit paths point at `.harness/docs` and `.harness/plans` (src: .agentkit/config.yaml), so docs and
  plans live under `.harness/`.
- Commits use conventional format with no AI attribution or `Co-Authored-By` line; the rule lives in the user's global rules outside this repository.
- Full behaviour map of the old CLI: see .harness/docs/cs-cli-feature-inventory.md.
- Product intent and confirmed boundaries: see .harness/docs/cs-project-overview.md.
- Plans live at `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` (AgentKit owns `.harness/plans/` per CLAUDE.md); the `active/`+`completed/` layout in CLAUDE.md's table and plans/README.md is stale — do not follow it.
- The repository has no git remote, so a push has nowhere to go; the husky hooks fire from the first
  commit onward.
