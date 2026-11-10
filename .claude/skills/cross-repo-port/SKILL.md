---
name: cross-repo-port
description: Port a file, script or test from another repository into cs, or review such a port. Use when work copies from ../jss-devtools, ../cs-cli or any sibling repo, when a ported shell script needs a test, or when reviewing a diff that was ported rather than written from scratch.
metadata:
  harness-origin: learned
  harness-pinned: 'false'
---

# Port into cs

## When to use

- A file is copied from another repository into this one (`../jss-devtools`, `../cs-cli`).
- A ported shell script needs a test in `tests/`.
- Reviewing a diff that was ported rather than written from scratch.

## Procedure

1. Read the source file in full before writing anything. The source repo's own documentation
   contradicts its code in places — port the code, not the prose. `.harness/docs/cs-cli-feature-inventory.md`
   is the read-only behaviour map of the old `cs-cli`.
2. **Diff the port against the file it replaces, not only against the source.** `git show HEAD:<path>`
   is the old version; the source repo is a different codebase with different guards. The port of
   `scripts/install.sh` dropped the old installer's "a relative install dir must be made absolute"
   guard, so a relative `CS_HOME` produced a shim that broke in every directory but the install one
   while the installer still exited 0.
3. Grep the source product name over every ported surface — the misses hide in yaml tags, fixtures
   and comments, not in the obvious strings.
4. Test a ported shell script from vitest by serving the artifact from a local HTTP server on
   `127.0.0.1`, so the download path is real without the network:

   ```ts
   const server = createServer((request, response) => {
     if (request.url === '/releases/latest/cli.mjs') {
       response.writeHead(200);
       response.end(bundle);
       return;
     }
     response.writeHead(404);
     response.end('not found');
   });
   ```

   `tests/install.test.ts` is the worked example. Drive the script with `sh` and a controlled
   environment (`HOME`, `PATH`, the script's own env vars), and assert observable effects: the exit
   code, stderr, and the files written under a temp HOME. Never assert on the script's internals.

5. Prove a test can fail. Revert the fix in a scratch copy, run the test against it, and confirm it
   fails — a green test that never went red proves nothing.
6. Check the shell script with shellcheck before it reaches CI. When Docker is down, fetch the
   koalaman release tarball to `/tmp` and run the binary directly:

   ```bash
   curl -fsSL -o /tmp/sc.tar.xz https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.darwin.aarch64.tar.xz
   tar -xJf /tmp/sc.tar.xz -C /tmp
   /tmp/shellcheck-v0.11.0/shellcheck --shell=sh scripts/install.sh
   ```

   Use the same version CI pins.

## Pitfalls

- A path a script computes from a user-supplied value must be absolutized before it is written into
  another file. A relative path in a shim resolves against whatever directory the user runs it from.
- A value that ends up in a filesystem path needs two rules, not one character class: the core is
  digits and dots, an optional prerelease suffix is `-` plus alphanumerics. A single blanket rule
  either blocks prereleases or lets `../../` through. Test both directions.
- A checksum file is a cross-agent contract. Match the entry by file name, not by an exact line, and
  accept the layouts `sha256sum` and `shasum` actually emit: `<digest>  cli.mjs`, `<digest>  path/cli.mjs`
  and `<digest> *cli.mjs`.
- A tool's output must not be swallowed by a pipeline: `sha256sum file | cut -d ' ' -f 1` takes
  `cut`'s exit status, so a failing `sha256sum` yields an empty digest and a misleading message.
  Check the tool exists before the download and treat an empty digest as its own error.
- A failure between the first write and the last leaves state behind unless a trap removes it.
  Remove a directory only while it is still empty (`rmdir`), never with `rm -rf` on a path a user
  may own.
- Write a temp file with the PID in its name (`.cs.$$.tmp`) so two concurrent installs do not
  collide, and escape a path before embedding it in a shell script (`\`, `"`, `$` and a backtick).
- `cs --version` prints a banner only on a TTY. A script that parses the version must read it from
  a pipe, or it parses the banner art.
- A ported file may need a companion file in the other repo (`stage-release.mjs` for the installer).
  Confirm the pair agrees by staging a real release and installing from it — a format that only one
  side assumes is a contract nobody wrote down.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

For a ported shell script, also `sh -n <script>` and `shellcheck --shell=sh <script>`, and one
smoke against a tmp `HOME` — never the real one, per `.harness/docs/smoke-temp-home.md`.
