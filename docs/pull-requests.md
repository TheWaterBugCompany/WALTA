# Pull request template

Open a **draft PR** as soon as the first meaningful commits land on a `task/wb-<N>-<short-slug>` branch — earlier review beats a polished one-shot. Push as you go; reviewers can follow along on GitHub.

## Title

`WB-<N>: <card title>`

Mirror the Trello card title verbatim. Keep it under 70 characters; details belong in the body.

## Body

```markdown
## Summary
- One bullet per meaningful change. Lead with the *why*; the diff shows the what.
- Mention any drive-by fixes that aren't in the card so reviewers aren't surprised.

First slice of [Trello WB-<N>](https://trello.com/c/<shortLink>/<N>-<slug>) — <one-sentence scope>. <Note any deferred work from the card.>

## Test plan
- [x] `npx grunt unit-test-node` — passes
- [ ] `npx grunt build-test` — passes
- [ ] Visual check on Android emulator
- [ ] Visual check on iOS simulator
- [ ] Acceptance / integration tests (only if behaviour-relevant)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Section notes

### Trello reference

Always link back to the card. Use the canonical URL from the Trello board (`https://trello.com/c/<shortLink>/<N>-<slug>`) — short URLs work too but the slug helps reviewers grok the scope at a glance.

### Description of changes

Bullet list. Each bullet should answer "why" first; the diff is the source of truth for "what". Drive-by fixes (e.g. unblocking a build path while doing the main work) get their own bullet so they're not buried.

### Test plan

Checklist of what was run and what still needs running. Mark items `[x]` as you verify them; reviewers can see at a glance what's covered and what's outstanding. Include the actual command (`npx grunt unit-test-node`) so anyone can reproduce.

The minimum bar: at least one automated suite must pass before requesting review.
