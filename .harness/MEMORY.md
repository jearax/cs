# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when one exists; longer than a line: write `.harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.

- `cs` (`@jjuidev/cs`) rewrites `cs-cli` (`../cs-cli`) from scratch: behaviour reference only, never copy code — .harness/docs/cs-cli-feature-inventory.md
- Builds with tsdown into one ESM bundle `dist/cli.mjs` (decision 0002); `tsc` only type-checks.
- Herdr ops (cooker dispatch, `/clear` stall, respawn, privacy hook): .harness/docs/herdr-agent-ops.md
- Only the user tests the real environment: smoke with tmp `HOME=$H` and fake tokens — never real `~/.config/cs` or `~/.claude`.
- Smoke chains: export `HOME=$H` once per subshell; never claim real-env state you did not re-read — .harness/docs/smoke-temp-home.md
- `cs use` renders profile files and writes global settings; no `--file` flag, no `cs help`.
- One token per profile: `cs config` rejects both tokens together and `token` without `url` (decision 0008) — .harness/docs/auth-modes.md
- `-h` is help everywhere (decision 0005); unknown args exit 1 "unknown command" (tests/cli.test.ts).
- Site command displays use the help Usage form (`cs config [options]`), not long flag examples — band cards, docs code blocks and hero typed lines alike.
- Tests live in `tests/`; vitest global setup builds the bundle, so green `pnpm test` proves the build. Rules: tests/support/architecture-rules.ts; .harness/docs/code-standards.md
- `scripts/package-info.d.mts` is required (allowJs off, else TS7016). Port jss-devtools code, not its docs prose.
- Profiles live in `~/.config/cs/cs.json` (0600); a profile renders only `profiles/<name>.json` (0013); only `cs alias` creates launchers (0024).
- `cs.json` is schema 1, nothing migrated (0012); save rewrites from the fields cs owns (`toCsConfig`) — hand-added keys are lost.
- Plans live at `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` — the `active/`+`completed/` layout in CLAUDE.md is stale.
- Public repo `github.com/jearax/cs`; install script served at cs.jjuidev.com/install.sh; HTTPS remote, no SSH key. Commits: conventional, no AI attribution.
- Node floor declared 3x (script, engines, site NODE_FLOOR); `--version` must be bare when piped; tsconfig excludes `site/`; no local shellcheck — .harness/docs/build-notes.md
- The installer and the site's Install docs state one contract — change either, update the other (site REQUIREMENTS/Install.tsx track scripts/install.sh).
- Porting into cs: diff against the file it replaces, not only the source repo — .claude/skills/cross-repo-port/SKILL.md
- Banner and rc PATH write need a real TTY: smoke them with a Python pty (cs-command-test skill).
- `CLAUDE_CODE_OAUTH_TOKEN` may be ignored via the `claude --settings` launcher path; verify with `/status` — global-write path unaffected.
- Antislop-code on the pending diff (comments only) before each report, then re-run the gate.
- Reviewing a port: grep the source product name over every ported surface — misses hide in yaml tags and fixtures; verify "clean" claims yourself.
- Decision status, index pipes and doctor secret check have traps — .harness/docs/harness-writing-traps.md
- Agent edit traps: corrupted long writes, `cd` persists, post-move name sweep — .harness/docs/agent-session-traps.md
- Release flow proven end-to-end: push main → CI (checks/image/deploy) → ghcr image → Dokploy webhook → cs.jjuidev.com; verify with tmp-HOME install + `--version` — .harness/docs/build-notes.md
