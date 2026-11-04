# Decisions

User decisions that later work must follow: the only product policy in this repository. Write one
from [`../templates/decision.md`](../templates/decision.md).

| #    | Title                                                                                      | Status             | Date       |
| ---- | ------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| 0001 | Only port a cs-cli workflow after the user names it                                        | Accepted           | 2026-11-03 |
| 0002 | Packaging and runtime floor follow jss-devtools conventions                                | Accepted           | 2026-11-03 |
| 0003 | Core layout, role suffixes, exit codes and the @/ alias follow jss-devtools                | Accepted           | 2026-11-03 |
| 0004 | Global write stays the default; --settings files and claude-<profile> launchers are opt-in | Superseded by 0007 | 2026-11-03 |
| 0005 | -h means help on every command; flags lose their old cs-cli short forms                    | Accepted           | 2026-11-03 |
| 0006 | cs is "@jjuidev/cs", "Claude code switch", with the jss-devtools-style banner              | Accepted           | 2026-11-03 |
| 0007 | Command surface v2: no --file, no help command, list/ls, key `profiles`, oauthToken        | Superseded by 0008 | 2026-11-03 |
| 0008 | One token per profile — token and oauthToken are mutually exclusive                        | Accepted           | 2026-11-03 |
| 0009 | cs appends a marked PATH export to the user's shell rc automatically                       | Superseded by 0010 | 2026-11-04 |
| 0010 | cs appends a marked PATH export to the user's shell rc; the marker names the tool only     | Accepted           | 2026-11-04 |
| 0011 | Role aliases — cs alias <name> <profile> re-points a launcher with one command             | Accepted           | 2026-11-04 |
| 0012 | Schema re-baselined to 1 — the migration chain is removed from the code                    | Accepted           | 2026-11-04 |
| 0013 | Only aliases create launchers — profiles render artifacts only                             | Accepted           | 2026-11-04 |
