# Code standards

The toolchain follows jss-devtools (decision 0002), so it is a tested claim rather than a preference.
The conventions below are the ones the code enforces; the code is the authority. Where this file and
the enforcement disagree, the enforcement wins.

## Formatting

Prettier owns formatting. `pnpm format` rewrites files: it runs `pnpm lint:fix` first, then
`prettier --write .`.

Each setting is declared in exactly one file:

| Setting                            | Value                                       | Declared in             |
| ---------------------------------- | ------------------------------------------- | ----------------------- |
| Charset                            | UTF-8                                       | `.editorconfig`         |
| Line endings                       | LF                                          | `.editorconfig`         |
| Indent                             | Tabs, width 2; spaces for YAML and Markdown | `.editorconfig`         |
| Width                              | 120                                         | `.editorconfig`         |
| Final newline, trailing whitespace | Yes; Markdown keeps trailing whitespace     | `.editorconfig`         |
| Semicolons, quotes, arrows, commas | Yes, single, always, none                   | `.prettierrc.json`      |
| Formatter, format and ESLint fix   | Prettier, on, on                            | `.vscode/settings.json` |

`.editorconfig` holds every fact Prettier and the editor share. Prettier reads it by default
(`--no-editorconfig` opts out), and the recommended EditorConfig extension applies it in VS Code, so
neither `.prettierrc.json` nor `.vscode/settings.json` restates any of it.

## What counts as source

One expression defines the source file set, and it is the same everywhere:

```
{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}
*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}
```

Two patterns, because a folder pattern cannot reach the root config files and a root pattern cannot
descend. It appears in four places, and they are meant to stay in step:

| Where                         | Form                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `eslint.config.mjs`           | An IIFE derives every pattern from the folder and extension constants  |
| `package.json` `lint` scripts | `lint` and `lint:fix` only; `format` reuses `lint:fix`                 |
| `package.json` `lint-staged`  | The same two patterns joined into one key, plus JSON, Markdown, YAML   |
| `tsconfig.json` `include`     | `**/*`, because TypeScript's `include` supports only `*`, `**` and `?` |

`test{,s}` expands to `test` and `tests`, so `tests/` is linted by the same expression that lints
`src/`. A folder in the list that does not exist is harmless, because ESLint only fails when a
pattern matches nothing at all.

## Linting

ESLint flat config (`eslint.config.mjs`), built with ESLint core's `defineConfig()` and
`globalIgnores()` rather than `tseslint.config()`, which is deprecated.

| Area              | Rules                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Every source file | `js.configs.recommended`, the untyped `typescript-eslint` recommended rules, and the house style below |
| TypeScript        | `recommendedTypeChecked` with `projectService`, so type-aware rules can read types                     |
| JavaScript        | `disableTypeChecked`, because a type-aware rule with no `projectService` to read from is an error      |

A type-aware rule on a file with no `projectService` is a hard error, so JavaScript opts out.

Both formatters are wired: `eslint-config-prettier` disables the ESLint rules that fight Prettier,
and `eslint-plugin-prettier` reports formatting as a lint error. So `pnpm lint` alone proves both.

Notable rules:

- `prefer-arrow-functions` and `arrow-body-style: always`. Functions are `const` arrow expressions
  with an explicit block body, never `function` declarations.
- `padding-line-between-statements` sets the blank-line rhythm: a line after a `const` block, and a
  line around a multiline block.
- `import-x/order` sorts `node:` builtins first, then external packages, then relative paths.
- `consistent-type-imports` with `prefer: type-imports`, matching `verbatimModuleSyntax`, which
  rejects a type imported without `import type` (TS1484).
- `no-restricted-imports` rejects a parent-relative `../` import and an import with a file
  extension. `tests/fixtures/**` is exempt: `@/` points at the real `src/`, where the fixture
  targets do not exist, so a fixture keeps its relative imports.

`dist/`, `coverage/` and `node_modules/` are ignored.

TypeScript is pinned to 6.0.x because `typescript-eslint` requires `<6.1.0`. Do not bump it past
that until the peer range widens. `strictPeerDependencies` in `pnpm-workspace.yaml` is what makes
that peer range binding rather than advisory.

## Naming

- Files are kebab-case, including test files: `architecture-rules.ts`, `capture-stream.ts`.
- One concern per file. Split a file once it passes roughly 200 lines and has separable parts.
- Prefer names that say what the thing is over names that say what it does.
- A comment explains why a decision was made. Delete a comment that only restates the code.
- A comment never cites a decision ID (`.harness/decisions/NNNN`); state the why directly.

## Layout

`src/` has three folders, and a file name says what the file is.

```
src/
├─ cli.ts                     the program, the exit code, the global handlers
├─ core/                      shared; imports no command and no commander
├─ modules/
│  └─ <name>/                 one folder per shared module; imports no command
└─ commands/
   └─ <name>/                 one folder per command
```

| Suffix         | Folder                       | Role                                                                     |
| -------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `.command.ts`  | `commands/<name>/` root      | commander wiring, argument parsing, rendering through clack              |
| `.service.ts`  | `commands/<name>/services/`  | the command's logic; returns data, prints nothing                        |
| `.check.ts`    | `commands/<name>/checks/`    | one check of a command                                                   |
| `.type.ts`     | `commands/<name>/types/`     | types only                                                               |
| `.constant.ts` | `commands/<name>/constants/` | constant values one command owns                                         |
| `.template.ts` | `commands/<name>/templates/` | the content of one file a command generates, as a function of its inputs |
| `.adapter.ts`  | `core/adapters/`             | the only knowledge of one external tool's command line                   |
| `.util.ts`     | `core/utils/`                | stateless helpers                                                        |
| `.constant.ts` | `core/constants/`            | constant values                                                          |
| `.error.ts`    | `core/errors/`               | error classes                                                            |
| `.ui.ts`       | `core/ui/`                   | terminal rendering, shared by commands                                   |

`src/cli.ts` is the file without a suffix: it is the CLI entry point. A new role needs an entry in
this table, in `tests/support/architecture-rules.ts` and in a negative fixture, together.

`src/modules/<name>/` mirrors a command's roles minus the command and the template (`services/`,
`checks/`, `types/`, `constants/`, `utils/`): the rows above apply with `modules/<name>/` in place
of `commands/<name>/`.

## Import rules

One alias, `@/`, mapped to `src/` in `tsconfig.json`:

```json
"paths": {
	"@/*": ["./src/*"]
}
```

- An import that leaves its folder goes through `@/`; an import in the same folder stays `./`.
- A parent-relative `../` import is rejected by ESLint, so the alias is the only way up.
- Imports carry no file extension: `@/core/errors/cli.error` is the file
  `src/core/errors/cli.error.ts`.
- The alias is declared once. TypeScript, tsdown and vitest read it from `tsconfig.json`; ESLint
  learns it through `import-x/internal-regex`, and the architecture scanner maps `@/x` to the logical
  path `x` so a rule sees an aliased import the same as a relative one.
- `tests/` has no alias of its own, so the test helpers are reached with `./support/...`.
- A type that a module service produces and `core/ui` renders lives in `core/ui`. `core` never
  imports a module, so the dependency has to point that way (`modules/` → `core`).

## Architecture rules

The layout is enforced by a test, not by a comment.
[`tests/support/architecture-rules.ts`](../../tests/support/architecture-rules.ts) is the contract;
this table is a copy.

| Id                                               | Rule                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `file-role-suffix`                               | Every file under `src/` except `cli.ts` carries the suffix its folder allows                        |
| `core-imports-no-command`                        | `src/core/**` never imports from `src/commands/**`                                                  |
| `command-imports-no-other-command`               | `src/commands/<a>/**` never imports `src/commands/<b>/**`; logic two commands share goes to `core/` |
| `module-imports-no-command`                      | `src/modules/**` never imports from `src/commands/**`                                               |
| `commander-in-command-files-only`                | `commander` only in `*.command.ts` and `cli.ts`                                                     |
| `clack-in-ui-layer-only`                         | `@clack/prompts` only in `*.ui.ts`, `*.command.ts` and `cli.ts`                                     |
| `output-in-ui-layer-only`                        | `process.stdout`, `process.stderr`, `console.` only in `*.ui.ts`, `*.command.ts` and `cli.ts`       |
| `child-process-in-runner-only`                   | `node:child_process` only in `core/utils/run-command.util.ts`                                       |
| `no-process-exit-outside-entry-point`            | `process.exit` only in `cli.ts`                                                                     |
| `no-global-process-handlers-outside-entry-point` | global process handlers only in `cli.ts`                                                            |

A rule with no negative fixture is a comment, not a rule. Each fixture under
`tests/fixtures/architecture/` breaks exactly one rule, and `tests/architecture.test.ts` proves it.

`runner-in-adapters-only` is not in the set yet: it arrives with the first adapter.

## CLI

Every CLI exposes the same two flag pairs: `--help, -h` and `--version, -v`, so `-v` is taken and a
later `--verbose` cannot use it.

An option declares the long form first (`--name, -n`), and an option with no short form declares the
long form alone. The help table prints the declaration verbatim, so the order is what a user reads.

A positional takes the domain noun it names (`use <profile>`, `remove <profile...>`); the exception
is `cs alias <name> <profile>`, whose two positionals are the launcher and its target.

Output indents a line only under a `Label: name` header (`Profile: work`); after a sentence banner
(`… updated.`, `Switched to profile …`) the lines start at column 0, labels still padded to one
column (decision 0032). `profileFieldLines`, `artifactLines` and `showBinPathNotice` take the indent
from the caller and default to the header case.

Only `src/cli.ts` builds the root command and only it owns the process: `process.exitCode`, the
global handlers and the fatal error path. A command attaches to the program, it does not replace it.

## Exit codes and `CliError`

Two codes: `0` for success, `1` for a failure. A command that fails for an expected reason throws
`CliError`, which carries the exit code, an optional hint, an optional list of next commands and an
optional label. Anything else is a crash and stays a bare line on stderr, with the stack under
`CS_DEBUG=1`.

- `src/core/constants/exit-code.constant.ts` declares `ExitCode = { ok: 0, failure: 1 }`.
- `src/core/errors/cli.error.ts` declares `CliError`, with the exit code defaulting to `failure`.
- `src/cli.ts` renders a `CliError` through `renderError` and ends with its exit code. A crash goes
  through `reportFatalError`, which never exits 0.
- More codes are added only when a command needs one that means something to a script.

A script can rely on 0 meaning success and anything else meaning failure. It cannot tell a failed
check from a crash by the code alone; the message on stderr says which.

## TypeScript

- `strict`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` and
  `exactOptionalPropertyTypes`.
- `module` is `Preserve` and `moduleResolution` is `Bundler`, so an import carries no file
  extension.
- An import that leaves its folder goes through the `@/` alias, which `tsconfig.json` maps to `src/`.
- `verbatimModuleSyntax` is on: type-only imports must use `import type`.
- `noEmit`. tsdown builds; `tsc` only checks.
- `allowJs` and `checkJs` are off, so the `.mjs` config files are not type-checked. The one
  exception is `scripts/package-info.d.mts`: it is the declaration for `scripts/package-info.mjs`,
  and without it `tsc` fails with TS7016 on the two config files that import it.

## Tests

Vitest. Files live in `tests/` at the repo root, matching `tests/**/*.test.ts`.

| Path                          | Holds                                          |
| ----------------------------- | ---------------------------------------------- |
| `tests/*.test.ts`             | The suites                                     |
| `tests/support/`              | Scanners and helpers shared by suites          |
| `tests/setup/global-setup.ts` | Builds the bundle once before any suite runs   |
| `tests/fixtures/`             | Deliberately broken inputs, kept out of `src/` |

Rules:

- A test that mirrors the implementation proves nothing. Assert observable behaviour: output, exit
  code, files written.
- A boundary rule gets a negative fixture. A rule with no fixture is a comment, not a rule.
- Tests that touch the filesystem use an OS temp directory, never a path inside the repository.
- `pnpm test` builds the CLI itself, so a green run also proves the build.

`tests/bundle.test.ts` runs `dist/cli.mjs` in a temp directory with no `node_modules` beside it, so
a runtime dependency left unbundled fails the suite instead of the user's machine.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by `@commitlint/cli` through
the `commit-msg` hook. Subject line: `type: summary`, lower case, no trailing period.

The `pre-commit` hook runs `lint-staged`: ESLint over staged source and root config files — its
`prettier/prettier` rule already formats them on `--fix` — Prettier over staged JSON (except
`package.json`), Markdown and YAML, and over `package.json` the pinned `prettier-package-json` for
canonical key order followed by Prettier for indentation.

## Dependencies

- Exact versions only, no ranges. The lockfile is the source of truth. That includes tools a script
  or hook runs: they are devDependencies, never `pnpm dlx` with a range.
- Runtime libraries go in `dependencies`, tooling in `devDependencies`, following Node convention.
- One floor, Node >= 24.11.0 in `engines.node`, for developing and for running the CLI.
  `engineStrict` in `pnpm-workspace.yaml` makes pnpm refuse an older Node; without it pnpm only
  warns.

## Package facts

The name, description, version and Node floor are read once, by `scripts/package-info.mjs`, and
injected at build time as `__CS_PACKAGE__` by tsdown and vitest. `src/core/constants/package.constant.ts`
is the only place that reads the constant, so a fact has one home.

The build is one ESM bundle, `dist/cli.mjs`, with a `#!/usr/bin/env node` banner. A build that
leaves an import unresolved fails at `UNRESOLVED_IMPORT` instead of warning, so a broken bundle
never reaches the artifact.

## Definition of done

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node dist/cli.mjs --help     # prints help
node dist/cli.mjs --version  # prints the version
node dist/cli.mjs            # prints help, exits 0
```

A failure of any of these is an unfinished change, not a note.

## Porting from jss-devtools: src and dist can diverge

The reference repo's TypeScript source and its shipped bundle do not always behave the same (e.g.
its help renderer `JSON.stringify`s `defaultValueDescription` in src but renders the value unquoted
in dist). When porting, match the dist/user-visible behaviour and flag the divergence for upstream.

## Rewording CLI output: negative assertions go vacuous

`expect(stdout).not.toContain('PATH: added')` keeps passing once the line is reworded or
re-padded, even if the line still prints. When a CLI string changes, grep the old literal across
`tests/` and `site/src`, and rewrite each negative check to a stem that cannot drift (for
example `not.toContain('PATH:')`).
