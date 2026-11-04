# Code review synthesis — full codebase scan, 2026-11-04

Three parallel reviewers (CLI surface, profiles core, tests/packaging). All findings verified
against source; the two most severe were independently re-verified by the planner. Source reports:
`code-reviewer-261104-1436-{cli-surface,profiles-core,tests-packaging}.md`.

## Verified findings (deduplicated, most severe first)

| #  | Severity    | Finding                                                                                                                                   | Key evidence |
|----|-------------|-------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| F1 | Critical    | `cs config --help` prints the default profile's API token raw via the live-default help renderer; no test guards it. Cross-confirmed by two reviewers. | `config.command.ts:33` → `cli.ts:106-117` → `storage.service.ts` `readLiveDefault`; `maskToken` exists but is used only in `profile.ui.ts` |
| F2 | High        | Every file write (cs.json, settings.json, artifacts, launchers) is a direct `writeFile` — no temp+rename, no lock. Crash mid-write truncates artifacts silently; two parallel `cs` runs lose updates via uncoordinated read-modify-write. | `storage.service.ts` `writeJsonFile`, `claude-settings.service.ts`, `render-artifacts.service.ts`, `alias-launcher.service.ts` |
| F3 | High        | No CI at all: `.github/` absent, husky pre-commit runs lint-staged only — tests/typecheck never run automatically anywhere.                 | repo tree |
| F4 | Medium-High | Corrupt `settings.json` is read as `{}` and the next global write drops every user key (permissions, hooks…) with no `.corrupt` recovery — unlike cs.json. Normal-path preservation (spread) is correct but untested. | `claude-settings.service.ts:10-25`, `global-write.service.ts` |
| F5 | Medium      | `maskToken` fully exposes tokens of 9–12 chars: the `slice(0,8)` + `slice(-4)` windows overlap.                                            | `mask-token.util.ts:7-11` |
| F6 | Medium      | `cs config`/`remove` commit cs.json before rendering/cleaning artifacts — a render failure leaves a stale artifact holding the old token; a crash leaves orphaned artifacts. `use` does the order right. | `config.service.ts:180-182`, `remove.service.ts:58-59` vs `use.service.ts:46-48` |
| F7 | Medium      | `detectActiveProfile` gates on `if (!url) return null` — an oauth-only profile (valid per decision 0008) can never be fallback-detected; `cs current` reports none active. | `active-profile.service.ts:16-20` |
| F8 | Medium      | `cs env` prompts have no non-interactive guard and zero test coverage; `cs env < /dev/null` exits silently or hangs.                       | `env.command.ts:24-135` |
| F9 | Medium      | `cli.ts` owns no EPIPE/`uncaughtException`/`unhandledRejection` handlers despite being the designated owner; commander's internal `process.exit(0)` can truncate piped help/version output. | `cli.ts:178`, commander source |
| F10 | Medium     | `install.sh`: a relative `CS_INSTALL_DIR` installs into the temp clone that the EXIT trap deletes while reporting success; clone failures swallowed; `cp` non-atomic. | `install.sh:28,36` |
| F11 | Low        | Architectures scanner bypassable via dynamic `import()`; `RESERVED_NAMES` guard untested through the CLI; duplicate dead guard `env.command.ts:120-130`; `rename` silently overwrites an old `cs.json.corrupt`; alias command recomputes the launcher path; login mode renders empty env keys (auth-modes.md wording); `.corrupt` mode window and symlink-follow on write. | various |

## Verified strengths

Profile-name validation tight at all four entry points; `toString`/`__proto__` handled with
`hasOwn` + `defineProperty` (tested); launchers carry no secret; 0600 enforced by `chmod` on every
write (tested); `useTempHome()` isolation solid; auth guard matrix covered in config tests.

## Policy questions for the user

1. Corrupt `settings.json`: back it up like cs.json (`.corrupt`), refuse + notice, or ignore?
2. Add a GitHub Actions CI (lint + typecheck + test on push/PR)?
3. Exit code when a `cs env` prompt is cancelled (clack upstream exits 0) — normalize or keep?
4. README support claim: "macOS only" vs overview's "macOS-first"?
5. `private: true` in package.json confirmed intentional until the release phase (decision 0002).
