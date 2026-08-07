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
4. Refactor with the test as a safety net (REFACTOR) — see [tidy](../tidy/SKILL.md) for what to look for and the discipline around proposing-vs-restructuring. Refactor the test too if its structure has decayed. **Don't skip this step.** Green means the test passes, not that you're done — pause and look at the shape critically before moving on.
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

Two corollaries, both non-negotiable — a fixed delay or a retry hides real bugs:

- **Never a fixed delay.** No `sleep(n)` / `waitForTick(n)`. Poll for the *actual expected state* with a built-in waiter (`waitForDisplayed`/`waitForExist`/`waitForClickable`, or `driver.waitUntil(predicate, {timeout, timeoutMsg})`) and proceed the moment it holds. If a tap flakes right after an animated transition, wait until the element is *stationary* before tapping (`base-screen.clickWhenStable`) — don't sleep. `wait-for-settled.js` is screenshot-timing only, not a functional wait.
- **Never a retry to go green.** Retries are only for genuinely contended *infrastructure* (device/session/network — `recover-session.js`, `dismiss-permission-alert.js`). A retry around functional steps papers over a real defect. If one correctly-awaited action doesn't reach the expected state, diagnose it.

See [fast-iteration](../fast-iteration/SKILL.md) "Flaky tests: poll for state, never delay, never retry-to-go-green" for the acceptance-layer detail and precedents.

## Hard-to-test code is a refactor signal

If the test needs a huge `beforeEach`, five mocks, private fields exposed, or a magic delay because there's no observable signal of "done" — **stop and refactor the production code first.** Pain in the test mirrors structural problems in the code: tangled dependencies, hidden state, missing seams.

Moves that usually help:

- Constructor injection so the test can swap a collaborator.
- Extract a pure function from a method that mixes IO and logic.
- Return a value from a side-effecting method so the assertion is on the return, not internal state.
- Emit a domain event when "done" so the test can `await` it instead of polling.

If still hard *after* a sincere refactor attempt, flag it to the user before plastering over with mocks.

## Don't skip refactor — especially on "small" tasks

The refactor phase needs a human-judgment beat: "would this code surprise a reader in six months?" The risk: when a task is framed as quick/small/no biggy/just a, both sides silently treat tests-pass as done and skip the refactor pass. Structural debt bakes in.

Concrete example: an `.ink`-format parser under `walta-app/app/lib/logic/` was originally generated as "just a 150-line parser, no biggy" — written in one shot, tests passed, shipped. The TDD red/green phases were followed; refactor was silently skipped. Mixed parser/domain concerns, depth-handling leaking into the domain layer, silent fallbacks on missing inputs, no error states tested. Three days later it took ~25 cleanup commits in one focused session to bring it up to standard — short enough that the rewrite was still cheap, long enough that "should we tidy this now?" had already stopped being asked.

When you hear "quick" / "no biggy" / "just a" framing on non-trivial code, treat it as a stop sign:
- Name it back ("the 'quick' framing usually means refactor gets skipped — want to start with one failing test and stop after green to look at the shape?").
- Suggest the minimum first step rather than the whole shape.
- After each green, prompt the user explicitly to look at the code shape *before* moving to the next test.

## Which test layer

Cheapest layer that meaningfully exercises the change:

- **Node unit** (`test/**/*_spec.js`, `npx grunt unit-test-node`) — pure JS, no `Ti.*`. Sub-second feedback. Most defects belong here.
- **Device unit** (`walta-app/app/spec/*_spec.js`) — needs Alloy / `Ti.*`. Runnable in-session via [fast-iteration](../fast-iteration/SKILL.md) (~20–30 s warm) — pick Node over device for genuinely pure-JS logic, never just to dodge a device build.
- **Cucumber acceptance** (`features/`) — cross-screen flows that map to a *business requirement*; keep them business-readable. Slow; use sparingly.
- **Appium E2E** (`end-to-end-testing/`, Mocha+Appium) — extensive, mechanism-heavy full-stack integration that doesn't belong in business language (e.g. sync interrupt/resume across restart/network/foreground). Currently dormant + not in CI — revival tracked in WB-104.

When in doubt, lowest layer that can observe the bug.

## See also

- [docs/testing.md](../../../docs/testing.md) — full test-layer story.
- [docs/device-specs.md](../../../docs/device-specs.md) — device-spec idioms.
- [fast-iteration](../fast-iteration/SKILL.md) — running specs with LiveView.
