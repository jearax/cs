---
id: 0002
title: Packaging and runtime floor follow jss-devtools conventions
status: Accepted
date: 2026-11-03
supersedes: none
---

# 0002: Packaging and runtime floor follow jss-devtools conventions

## Context

`cs` is a from-scratch refactor of the old `cs-cli` (bun, dual ESM/CJS, Node >= 18). The question
was whether the new repo keeps the old packaging compatibility or adopts the conventions of the
reference repo `/Users/tandm/Documents/jearax/npm/jss-devtools`.

## Decision

Packaging, toolchain and the Node runtime floor follow jss-devtools: pnpm, exact-pinned
dependencies, single-bundle build, Node `>=24.11.0`.

> "Apply jss-devtools cho dự án này với pnpm, harness, agent kit." (user, 2026-11-03)
> "[Chọn] Theo jss-devtools (Recommended): Bundle ESM duy nhất qua tsdown, Node floor theo jss-devtools (>=24.11), deps pin exact version. … Là breaking change với user Node <24." (user, 2026-11-03)

## Options considered

| Option                 | Consequence                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| Follow jss-devtools    | One consistent toolchain across the org's CLIs; breaks Node < 24 users |
| Keep old compatibility | Dual ESM/CJS and Node >= 18 preserved, two toolchains to maintain      |

## Consequences

- Easier: one convention to copy from jss-devtools; the reference repo doubles as a template.
- Harder: dropping Node < 24 is a breaking change versus published `@jjuidev/cs@0.3.x`.
- Enforced by: review only, until build/publish scripts exist.
