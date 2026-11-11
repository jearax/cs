---
id: 0029
title: The cs config created banner names the default record only when a field was inherited
status: Accepted
date: 2026-11-11
supersedes: none
---

# 0029: The cs config created banner names the default record only when a field was inherited

## Context

Every creation printed `Profile "<name>" created with the "default" record.`, even when the flags
set every field and nothing came from `default` (decision 0015's inheritance). Decision 0020 only
requires the output to name the creation.

## Decision

A creation always prints `Profile "<name>" created`. It appends ` with the "default" record` only
when at least one field (url, token, oauthToken, models, env) took its value from the default
record instead of a flag. Fable mirrored from `--opus` counts as a flag value.

> "theo tôi thấy đâu phải lúc nào cũng nên có dòng "Profile "xxx" created with the "default" record." đâu ta, chỉ có dòng đó khi các flags về model không truyền hay gì đó" (user, 2026-11-11)
>
> [Chosen option:] "Đuôi chỉ khi thừa hưởng" (user, 2026-11-11)

## Options considered

| Option                     | Consequence                                         |
| -------------------------- | --------------------------------------------------- |
| Suffix only on inheritance | True in every case; one boolean in the result       |
| List the inherited fields  | Most precise, but a long banner line                |
| Always plain `created.`    | Shortest; loses the hint that defaults were applied |

## Consequences

- Easier: the banner no longer claims a source that was not used.
- Harder: the hero config transcript must be re-captured when the inheritance changes.
- Enforced by: `tests/config.command.test.ts` ("names no default record when every field comes
  from a flag", and the existing created-with-default cases).
