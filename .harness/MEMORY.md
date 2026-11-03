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
- The init node preset builds with `tsc` + `tsc-alias`; the reference repo builds with `tsdown` (single ESM bundle). Which one `cs` ships with is unresolved (decision 0002 chose tsdown intent; the build script still uses `tsc`).
- Working layout: planner (this pane) plans and reviews; `cooker` (sibling Herdr pane) implements via `/ak-cook`. Send `/clear` before each new task.

- Scaffolded by jss-devtools 0.0.1 from `../jss-devtools/dist/cli.mjs`; the published
  `@jjuidev/jss-devtools@0.6.4` has no create mode, so `npx … init` fails on an empty folder.
- Tests live in `src/` as `*.test.ts`; `tsconfig.build.json` excludes them from emit and
  `vitest.config.ts` scopes `include` to `src/**`, because Vitest 5 does not exclude `dist` by default.
- A new root-level `.ts` file must be added to `tsconfig.json` `include`, or ESLint's `projectService`
  fails on it as outside the project (src: eslint.config.mjs).
- `pnpm-workspace.yaml` sets `strictPeerDependencies` and `engineStrict`, so a dependency whose peers do
  not resolve exactly fails the install instead of warning.
- AgentKit paths point at `.harness/docs` and `.harness/plans` (src: .agentkit/config.yaml), so docs and
  plans live under `.harness/`.
- `src/main.ts` calls `main()` at module load; tests import it dynamically after spying on `console.log`.
- Commits use conventional format with no AI attribution or `Co-Authored-By` line; the rule lives in the user's global rules outside this repository.
- The repository has no git remote and no commit yet; the husky hooks are installed but fire only from the
  first commit onward.
