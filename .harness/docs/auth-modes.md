# Auth modes — the url/token/oauthToken matrix

The constraints on a profile's three credential fields, per
[decision 0008](../decisions/0008-token-constraints.md). The user's fallback strategy: one
credential per profile, one profile per auth mode — switching profiles switches the auth mode
Claude Code resolves.

## Allowed

| url | token | oauthToken | Mode                                        | cs writes                                        |
| --- | ----- | ---------- | ------------------------------------------- | ------------------------------------------------ |
| ✓   | ✗     | ✗          | custom endpoint, credentials from elsewhere | `ANTHROPIC_BASE_URL` only                        |
| ✓   | ✓     | ✗          | auth mode — paid API credits                | `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`    |
| ✓   | ✗     | ✓          | oauth + custom endpoint                     | `ANTHROPIC_BASE_URL` + `CLAUDE_CODE_OAUTH_TOKEN` |
| ✗   | ✗     | ✓          | oauth mode — shared team token              | `CLAUDE_CODE_OAUTH_TOKEN` only                   |

## Blocked

| Combination                 | Guard                  | Hint                                         |
| --------------------------- | ---------------------- | -------------------------------------------- |
| `token` without `url`       | `hasTokenWithoutUrl`   | clear with `-t ""` or set `-u <url>`         |
| `token` + `oauthToken` both | `cs config` validation | clear one with `-t ""` or `--oauth-token ""` |

## Notes

- The renderer is tolerant: a hand-edited `cs.json` with both tokens still renders both env keys;
  Claude Code's documented precedence (`ANTHROPIC_AUTH_TOKEN` above `CLAUDE_CODE_OAUTH_TOKEN`)
  decides. The guard lives in `cs config`, not in the renderer.
- Login mode is the empty profile: no credentials, Claude Code falls back to `/login`
  (Remote Control and usage pages need it).
- Real-world verification of each combo (what `/status` shows, whether oauth survives the
  `claude --settings` launcher path) is owned by the user, who tests in real usage.
