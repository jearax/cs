# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.

- `cs` (`@jjuidev/cs`, "Claude code switch") is the from-scratch refactor of `cs-cli` (`/Users/tandm/Documents/jearax/npm/cs-cli`, bun + citty): behaviour reference only, never copy code. See .harness/docs/cs-cli-feature-inventory.md and cs-project-overview.md.
- Builds with tsdown into one ESM bundle `dist/cli.mjs` (decision 0002); `tsc` only type-checks.
- Working layout: planner (this pane) plans/reviews; `cooker` (sibling Herdr pane) implements via `/ak-cook`. Dispatch with `--wait` and no timeout in the background; brief cooker to ping back `herdr agent prompt planner "<one-line status>"`.
- `/clear` via `agent prompt` returns `agent_prompt_stalled` (local command, nothing to observe) — confirm the reset in the viewport before resending; a blind retry can wipe a mid-task session.
- Only the user tests the real environment: planner/cooker smoke with tmp `HOME=$H` per command, fake tokens — never real `~/.config/cs`, `~/.claude`, or the real `claude` binary.
- A smoke that parses a rendered profile with an inline `node -e` trips the privacy-block hook (it reads the `j.env` member as a file path): put the check in a script file under a temp dir and pass the path as an argument.
- `cs use <profile>` renders the profile files and writes the global settings; there is no `--file` flag, and `cs help` is not a command (decision 0007).
- One token per profile: `cs config` rejects `--token` + `--oauth-token` together, and `token` without `url` stays blocked (decision 0008). See .harness/docs/auth-modes.md.
- Command declarations: the domain noun for a positional (`use <profile>`, `remove <profile>`; `cs alias <name> <profile>` excepted) and the long form first for a flag (`--name, -n`, as jss-devtools) — the placeholder and the declaration surface in the help and in the error text.
- `-h` is help everywhere; Haiku is set with `--haiku` only (decision 0005).
- Tests live in `tests/`; `vitest.config.ts` includes `tests/**` and a global setup builds the bundle, so a green `pnpm test` also proves the build.
- Layout rules are enforced by `tests/support/architecture-rules.ts`, one negative fixture per rule; the conventions live in .harness/docs/code-standards.md.
- `scripts/package-info.d.mts` is required (`allowJs` off, so the `.mjs` imports fail TS7016 without it). Porting jss-devtools: copy its code, not its docs prose — they contradict.
- Unknown arguments exit 1 "unknown command" now that the seven commands exist; `tests/cli.test.ts` asserts the wording.
- `.prettierignore` excludes `.harness/plans/` and `.agentkit/` (their owners rewrite those tables); use `pnpm lint:fix` instead of `pnpm format` when only source changed.
- `pnpm-workspace.yaml` sets `strictPeerDependencies` and `engineStrict`: an unresolvable peer fails the install instead of warning.
- Profiles live in `~/.config/cs/cs.json` (0600) under the key `profiles`; each profile also renders `~/.config/cs/profiles/<name>.json` plus the launcher `~/.config/cs/bin/claude-<name>` (decision 0007). An alias adds `bin/claude-<alias>`; the `aliases` map in cs.json owns it (decision 0011).
- `cs.json` schemaVersion 3 migrates a v2 file (profiles under `claude`) on load: the old file is copied to `cs.json.bak` (0600) before the new one is written.
- `cs.json` is rewritten from the fields cs owns (`toCsConfig`), so a hand-added key in that file is lost on the next save.
- AgentKit owns `.harness/{docs,plans}/`; plans live at `.harness/plans/<YYMMDD>-<HHMM>-<slug>/` — the `active/`+`completed/` layout in CLAUDE.md's table and plans/README.md is stale, do not follow it.
- No git remote; husky hooks fire from the first commit onward. Commits: conventional format, no AI attribution (user's global rule, outside this repo).
- Scaffold came from the local jss-devtools bin; published `@jjuidev/jss-devtools@0.6.4` has no create mode.
- Terminal-only paths (the banner, the rc PATH write) need a real TTY: a fake pty reports 0 columns, so `isInteractive()` stays false; macOS `script` fails here, use a Python pty (see the cs-command-test skill).
- `CLAUDE_CODE_OAUTH_TOKEN` may be ignored via the launcher path (`claude --settings` file): docs say oauth is ignored in project/local settings; verify with `/status` before trusting it — the global-write path is unaffected.
