# @jjuidev/cs

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
