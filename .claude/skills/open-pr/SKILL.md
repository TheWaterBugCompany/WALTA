---
name: open-pr
description: Open a draft PR for a WALTA `task/wb-<N>-...` branch. Load when the user asks to open the PR, or after the first meaningful commits land.
user-invocable: true
allowed-tools:
  - Bash
  - Read
---

# Opening a draft PR (WALTA)

Open as soon as the first *meaningful* commits land on a `task/wb-<N>-<short-slug>` branch — earlier review beats a polished one-shot. The PR stays draft while you push more commits.

## Pre-flight checks

1. **Branch name** — `git branch --show-current` should be `task/wb-<N>-<slug>`. If not, stop and ask.
2. **Side-quest scan** — run `git diff main...HEAD` and check: *is every change something the Trello card asks for?* Drive-by build fixes, refactors, or unrelated improvements should split onto their own branch before opening this PR. Up-front splits cost minutes; after-the-fact splits cost an hour. See CLAUDE.md "One PR = one responsibility".
3. **One automated suite passes** — minimum bar. Pick whatever applies (`npx grunt unit-test-node`, `npx grunt build-test`, or device specs via [fast-iteration](../fast-iteration/SKILL.md)).
4. **Staged files are intentional** — `git status` shouldn't surprise you. Stage by name; never `git add -A` (memory: `feedback_git_add`).

## Gather inputs

Before calling `gh pr create` you need:

- `<N>` — Trello card number
- Card title verbatim
- Trello `shortLink` from the card URL (`https://trello.com/c/<shortLink>/<N>-<slug>`)
- One-sentence scope of *this* PR (not necessarily the whole card)
- Summary bullets — lead each with the *why*, since the diff shows the what

If any of these aren't already in conversation context, **ask the user** — don't guess at card titles or shortLinks.

## Create the PR

Title: `WB-<N>: <card title>` — under 70 characters, mirror the Trello card title verbatim.

```bash
gh pr create --draft --title "WB-<N>: <card title>" --body "$(cat <<'EOF'
## Summary
- <one bullet per meaningful change; lead with the why>
- <mention drive-by fixes not in the card so reviewers aren't surprised>

First slice of [Trello WB-<N>](https://trello.com/c/<shortLink>/<N>-<slug>) — <one-sentence scope>. <Note any deferred work from the card.>

## Test plan
- [x] `npx grunt unit-test-node` — passes
- [ ] `npx grunt build-test` — passes
- [ ] Visual check on Android emulator
- [ ] Visual check on iOS simulator
- [ ] Acceptance / integration tests (only if behaviour-relevant)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

`--draft` is non-negotiable for `task/wb-<N>-...` branches. Mark ready-for-review later with `gh pr ready` once CI is green.

Return the PR URL after creating, so the user can review.

## Marking ready-for-review

When the test plan is fully green:

1. Re-uncheck items in the PR description, re-run, re-check. Keeps the checklist honest.
2. `gh pr ready` — or click "Ready for review" in the GitHub UI.

## See also

- [docs/pull-requests.md](../../docs/pull-requests.md) — full template reference.
- [CLAUDE.md](../../CLAUDE.md) workflow section — task-branch naming and one-PR-one-responsibility rule.
