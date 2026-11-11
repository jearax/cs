# Smoke with a temp HOME

Only the user tests the real environment. Bundle smoke runs use a temp `HOME`.

## The trap

In a `&&` smoke chain, the per-command prefix `HOME=$H` must appear on **every**
invocation. The command that misses it silently reads and writes the real `~/.config/cs` — the
smoke itself can create, remove, or rewrite state the user owns, while the agent infers "net zero"
from a single `cs list` output.

## The rules

1. **Export once**: run the whole chain inside a subshell that exports `HOME=$H` first
   (`H=$(mktemp -d); export HOME=$H; node dist/cli.mjs …`), or prefix every invocation.
2. **Never claim real-env state you did not re-read**: one command's stdout is not re-reading —
   state claims need a fresh read of the actual files, or stay unclaimed.

## Verification

A leak already happened once; cleanup belongs to the user. After any smoke, the only safe claim
about the real environment is one backed by a fresh read — which itself must not run against the
real HOME without the user asking for it.

## TTY-only output

The banner and the rc PATH write need a real TTY: smoke them through a Python pty with a window
size set (`TIOCSWINSZ`), because `isInteractive` also demands `stdout.columns > 0` — see the
`cs-command-test` skill. macOS `cat` has no `-A`; inspect bytes with `od -c`.

## Guard `H` before every smoke run

An empty `HOME` makes `os.homedir()` return `''`, so cs resolves `.config/cs` against the current
directory: a failed `H=$(...)` once wrote a stray `.config/cs/cs.json` into the repo root. Check
`git status` for a root `.config/` after any smoke. Assert it first: `case "$H" in "$S"/home.*) ;; *) exit 1;; esac`.
Two shell traps produced an empty `H` here: `ls` is aliased to `eza` (`ls -td` fails; use
`command ls`), and zsh does not word-split `$c`, so `node cli.mjs $c` gets `use work` as one
argument (use `${=c}` or an array).
