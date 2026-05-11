---
name: tdd
description: TDD discipline for WALTA — every behavioural change starts with a failing test at the right layer (Node unit, device unit, cucumber, Appium). Load for any development work. Skip only for non-behavioural edits like typos, formatting, comment-only changes.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Test-first development (WALTA)

Every behavioural change starts with a failing test.

## TDD rhythm

1. Pick the smallest behavioural change you can make next.
2. Write a *single* failing test that pins that behaviour (RED). Run it; confirm it fails for the right reason.
3. Write the minimal production code to pass (GREEN).
4. Refactor with the test as a safety net (REFACTOR). Refactor the test too if its structure has decayed.
5. Repeat.

One observable behaviour per test (or per cucumber scenario). Multiple assertions in one `it` hide which behaviour broke.

## Test behaviour, not implementation

Assert on what an outside observer sees — rendered text, persisted state, what a downstream caller gets back. Don't reach past the public surface.

```js
// Good — outcome the user / next caller sees
expect(ctl.logText.value).to.equal("starting upload\nrate limit hit");
expect(viewModel.percent).to.equal(45);
expect(await repo.query({ facility: "sync" })).to.have.length(2);

// Bad — implementation details
expect(spy.calledWith(...))                 // a *call* happened
expect(obj._privateField).to.equal(...)     // private state
```

If the test breaks every time you rename or reorganise, it's coupled to structure not behaviour. At cucumber / Appium layers the same rule reads: assert on visible screen state, not which method fired.

## Socialised tests, not mocks

Default to running real collaborators end-to-end. Mock only when the real thing is genuinely impractical:

- **Mock**: slow networks (`CerdiApi`), third-party services, hardware effects, the system clock when timing actually matters.
- **Don't mock**: pure utilities (`Logger`, `Topics`, `Palette`), in-memory stores you can swap for a test instance (e.g. `makeTestLogRepository()` builds a fresh sqlite-backed repo against an isolated db file), other view-models, controllers under test.

If you reach for `sinon.stub(...)`, first check: can you swap in a real lightweight version? Can you inject a *fake* (small in-memory implementation)? Only if both answers are no — and then keep the mock at the IO boundary, not in the middle of the domain.

## No hardcoded delays — poll for the actual state

`waitForTick(400)` (or `setTimeout(..., 400)`) is almost always wrong: flakes on slow machines, wastes time when state was ready in 20ms. Use `waitFor` from [TestUtils.js](../../../walta-app/app/spec/util/TestUtils.js) — polls every 50ms up to a 5s ceiling and rejects with a clear error:

```js
// Wrong — arbitrary delay
await waitForTick(400)();
expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(0);

// Right — polls the actual condition
await waitFor(() => ctl.logScroll.contentOffset.y > 0);
expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(0);
```

For events, prefer event-driven helpers (`waitForTopic`, `waitForBackboneEvent`, `windowOpenTest`). For cucumber / Appium, use the framework's wait-for-selector helpers, not `await sleep(...)`.

## Hard-to-test code is a refactor signal

If the test needs a huge `beforeEach`, five mocks, private fields exposed, or a magic delay because there's no observable signal of "done" — **stop and refactor the production code first.** Pain in the test mirrors structural problems in the code: tangled dependencies, hidden state, missing seams.

Moves that usually help:

- Constructor injection so the test can swap a collaborator.
- Extract a pure function from a method that mixes IO and logic.
- Return a value from a side-effecting method so the assertion is on the return, not internal state.
- Emit a domain event when "done" so the test can `await` it instead of polling.

If still hard *after* a sincere refactor attempt, flag it to the user before plastering over with mocks.

## Which test layer

Cheapest layer that meaningfully exercises the change:

- **Node unit** (`test/**/*_spec.js`, `npx grunt unit-test-node`) — pure JS, no `Ti.*`. Sub-second feedback. Most defects belong here.
- **Device unit** (`walta-app/app/spec/*_spec.js`) — needs Alloy / `Ti.*`. Drive with [fast-iteration](../fast-iteration/SKILL.md).
- **Cucumber** (`features/`) — cross-screen user flows. Slow; use sparingly.
- **Appium** (`end-to-end-testing/`) — full-stack smoke. Reserve for golden-path checks.

When in doubt, lowest layer that can observe the bug.

## See also

- [docs/testing.md](../../../docs/testing.md) — full test-layer story.
- [docs/device-specs.md](../../../docs/device-specs.md) — device-spec idioms.
- [fast-iteration](../fast-iteration/SKILL.md) — running specs with LiveView.
