# Report: cooker-glm — help defaults conventions (no decision file)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Item 1 — configureHelp block: already ported, one adjustment

`src/cli.ts` already carried the jss-devtools configureHelp block (styleTitle, optionsLast usage,
styleHelpTerm styling, optionDescription with `argChoices`/`defaultValueDescription`/`defaultValue`,
styleOptionDescription dim) from the original conventions port — nothing to re-port.

One adjustment against the visual target: the ported handler ran `JSON.stringify` over
`defaultValueDescription` too, quoting the inheritance note. The reference's own `dist` rendering
(`jss-devtools init -h`: `(default: written)`, `(default: installed)` — unquoted) and the
planner's example both show descriptions unquoted while real values stay quoted
(`(default: "node")`). The handler now renders `defaultValueDescription` as-is and keeps
`JSON.stringify` for `defaultValue`; a one-line why-comment records the distinction. Flagging the
src-vs-dist discrepancy in the reference repo for whoever maintains it.

## Item 2 — config option metadata

`config.command.ts` options moved to `addOption(new Option(...))`:

- `--name, -n <name>` — `.default('default')`; the hand-written `(default: "default")` is dropped
  from its description (the handler renders it). Commander now fills the value too; the service's
  `|| 'default'` normalization is unaffected.
- `--url/--token/--haiku/--sonnet/--opus/--fable` — `.default(undefined, INHERITED_NOTE)` with
  `INHERITED_NOTE = 'inherited from the default profile on creation'` (decision-0015 semantics);
  no real `defaultValue`, so no value is invented.
- `--oauth-token` — bare, per instructions.

## Item 3 — verification

- Full gate: `pnpm lint`, `pnpm typecheck`, `pnpm test` (20 files, 214/214), `pnpm build` — pass.
- `cs config -h` renders exactly the target: `Profile name (default: "default")`, `Sonnet model
  (default: inherited from the default profile on creation)`, wrapped to width, parentheticals
  dimmed; `--oauth-token` stays bare. `cs use -h` and `cs env -h` render cleanly.
- New assertions in the config help test lock the rendered defaults (whitespace-normalized, since
  commander wraps at terminal width); the whole gate re-ran green after them.
- `antislop-code` applied: one why-comment in the cli.ts handler; no slop.

## Not checked

- Nothing this time; every changed surface renders through the gate and the smoke.
