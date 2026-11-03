# Phase 01: the profiles module — storage and settings renderer

## Context

Decision 0004 makes `cs.json` the source of truth and the rendered profile file a rebuild-on-change
artifact. The old CLI's behaviour (see `.harness/docs/cs-cli-feature-inventory.md`) moves into a
`modules/profiles/` feature: services return data and print nothing (decision 0003 layout).

## Requirements

- One renderer feeding both delivery targets (global write and profile artifact) so the two targets
  can never drift behaviourally.
- Port the old behaviours deliberately: partial update, blank-start profiles, `--fable` mirrors
  `--opus` on create, `denormalizeModelId`, login mode (empty url+token valid, token-without-URL
  rejected), name validation (`[a-zA-Z0-9_-]+`, no path separators, prototype names blocked),
  `[1m]` derivation, env precedence (7 `ANTHROPIC_*` fields → derived `[1m]` → global+profile env
  last-wins), connectors `true`, masked tokens in listings.

## Files

| File | Action |
| ---- | ------ |
| `src/modules/profiles/` | new module: `services/storage.service.ts` (cs.json load/save 0600, migration v1→v2 with `.bak` 0600, upsert/remove/reset/list), `services/render.service.ts` (settings-shaped render: env block, `[1m]` derivation, env precedence, connectors), `services/launcher.service.ts` (bin script content), `constants/paths.constant.ts` (`~/.config/cs/{cs.json,profiles/,bin/}`), `types/` |
| `tests/profiles-render.service.test.ts` | new — precedence matrix: login mode, `[1m]` on/off per model, global+profile env override, connectors; each row maps to an inventory line |
| `tests/profiles-storage.service.test.ts` | v1→v2 migration with `.bak`, upsert partial-merge, remove clears currentProfile, reset restores OFFICIAL, prototype-name safety (`Object.hasOwn`) |
| `src/core/constants/` | nothing — paths belong to the module, not core |

## Steps

1. Port behaviours one table row at a time from the inventory; write the test first, then the service.
2. Renderer is pure (input profile + global env → output settings object); no fs in the renderer.
   Storage service owns fs (0600, mkdir -p, `.bak` on migration).
3. Launcher content: `#!/bin/sh\nexec claude --settings ~/.config/cs/profiles/<name>.json` — no
   secrets inside launchers.

## Validation

```bash
pnpm typecheck && pnpm test -- profiles
```

## Risk & rollback

- `[1m]` derivation and precedence are the highest-risk port — the matrix must cover every inventory
  row; a wrong precedence silently breaks users' models.
- Rollback: delete `src/modules/profiles/` and the two test files.
