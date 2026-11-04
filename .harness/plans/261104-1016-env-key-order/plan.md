---
title: "Render env keys alphabetically"
description: "The renderer sorts the env map A→Z before returning; both the artifact and the global write inherit the order."
status: pending
priority: P3
effort: 0.5h
issue: none
branch: main
decision: 0016
created: 2026-11-04
---

# Plan: alphabetical env key order (decision 0016)

## Changes

| File | Action |
| ---- | ------ |
| `src/modules/profiles/services/render.service.ts` | sort the final env map alphabetically before returning (`Object.fromEntries(Object.entries(...).sort())` — plain code-point comparison is the A→Z contract) |
| `tests/profiles-render.service.test.ts` | new — `Object.keys` of the rendered env is sorted, with oauth token, `[1m]` keys and user extras all present in the order |

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
HOME=$H node dist/cli.mjs config -n w -u https://x.com -t tok && jq '.env | keys' $H/.config/cs/profiles/w.json   # sorted
```

## Risk & rollback

- Pure output-order change; consumers read keys by name. Rollback: `git revert`.
