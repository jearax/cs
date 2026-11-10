---
title: Port jss-devtools landing site into cs with a Signal Orange skin
date: 2026-11-10
summary: "site/ port, skin cs, cs-only content from real smoke output, docker+CI deploy chain to cs.jjuidev.com"
---

# Port jss-devtools landing site into cs with a Signal Orange skin

## What happened
Cooked plan 261110-1447: copied jss-devtools `site/` wholesale, then retargeted. New skin `cs`
built by luminance-preserving OKLCH rotation (primary hue 45 Signal Orange, secondary warm grey
chroma <=0.008, neutral warm ink chroma <=0.010) so the design system's contrast contract holds
exactly. Constants, Home, Docs (GettingStarted/Install/Reference) rewritten for cs; Doctor/Harness/
Init pages dropped everywhere. Transcripts and the file tree come from real `dist/cli.mjs` runs in a
temp HOME with fake tokens via pty (`FORCE_COLOR=1`). Root wiring: `build:site`, ignores,
`scripts/stage-release.mjs`, `docker/` (cs-web, Host cs.jjuidev.com), `ci/smoke-site-image.sh`,
CI workflow ported with pinned SHAs to ghcr.io/jearax/cs + Dokploy webhook.

## Decision
Smoke script checks image routes only — it does not execute `scripts/install.sh` (parallel plan
261110-1454 owns the installer and its env-var contract). Trap hit twice: long file writes/heredocs
got corrupted mid-stream — recovered by re-copying from the source repo and re-applying small edits.

## Next steps
- Docker build + image smoke validate in CI only (Docker down locally).
- User: set `DOKPLOY_WEBHOOK_URL` + `main` environment; create the cs.jjuidev.com domain.
- Deploy job fails loudly until then, by design.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
