# Report: cs identity (decision 0006) and the jss-devtools banner

Task: brief from the planner, no plan file (small task).
Reference: `~/Documents/jearax/npm/jss-devtools` (read-only, unmodified).
Date: 2026-11-03

Decision 0006 is implemented end to end: the package is `@jjuidev/cs`, the product says "Claude code
switch", and the text-line banner is replaced by the reference's block-letter banner. Nothing was
committed.

## What shipped

| Area            | Files                                                                                                   | Note                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Identity        | `package.json`                                                                                          | `name` → `@jjuidev/cs`, `description` → `Claude code switch`       |
| Banner art      | `src/core/constants/banner.constant.ts` (new)                                                           | `CS` block letters, moss palette, platform names                 |
| Banner render   | `src/core/ui/banner.ui.ts` (rewritten)                                                                  | `renderBanner`, `bannerText`, `showBanner` — ported from the reference |
| Wiring          | `src/cli.ts`                                                                                            | `showBanner` on `option:version`, `addHelpText('beforeAll')` when interactive |
| Wording         | `README.md`, `CLAUDE.md`, `tests/cli.test.ts`                                                           | "code switch" → "Claude code switch"                             |
| Harness memory  | `.harness/MEMORY.md`                                                                                    | one line on `cs use --file` and `currentProfile`                  |
| Tests           | `tests/banner.test.ts` (new), `tests/cli.test.ts`                                                       | 16 new tests: rendering, colour depth, the three CLI entry points |

The banner shows in the same three places as the reference — bare run, `--help`, `--version` — and
only on a terminal. Piped output is unchanged apart from the missing banner.

### The banner

```
 ██████╗███████╗
██╔════╝██╔════╝   cs v0.0.0
██║     ███████╗   Claude code switch
██║     ╚════██║
╚██████╗███████║   Node.js v24.22.0 · macOS arm64
 ╚═════╝╚══════╝
```

The art is figlet's ANSI Shadow font for `CS`, generated once with `npx figlet -f "ANSI Shadow" CS`
and embedded as a constant — `figlet` is not a dependency and the bundle ships without
`node_modules`. The gradient, the dimmed shadow characters and the truecolor/256/16-colour fallbacks
are the reference's implementation, moved to `core/ui` so the architecture rule "output only in
`*.ui.ts` / `*.command.ts` / `cli.ts`" holds.

### Wiring in `src/cli.ts`

```ts
// Before `.version()`, so the banner comes before the version it belongs to.
program.on('option:version', () => {
	showBanner();
});

program.addHelpText('beforeAll', (context) => {
	if (context.error || !isInteractive()) {
		return '';
	}

	return `${bannerText()}\n`;
});
```

Commander emits `option:version` to the listeners in registration order, so registering before
`.version()` puts the banner ahead of the version number. `context.error` keeps the banner out of
the help printed after a failure, and `isInteractive()` keeps it out of piped output.

## Validation — real output

### `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

```
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
$ vitest run

 Test Files  14 passed (14)
      Tests  125 passed (125)
   Duration  491ms (tests 64%, import 19%, transform 15%, worker 2%)

$ tsdown
ℹ dist/cli.mjs  170.55 kB │ gzip: 44.10 kB
✔ Build complete in 18ms
EXIT=0
```

One lint round was needed first: `autofix/object-curly-newline` on the two `Object.defineProperty`
calls in the new test file; `pnpm lint:fix` resolved it and `pnpm lint` is clean.

### Terminal smoke (a sized pty, macOS)

`--version` on a pty of 80 columns:

```
 ██████╗███████╗
██╔════╝██╔════╝   cs v0.0.0
██║     ███████╗   Claude code switch
██║     ╚════██║
╚██████╗███████║   Node.js v24.22.0 · macOS arm64
 ╚═════╝╚══════╝

0.0.0
```

(Colours stripped here; the real output carries the moss gradient and the dimmed shadow characters.)

`--help` on the same pty prints the banner, a blank line and then `Usage: cs [command] [options]`.
The bare run piped prints the help with no banner, and `node dist/cli.mjs --version` piped prints
`0.0.0` alone — the existing bundle test still asserts that.

### Tests added (`tests/banner.test.ts`)

- the info column starts at the same column on every line it occupies;
- the banner shows the name, the version, the description, the node version and the platform;
- the `CS` block letters are drawn;
- truecolor at depth 24 (with the shadow characters dimmed), 256-colour at depth 8, one 16-colour
  code at depth 4, no escape code under `NO_COLOR` or with the colour off;
- the banner fits in eighty columns;
- `showBanner` writes on a terminal, writes nothing when piped, writes nothing under `CI`;
- the CLI shows the banner before the version, above the help, and on the bare run, and shows none
  when the output is piped.

## Deviations from the brief

- **`package.json` description is `Claude code switch`, not `CS — Claude code switch`.** The banner
  tagline in the reference is `PACKAGE.description`, so this is the only way the tagline reads
  exactly "Claude code switch" while the string lives in one place. The "CS — Claude code switch"
  product form stays in `README.md`, `CLAUDE.md` and `.harness/docs/cs-project-overview.md`, which
  already carried it.
- **The "show once" guard is gone.** The old `banner.ui.ts` kept module state so the text banner
  printed once per process. The reference has no such state: the three entry points are mutually
  exclusive within a process, so the guard was redundant — and it would have leaked across tests in
  one file. `renderBanner` is a pure function now, which is also what makes the colour-depth tests
  possible.
- **`private: true` stays in `package.json`.** The brief said to keep everything else, so the
  publish guard was left in place even though the name is now a publishable scope.
- **"Switch Claude Code between API providers and model sets" was kept** in `README.md` and
  `CLAUDE.md`. The decision retires the generic *name*; a profile still carries a base URL and a
  token, so the sentence describes the mechanism, and it matches the wording the overview document
  already uses. See the open item below.

## Not checked

- The banner was verified on macOS only, on a pty sized 80×24. Windows and Linux are out of scope
  (the tool is macOS-first), but `PLATFORM_NAMES` carries their labels untested.
- No visual check in a real terminal application — the pty smoke covers the escape sequences, not
  how a particular terminal renders them.
- Nothing was published and no commit was cut, per the brief.

## Open items for the planner and the user

- **The multi-provider sentence.** `README.md` and `CLAUDE.md` still say the tool switches Claude
  Code "between API providers and model sets". If the retirement in decision 0006 was meant to cover
  that sentence too, it needs a different wording (a profile still holds a base URL, so "providers"
  cannot simply be deleted).
- **`private: true`.** Publishing `@jjuidev/cs` needs the flag dropped, and probably a real version
  bump off `0.0.0`.
- **The npm description is now three words.** `@jjuidev/cs — Claude code switch` reads well in a
  terminal but says nothing about the mechanism on the npm page.

## Harness knowledge changed

- `.harness/MEMORY.md`: one line added — `cs use --file` renders the profile files only and never
  sets `currentProfile` (user-confirmed reading of decision 0004). The file is now 4385 of the 4800
  characters the config allows, so the curation the session-start hook keeps warning about is still
  due.
- No new decision was written: decision 0006 already covers this work.

Status: DONE
Summary: Decision 0006 is implemented — the package is `@jjuidev/cs`, the product says "Claude code
switch", and the jss-devtools block-letter banner now shows on a terminal in the bare run, `--help`
and `--version`, with 16 new tests and a green full gate (`pnpm lint`, `pnpm typecheck`, `pnpm test`
— 125 tests, 14 files — and `pnpm build`).
Concerns: the `package.json` description is "Claude code switch" rather than "CS — Claude code
switch" so the banner tagline matches exactly; `private: true` was kept as instructed, so the
package is still not publishable; and the "between API providers" sentence stayed in `README.md` and
`CLAUDE.md`, which may need rewording if the retirement in decision 0006 was meant to cover it.
