---
id: 0018
title: Env keys render in an explicit semantic order, unknown keys appended alphabetically
status: Accepted
date: 2026-11-04
supersedes: 0016
---

# 0018: Env keys render in an explicit semantic order, unknown keys appended alphabetically

## Context

Decision 0016 chose alphabetical sorting, but after seeing real output the user settled on an
explicit semantic order: endpoint, credentials, the model block in its canonical sequence, then
the oauth token, then the `[1m]` keys. Keys not in that list (user extras from `cs env`) follow,
sorted alphabetically.

## Decision

The renderer orders the final env map exactly as:

1. `ANTHROPIC_BASE_URL`
2. `ANTHROPIC_AUTH_TOKEN`
3. `ANTHROPIC_DEFAULT_MODEL`
4. `ANTHROPIC_DEFAULT_HAIKU_MODEL`
5. `ANTHROPIC_DEFAULT_SONNET_MODEL`
6. `ANTHROPIC_DEFAULT_OPUS_MODEL`
7. `ANTHROPIC_DEFAULT_FABLE_MODEL`
8. `CLAUDE_CODE_OAUTH_TOKEN`
9. `CLAUDE_CODE_DISABLE_1M_CONTEXT`
10. `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Any other key (user extras) follows, alphabetically. The order applies to both delivery targets
(the artifact and the global write) — one renderer, one contract.

> "[Sort] ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_DEFAULT_MODEL, ANTHROPIC_DEFAULT_HAIKU_MODEL,
> ANTHROPIC_DEFAULT_SONNET_MODEL, ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_FABLE_MODEL,
> CLAUDE_CODE_OAUTH_TOKEN, CLAUDE_CODE_DISABLE_1M_CONTEXT, CLAUDE_CODE_AUTO_COMPACT_WINDOW" (user, 2026-11-04)

## Options considered

| Option                  | Consequence                                         |
| ----------------------- | --------------------------------------------------- |
| Explicit order (chosen) | Reads like the model config it is; stable positions |
| Alphabetical (0016)     | Zero maintenance, but semantically scattered        |

## Consequences

- Easier: the block reads as documentation; credentials and toggles live where the eye expects.
- Harder: a new cs-managed key needs an explicit position in the order list.
- Enforced by: renderer order tests rewritten for the sequence.
