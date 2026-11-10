---
id: 0027
title: The installer downloads the verified release bundle from the site, replacing clone-and-build
status: Accepted
date: 2026-11-10
supersedes: none
---

# 0027: The installer downloads the verified release bundle from the site, replacing clone-and-build

## Context

`scripts/install.sh` cloned the repo and built with pnpm — slow, and it demanded git+pnpm beyond
the runtime floor. jss-devtools serves a checksummed bundle (`/releases/latest/cli.mjs` +
`checksums.txt`) from its site and its installer only needs node, curl/wget and a sha256 tool. The
landing site (decision 0026) serves the same files for cs.

## Decision

`scripts/install.sh` is the jss-devtools installer ported to cs names: it downloads
`cli.mjs` + `checksums.txt` from `https://cs.jjuidev.com/releases/latest` (override
`CS_BASE_URL`), verifies sha256, smoke-runs `cs --version`, installs to `~/.cs/<version>/`
(override `CS_HOME`) and writes the `cs` shim to `~/.local/bin` (override `CS_BIN_DIR`). The old
`CS_INSTALL_DIR` env is gone. Nothing is written before the checksum matches.

> "nói chung là port ngược lại của jss-devtools cho cs" (user, 2026-11-10)

## Options considered

| Option                        | Consequence                                       |
| ----------------------------- | ------------------------------------------------- |
| Download + checksum from site | Chosen: no toolchain beyond node+curl/wget+sha256 |
| Keep clone + build            | Rejected: slow, needs git and pnpm                |
| Clone fallback in installer   | Rejected: two code paths to keep correct          |

## Consequences

- Easier: install is one download; the checksum entry is a contract with `scripts/stage-release.mjs`.
- Harder: a public install fails until `cs.jjuidev.com` is live (accepted under decision 0026).
- Enforced by: `tests/install.test.ts` + shellcheck in CI; plan `261110-1454-installer-from-site`.
