# @jjuidev/cs

## 0.2.2

### Patch Changes

- 7838ffc: Show the ASCII banner on `cs --help` and `cs <command> --help`; citty printed usage without it.

## 0.2.1

### Patch Changes

- bf941a6: Fix profile env set via `cs env` being overwritten or deleted when `cs config` changes a model. The `[1m]` env (`CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`) is now a default computed on `cs use`; global and profile env override it.
  - One-time `cs.json` migration removes the `[1m]` values older versions wrote into profile env (a copy is kept at `cs.json.bak`). A deliberately set `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` is removed too; set it again with `cs env` if needed.
  - Profiles with empty URL and token now write `"disableClaudeAiConnectors": true`; `cs` removes it on switch only if it added it.
  - `cs config` rejects a token without a URL; `cs use` validates the profile name.
  - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` is no longer added to global env by default. Existing values are kept; remove with `cs env` → Global → Unset.

## 0.2.0

### Minor Changes

- 95bf684: Release Fable model support under a minor version. `cs config --fable`, `ANTHROPIC_DEFAULT_FABLE_MODEL`, and `ANTHROPIC_DEFAULT_MODEL` are additive features; 0.1.7 shipped them as a patch, which understated the change.

## 0.1.7

### Patch Changes

- a3ce4b0: Add Fable model support (`cs config --fable`, `ANTHROPIC_DEFAULT_FABLE_MODEL`) and write `ANTHROPIC_DEFAULT_MODEL` from the profile's Sonnet value. Fable also participates in `[1m]` context detection. Adds a README with the full CLI reference.
- f09db7c: Update default profile: empty base URL, bump Sonnet to `claude-sonnet-5` and Opus to `claude-opus-5`.

## 0.1.6

### Patch Changes

- 3a8388a: Remove `EMPTY_TOKEN_PLACEHOLDER` logic — token now writes empty string `''` directly instead of a dummy value.

## 0.1.5

### Patch Changes

- Fix: cs use now removes env from previous profile when switching. mergeClaudeSettings now uses sync semantics (replaces env block) instead of merge, so old profile env keys are cleared.

## 0.1.4

### Patch Changes

- Fix: cs use now removes stale CLAUDE_CODE_AUTO_COMPACT_WINDOW when profile has no [1m] suffix.

## 0.1.4-alpha.0

### Patch Changes

- cs-cli simplification: drop OpenCode sync, drop auth command, drop cross-os env. Add cs env command, auto-detect 1m model suffix.

## 0.1.2

### Patch Changes

- 4649ab4: Fix and clean

## 0.1.1

### Patch Changes

- c176d8a: Update commands

## 0.1.0

### Minor Changes

- 712b4b1: Add commands auth, integrated ai.jjuidev.com

### Patch Changes

- 712b4b1: Update command cs use

## 0.0.9

### Patch Changes

- 90f5505: Update ci

## 0.0.8

### Patch Changes

- 8405244: Update can be set token is empty

## 0.0.7

### Patch Changes

- de9faf4: Release

## 0.0.2

### Patch Changes

- 9d47fda: Release cs CLI command
