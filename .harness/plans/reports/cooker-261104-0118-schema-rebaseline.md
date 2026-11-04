# Report: Schema re-baseline (decision 0012)

Decision: [../../decisions/0012-schema-rebaseline.md](../../decisions/0012-schema-rebaseline.md)
Plan: [../261104-0118-schema-rebaseline/plan.md](../261104-0118-schema-rebaseline/plan.md)
Date: 2026-11-04

Decision 0012 is implemented and the full gate is green. No commit was made.

## What shipped

| # | Change | Files |
| - | ------ | ----- |
| 1 | `CURRENT_SCHEMA_VERSION = 1`; a newly created config is written with `schemaVersion: 1` | `src/modules/profiles/constants/profile.constant.ts` |
| 2 | The migration chain is gone: the `claude`→`profiles` key fallback, the legacy `[1m]` auto-env strip and the `.bak`-on-migration write | `src/modules/profiles/services/storage.service.ts` |
| 3 | The dead artefacts of that chain are removed with it: `csConfigBackupPath` and the `claude` key of `RawCsConfig` | `src/modules/profiles/constants/paths.constant.ts`, `src/modules/profiles/types/profile.type.ts` |
| 4 | The migration tests are replaced by the three cases of the plan | `tests/profiles-storage.service.test.ts` |
| 5 | The storage docs and the memory line say schema 1, no migration | `README.md`, `.harness/MEMORY.md` |

### The load path

`loadCsConfig` now has one rule: the file has a `profiles` key, or it is not a cs config.

- **No file** — a fresh config is created with the official `default` profile and written with
  `schemaVersion: 1` and mode `0600`.
- **A file with `profiles`** — it is read as it is. cs never rewrites it on load, so there is no
  backup and no second version of the file on disk.
- **A file without `profiles`** (unparseable, or the old shape with the profiles under `claude`) —
  it is not a cs config. cs says so, keeps the file at `cs.json.corrupt` (mode `0600`) and starts
  from the default profile. The notice names both causes, because the old shape is the one the
  user has to convert by hand.

Kept untouched, as the decision requires: the `.corrupt` handling, mode `0600`, the owned-keys
rewrite (`toCsConfig`) and every command behaviour. The `.bak` file is never written any more.

### The one judgement call

A file that declares a version keeps that version when cs rewrites it — only a **newly created**
config is stamped `1`. So a user's existing `schemaVersion: 3` file still reads `3` after a
`cs config` run, while a fresh install writes `1`.

The plan does not pin this down ("a v3-shape file reads as-is"), and decision 0012 only says that
newly created configs are written with `schemaVersion: 1`. Reading the version as-is is the smaller
change: it keeps the version honest about the shape the file actually has, and it needs no rewrite
on load. Restamping every write to `1` is a one-line change in `loadCsConfig` if the baseline is
preferred instead.

## Validation — real output

### The gate

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,tsx}"
EXIT=0

$ pnpm typecheck
$ tsc --noEmit
EXIT=0

$ pnpm test
 Test Files  18 passed (18)
      Tests  193 passed (193)
   Duration  730ms (tests 60%, transform 20%, import 19%, build 1%)

$ pnpm build
ℹ dist/cli.mjs  181.00 kB │ gzip: 46.65 kB
✔ Build complete in 27ms
EXIT=0
```

The storage suite carries the three new cases: a fresh config is stamped `1`, a file that keeps the
profiles under `profiles` is read as it is (the file content is unchanged, no `.bak`, no `.corrupt`),
and a `claude`-keyed file is not migrated — the notice fires, cs starts from the default profile and
the old file is kept at `cs.json.corrupt`. A fourth case proves the removed auto-env strip: the env
of a profile is now kept exactly as it is.

### The smoke, on a temp HOME (`HOME=$H node dist/cli.mjs …`)

A fresh HOME gets the default profile and a file stamped with the baseline:

```
$ HOME=$H node dist/cli.mjs list
Profiles:

  * default
    URL:    https://api.anthropic.com
    ...

$ cat $H/.config/cs/cs.json
{
  "schemaVersion": 1,
  "profiles": { "default": { ... } },
  "currentProfile": "default"
}

$ stat -f "%Lp" $H/.config/cs/cs.json
600
```

A file that keeps the profiles under `profiles` is read as it is — the file is byte-identical
afterwards and no `.bak` appears:

```
$ cat $H/.config/cs/cs.json
{"schemaVersion":1,"profiles":{}}

$ HOME=$H node dist/cli.mjs list
Profiles:

$ ls -a $H/.config/cs/
.  ..  cs.json
```

The old shape fails loudly and stays convertible:

```
$ HOME=$H node dist/cli.mjs list
   ! cs.json is not a cs config: it could not be parsed, or it has no `profiles` key. It was
     replaced by a default config and kept at $H/.config/cs/cs.json.corrupt
Profiles:

  * default
    ...

$ ls -a $H/.config/cs/
.  ..  cs.json  cs.json.corrupt

$ cat $H/.config/cs/cs.json.corrupt
{"schemaVersion":2,"claude":{"work":{ ... }}}
```

The write path stamps the baseline on a new config: `cs config -n work` on a fresh HOME leaves
`schemaVersion: 1` with the `default` and `work` profiles.

The real `~/.config/cs`, the real `~/.claude` and the real `claude` binary were never touched —
every run above used a fresh `mktemp -d` HOME and a fake token.

### The plan

```
$ ak plan validate .harness/plans/261104-0118-schema-rebaseline
[OK] .harness/plans/261104-0118-schema-rebaseline is a valid plan directory
EXIT=0
```

The plan directory had no phase file, so the validator rejected it (as it still does for the four
other phase-less plans in this repo). Two phase records were added for the two steps of the plan,
and the plan now carries `status: completed` with its Result.

## Harness knowledge changed

- `.harness/MEMORY.md` — the migration line is replaced by "schema 1, nothing is migrated, an
  old-shape file is kept at `cs.json.corrupt` for a manual conversion (decision 0012)". The file is
  4790 chars, inside the 4800 limit.
- `.harness/docs/` — untouched; those docs never described the migration.

## Open questions

- The version stamp on rewrite: keep the file's own version (shipped) or restamp every write to
  `1`? One line in `loadCsConfig` either way.
- The plan's phase files: written here to make `ak plan validate` pass, but the other phase-less
  plans in this repo still fail that check. If the validator is meant to require phases, the older
  plan folders need the same treatment.
