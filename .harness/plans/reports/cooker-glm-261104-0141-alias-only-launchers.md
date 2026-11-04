# Report: cooker-glm — alias-only launchers (decision 0013, plan 261104-0141)

Date: 2026-11-04 · Branch: main · No commit (as instructed)

## Outcome

Profiles render only their artifact; `cs alias` is the only launcher creator; `bin/` mirrors the
`aliases` map. Full gate green; plan validation smoke passed 3/3 in a tmp `$HOME`.

## Changes

- `src/modules/profiles/services/render-artifacts.service.ts`: `renderProfileArtifacts` writes the
  artifact (0600) and re-renders the alias launchers of the profile; the `claude-<profile>`
  launcher write is gone. `ProfileArtifacts` keeps `settingsPath`, `settingsHomePath`,
  `launchCommand`.
- `src/core/ui/artifact.ui.ts`: `ArtifactView` keeps `settingsHomePath` + `launchCommand`; output
  is `Settings:` + `Command:` — the `Launcher:` line is gone from config/use.
- `src/modules/profiles/services/artifact-cleanup.service.ts`: `removeProfileArtifacts` removes the
  artifact only; `listArtifactProfiles` reads the artifacts dir only (the bin/ scan is gone), so
  `cs list`'s rendered marker and `cs current` mean "the artifact exists". `removeAllArtifacts`
  (reset) removes artifacts only.
- `src/commands/alias/` untouched in behaviour: keeps its `Launcher:` output line and stays the
  only launcher creator. `cs remove` and `cs reset` keep cleaning dangling alias launchers via the
  registry and reporting them (remove.service / reset.service needed no code change — the slimmed
  cleanup service carries the new ownership).
- Tests: render tests now assert artifact-only and no `Launcher:` line; `cs remove` gained a test
  that a stray `claude-<profile>` launcher cs never made survives removal; reset test now asserts
  no `claude-default` launcher; use + e2e flows assert no profile launcher.
- `README.md`: profiles render `--settings` artifacts only; launchers come from `cs alias`; stale
  `claude-<profile>` launchers from older versions are removed by hand once; PATH-notice wording
  and the "Where things live" table updated.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (18 files, 196/196 — two new tests), `pnpm build` — all pass.
- Plan validation in a tmp `$HOME`, fake token, no real `~/.config/cs`, `~/.claude` or `claude` binary touched:
  1. `cs config -n work ...` — no `Launcher:` line, no `bin/` dir created.
  2. `cs alias rw work` — `bin/` contains only `claude-rw`.
  3. `cs remove work` — `Removed aliases: rw` reported.
- Temp home deleted after the smoke.

## Notes / limitations

- The automatic journal step was skipped: the session rule forbids creating markdown outside
  `.harness/plans|docs` without an explicit request.
- Launchers already in a real user's `bin/` from older versions are unmanaged by design (decision
  0013); README documents the one-time manual cleanup.
- Not checked: a real-TTY rc-write smoke (the PATH service is unchanged and covered by its own tests).

## Addition (planner polish, same session): gated PATH hint

The PATH hint ("Add ~/.config/cs/bin to your PATH to run the launchers") used to fire on every
profile render even with an empty or absent `bin/`. Gated:

- `ensure-bin-path.service.ts`: `ensureBinPath` now returns `null` and touches nothing when the
  bin dir holds no launcher — no rc write, no hint. The gate sits in one place; `cs alias` is
  unaffected because it calls the service after rendering its launcher, so the first alias still
  triggers the rc append (interactive) or the hint (non-interactive).
- `tests/ensure-bin-path.service.test.ts`: direct-service tests seed a launcher; new test
  "does nothing when the bin dir holds no launcher"; CLI tests run through the `cs alias` flow and
  a new "stays silent while no alias launcher exists" asserts no output and an untouched rc.
- `README.md`: the rc PATH entry is now described as appended "the first time cs creates a
  launcher".

Verification: full gate green (lint, typecheck, 198/198 tests, build); tmp-`$HOME` smoke —
`cs config` alone prints no PATH hint and leaves `.zshrc` absent, `cs alias rw work` creates
`claude-rw` and prints the hint. No commit.
