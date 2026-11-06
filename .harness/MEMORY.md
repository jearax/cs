# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when one exists; longer than a line: write `.harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.

- `cs` (`@jjuidev/cs`) is the from-scratch refactor of `cs-cli` (`../cs-cli`): behaviour reference only, never copy code. Docs: .harness/docs/cs-cli-feature-inventory.md, cs-project-overview.md.
- Builds with tsdown into one ESM bundle `dist/cli.mjs` (decision 0002); `tsc` only type-checks.
- The Herdr cooker (name varies: `cooker-glm`, `cooker-2`; check `herdr agent list`) implements via /ak-cook: dispatch without `--wait`; it pings back `herdr agent prompt <planner-name> "<status>"`.
- `/clear` via `agent prompt` returns `agent_prompt_stalled` — confirm the reset in the viewport before resending; a retry can wipe a session.
- Only the user tests the real environment: planner/cooker smoke with tmp `HOME=$H`, fake tokens — never real `~/.config/cs`, `~/.claude`, or the real `claude` binary.
- Inline `node -e` with profile fields trips the privacy-block hook (it reads `j.env` as a path): use a script file with paths as args.
- `cs use` renders the profile files and writes the global settings; no `--file` flag, no `cs help` command (`helpCommand(false)` in `src/cli.ts`).
- One token per profile: `cs config` rejects both tokens together, and `token` without `url` (decision 0008). See .harness/docs/auth-modes.md.
- `-h` is help everywhere (decision 0005); unknown arguments exit 1 "unknown command" (`tests/cli.test.ts` asserts it).
- Tests live in `tests/`; the vitest global setup builds the bundle, so a green `pnpm test` proves the build. Layout rules: `tests/support/architecture-rules.ts` (one negative fixture per rule); conventions in .harness/docs/code-standards.md.
- `scripts/package-info.d.mts` is required (`allowJs` off, else TS7016). Port jss-devtools code, not its docs prose — they contradict.
- `.prettierignore` excludes `.harness/plans/` and `.agentkit/`; use `pnpm lint:fix` instead of `pnpm format` when only source changed.
- Profiles live in `~/.config/cs/cs.json` (0600) under the key `profiles`; a profile renders only `profiles/<name>.json` (decision 0013); only `cs alias` creates launchers (decision 0011).
- `cs.json` is schema 1, nothing migrated — old shape kept at `cs.json.corrupt` (decision 0012); rewritten from the fields cs owns (`toCsConfig`), so hand-added keys are lost on save.
- Plans live at `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` — the `active/`+`completed/` layout in CLAUDE.md is stale, do not follow it.
- Public repo `github.com/jearax/cs` (curl install at `scripts/install.sh`); HTTPS remote — no SSH key here. Commits: conventional, no AI attribution.
- Banner and rc PATH write need a real TTY: smoke them with a Python pty (cs-command-test skill).
- `CLAUDE_CODE_OAUTH_TOKEN` may be ignored via the `claude --settings` launcher path; verify with `/status` — the global-write path is unaffected.
- Antislop-code on the pending diff (comments only) before each report, then re-run the gate.
- The `harness doctor` secret check also fires on prose: a token field shown with an assigned literal, even an empty one. Describe the value in words, then re-run doctor.
- Superseding a decision: set the old file's `status` too; the session hook reads frontmatter, not the index.
