---
title: One token per profile in cs config
date: 2026-11-03
summary: "Decision 0008: cs config now rejects a profile holding both --token and --oauth-token; the renderer stays tolerant."
---

# One token per profile in cs config

## What happened

Decision 0008 narrowed the profile credential model: one profile carries one credential. `cs config`
now rejects a profile whose effective state holds both `--token` and `--oauth-token`, with
`Profile "<name>" cannot have both --token and --oauth-token.` and the hint
`Clear one with -t "" or --oauth-token ""`.

The guard (`src/modules/profiles/checks/token-exclusivity.check.ts`) runs on the effective profile —
the stored profile merged with the flags of this run — so it also catches an `--oauth-token` added
on top of a profile that already carries a token, not only the two flags passed together. It sits
next to the existing `hasTokenWithoutUrl` guard, which still fires first.

`cs use` keeps only the token-without-URL guard, and the renderer stays tolerant: a hand-edited
`cs.json` holding both tokens still renders both env keys, so Claude Code's documented precedence
decides.

## Decision

The guard lives in `cs config`, not in the renderer: the renderer cannot know whether a profile was
written by cs or by hand, and a hand-edited file must keep working. The price is that anything
writing `cs.json` directly bypasses the check.

## Next steps

- Real-world verification of each combo (what `/status` shows, whether the oauth token survives the
  `claude --settings` launcher path) stays with the user.
- A `cs.json` written before this guard keeps both tokens until the next `cs config`.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
