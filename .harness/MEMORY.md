# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when one exists; longer than a line: write `.harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.

- `cs` rewrites `cs-cli` from scratch, never copying code; its behaviour lives in .harness/docs/cs-cli-feature-inventory.md (no checkout beside cs).
- Builds with tsdown into one ESM bundle `dist/cli.mjs` (decision 0002); `tsc` only type-checks.
- Herdr planner/cooker ops and traps — .harness/docs/herdr-agent-ops.md
- Smoke only in a tmp `HOME=$H` with fake tokens, never the real `~/.config/cs`/`~/.claude`; TTY-only output needs a sized pty — .harness/docs/smoke-temp-home.md
- `cs use` renders profile files and writes global settings; no `--file` flag, no `cs help`.
- One token per profile: `cs config` rejects both tokens together and `token` without `url` (decision 0008) — .harness/docs/auth-modes.md
- `-h` is help everywhere (decision 0005); unknown args exit 1 "unknown command" (tests/cli.test.ts).
- Tests live in `tests/`; vitest global setup builds the bundle, so green `pnpm test` proves the build. Rules: tests/support/architecture-rules.ts; .harness/docs/code-standards.md
- `scripts/package-info.d.mts` is required (allowJs off, else TS7016).
- Profiles live in `~/.config/cs/cs.json` (0600); a profile renders only `profiles/<name>.json` (0013); only `cs alias` creates launchers (0024).
- `cs.json` is schema 1, nothing migrated (0012); save rewrites from the fields cs owns (`toCsConfig`) — hand-added keys are lost.
- Plans: `.harness/plans/<YYMMDD>-<HHMM>-<slug>/`.
- Public repo `github.com/jearax/cs`; install script served at cs.jjuidev.com/install.sh; HTTPS remote, no SSH key. Commits: conventional, no AI attribution.
- Node floor declared 3x (script, engines, site NODE_FLOOR); `--version` must be bare when piped; tsconfig excludes `site/`; no local shellcheck — .harness/docs/build-notes.md
- Porting into cs or reviewing a port: .claude/skills/cross-repo-port/SKILL.md
- `CLAUDE_CODE_OAUTH_TOKEN` may be ignored via the `claude --settings` launcher path; verify with `/status` — global-write path unaffected.
- Antislop-code on the pending diff (comments only) before each report, then re-run the gate.
- Decision status, index pipes and doctor secret check have traps — .harness/docs/harness-writing-traps.md
- Agent edit traps: corrupted long writes, `cd` persists, post-move name sweep — .harness/docs/agent-session-traps.md
- Release: push main → CI → ghcr image → Dokploy webhook → cs.jjuidev.com; verify with a tmp-HOME install + `--version`.
- Site hero: transcripts are verbatim captures, Terminal animation and test traps — .harness/docs/site-terminal.md
- Site vitest browser: `renderHook` is awaited; `act` is a method on its result, not an export.
- Change together: `scripts/install.sh` + site Install docs (REQUIREMENTS, Install.tsx); README command table + `site/src/constants/commands.constant.ts` (docs Reference, home features).
