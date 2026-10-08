---
"@jjuidev/cs": patch
---

Fix profile env set via `cs env` being overwritten or deleted when `cs config` changes a model. The `[1m]` env (`CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`) is now a default computed on `cs use`; global and profile env override it.

- One-time `cs.json` migration removes the `[1m]` values older versions wrote into profile env (a copy is kept at `cs.json.bak`). A deliberately set `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` is removed too; set it again with `cs env` if needed.
- Profiles with empty URL and token now write `"disableClaudeAiConnectors": true`; `cs` removes it on switch only if it added it.
- `cs config` rejects a token without a URL; `cs use` validates the profile name.
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` is no longer added to global env by default. Existing values are kept; remove with `cs env` → Global → Unset.
