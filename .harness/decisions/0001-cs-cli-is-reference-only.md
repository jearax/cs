---
id: 0001
title: Only port a cs-cli workflow after the user names it
status: Accepted
date: 2026-11-03
supersedes: none
---

# 0001: Only port a cs-cli workflow after the user names it

## Context

`cs` is a new CLI. `cs-cli` (at `../cs-cli`, outside this repository) exists only as a behavioural
reference; `cs` is not a 1:1 replacement for it. The user intends `cs` to update some of the
existing workflows, but which workflows is still open and was deliberately deferred to a later
discussion.

## Decision

Do not treat `cs-cli` behaviour as a compatibility contract, and do not port a workflow into `cs`
on your own judgement. Ask the user which workflow to update, then implement that one.

> "CLI mới, cs-cli chỉ là tham chiếu, cs update 1 số workflow, thảo luận với tôi sau." (user,
> 2026-11-03)

## Options considered

| Option                                   | Consequence                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Port cs-cli feature by feature           | Keeps parity but freezes cs's design on a reference the user does not want to copy |
| Update only the workflows the user names | Each change is a deliberate choice; the set stays open until the user decides      |

## Consequences

- Easier: `cs` can diverge from `cs-cli` wherever the user wants different behaviour.
- Harder: there is no default answer for "what should this command do" — the reference gives a
  hint, not the answer.
- Enforced by: review only.
