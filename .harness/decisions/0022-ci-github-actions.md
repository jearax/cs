---
id: 0022
title: GitHub Actions CI runs lint, typecheck and test on push and pull requests
status: Accepted
date: 2026-11-04
---

# 0022: GitHub Actions CI runs lint, typecheck and test on push and pull requests

## Context

The code review found that no automated gate ever ran the test suite: husky's pre-commit runs
lint-staged only, and `.github/` did not exist. On a public repository the green build should be
verifiable by anyone.

## Decision

A GitHub Actions workflow runs `pnpm lint`, `pnpm typecheck` and `pnpm test` on push and on pull
requests, on Node >= 24.11. The workflow mirrors the Development section of the README; the husky
hooks stay as they are.

> "[Thêm GitHub Actions CI (F3)?] = Có, GitHub Actions" (user, 2026-11-04)

## Options considered

| Option                  | Consequence                                      |
| ----------------------- | ------------------------------------------------ |
| GitHub Actions (chosen) | Public, per-PR evidence; mirrors the local gates |
| Pre-push husky hook     | Local only; invisible to contributors            |
| None                    | Gates rely on discipline                         |

## Consequences

- Easier: regressions surface on the PR, not at install time.
- Harder: every push must keep lint/typecheck/test green; a red CI blocks merging by convention.
- Enforced by: the workflow file itself, exercised on every push.
