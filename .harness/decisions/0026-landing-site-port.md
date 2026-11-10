---
id: 0026
title: cs ships a landing site ported from jss-devtools, deployed at cs.jjuidev.com
status: Accepted
date: 2026-11-10
supersedes: none
---

# 0026: cs ships a landing site ported from jss-devtools, deployed at cs.jjuidev.com

## Context

cs had no landing site. jss-devtools already has one (`site/` project, jjuidev design system,
CI-built image on ghcr, Dokploy/Traefik deploy). The user asked to port it for cs with cs-only
content and a distinct skin, and confirmed the full deploy chain and domain.

## Decision

The landing site lives in `site/` as its own project using the jjuidev design system vendor
tarballs, with a `cs` skin (Signal Orange primary, mean hue ≈ 45) instead of jss-devtools' teal.
Content states cs facts only. Deploy mirrors jss-devtools: CI builds and pushes the image to
`ghcr.io/jearax/cs`; Dokploy serves it at `cs.jjuidev.com`. The domain does not exist yet; port
anyway, it is created later.

> "Về infar, cs sẽ deploy giống như jss-devtools, tôi sẽ deploy nó trên site cs.jjuidev.com (hiện tại chưa có) nên bạn cứ port theo." (user, 2026-11-10)

> "có thể define 1 skin color khác cho cs sinh động để không giống 100% màu của jss-devtools" (user, 2026-11-10; hue chosen as Signal Orange ~45 in follow-up)

## Options considered

| Option                     | Consequence                                             |
| -------------------------- | ------------------------------------------------------- |
| Full port + cs.jjuidev.com | Chosen: one deploy pattern across the jjuidev CLIs      |
| Site + CI build only       | Rejected: deploy would be reworked once the domain came |
| Site project only, no CI   | Rejected: leaves the site untested in CI                |

## Consequences

- Easier: same image/nginx/compose shape as jss-devtools; `DOKPLOY_WEBHOOK_URL` and the `main`
  environment must be configured on GitHub before the deploy job can succeed.
- Harder: site Chromium tests add CI minutes; the install URL 404s until the domain is live.
- Enforced by: CI workflow + `ci/smoke-site-image.sh`; plan `261110-1447-cs-landing-site`.
