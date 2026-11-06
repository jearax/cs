# Decisions

User decisions that later work must follow: the only product policy in this repository. Write one
from [`../templates/decision.md`](../templates/decision.md).

| #    | Title                                                                                          | Status             | Date       |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| 0001 | Only port a cs-cli workflow after the user names it                                            | Accepted           | 2026-11-03 |
| 0002 | Packaging and runtime floor follow jss-devtools conventions                                    | Accepted           | 2026-11-03 |
| 0003 | Core layout, role suffixes, exit codes and the @/ alias follow jss-devtools                    | Accepted           | 2026-11-03 |
| 0004 | Global write stays the default; --settings files and claude-<profile> launchers are opt-in     | Superseded by 0007 | 2026-11-03 |
| 0005 | -h means help on every command; flags lose their old cs-cli short forms                        | Accepted           | 2026-11-03 |
| 0006 | cs is "@jjuidev/cs", "Claude code switch", with the jss-devtools-style banner                  | Accepted           | 2026-11-03 |
| 0007 | Command surface v2: no --file, no help command, list/ls, key `profiles`, oauthToken            | Superseded by 0008 | 2026-11-03 |
| 0008 | One token per profile — token and oauthToken are mutually exclusive                            | Accepted           | 2026-11-03 |
| 0009 | cs appends a marked PATH export to the user's shell rc automatically                           | Superseded by 0010 | 2026-11-04 |
| 0010 | cs appends a marked PATH export to the user's shell rc; the marker names the tool only         | Accepted           | 2026-11-04 |
| 0011 | Role aliases — cs alias <name> <profile> re-points a launcher with one command                 | Accepted           | 2026-11-04 |
| 0012 | Schema re-baselined to 1 — the migration chain is removed from the code                        | Accepted           | 2026-11-04 |
| 0013 | Only aliases create launchers — profiles render artifacts only                                 | Accepted           | 2026-11-04 |
| 0014 | The profile name `claude` auto-seeds from the default record when missing, and stays removable | Superseded by 0015 | 2026-11-04 |
| 0015 | Creating a profile fills unspecified fields from the default record (function default params)  | Accepted           | 2026-11-04 |
| 0016 | Env keys render in alphabetical order — profile artifact and global write alike                | Superseded by 0018 | 2026-11-04 |
| 0017 | Suggestion UX: clack autocomplete for env keys and a curated models catalog                    | Superseded by 0019 | 2026-11-04 |
| 0018 | Env keys render in an explicit semantic order, unknown keys appended alphabetically            | Accepted           | 2026-11-04 |
| 0019 | The models catalog is removed — model IDs are provider-specific and drift                      | Accepted           | 2026-11-04 |
| 0020 | cs config show on a missing name creates the profile with creation defaults — for every name   | Accepted           | 2026-11-04 |
| 0021 | A corrupt settings.json is refused with an error, never overwritten                            | Accepted           | 2026-11-04 |
| 0022 | GitHub Actions CI runs lint, typecheck and test on push and pull requests                      | Accepted           | 2026-11-04 |
| 0023 | cs list shows default first, then profiles A→Z; aliases A→Z                                    | Accepted           | 2026-11-06 |
