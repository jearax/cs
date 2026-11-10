# Cooker report — cs landing site (plan 261110-1447)

Status: DONE (plan accepted after planner review round 2; commit deferred until the installer plan 261110-1454 finishes, then reviewer merges)

## Review round 2 fixes (planner-verified)

- `docker/docker-compose.yml:7` — image was still `ghcr.io/jearax/jss-devtools:latest`; now `ghcr.io/jearax/cs:latest`.
- `.github/workflows/ci.yml:131-132` — `docker tag` used `jss-devtools-site:ci` while the build tagged `cs-site:ci`; now `cs-site:ci`.
- `Terminal.test.tsx` fixtures used `jss-devtools doctor/init`; now `cs current`/`cs list`. Also cleaned three `"jss"` JSON fixtures in `highlight.test.ts` and `CodeBlock.test.tsx`.
- Post-fix: `grep jss-devtools` over `.github/ ci/ docker/ site/src/` is clean; site tests 109/109 green.

## Follow-up: installer rewrite (2026-11-10, planner request)

The parallel installer plan replaced the clone-based installer with a download-based one
(`cli.mjs` + `checksums.txt` from `cs.jjuidev.com/releases/latest`, sha256 verify, no git/pnpm).
Site copy updated to match `scripts/install.sh`: `REQUIREMENTS` (Node, curl/wget, sha256sum/shasum,
PATH) and the Install page (download+verify description, `~/.cs/<version>/cli.mjs` +
`~/.local/bin/cs` shim, `CS_BASE_URL`/`CS_HOME`/`CS_BIN_DIR` env table, uninstall, from-source).
Site lint/typecheck/tests green (109/109).

## Follow-up: commands band UI (2026-11-10, planner request)

CommandsBand shows exactly three cards (config, use, alias) via a new `BAND_COMMANDS` constant in
`feature.constant.ts` (FEATURES keeps all eight). Added a centered "All nine commands" outline-style
link to `/docs/reference` under the row. `@jjuidev/react` exports `Button` only as a `<button>`
(variants module not exported), so the link carries the outline recipe's own token utilities in the
CSS module instead of a restyled one-off. Heading unchanged. Verified on the dev server: light,
dark and 390px mobile (no horizontal scroll); screenshots in the plan dir `screens/`. Site tests
112/112 (new CommandsBand.test.tsx), lint + typecheck green.

## What changed

- `site/` — full port of jss-devtools `site/` (configs, vendor tarballs 0.0.1, public, vite plugin) with:
  - Skin `cs` (Signal Orange, mean hue 45; secondary warm grey chroma ≤0.008; neutral warm ink chroma ≤0.010) built with the luminance-preserving OKLCH rotation from the source skin; contrast contract untouched (status scales inherited). `cs.css` + `cs.skin.ts` + browser-mode skin test; jss-devtools skin pair deleted.
  - Constants rewritten for cs: `cli` (install command `https://cs.jjuidev.com/install.sh`, macOS-first, Node >= 24.11.0), `commands` (8 entries covering all 9 README rows — `alias` carries `alias remove` in its details), `reference` (8 `cs config` options, auth-mode matrix per decision 0008, exit codes 0/1, on-disk artifacts), `routes` (getting-started / install / reference), `search-index`, `search` (`cs:search-open`), `transcripts`. `harness.constant.ts` and `snippets.constant.ts` deleted (their only consumers were the dropped pages).
  - Transcripts are REAL smoke output: captured from `dist/cli.mjs` in a temp HOME (`cs-site-smoke2-*`) with fake tokens, `FORCE_COLOR=1` via pty: config (token), config (oauth), use, current, list (with `[rendered]` marks and aliases), alias `claude-work work`, remove. On-disk artifacts (cs.json shape, `profiles/<name>.json`, `~/.claude/settings.json`) read from the same temp HOME. The tmp-dir path in the alias output was trimmed to `~/.config/cs/bin/...`; nothing invented.
  - Home adapted: hero "Switch providers. / Keep your profiles.", 4-tab terminal (config/use/current + Claude Code screen adapted to a profile session), commands band (8 cards, one icon each), file tree = `~/.config/cs` + `~/.claude` artifacts from the real smoke run.
  - Docs: GettingStarted / Install / Reference rewritten for cs (Reference carries the config flag table, the url/token/oauthToken matrix and the four on-disk artifacts). Doctor/Harness/Init pages, their routes, search-index sections and pager entries dropped. NotFound updated.
  - All component/browser tests adapted; no jss-devtools string remains under `site/src`.
- Root: `pnpm build:site`; `.gitignore` (+`.vitest/`, `release/`, `!site/vendor/*.tgz`), `.prettierignore` (+`site/dist/`, `site/pnpm-lock.yaml`); `scripts/stage-release.mjs` ported as-is; `docker/` (Dockerfile/nginx/compose → `cs-web`, `Host(\`cs.jjuidev.com\`)`); `ci/smoke-site-image.sh`; `.github/workflows/ci.yml` ported to the source shape with pinned SHAs (checks incl. site install/lint/typecheck/test + Chromium and shellcheck; image job → `ghcr.io/jearax/cs`; deploy job → Dokploy webhook).

## How I checked

- `pnpm --dir site install` — ok.
- `site`: lint, typecheck, test (109 passed, Chromium browser mode; `playwright install chromium` run locally), build — all green.
- Root: lint, typecheck, test (274 passed), build, `pnpm build:site` — all green.
- `node scripts/stage-release.mjs dist/cli.mjs` — stages `release/cli.mjs` + `checksums.txt`.
- `sh -n ci/smoke-site-image.sh` — syntax ok (no local shellcheck; CI covers it).
- Smoke runs used a temp HOME per `.harness/docs/smoke-temp-home.md`; the real `~/.config/cs` was never read or written.
- antislop-code reviewed on the diff (comments only); no edits needed.

## Not checked / concerns

1. **Docker is down locally** — `docker/Dockerfile` build and `ci/smoke-site-image.sh` were not run; CI validates them. My smoke script checks routes only and deliberately does not execute `scripts/install.sh` (that CLI's env-var contract belongs to plan 261110-1454; the source script ran the installer — this is the one ported behaviour I narrowed).
2. **CI secrets**: `DOKPLOY_WEBHOOK_URL` + the `main` environment are not set — the deploy job will fail loudly (by design, as the source does) until configured. Follow-up for the user.
3. **Domain `cs.jjuidev.com` does not exist yet** (accepted by decision) — the site's install URL 404s until deploy.
4. `cs docs` has 3 pages instead of the source's 6; sidebar/breadcrumbs/pager/search adapted and covered by tests.
5. The parallel cooker owns `scripts/install.sh`, `tests/install.test.ts`, `README.md` — untouched. Note the Dockerfile COPYs `scripts/install.sh` and CI shellchecks it, so those steps pass only once that plan lands.
