---
name: cs-command-test
description: Write or change a test for a cs CLI command, and add the rule a new file role needs. Use when adding a command under src/commands/, testing one through the CLI, or introducing a new folder role such as src/modules/.
metadata:
  harness-origin: learned
  harness-pinned: 'false'
---

# Test a cs command

## When to use

- A command under `src/commands/<name>/` is added or changed.
- A command is exercised end to end (`config`, `use`, `current`, `list`, `remove`, `reset`).
- A new folder role appears under `src/` and needs a rule of its own.

## Procedure

1. Put the suite in `tests/<name>.command.test.ts` and drive the CLI in-process:

   ```ts
   import { runCli } from './support/cli';
   import { useTempHome } from './support/temp-home';

   useTempHome();

   const { stdout, stderr, exitCode } = await runCli(['config', '-n', 'work', '-u', 'https://example.com']);
   ```

   A module service (`src/modules/<module>/services/<name>.service.ts`) gets
   `tests/<name>.service.test.ts`; prefix the file with the module name only when the service name
   is generic (`profiles-render.service.test.ts`, `rc-path.service.test.ts`).

2. Assert observable behaviour only: the text on stdout, the text on stderr, the exit code, and
   the files under the temp HOME. Never assert on an internal value.
3. Reach the paths through the module that owns them (`@/modules/profiles/constants/paths.constant`),
   never through a hard-coded `~`.
4. A command that fails for an expected reason exits 1 with a `CliError`; assert the exit code and
   the hint, not only the message.
5. When a new role arrives (a folder under `src/`), add it in the same change to
   `tests/support/architecture-rules.ts` — the role suffixes and the rule — plus one negative
   fixture under `tests/fixtures/architecture/`, and prove the fixture with the architecture suite.
6. When the stored shape of `cs.json` changes (a key, a schema version), a CLI test cannot see the
   old shape: seed the previous file version on disk in `tests/profiles-storage.service.test.ts` and
   assert what the loader does with it. cs migrates nothing — a file without the `profiles` key is
   not a cs config: it is kept at `cs.json.corrupt` and cs starts from the default profile
   (decision 0012). Bump `CURRENT_SCHEMA_VERSION` in the same change, and state the new version in
   the comment above it.
7. A smoke of the built bundle runs against a temp HOME as well, one command per invocation:
   `HOME=$H node dist/cli.mjs …`. The real `~/.config/cs`, the real `~/.claude` and the real
   `claude` binary stay untouched — the user tests those.

## Pitfalls

- `os.homedir()` reads `$HOME` on every call, so `useTempHome()` redirects `~/.config/cs` and
  `~/.claude` together; a path built at import time would escape the temp HOME.
- The capture helper returns the captured text: nest the stdout capture inside the stderr one and
  assign the outer result, or stderr comes back empty while the CLI did write to it.
- `jq keys` sorts alphabetically — verify a JSON file's real key order with `jq keys_unsorted`.
- Commander wraps `-h` output at the terminal width: match a help-text line against
  `help.replace(/\n\s+/g, ' ')`, or the assertion breaks on the wrap.
- Output that shows on a terminal only (the banner, the `cs env` prompts) needs a fake terminal
  in-process: `Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })`,
  the same for `columns` (80), and `delete process.env['CI']`. `isInteractive()` requires all three,
  so a piped run stays silent and the test proves nothing.
- A macOS `script -q /dev/null` pty reports 0 columns, so `isInteractive()` is false and the
  terminal-only output stays hidden. Size the pty with `TIOCSWINSZ` (80x24) when smoking the built
  bundle. In this sandbox `script` fails outright — "tcgetattr/ioctl: Operation not supported on
  socket" — because its stdin is a socket; a Python pty (`pty.openpty`, `TIOCSWINSZ` 24x80,
  `os.fork`) is what actually gives the child a terminal.
- `pnpm lint:fix` applies Prettier through ESLint. Prefer it over `pnpm format`, which rewrites
  every Markdown file in the repository, including the tables of `.harness/docs`.
- ESLint does not lint Markdown: format a changed README with `npx prettier --write README.md`,
  otherwise its tables drift out of alignment with the column widths.
- Commander styles every help term on its own (`styleHelpTerm` in `src/cli.ts`), so the ANSI codes
  sit between the words of a term: assert the placeholder alone (`toContain('<profile>')`), never
  the whole term (`'use <profile>'`).
- When the assertion has to cover a whole term (a flag declaration such as `--name, -n <name>`),
  strip the styling first: `stripVTControlCharacters` from `node:util` on the captured text, then
  match the term. The captured text carries no ANSI codes while stdout is not a terminal, so the
  assertion passes without stripping; stripping keeps it true in a terminal run too, where the codes
  sit between the words and a contiguous match would fail.
- A missing positional argument never reaches a `CliError`: commander prints
  `missing required argument '<name>'` on stderr and exits 1. Assert that wording and the code.
- ESLint's `autofix/object-curly-newline` and Prettier disagree on a one-line object literal with
  two or more properties: ESLint expands it, Prettier collapses it back. Run `pnpm lint:fix` and keep
  its shape — Prettier keeps an object multi-line when the source already breaks after `{`.
- `arrow-body-style` + `prefer-arrow-functions` reject concise-return arrows (`(x) => x + 1`) — write
  block bodies with `return`, or let `pnpm lint:fix` rewrite them; either way re-run the gate.
- An order assertion via `indexOf` is vacuous: a missing name gives -1, and -1s still "sort".
  Collect the names from the section's header lines with `matchAll` and `toEqual` the whole array.
- `match[1]` is `string | undefined` under `noUncheckedIndexedAccess` — use `match[1]!`; the
  non-null assertion is allowed here (`src/core/ui/banner.ui.ts` does it).

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`pnpm test` builds the bundle in its global setup, so a green run also proves the build.
