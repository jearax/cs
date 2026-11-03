---
id: 0006
title: cs is "@jjuidev/cs", "Claude code switch", with the jss-devtools-style banner
status: Accepted
date: 2026-11-03
supersedes: none
---

# 0006: cs is "@jjuidev/cs", "Claude code switch", with the jss-devtools-style banner

## Context

The port shipped a text-line banner and the working name `cs` / "code switch". The user clarified
the product identity: the tool is Claude-specific now (the old multi-provider "code switch" idea is
dropped), the package name follows the org scope, and the banner follows the reference repo's
block-letter style rather than a bare text line.

## Decision

- Package name: `@jjuidev/cs`; the product is "CS — Claude code switch".
- The banner is ASCII block-letter art ported from jss-devtools (`core/ui/banner.ui.ts`,
  `banner.constant.ts`), shown in the same places as the reference: bare run, `--help`,
  `--version`, on a terminal only.
- The old "code switch for many providers" framing is retired: docs and help text say Claude.

> "[Banner] Tham khảo jss-devtools á, FYI: pkg name `cs` -> `@jjuidev/cs`, `cs` là `Claude code
switch`, đổi lại khái niệm, trước đó tôi dự định là `Code switch` và sẽ viết nhiều provider,
> nhưng giờ tôi chỉ dùng 1 mình claude" (user, 2026-11-03)

## Options considered

| Option                       | Consequence                                            |
| ---------------------------- | ------------------------------------------------------ |
| jss-devtools banner + rename | Consistent identity across the toolchain               |
| Keep the text-line banner    | Smaller bundle, but plain look the user dislikes       |
| Keep "code switch" naming    | Preserves the multi-provider idea the user has dropped |

## Consequences

- Easier: one visual language with jss-devtools; docs stop promising multi-provider scope.
- Harder: if multi-provider returns, the naming and docs must widen again.
- Enforced by: review only.
