---
"@jjuidev/cs": minor
---

`cs config` no longer merges the official default profile into the profile you are editing: a new profile starts blank and only the flags you pass are set. Omitting `--fable` now mirrors `--opus`. The `default` profile seed moves to `https://api.anthropic.com` with the Claude 5.5 model line at 1M context.
