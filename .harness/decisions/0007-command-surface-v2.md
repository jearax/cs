---
id: 0007
title: 'Command surface v2: no --file, no help command, list/ls, key `profiles`, oauthToken'
status: Superseded by 0008
date: 2026-11-03
supersedes: 0004
---

# 0007: Command surface v2: no --file, no help command, list/ls, key `profiles`, oauthToken

## Context

First real usage pass over the ported CLI surfaced five adjustments. The storage key rename and the
oauth field change the persisted schema; removing `cs use --file` narrows decision 0004's dual
delivery: the file path lives entirely in the artifacts and launchers rendered at `cs config` time,
and `cs use <name>` writes the global settings only. When both tokens are set, Claude Code's own
documented precedence (`ANTHROPIC_AUTH_TOKEN` ranks above `CLAUDE_CODE_OAUTH_TOKEN`) decides — cs
writes both env keys without judging.

## Decision

- `cs use <name>` has no `--file` flag: it renders the artifact + launcher and writes the global
  settings. The `claude --settings` delivery happens through the launchers (`claude-<profile>`)
  and rendered profile files, not through a `use` flag.
- `cs.json` stores profiles under the key `profiles` (was `claude`); schemaVersion moves to 3 and
  the migration reads the old key, backs up to `.bak` first.
- Profile gains an independent `oauthToken` field with flag `--oauth-token` (no short form); the
  renderer writes `CLAUDE_CODE_OAUTH_TOKEN` when set; an oauth token is valid without a URL (the
  token-without-URL guard applies to `--token` only); both tokens may coexist and both env keys are
  written — precedence is Claude Code's business.
- The list command is `cs list` with `ls` as an alias.
- The `help` subcommand is removed (`--help, -h` remains); `cs reset` stays as is.

> "Bỏ `cs help`" (user, 2026-11-03)
> "Trong profile.type.ts:17, key `claude` -> `profiles`, thêm config cho `CLAUDE_CODE_OAUTH_TOKEN`, --oauth-token" (user, 2026-11-03)
> "Không có syntax/flag `cs use --file`" (user, 2026-11-03)
> "cs ls là bí danh của cs list" (user, 2026-11-03)
> "[reset] Giữ nguyên" (user, 2026-11-03)
> "Chỉ có cs use <name> thôi, còn hệ thống bin alias là để xài trực tiếp, ví dụ claude-planner" (user, 2026-11-03)
> "Ghi bình thường cho tôi, tôn trọng chủ đích của client, sai cũng là client, behaivior ưu tiên đã
> có claude xử lý." (user, 2026-11-03)

## Options considered

| Option                           | Consequence                                         |
| -------------------------------- | --------------------------------------------------- |
| Keep --file on use               | Two overlapping ways to enter file mode             |
| File delivery only via launchers | One path per concern: use = global, launcher = file |
| Warn when both tokens set        | Cs judges a precedence Claude Code documents itself |

## Consequences

- Easier: one flag set per command; launchers are the only file-delivery entry.
- Harder: existing cs.json files (key `claude`) depend on the v2→v3 migration keeping their data.
- Enforced by: storage migration tests, render tests for the oauth env, CLI tests for the command names.
