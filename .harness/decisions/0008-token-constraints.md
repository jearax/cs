---
id: 0008
title: One token per profile — token and oauthToken are mutually exclusive
status: Accepted
date: 2026-11-03
supersedes: 0007
---

# 0008: One token per profile — token and oauthToken are mutually exclusive

## Context

Reviewing the `url` / `token` / `oauthToken` constraints surfaced the intent behind them: the user
switches Claude Code's auth mode by switching profiles — a login profile (empty credentials) for
Remote Control and usage pages, an oauth-only profile for the team's shared token, an auth profile
for paid API credits. A profile carrying both tokens at once has no place in that model, so the
coexistence allowed by decision 0007 narrows: one token per profile.

## Decision

Allowed combinations:

| url | token | oauthToken | Meaning                                                             |
| --- | ----- | ---------- | ------------------------------------------------------------------- |
| ✓   | ✗     | ✗          | custom endpoint, credentials from elsewhere (subscription/login)    |
| ✓   | ✓     | ✗          | auth mode: custom endpoint + `ANTHROPIC_AUTH_TOKEN`                 |
| ✓   | ✗     | ✓          | oauth token with a custom endpoint                                  |
| ✗   | ✗     | ✓          | oauth mode: `CLAUDE_CODE_OAUTH_TOKEN` against the official endpoint |

Blocked combinations:

- `token` set without `url` — unchanged guard (`hasTokenWithoutUrl`), oauth does not rescue it.
- `token` and `oauthToken` both set — `cs config` rejects it with a hint to clear one.

The renderer stays tolerant: a hand-edited `cs.json` holding both tokens still renders both env
keys (Claude Code's documented precedence decides); the guard lives in `cs config`. The auth-mode
fallback strategy (one credential per profile, precedence per Claude Code) belongs to the user,
who also owns verifying the combos in real usage.

> "Giữa guard và thu hẹp so với decision trước đó đi, không có tổ hợp cả url + token + oauth token" (user, 2026-11-03)
> "Bạn cũng không cần test cũng được, tôi tự test cho." (user, 2026-11-03)

## Options considered

| Option                     | Consequence                                               |
| -------------------------- | --------------------------------------------------------- |
| One token per profile      | Profiles map 1:1 to auth modes; config catches mistakes   |
| Both tokens allowed (0007) | Flexible, but a mixed profile hides which credential wins |

## Consequences

- Easier: a profile name says which auth mode it carries; no silent precedence inside one profile.
- Harder: switching from a paid token to the team oauth token means clearing one flag, not stacking them.
- Enforced by: `cs config` validation and its tests; the renderer stays tolerant.
