---
title: "Landing site for cs (port from jss-devtools)"
description: "Port the jss-devtools landing site into cs/site with the jjuidev design system, a Signal Orange skin, cs-only content from real smoke output, and the full CI → ghcr → Dokploy deploy chain for cs.jjuidev.com."
status: pending
priority: P1
effort: 2-3 days
issue: none
branch: main
decision: none
created: 2026-11-10
---

# Plan: cs landing site (xia --port from jss-devtools)

## Source manifest (xia phase 1)

| Item | Value |
| ---- | ----- |
| Source repo | `/Users/tandm/Documents/jearax/npm/jss-devtools` @ `8d68349` (main) — MIT, same owner |
| Design system repo | `/Users/tandm/Documents/jearax/dokploy/design-system` @ `949cb89`; packages `react`/`styles` both `0.0.1` |
| Scoped source paths | `site/` (whole project), `.github/workflows/ci.yml`, `docker/`, `ci/smoke-site-image.sh`, `scripts/stage-release.mjs`, root `package.json` scripts, `.prettierignore` |
| Target | this repo, new `site/` dir + root wiring + CI + docker. Version shown: root `package.json` `0.1.0` (injected at build via `__CLI_VERSION__`) |

Reference (read-only, behaviour map): live site `https://jss-devtools.jjuidev.com/` if a visual check helps.

## Accepted decisions (user, 2026-11-10)

1. **Full deploy port**: CI builds the site image, pushes to `ghcr.io/jearax/cs`, `docker/docker-compose.yml` targets `Host(`cs.jjuidev.com`)` on the Dokploy network. The domain does not exist yet — port anyway; the user creates it later. Install command on the site becomes `curl -fsSL https://cs.jjuidev.com/install.sh | sh` (the image serves `scripts/install.sh`).
2. **Skin**: new skin `cs` — Signal Orange primary scale, mean hue ≈ 45, built with the documented luminance-preserving OKLCH rotation so the design system's contrast contract holds exactly (method documented in `site/src/styles/skins/jss-devtools.css` header in the source repo). Secondary: quiet warm-grey companion. Neutral: warm ink, not a copy of jss-devtools graphite.

## Product facts the content must state (from README + `.harness/docs/`)

- `cs` = "Claude code switch". Switches Claude Code between API providers and model sets through named profiles in `~/.config/cs/cs.json` (0600).
- Delivery is dual: `cs use` writes `~/.claude/settings.json` (global) AND renders `~/.config/cs/profiles/<name>.json`; only `cs alias` creates `claude-<name>` launchers. Same renderer for both.
- **macOS-first** (not Linux/WSL like jss-devtools). Node `>= 24.11.0`.
- Commands (9): `config`, `use`, `current`, `list`(`ls`), `remove`(`rm`), `reset`, `env`, `alias <name> <profile>`, `alias remove|rm <alias...>`.
- Auth modes: one token per profile — `token`+`url` or `oauthToken`, mutually exclusive (decision 0008, `.harness/docs/auth-modes.md`).
- Source: `https://github.com/jearax/cs`. Install from source today: `curl -fsSL https://raw.githubusercontent.com/jearax/cs/main/scripts/install.sh | sh`.

## Changes

| File / dir | Action |
| ---------- | ------ |
| `site/` | NEW — port of jss-devtools `site/`: own `package.json` (`@jjuidev/cs-site`, version `0.1.0`, MIT), own lockfile, vite/tsconfig/eslint/stylelint/vitest configs, `vite/tailwind-auto-reference.plugin.ts`, `vendor/` tarballs copied as-is from source (`@jjuidev/react` + `@jjuidev/styles` 0.0.1), `public/`, `index.html` (pre-paint script writes `data-skin='cs'`) |
| `site/src/styles/skins/` | NEW `cs.skin.ts` + `cs.css` (Signal Orange); delete the jss-devtools skin pair |
| `site/src/constants/` | REWRITE for cs: `cli.constant.ts` (name/version/install/platform/requirements), `commands.constant.ts` (9 commands), `theme.constant.ts` (port as-is), `routes.constant.ts`, `search-index.constant.ts`, `search.constant.ts`, `snippets.constant.ts`, `transcripts.constant.ts` (real smoke output — see Safety), drop `harness.constant.ts` |
| `site/src/pages/Home/` | ADAPT: Hero (cs tagline, install command, version 0.1.0), CommandsBand (cs commands), repository section → "what lands on your machine": `~/.config/cs/cs.json`, `~/.config/cs/profiles/<name>.json`, `~/.claude/settings.json`, `claude-<name>` launchers; `ClaudeCodeScreen` + `FileTree` adapted to cs artifacts |
| `site/src/pages/Docs/` | ADAPT: keep `GettingStarted`, `Install`, `Reference` (all 9 commands + config flag table + auth modes from `.harness/docs/auth-modes.md`); DROP `Doctor`, `Harness`, `Init` pages (no cs equivalent) and their routes/sidebar/search entries |
| `site/src/components/`, `site/src/main.tsx`, `site/src/styles/styles.css` | PORT as-is (they are product-agnostic: Layout, CodeBlock, Terminal, SearchPalette, WindowChrome, …); only skin id and product strings change |
| `package.json` | ADD `build:site` script (`pnpm --dir site build`), like source root |
| `.gitignore` / `.prettierignore` | ADD site ignores per source repo conventions |
| `scripts/stage-release.mjs` | NEW — port as-is (checksum contract with the installer) |
| `docker/` | NEW — `Dockerfile`, `nginx.conf`, `docker-compose.yml`; image `ghcr.io/jearax/cs`, container `cs-web`, `Host(`cs.jjuidev.com`)` |
| `ci/smoke-site-image.sh` | NEW — port, retarget names/domain |
| `.github/workflows/ci.yml` | EXTEND to the source shape (pinned SHAs): checks job adds site install/lint/typecheck/test + chromium, shellcheck installer, bundle artifact; image job builds+smokes+pushes `ghcr.io/jearax/cs`; deploy job triggers Dokploy webhook (`DOKPLOY_WEBHOOK_URL` secret, `main` environment) |

**Out of scope — owned by plan `261110-1454-installer-from-site` (cooker-cs, runs in parallel):** `scripts/install.sh` itself, its tests, and the README install section. This plan only *serves* `scripts/install.sh` (docker COPY) and shellchecks it (CI); it never edits it. Do not edit `README.md`.

## Steps

1. Scaffold `site/` from source: configs, vendor tarballs, public, index.html, main.tsx, components, styles.css. Delete jss-devtools skin; create `cs` skin (compute the orange scale with a throwaway `colorjs.io` script holding each step's OKLCH L and C, rotating hue to 45; secondary/neutral per accepted decision 2).
2. Rewrite constants with cs product facts; capture REAL CLI output for `transcripts.constant.ts` and hero/terminal mocks first (see Safety).
3. Adapt pages: Home (hero/commands/artifact tree), Docs (GettingStarted/Install/Reference), NotFound; drop Doctor/Harness/Init everywhere (routes, sidebar, search index, pager).
4. Root wiring: `build:site`, ignores, `scripts/stage-release.mjs`.
5. Deploy chain: `docker/`, `ci/smoke-site-image.sh`, CI workflow extension.
6. Full validation (below), antislop-code on the pending diff, report.

## Safety (hard constraints)

- **Never run `cs` against the real environment.** Always a tmp `HOME=$H` with fake tokens, per `.harness/docs/smoke-temp-home.md`. Never read the user's real `~/.config/cs/cs.json` (real tokens) or `~/.claude/settings.json`. Every bundle invocation in one subshell with `HOME=$H` exported once.
- Do not touch `src/`, `tests/`, or any CLI behaviour. The CLI is production for the user.
- Site tests run in Chromium (Vitest Browser Mode) — port the setup; local run needs `pnpm --dir site exec playwright install chromium`.
- Do not invent CLI output. Every transcript/snippet on the site comes from a real smoke run or the README.

## Validation

```bash
pnpm --dir site install
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
pnpm lint && pnpm typecheck && pnpm test && pnpm build
node scripts/stage-release.mjs dist/cli.mjs    # stages release/cli.mjs + checksums.txt
```

- Optional if Docker is up locally: `docker build -f docker/Dockerfile .` then run `ci/smoke-site-image.sh` against it.
- Manual: `pnpm --dir site dev`, check Home/Docs/Reference render cs content with the orange skin in light+dark.
- CI secrets `DOKPLOY_WEBHOOK_URL` + `main` environment are NOT set yet — flag this in the report as a user follow-up; the deploy job must fail loudly (as the source does) until configured.

## Dependency matrix (xia phase 2, summary)

| Source component | Local equivalent | Status |
| ---------------- | ---------------- | ------ |
| `@jjuidev/react` + `@jjuidev/styles` vendor 0.0.1 | copy tarballs | EXISTS (same version) |
| Skin `jss-devtools` | skin `cs` (Signal Orange) | NEW |
| Docs pages Doctor/Harness/Init | none | DROP |
| jss-devtools facts/constants | cs facts | REWRITE |
| Harness file-tree section | cs on-disk artifacts | REWRITE |
| CI/deploy chain | none in cs (minimal ci.yml) | NEW |

## Risk & rollback

- **Medium.** Everything is additive (`site/`, `docker/`, `ci/`, one script, CI extension, README line). CLI code untouched.
- Site Chromium tests + image build add CI minutes (source: ~20 min image job) — accepted, mirrors source.
- Rollback: revert the commits; `site/` deletion removes the feature wholesale.
- The domain not existing yet means the site's install URL 404s until the user deploys — accepted by decision.
