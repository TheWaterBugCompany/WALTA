# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WALTA (Waterbug App) is a cross-platform mobile app for iOS and Android that enables dichotomous key-based insect identification for water quality monitoring. It is built on the Titanium/Alloy MVC framework.

## Coding Style

See [docs/coding-style.md](docs/coding-style.md) for JavaScript conventions — module system per directory, async/await direction, and incremental migration guidance.

## Methodology

Folloing as test driven development philsophy, as Kent Beck intended, here is the breakdown:

1. Break up the changes into small increments, strongly prefer small commits that focus on one small change at a time.

2. Find an appropriate type of test to write that covers the change, for example if this is adding a new feature and write a cucumber test, if this change is better tested at a unit test level, then add a unit test. (Be pragmatic about writing tests).

3. Write a test to verify the new code, this shouldn't test the entire feature comphrensively upfront, but it should be a minimal failing test that tests just the incremental chagne we are adding. (RED)

4. Write the minimal amount of code to get the tests to pass. (GREEN)

5. Once the tests are passing take a step back and do refactoring phase: refactoring should be small steps to tidy the code, again make this pragmatic the code doesn't have to be perfect, but this is important to stop tech debt accruing. (REFACTOR)

6. Don't forget to refactor tests if they need it.

7. Once everything is green we can begin the next micro iteration: beginning from step 3 (RED) and adding a new failing test.

8. Continue the RED/GREEN/REFACTOR until the feature is complete.

### Rationale

The intention is to encourage the following:

 - Meaningful tests: the goal is not code coverage metrics but test quality. A good test tells you *what* broke and *where* — not just that something failed. Ask: if this test fails in 6 months, will it point me directly at the problem? Coverage is a byproduct of good tests, not a target in itself.

 - Test behaviour, not implementation: prefer socialised tests — real collaborators running together, asserting on observable outcomes (rendered text, scroll position, persisted state, what the user would see). Mockist testing (mock every collaborator, assert on internal method calls) makes tests pass while the real code breaks and couples tests to implementation details so refactors become painful. Mock only when a real collaborator is genuinely impractical: slow (CerdiApi/network), unstable (third-party services), or has hard-to-isolate side effects (filesystem, shared sqlite). For everything else (Logger, Topics, pure utilities, in-memory stores) use the real thing — outcome-level assertions take slightly more setup effort but survive refactors and catch real bugs.

 - Meaningful code: by writing the code to implement the tests, we are avoiding writing code that isn't strictly necessary, and also this gives us an opportunity to be pragmatic about refactoring rather than speculative.

 - Keeping technical debt in check: by keeping to this rhythm we use our test cases to drive the design of the code and we take the opportunity at every incremental step to refactor.

## Workflow

### Starting a Trello task

When the user asks to start work on a Trello card (e.g. "let's start work on WB-3"):

1. Look up the card details from Trello to understand the requirements.
2. Create a new branch named `task/wb-<N>-<short-slug>`.
3. Once the first commits are ready, create a **draft PR** following the template in [docs/pull-requests.md](docs/pull-requests.md).

### Iterating on a draft PR

Once the draft PR exists, commit and push directly to the task branch as work progresses — review happens on the PR's Files Changed view, not by showing diffs in chat. This applies to `task/wb-<N>-...` branches only; direct commits to `main`, force pushes, and history rewrites still need explicit approval.

### One PR = one responsibility

If unrelated work surfaces while you're in the middle of a task — a build fix, a small refactor, an improvement to a different module, a new methodology rule — open a separate task branch and PR for it, merge that independently, and rebase the in-progress branch on top. Don't bundle side quests into the main PR. They turn a focused, mergeable change into a sprawling pile that's hard to review, hard to revert, and where one flaky test in the side quest delays the main work. Splitting after the fact is significant overhead (rebasing, multiple PR descriptions, CI re-runs); splitting up front is ~free.

## Commands

### Setup

```bash
brew install node@20
brew install ios-deploy
brew install libimobiledevice
npm install
npx appium driver install xcuitest
npx appium driver install uiautomator2
```

The following environment variables must be set before building (add to your shell profile):

```bash
export GOOGLE_MAPS_API_KEY="<android maps api key>"   # Required for all builds — injected into tiapp.xml from tiapp.xml.template
export KEYSTORE="<path to keystore>"                  # Required for Android release builds
export KEYSTORE_PASSWORD="<keystore password>"
export KEYSTORE_SUBKEY="<keystore alias>"
```

> `tiapp.xml` is not committed — it is generated at build time by `injectSecrets()` in the Gruntfile from `tiapp.xml.template`.

### Build

```bash
npx grunt --platform=android debug
npx grunt --platform=ios debug
npx grunt --platform=android clean release
npx grunt --platform=ios clean release
npx grunt --platform=android preview   # Live development with fast iteration

# Add --simulator to target the emulator/iOS simulator instead of a device.
# Add --reset to wipe Ti.App.Properties / sqlite before launch (handy when a
# stale auth token from a prior session is poisoning login).
npx grunt --platform=ios --simulator --reset debug
```

### Test

```bash
# Node.js unit tests (fastest)
npx grunt unit-test-node

# Device unit tests (requires connected device)
npx grunt --platform=android unit-test
npx grunt --platform=ios unit-test

# Simulator/emulator unit tests (no physical device required)
npx grunt --platform=android --simulator unit-test
npx grunt --platform=ios --simulator unit-test

# Fast on-device iteration: LiveView + reuse-server skips the rebuild
# step on subsequent runs. Use this for tight feedback loops while
# editing controllers/specs. See docs/testing.md § "LiveView (fast
# iteration)" for the full story (prerequisites, troubleshooting).
npx grunt --platform=android --simulator --liveview --reuse-server unit-test

# End-to-end and acceptance tests
npx grunt --platform=android end-to-end-test
npx grunt --platform=android acceptance-test
npx grunt --platform=android visual-regression-test
```

To run a single test, add `.only` to the describe block in the spec file:
```javascript
describe.only("My test", function() { ... });
```

### Device Logging

```bash
adb logcat -s "TiAPI:*"   # Android
```

## Architecture

### Framework

- **Titanium SDK** with **Alloy MVC** — views are XML (`.xml`), styles are TSS (`.tss`), controllers are JS
- Single codebase compiles to both iOS and Android; platform-specific code lives in `lib/android/` and `lib/ios/`

### Key Directories

- `walta-app/app/controllers/` — 40+ UI controllers
- `walta-app/app/lib/logic/` — Business logic: `CerdiApi.js` (API client), `KeyLoader*.js` (taxonomy loading), `SampleUploader/Downloader.js` (sync)
- `walta-app/app/lib/util/` — Shared utilities (Logger, PhotoUtils, etc.)
- `walta-app/app/assets/` — Static assets and taxonomy data
- `walta-taxonomy/walta/` — Compiled taxonomy files (`key.json`, `key.ink.json`)
- `test/` — Node.js unit test specs (`*_spec.js`)
- `features/` — Cucumber BDD acceptance tests
- `end-to-end-testing/` — Appium integration tests

### Documentation maintenance

The `docs/` folder holds pattern references that this CLAUDE.md links to. **When you rediscover something** — a non-obvious pattern, a gotcha that bit you, a convention that wasn't clear from reading existing code — add it to the relevant doc (or create a new one and link it from here). Aim short and specific: a one-liner with a code example beats a paragraph. The test for "is this worth writing down?" is *would the next session save time if it could find this?*

**Architectural narrative goes in `docs/`, not in source-file headers.** If a comment is more than a couple of lines explaining *why this pattern exists* or *how this module fits into the broader design*, it belongs in a `docs/` page (existing or new). Leave a one-line pointer in the source — e.g. `// see docs/patterns/viewmodels.md "Semantic palette colours"`. Reasons: code-level comments rot when the design moves; long blocks bloat the file and bury the actual code; the same explanation usually applies to multiple files, and `docs/` lets it live in one place. Inline comments are still right for the local *why* — a hidden constraint, a workaround for a specific bug, a non-obvious invariant — anything that wouldn't make sense outside the surrounding code.

**Treat every comment as a code smell.** A comment usually signals that the code itself can't make its point — and the right response is normally to refactor (better names, smaller functions, clearer structure), not to paper over the smell with prose. Noise comments are worse than missing ones: they dilute the signal so that the few comments worth reading get lost. So: try refactoring first; only keep a comment when there's an irreducible WHY (a hidden constraint, a non-obvious workaround). Don't paraphrase what the code already says, don't narrate the change you're making, don't recap the bug you just fixed — that context belongs in the commit message. Commits don't rot; code comments do.

All technical docs live in `docs/` (only `README.md`, `CLAUDE.md`, and `CONTRIBUTORS.md` stay at the repo root):

- [docs/installation.md](docs/installation.md) — full setup guide: prerequisites, Titanium SDK, Android/iOS signing, env vars, API config
- [docs/coding-style.md](docs/coding-style.md) — JS conventions: module system per directory, async/await direction
- [docs/architecture-vision.md](docs/architecture-vision.md) — long-term architectural direction
- [docs/testing.md](docs/testing.md) — five test layers, when to write what, LiveView fast-iteration, run-both-suites rule, known gaps
- [docs/device-specs.md](docs/device-specs.md) — writing device specs: idioms, child-controller refs, test pollution, `--manual` cleanup
- [docs/pull-requests.md](docs/pull-requests.md) — PR template: title format, Trello link, screenshots policy, test plan checklist
- [docs/patterns/](docs/patterns/) — one file per pattern / module summary (controller patterns, ViewModels, toolbar buttons, `CerdiApi`, `KeyLoader*`, `SampleUploader`, `Navigation`, …). See [docs/patterns/README.md](docs/patterns/README.md) for the index.

### Configuration & Environment

**API endpoint switching:** Pass `--app-config=mock|production|development` to grunt to switch API base URLs. The mock config points to a local stub server for offline development.

**Signed Android release builds** require three environment variables set in `Gruntfile.js` (lines 13–21): keystore path, keystore password, and developer profile. These are not in version control — set them locally.

### Data Flow

The app loads taxonomy data from `walta-taxonomy/walta/key.ink.json` via `KeyLoaderInk.js`. `CerdiApi.js` handles all remote API communication for sample upload/download and user authentication. `SampleUploader` and `SampleDownloader` orchestrate bi-directional sync, fired by `SampleSync.js` on a timer.
