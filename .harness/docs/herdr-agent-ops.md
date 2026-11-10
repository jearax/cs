# Herdr agent ops

Traps for driving cookers and planners through Herdr.

- Cookers implement via /ak-cook: dispatch without `--wait`; they ping back
  `herdr agent prompt <planner-name> "<status>"`. Extra cookers spawn via `pane run` of a cs
  alias launcher + `agent rename`. Parallel plans split by file ownership.
- `/clear` via `agent prompt` returns `agent_prompt_stalled` — confirm the reset in the viewport
  before resending; a retry can wipe a session.
- Respawning a dead cooker: `/exit`, close pane, rename replacement (the name frees only at
  exit); diff `git status` vs plan ownership first — an untouched boundary means a clean restart.
- Inline `node -e` with profile fields trips the privacy-block hook (it reads `j.env` as a
  path): use a script file with paths as args.
