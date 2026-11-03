# Report: rc PATH entry (decision 0009, amended by 0010)

- Date: 2026-11-04
- Plan: `.harness/plans/261104-0021-rc-path-marker/plan.md`
- Scope: append a marked PATH export to the user's shell rc on the first artifact render
- Commit: none (the plan asked for no commit)

## Outcome

`cs` now adds `~/.config/cs/bin` to the user's PATH by writing the two-line block to their shell
rc, once, and only from an interactive terminal. The trigger is the render of a profile, so it
fires from `cs config`, `cs use` and `cs env` — the three commands that render artifacts.

The block is exactly:

```sh
# Added by @jjuidev/cs
export PATH="$HOME/.config/cs/bin:$PATH"
```

with `fish_add_path $HOME/.config/cs/bin` for fish. The write is append-only: an rc file cs does
not own is never rewritten, and the marker keeps a second run from writing the block again.

## Changes

| File | Change |
| ---- | ------ |
| `src/modules/profiles/services/rc-path.service.ts` | new — pure logic: `$SHELL` → rc file and export line, the two-line block, the marker detection, the PATH entry lookup |
| `src/modules/profiles/services/ensure-bin-path.service.ts` | new — orchestrator: the four trigger conditions in order, then the append |
| `src/core/ui/artifact.ui.ts` | the `BinPathOutcome` type, the notice and the manual-hint lines, and `showBinPathNotice` |
| `src/commands/config/services/config.service.ts` | renders → `ensureBinPath()`, the outcome in `ConfigResult` |
| `src/commands/use/services/use.service.ts` | renders → `ensureBinPath()`, the outcome in `UseResult` |
| `src/commands/env/services/env.service.ts` | renders → `ensureBinPath()`, the outcome in `EnvResult` |
| `src/commands/{config,use,env}/*.command.ts` | render the notice through `core/ui` |
| `tests/rc-path.service.test.ts` | new — the shell map, the two-line block, the marker, the PATH lookup |
| `tests/ensure-bin-path.service.test.ts` | new — append once, second run writes nothing, the PATH skip, the non-interactive skip, the marker skip, the fish block, and the CLI path |
| `README.md` | the launchers section: cs adds the entry itself, and the manual line for a script |
| `.harness/decisions/0010-rc-marker-names-the-tool-only.md` | new — the amendment, and the full policy it now carries in force |
| `.harness/decisions/0009-rc-path-marker.md` | `status: Superseded by 0010` |
| `.harness/decisions/README.md` | the row for 0010 |
| `.harness/docs/code-standards.md` | a type a module service produces and `core/ui` renders lives in `core/ui` |
| `.claude/skills/cs-command-test/SKILL.md` | the pty smoke recipe that works here, and the naming of a module service test |
| `.harness/MEMORY.md` | the TTY line now points at the pty recipe in the skill |

## The marker amendment

The plan and decision 0009 pinned the marker as `# Added by @jjuidev/cs, ~/.config/cs/bin/`. The
user amended it mid-task to `# Added by @jjuidev/cs` — the path is already in the export line
below it. The repo rule is that an accepted decision is never edited, so the amendment is
recorded as decision 0010, which supersedes 0009; 0009 keeps its original text and its original
quote.

0010 also carries the whole policy, not only the marker: the session-start hook injects
`- <id> <title>` for the decisions in force and drops a superseded one, so a decision that only
amended a detail would have taken the automatic-append rule out of that list. 0010's title and
body therefore state the trigger conditions, the shell map and the block.

The new marker is a prefix of the old one, so an rc file written by the earlier cs still matches
and does not get a second block.

## Verification

Full gate green:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- `eslint`: clean
- `tsc --noEmit`: clean
- `vitest run`: 16 files, 173 tests passed (26 new; the global setup also rebuilds the bundle)
- `tsdown`: `dist/cli.mjs` built, 175.90 kB

Smoke against the built bundle, each with its own temp `HOME`:

1. **Not a terminal** — `HOME=$H node dist/cli.mjs config -n work -u https://example.com -t <test-token>`
   printed the manual hint and wrote no rc file (`ls -a $H` showed only `.config`).

   ```
   Add ~/.config/cs/bin to your PATH to run the launchers:
     export PATH="$HOME/.config/cs/bin:$PATH"   (add it to ~/.zshrc)
   ```

2. **Interactive terminal** — the same command through a pty (24x80, `SHELL=/bin/zsh`) printed the
   notice and appended the block once:

   ```
   PATH entry added to ~/.zshrc — open a new shell to pick it up
   ```

   The rc file held exactly the two lines of the block.

3. **Second run** — the same pty command again appended nothing: the file still had 2 lines.

4. **PATH already holds the bin dir** — a fresh `HOME` with the bin dir in `PATH` wrote no rc file
   and printed no notice.

5. **Unknown shell** — `SHELL=/bin/tcsh` printed the hint and wrote no file.

## Notes and judgement calls

- **The order of the conditions.** PATH first, then the shell, then the marker, then the TTY. The
  marker is checked before the TTY, so a script that runs against a machine whose rc already
  carries the block prints nothing — the hint would be noise there.
- **The notice is silent when the marker is present.** A second run in a terminal prints neither
  the notice nor the hint; the rc file already says everything needed.
- **The append keeps the previous line intact.** When the rc file does not end with a newline, a
  newline is written first, so the block never lands in the middle of a line. The file is only
  ever appended to.
- **The fish directory is created.** `~/.config/fish/` does not exist on a machine that never ran
  fish, so the parent directory is created before the append.
- **The type of the outcome lives in `core/ui`.** `BinPathOutcome` is defined where it is
  rendered, and the module service imports it. A module importing `core` is the allowed
  direction; the other way round would make `core` depend on a module.
- **The fish path was not smoked.** The unit test writes the fish block to
  `~/.config/fish/config.fish` and asserts the `fish_add_path` line; no fish shell was run.
- **The plan file was amended by the planner** while the work ran: it now carries the new marker
  and `status: completed`. The reference in its amendment note pointed at decision 0009 and now
  points at 0010.

## Not checked

- No run against the real `~/.config/cs` or the real `~/.zshrc`; every smoke used a temp `HOME`.
- `cs env` was not driven through its prompts (they need a terminal and a TTY read); its call
  site is the same `ensureBinPath()` as the other two commands, and the env service test covers
  the outcome it returns.

## Unresolved questions

None.
