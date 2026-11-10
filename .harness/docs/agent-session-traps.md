# Agent session traps

Traps hit while an agent edits this repository in bulk.

## Long writes can arrive corrupted

A long heredoc or Write call can land corrupted mid-stream: duplicated lines, injected typos
(`skeet`, `--c1olor`), stray scaffold text. Hit twice while porting the landing site (plan
261110-1447).

- After bulk writes, `pnpm typecheck` and grep for expected markers before moving on.
- Recover by re-copying the file from its source (or the upstream repo) and re-applying small
  edits; do not hand-patch a corrupted block.

## `cd` carries across Bash calls

The shell cwd persists between calls. After `cd site`, relative writes that were meant for the
repo root landed as `site/docker/`, `site/ci/` and `site/scripts/`.

- Write repo-root files with absolute paths, or reset with `cd /Users/tandm/Documents/jearax/npm/cs`.

## Verify the moved tree, not the working copy

After a port, the final string sweep must run over the files' final locations and the whole
changed tree. The landing-site port grepped only `site/src` for the old product name while
`docker/` and `ci/` were still misplaced under `site/`; the move-up skipped a re-grep and left
`ghcr.io/jearax/jss-devtools` and `docker tag jss-devtools-site:ci` in the deploy path — caught
only at review. Sweep `.github/`, `ci/`, `docker/`, `site/src/` (and anything copied) for the
old names, image refs and tags once everything is in place.

## Privacy hook on inline node

Inline `node -e` whose source mentions profile fields trips the privacy-block hook (it reads
`j.env` as a path). Put the code in a script file and pass paths as arguments.

## Prettier rewraps before string replaces

`pnpm format` rewraps JSX and prose, so a multi-line string replace anchored on text written
before the last format run silently misses. For anything longer than one stable line, Read the
file and Edit against the current bytes.

## ghost-proc-guard blocks the planner's kill

While any dev server the session started is still listening, the ghost-proc-guard hook rejects
Bash calls that touch those processes — even a plain `kill` of leaked fixture servers. Route the
cleanup to the cooker that started them (its `/procs` command owns the list) instead of killing
from the planner pane.

## A busy dev-server port is a stop, not a prompt

Starting a dev server on a taken port is blocked by the ghost-proc-guard. Reuse the running
server — vite HMR picks up source edits, so the existing process serves the new code — or stop
it only if this session started it; a foreign session's server needs the user's say-so.
