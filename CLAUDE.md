# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WALTA (Waterbug App) is a cross-platform mobile app for iOS and Android that enables dichotomous key-based insect identification for water quality monitoring. It is built on the Titanium/Alloy MVC framework.

## Coding Style

See [CODING-STYLE.md](CODING-STYLE.md) for JavaScript conventions — module system per directory, async/await direction, and incremental migration guidance.

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

 - Meaningful code: by writing the code to implement the tests, we are avoiding writing code that isn't strictly necessary, and also this gives us an opportunity to be pragmatic about refactoring rather than speculative.

 - Keeping technical debt in check: by keeping to this rhythm we use our test cases to drive the design of the code and we take the opportunity at every incremental step to refactor.

## Workflow

### Starting a Trello task

When the user asks to start work on a Trello card (e.g. "let's start work on WB-3"):

1. Look up the card details from Trello to understand the requirements.
2. Create a new branch named `task/wb-<N>-<short-slug>`.
3. Once the first commits are ready, create a **draft PR** with:
   - Title: `WB-<N>: <card title>`
   - A link to the Trello card in the PR description
   - A test plan checklist

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
# editing controllers/specs. See TESTING.md § "LiveView (Fast
# Iteration)" for the full story (prerequisites, troubleshooting).
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

Existing pattern docs:
- [docs/toolbar-buttons.md](docs/toolbar-buttons.md) — anchor bar / NavButton pattern
- [docs/device-specs.md](docs/device-specs.md) — device spec idioms, child-controller refs, test pollution
- [docs/viewmodels.md](docs/viewmodels.md) — MVVM convention: ViewModel class shape, `bindView`, semantic palette colours via Symbols

### Patterns & Conventions

**Controller communication:** Controllers communicate via `Topics` (a pub/sub event bus over Ti's global event system — see `lib/ui/Topics.js`). Use `Topics.fireTopicEvent(Topics.SOME_EVENT, payload)` to publish and `Topics.subscribe(Topics.SOME_EVENT, handler)` to listen. Direct function calls are used within a controller; Topics are used across controllers.

**Controller lifecycle:** Controllers receive injected dependencies via `$.args`. Always implement a `cleanUp()` function that unsubscribes Topics listeners and destroys child views — it is called by the navigation system when the screen is unloaded.

**No `Alloy.Globals`:** Don't read or write `Alloy.Globals.*` for shared state — it's a deprecated anti-pattern that makes data flow invisible and tests brittle. Pass shared objects (e.g. the loaded `key` from `walta-taxonomy`) explicitly via `$.args` from parent controllers to children, including sub-controllers created with `Alloy.createController(name, { key, ... })`. The key is threaded from the topmost controller that loads it down through every screen and sub-widget that needs it.

**Photo paths:** Photos taken by users are stored in `Ti.Filesystem.applicationDataDirectory` using relative paths (no leading `/`). Taxonomy reference images are in `Ti.Filesystem.resourcesDirectory` (absolute paths starting `/`). `PhotoUtils.absolutePath()` handles both conventions.

**Ti.App.Properties keys:** Persistent storage uses `Ti.App.Properties.setObject/getObject`. Key names in use: `userAccessTokenLive` (user auth token object), `appAccessTokenLive` (app-level OAuth token object), `userAccessUsername` (logged-in email).

**Toolbar buttons:** Screen-level action buttons (Back, Next, Done, Sync, etc.) belong on the anchor bar, not in the screen body. Pattern: `getAnchorBar().addTool(Alloy.createController("NavButton").getView())`. See [docs/toolbar-buttons.md](docs/toolbar-buttons.md) for the full pattern, accessibilityLabel semantics, and the Appium selector convention.

### Configuration & Environment

**API endpoint switching:** Pass `--app-config=mock|production|development` to grunt to switch API base URLs. The mock config points to a local stub server for offline development.

**Signed Android release builds** require three environment variables set in `Gruntfile.js` (lines 13–21): keystore path, keystore password, and developer profile. These are not in version control — set them locally.

### Key Module Summaries

**`CerdiApi.js`** — HTTP client wrapper for the CERDI backend. Uses a two-token auth model: an app-level OAuth token (`appAccessTokenLive`, obtained via `client_secret`, scoped to `create-users`) and a per-user token (`userAccessTokenLive`, obtained at login). The app token is cached with TTL checking; the user token is stored persistently. All HTTP is done via `Ti.Network.createHTTPClient`. Photos are uploaded as `multipart/form-data`; everything else is JSON.

**`KeyLoader*.js`** — Three loaders for different taxonomy data formats. `KeyLoaderInk.js` is the canonical format going forward (reads compiled Ink JSON). `KeyLoaderXml.js` and `KeyLoaderJson.js` are legacy. The Ink loader walks the compiled Ink runtime graph, evaluating containers and following choice branches to reconstruct the key tree into `Key`, `Question`, and `Taxon` objects. The root Ink container has two top-level branches: `"ALT Key"` (the dichotomous key) and several speedbug indexes (`"Speedbug"`, `"Mayfly Muster Speedbug"`, `"Order Speedbug"`).

**`SampleUploader.js`** — Uploads samples sequentially. For each sample it: submits/updates the sample record, then uploads the site photo, then taxa photos, then unknown creature records (with photos), then deletes any pending-delete unknown creatures. Photos are optimised before upload via `PhotoUtils`: anything over 4 MB is resized to max 1600px wide. On iOS, PNG files are converted to JPEG first (PNG→JPEG reduces memory pressure during resize — a known intermittent corruption issue). A `delay` parameter threads through all upload calls to rate-limit requests.

**`Navigation.js`** — Maintains a history stack of `{ ctl, args }` entries. `openController()` calls `garbageCollectControllers()` first: if the target screen is already in history (matched by controller name + node id), everything above that point is truncated and a `PAGES_UNLOADED` topic is fired. This prevents the user building up loops. If a `SiteDetails` screen is in the truncated range and has unsaved changes, the user is prompted to discard or submit before navigation proceeds. `goBack()` re-opens the second-to-last entry (not a native back gesture — the whole screen is re-rendered).

### Testing Strategy

There are four levels of tests:
1. **Node.js unit tests** (`test/*_spec.js`) — run with Mocha directly, fastest; use these for logic in `lib/logic/` and `lib/util/`
2. **Device unit tests** (`walta-app/app/spec/`) — run on device via Titanium; required when code uses `Ti.*` APIs that cannot be mocked
3. **End-to-end tests** (`end-to-end-testing/`) — Appium-driven
4. **Acceptance/BDD tests** (`features/`) — Cucumber + WebdriverIO (Appium), uses `@only` tag to filter

**Acceptance test environment:** The local dev environment is already provisioned — emulator/simulator, Appium drivers, and the mock CERDI server are configured and ready. Run acceptance tests directly (`npx grunt --platform=android acceptance-test`); don't gate on or caveat about setup.

**Acceptance coverage does not replace device specs.** Every screen-level feature must have a device spec in `walta-app/app/spec/` even if an acceptance test covers the same path. Rationale: acceptance tests are slow integration tests — a single run takes minutes — so they're unsuitable for the tight TDD loop. Device specs run quickly with `--liveview --reuse-server` (see `fast-device-test`), give per-screen test checklists for future work, and pinpoint failures at the controller level rather than at the end of an end-to-end flow. When adding/modifying a screen feature, default to a device spec; add an acceptance scenario only for cross-screen flows.

**Device spec idioms:** [docs/device-specs.md](docs/device-specs.md) covers the things that aren't obvious from reading existing specs — `TestUtils` helpers, how to reach inner views of child controllers (`ctl.childCtl.NavButton.fireEvent("click")`), test pollution between specs (Topics subscribers, `Alloy.Globals.CerdiApi`, `SyncStore` singleton), and `--manual` mode considerations. Read this before adding a new device spec.

**Mocking `Ti.*` in Node.js tests:** The Node.js environment has no Titanium runtime. Mock `Ti.Network.createHTTPClient` by injecting a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical pattern. `mocha-bootstrap.js` is only loaded for on-device tests; do not include it in Node tests.

**Run *both* Node and device suites before pushing changes to `walta-app/app/lib/`.** Modules under `lib/` (viewmodels, util, models, logic) are imported by both Node specs (`test/`) and device specs (`walta-app/app/spec/`). A green device run alone can mask a Node failure — e.g. a `Alloy.CFG.colors.*` reference works under Alloy but throws `ReferenceError: Alloy is not defined` under bare Node. Minimum gate before pushing such a change:

```bash
npx grunt unit-test-node                                           # fast — pure Node, no device
npx grunt --platform=android --simulator unit-test --grep="X"     # device-side coverage
```

If a `lib/` module needs a Titanium runtime global (like `Alloy.CFG`), keep the Titanium reference *out* of the module — pass the runtime value in from the controller. The canonical example is the colour palette: ViewModels return `Palette.error` / `Palette.primary` Symbols from [walta-app/app/lib/util/Palette.js](walta-app/app/lib/util/Palette.js); the controller passes `Alloy.CFG.colors` as `bindView`'s 4th argument; `bindView` resolves the Symbol on render. See [docs/viewmodels.md](docs/viewmodels.md) "Semantic palette colours".

**Known test gaps:** No unit tests exist for controllers, `KeyLoaderInk.js`, `Navigation.js`, or `SampleSync.js`.

### Data Flow

The app loads taxonomy data from `walta-taxonomy/walta/key.ink.json` via `KeyLoaderInk.js`. `CerdiApi.js` handles all remote API communication for sample upload/download and user authentication. `SampleUploader` and `SampleDownloader` orchestrate bi-directional sync, fired by `SampleSync.js` on a timer.
