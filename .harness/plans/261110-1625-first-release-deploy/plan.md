---
title: "First release: push, deploy cs.jjuidev.com, verify end to end"
description: "Land the remaining commits, push main so CI builds and pushes the image, the user creates the Dokploy app and domain, then verify the live site and the installer end to end, with a rollback path."
status: pending
priority: P1
effort: 1h planner + user Ops
issue: none
branch: main
decision: 0026
created: 2026-11-10
---

# Plan: first release and deploy of cs 0.1.0

## Overview

Everything is reviewed and committed except harness doc edits; `DOKPLOY_WEBHOOK_URL` is set on the
`main` environment. What remains: push, first deploy, live verification. Decisions 0026/0027 cover
the deploy shape and the installer contract.

## Ownership

| Who | Owns |
| --- | ---- |
| Planner | git operations, CI watch, live verification (read-only HTTP + tmp-HOME install) |
| User | Dokploy app creation, domain `cs.jjuidev.com`, DNS |
| CI | checks → image build+smoke+push (`ghcr.io/jearax/cs:latest`, `:sha-<sha>`) → deploy webhook |

## Steps

### 1. Land the rest (planner)

- Commit the pending `.harness/docs/` edits (session-traps + build-notes additions).
- `git push origin main` — HEAD is the band-UI fix `df37a6b` plus the release commits.
- Watch: `gh run watch` — checks (site+root lint/typecheck/test/build, shellcheck) → image job
  (build, smoke, push ghcr) → deploy job (webhook). All three must be green.

### 2. Dokploy app (user — blocking for go-live, not for push)

- Create a Compose app from `docker/docker-compose.yml` (service `cs-web`, image
  `ghcr.io/jearax/cs:latest`, `pull_policy: always`, network `dokploy-network`, Traefik labels for
  `Host(`cs.jjuidev.com`)` are already in the file).
- Point DNS for `cs.jjuidev.com` at the Dokploy server; certificate is letsencrypt via Traefik
  labels.
- The app's redeploy webhook URL must be the value already stored in `DOKPLOY_WEBHOOK_URL`
  (env `main`) — if the app was created before setting the secret, confirm the stored URL matches
  this app, not another.
- First deploy: either let the push from step 1 trigger it, or press Redeploy once DNS resolves.

### 3. End-to-end verification (planner, after DNS resolves)

Read-only against the live site; the install runs in a throwaway HOME only:

```bash
# Site serves the SPA
curl -fsS https://cs.jjuidev.com/ | head
curl -fsS -o /dev/null -w '%{http_code}\n' https://cs.jjuidev.com/docs/reference

# Release artifacts
curl -fsS https://cs.jjuidev.com/releases/latest/cli.mjs -o /dev/null
curl -fsS https://cs.jjuidev.com/releases/latest/checksums.txt

# Installer, no cache header, tmp HOME
curl -fsS -I https://cs.jjuidev.com/install.sh | grep -i cache-control   # expect no-cache
H=$(mktemp -d); HOME="$H" sh -c 'curl -fsSL https://cs.jjuidev.com/install.sh | sh'
HOME="$H" "$H/.local/bin/cs" --version                                     # expect 0.1.0
```

- Browser pass: home, docs, reference, search palette, light/dark toggle — on desktop and phone
  width.

### 4. Rollback (documented, only if needed)

- Image: deploy a previous `ghcr.io/jearax/cs:sha-<full-sha>` tag by pinning `image:` in the
  Dokploy compose override and redeploying.
- Repo: `git revert` + push — a green push redeploys, same as a forward push.

## Acceptance criteria

1. CI green on main: checks, image, deploy jobs.
2. `https://cs.jjuidev.com/` loads with cs content (orange skin) and `/docs/reference` answers.
3. Installer from the site installs `cs 0.1.0` into a tmp HOME and `--version` prints `0.1.0`.
4. No real `~/.config/cs`, `~/.claude` or real `cs` install was touched during verification.

## Risk & rollback

- First image build in CI is unexercised locally (Docker was down) — if the image job fails, the
  failure is contained before any deploy; fix forward and re-push.
- If the deploy webhook answers non-200, the deploy job fails loudly; the site simply is not live
  yet — retry after the Dokploy app exists.
