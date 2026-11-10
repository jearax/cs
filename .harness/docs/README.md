# Docs

Knowledge longer than one line of [`../MEMORY.md`](../MEMORY.md). Pick the template from
[`../templates/README.md`](../templates/README.md).

| Doc                                                          | Kind      | Summary                                                                                   |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| [cs-project-overview.md](./cs-project-overview.md)           | overview  | Product intent, confirmed boundaries, terminology                                         |
| [cs-cli-feature-inventory.md](./cs-cli-feature-inventory.md) | reference | Behaviour map of the old `cs-cli` (read-only reference)                                   |
| [code-standards.md](./code-standards.md)                     | standards | Layout, import, exit-code, testing and tooling conventions the architecture test enforces |
| [auth-modes.md](./auth-modes.md)                             | reference | The url/token/oauthToken constraint matrix per profile (decision 0008)                    |
| [harness-writing-traps.md](./harness-writing-traps.md)       | topic     | Decision status/index traps and the doctor secret check                                   |
| [smoke-temp-home.md](./smoke-temp-home.md)                   | topic     | Smoke chains must carry HOME=$H on every invocation; real-env claims need a fresh read    |

- [agent-session-traps.md](agent-session-traps.md) — corrupted long writes; `cd` persists across Bash calls.
- [herdr-agent-ops.md](herdr-agent-ops.md) — cooker dispatch, /clear stall, respawn, privacy hook.
- [build-notes.md](build-notes.md) — Node floor copies, --version parsing, tsconfig excludes site/, shellcheck.
