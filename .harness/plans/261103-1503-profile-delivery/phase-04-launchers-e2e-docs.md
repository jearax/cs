# Phase 04: launchers polish, e2e flow, user-facing docs

## Context

All commands exist (phases 01–03). This phase wires the end-to-end flow, polishes the launcher
generation and writes the docs the new user-visible behaviour requires.

## Requirements

- Launcher generation is the single implementation shared by `config`/`use`/`remove`/`reset` —
  already centralized in `render-artifacts.service.ts` (phase 02) and
  `artifact-cleanup.service.ts` (phase 03); this phase verifies and polishes, no new logic.
- One e2e test drives the full flow in a temp HOME: config → use --file → artifact + launcher exist
  → current lists the profile → remove cleans both.
- User-facing README.md documents install, quick start, the two delivery modes, and the PATH note
  for launchers (the repo has no README today).

## Files

| File | Action |
| ---- | ------ |
| `tests/profile-flow.e2e.test.ts` | new — temp HOME e2e: config → use --file → render → current → remove; verify artifact/launcher lifecycle |
| `README.md` | new — install, quick start, dual delivery (global default + `claude --settings` files), launcher PATH note |
| `CLAUDE.md` project block | extend: add one line on dual delivery pointing at decision 0004 |

## Steps

1. Verify launcher generation is reachable from every path that changes a profile (config, use,
   remove, reset, env).
2. Write the e2e test with a temp HOME (reuse `tests/support/tmp-dir.ts`).
3. README.md: model it on the old repo's README, updated for dual delivery and launcher naming.
4. CLAUDE.md project block: one added line.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$(mktemp -d) node dist/cli.mjs config -n work -u https://example.com -t sk-test -s m1
HOME=... node dist/cli.mjs use work --file
cat ~/.config/cs/profiles/work.json       # settings-shaped, env block correct
ls -l ~/.config/cs/bin/                    # claude-work executable
HOME=... node dist/cli.mjs current         # lists the rendered profile
```

## Risk & rollback

- README is user-facing: claims must match real behaviour — every command example is run once.
- Rollback: delete the e2e test, README, and the CLAUDE.md line.
