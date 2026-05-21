# Testing

Test infrastructure for the WALTA project — what each layer is for, when to write at which layer, and how to drive each runner. For device-spec idioms specifically (TestUtils, child-controller refs, test pollution, `--manual` mode), see [device-specs.md](device-specs.md).

## Test layers

Five layers, ordered fastest to slowest:

| Level | Directory | Runner | When to use |
|-------|-----------|--------|-------------|
| Node.js unit tests | `test/*_spec.js` | Mocha (Node) | Logic in `lib/logic/` and `lib/util/` that doesn't use `Ti.*` APIs |
| Build utility tests | `build-tests/unit/*.js` | Mocha (Node, ESM) | Build tools, launchers, hooks |
| Device unit tests | `walta-app/app/spec/*_spec.js` | ti-mocha (on-device) | Code that depends on `Ti.*` APIs or Alloy controllers |
| End-to-end tests | `end-to-end-testing/*.js` | Mocha + Appium | Extensive, mechanism-heavy full-stack integration — developer-oriented flows that would clutter a business-readable scenario |
| Acceptance tests | `features/*.feature` | Cucumber + WebdriverIO | Business-readable BDD tied to a product requirement; kept high-level |

## When to write what

**Default to a Node unit test** for logic in `lib/logic/` and `lib/util/`. They're the fast TDD loop.

**Default to a device spec** for screen-level features. Every screen feature must have a device spec under `walta-app/app/spec/`, even if an acceptance test covers the same path. Rationale: acceptance tests are slow integration tests — a single run takes minutes — so they're unsuitable for the tight TDD loop. Device specs run quickly with `--liveview --reuse-server` (see the `fast-iteration` skill), give per-screen test checklists for future work, and pinpoint failures at the controller level rather than at the end of an end-to-end flow.

**Add an acceptance scenario** (`features/`, Cucumber) for a cross-screen flow that maps to a *business requirement* — it should read like a spec a non-developer could follow. Keep the mechanism out: no "kill the app mid-sync, toggle the network, assert N rows" plumbing.

**Drop to an end-to-end test** (`end-to-end-testing/`, Mocha + Appium) for extensive, mechanism-heavy full-stack integration that doesn't belong in business language — e.g. interrupting a sync mid-flight and asserting it resumes after app restart / network restore / foreground. The two layers are deliberately split: `features/` answers "does the product meet the requirement?", `end-to-end-testing/` answers "does this mechanism hold up under real-stack conditions?".

> **Note (2026-05):** the end-to-end layer is currently dormant — only a back-button smoke test, and no CI job runs the `end-to-end-test` grunt task (it appears in `ci.yml` only as a `changes` path-filter). Reviving the harness, wiring it into CI, and adding the sync interrupt/resume suite is tracked in **WB-104**. Until then, prefer device specs for mechanism coverage and don't add low-level integration mechanics to `features/`.

## Quick reference

```bash
# Node.js unit tests (fastest, no device needed)
npx grunt unit-test-node

# Build utility tests
npx grunt build-test

# Device unit tests (requires connected device or simulator)
npx grunt --platform=android unit-test
npx grunt --platform=ios unit-test
npx grunt --platform=android --simulator unit-test
npx grunt --platform=ios --simulator unit-test

# End-to-end tests
npx grunt --platform=android end-to-end-test

# Acceptance tests
npx grunt --platform=android acceptance-test

# Contract tests (API contract verification)
npx grunt contract-test

# Visual regression tests
npx grunt --platform=android visual-regression-test
```

## Shared Appium orchestration

The end-to-end suite (`end-to-end-testing/`) and the cucumber acceptance suite
(`features/`) drive the same app the same way, so the shared orchestration lives
once in [features/support/appium-world.js](../features/support/appium-world.js):
starting the mock CERDI server, computing launch args, per-platform app
preparation, the between-test reset, and teardown. Both runners' hooks
(`end-to-end-testing/setup.js` Mocha root hooks, `features/support/cucumber.js`
cucumber hooks) call into it and set the same globals (`global.launcher`,
`global.driver`, `global.mockCerdiServer`, `global.platform`,
`global.isSimulator`) that the step and test files read.

The mock server's override URL and secret reach the app as launch args (Android
intent extras / iOS process arguments — see `alloy.js` + `AppiumLauncher`), so
any build can be redirected to the mock without rebuilding. The server must be
running before the app launches, because auto-login hits `/token/create` at boot.

## Acceptance test environment

The local dev environment is already provisioned — emulator/simulator, Appium drivers, and the mock CERDI server are configured and ready. Run acceptance tests directly; don't gate on or caveat about setup.

## Running a single test

**Mocha tests** (Node.js unit, build, end-to-end, contract): add `.only` to a `describe` or `it` block:

```javascript
describe.only("My module", function() {
  it("does the thing", function() { ... });
});
```

**Device unit tests** (`walta-app/app/spec/`): same `.only` approach, or use `--grep="..."` (see [LiveView § Runtime Test Config](#runtime-test-config---grep-and---manual)) to filter without editing the file.

**Acceptance tests** (Cucumber features): pass `--grep="<scenario name>"` (regex against the `Scenario:` text) to filter without editing the file:

```bash
npx grunt --platform=ios --simulator --grep="Log in with existing account" acceptance-test
```

`--grep` maps to cucumber-js's `--name` flag. Use `--cucumber-tags=<expr>` if you want to filter by tag instead (defaults to `not @skip`).

## Run *both* Node and device suites before pushing changes to `walta-app/app/lib/`

Modules under `lib/` (viewmodels, util, models, logic) are imported by both Node specs (`test/`) and device specs (`walta-app/app/spec/`). A green device run alone can mask a Node failure — e.g. an `Alloy.CFG.colors.*` reference works under Alloy but throws `ReferenceError: Alloy is not defined` under bare Node. Minimum gate before pushing such a change:

```bash
npx grunt unit-test-node                                        # fast — pure Node, no device
npx grunt --platform=android --simulator unit-test --grep="X"  # device-side coverage
```

## `lib/` modules and Titanium runtime globals

If a `lib/` module needs a Titanium runtime global (like `Alloy.CFG`), keep the Titanium reference *out* of the module — pass the runtime value in from the controller.

The canonical example is the colour palette: ViewModels return `Palette.error` / `Palette.primary` Symbols from [walta-app/app/lib/util/Palette.js](../walta-app/app/lib/util/Palette.js); the controller passes `Alloy.CFG.colors` as `bindView`'s 4th argument; `bindView` resolves the Symbol on render. See [patterns/viewmodels.md](patterns/viewmodels.md) "Semantic palette colours".

## LiveView (fast iteration)

LiveView uses a Vite-based dev server to serve JavaScript to the device at runtime. Instead of rebuilding and reinstalling the entire app for every code change, the device fetches JS modules from the dev server over the network.

### Prerequisites

- **Android**: device connected via USB (adb handles networking).
- **iOS**: device connected via USB **and** on the same WiFi network as the Mac (the device needs to reach the Vite server over the network).

### Basic usage

```bash
# Start fresh server, build app, install, and run tests
npx grunt --platform=android --liveview unit-test
npx grunt --platform=ios --liveview unit-test
```

On the first run, `ti serve` builds the app with LiveView support and starts the Vite dev server on port 8323. The app is then installed and launched on the device.

### Fast iteration with `--reuse-server`

```bash
npx grunt --platform=android --liveview --reuse-server unit-test
```

When `--reuse-server` is passed:

1. If the LiveView server is already running on port 8323, it is reused (no restart).
2. The app is not reinstalled — it just relaunches the existing app on the device.
3. This skips the build and install steps entirely, making the feedback loop much faster.

**When to use `--reuse-server`:** when iterating on JS code on the same platform. The server survives between grunt runs because it is spawned as a detached process.

**When NOT to use it:** when switching platforms (e.g. Android to iOS), when `tiapp.xml` changes, or when native assets change. In those cases, omit `--reuse-server` to get a fresh build.

### Runtime test config (`--grep` and `--manual`)

`grunt unit-test` accepts two more options that are forwarded to the on-device spec runner at launch (no rebuild needed):

```bash
npx grunt --platform=android --simulator --liveview --reuse-server \
  --grep="SyncFeedback" --manual unit-test
```

- `--grep=<pattern>` — Mocha grep filter on the fully-qualified test name. `--grep="SyncFeedback"` runs only tests under `describe("SyncFeedback controller", …)`; `--grep="should render"` runs every `it("should render …")` across the suite. **Use the `=` form** — bare `--grep "..."` makes grunt treat the value as a task name and aborts with `Task "..." not found`.
- `--manual` — enables manual mode: no test timeout and the window stays open after the test finishes. On Android, tap the "Continue" menu item to dismiss. Useful for poking at a single screen after its setup has run.

**How this works:** the grunt `launch` task maps these options into launcher arguments — Android intent extras (`--es test_grep … --ez test_manual true`) or iOS `simctl launch` argv (`-test_grep … -test_manual true`). `walta-app/app/spec/index.js` reads them on startup via `Ti.Android.currentActivity.intent.getStringExtra(…)` or `Ti.App.arguments` and configures Mocha accordingly.

Combine freely with `--liveview --reuse-server` for sub-30-second iteration on a focused test.

### LiveView with other tasks

```bash
# Debug mode with liveview (keeps logs streaming)
npx grunt --platform=android --liveview debug
npx grunt --platform=android --liveview --reuse-server debug

# Acceptance tests with liveview
npx grunt --platform=android --liveview acceptance-test
```

### Verbose Vite logs

By default, the `[vite]` HTTP request logs are suppressed. To see them:

```bash
VITE_LOG_LEVEL=trace npx grunt --platform=android --liveview unit-test
```

### Stopping the server

The LiveView server runs as a background process on port 8323. To stop it manually:

```bash
lsof -ti:8323 | xargs kill -9
```

Running without `--reuse-server` will automatically stop any existing server before starting a new one.

### Editing `config.json` while LiveView is running

Editing `app/config.json` (e.g. tweaking the `Alloy.CFG.colors` palette) while a LiveView dev server is running will usually crash the next reload with:

```
Unexpected error: Uncaught Error: Requested module not found:
  /@fs/.../node_modules/alloy/Alloy/lib/alloy/underscore.js
```

This is a known interaction between Alloy's compiler and LiveView's Vite-based HMR — not a code bug. Mechanism:

- `node_modules/alloy/Alloy/template/lib/alloy.js` (the file that becomes the `Alloy` global) starts with `require('/alloy/underscore')`. `/alloy/*` is a virtual Titanium-runtime path, not a filesystem path.
- Under LiveView, `Module.liveViewRequire` forwards that require to Vite. Vite only serves modules from the dependency graph it built lazily when the dev server started — it has no "look on disk" fallback for virtual paths.
- A `config.json` edit makes Alloy regenerate `alloy.js` with a fresh dependency tree. The new file's *bytes* get HMR'd into Vite, but Vite's *resolver graph* is stale — it doesn't know to pre-index the new imports. Next require → 404.

**Workaround:** drop `--reuse-server` (and ideally `--liveview` too) on the next run after editing `config.json`. LiveView is fine for source/style edits *between* config changes.

### Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `module not found: /@vite/client` | Device can't reach the Vite server | Ensure iOS device is on the same WiFi as the Mac |
| `LiveView server exited with code 1` | Build failure during `ti serve` | Run without `--reuse-server` to see full build output |
| Tests fail intermittently | Device screen locked | Screen stays awake automatically on Android; unlock iOS manually |
| Stale code running on device | Server from different platform | Run without `--reuse-server` to force a fresh server |
| `Requested module not found: ...alloy/underscore.js` | `config.json` edit while LiveView reused | See [Editing `config.json` while LiveView is running](#editing-configjson-while-liveview-is-running) |

## Device unit tests in detail

Device unit tests run on the actual Titanium runtime (on a physical device or simulator). They are needed when testing code that uses `Ti.*` APIs which can't be mocked in Node.js.

### Test structure

- **Spec files**: `walta-app/app/spec/*_spec.js`
- **Test runner**: `walta-app/app/spec/index.js` (loads all specs, runs ti-mocha)
- **Mocks**: `walta-app/app/spec/mocks/` (`MockCamera`, `MockCerdiApi`, `MockKey`, etc.)
- **Utilities**: `walta-app/app/spec/util/TestUtils.js`
- **Test fixtures**: `walta-app/app/spec/fixtures/` and `walta-app/app/spec/resources/`

For idioms specific to writing device specs (TestUtils helpers, child-controller refs, test pollution between specs, `--manual` mode considerations), see [device-specs.md](device-specs.md).

### Mocking `Ti.*` in Node tests

The Node.js environment has no Titanium runtime. Mock `Ti.Network.createHTTPClient` by injecting a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical pattern.

`mocha-bootstrap.js` is only loaded for on-device tests; do not include it in Node tests.

## Build utility tests

Tests for the build infrastructure (launchers, hooks, config processing):

```bash
# Unit tests for build utilities
npx grunt build-test

# Integration tests (builds fixture apps, then tests)
npx grunt build-integration-test

# Rebuild integration fixtures
npx grunt build-integration-fixtures

# Clean integration fixtures
npx grunt clean-integration-fixtures
```

Build tests use ES modules and require `NODE_OPTIONS=--experimental-vm-modules` (handled automatically by the grunt tasks).

## Additional options

| Option | Effect |
|--------|--------|
| `--platform=android\|ios` | Target platform |
| `--simulator` | Use emulator/simulator instead of physical device |
| `--liveview` | Use Vite-based liveview dev server |
| `--reuse-server` | Reuse existing liveview server (skip build/install) |
| `--preview` | Keep log streaming after tests complete |
| `--log-level=info\|debug\|trace` | App log verbosity |
