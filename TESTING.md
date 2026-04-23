# Testing Guide

This document covers the test infrastructure for the WALTA (Waterbug) project.

## Test Levels

The project has five levels of testing, ordered from fastest to slowest:

| Level | Directory | Runner | When to use |
|-------|-----------|--------|-------------|
| Node.js unit tests | `test/*_spec.js` | Mocha (Node) | Logic in `lib/logic/` and `lib/util/` that doesn't use `Ti.*` APIs |
| Build utility tests | `build-tests/unit/*.js` | Mocha (Node, ESM) | Build tools, launchers, hooks |
| Device unit tests | `walta-app/app/spec/*_spec.js` | ti-mocha (on-device) | Code that depends on `Ti.*` APIs or Alloy controllers |
| End-to-end tests | `end-to-end-testing/*.js` | Mocha + Appium | Full user interaction flows |
| Acceptance tests | `features/*.feature` | Cucumber + WebdriverIO | BDD scenarios against product requirements |

## Quick Reference

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

## Running a Single Test

**Mocha tests** (Node.js unit, build, end-to-end, contract):

Add `.only` to a `describe` or `it` block:

```javascript
describe.only("My module", function() {
  it("does the thing", function() { ... });
});
```

**Device unit tests** (`walta-app/app/spec/`):

Same `.only` approach — add it to the describe or it block in the spec file.

**Acceptance tests** (Cucumber features):

Add the `@only` tag above a scenario:

```gherkin
@only
Scenario: Download samples from server
  Given I have existing samples stored on the server
```

## LiveView (Fast Iteration)

LiveView uses a Vite-based dev server to serve JavaScript to the device at runtime. Instead of rebuilding and reinstalling the entire app for every code change, the device fetches JS modules from the dev server over the network.

### Prerequisites

- **Android**: Device connected via USB (adb handles networking)
- **iOS**: Device connected via USB **and** on the same WiFi network as the Mac (the device needs to reach the vite server over the network)

### Basic Usage

```bash
# Start fresh server, build app, install, and run tests
npx grunt --platform=android --liveview unit-test
npx grunt --platform=ios --liveview unit-test
```

On the first run, `ti serve` builds the app with liveview support and starts the Vite dev server on port 8323. The app is then installed and launched on the device.

### Fast Iteration with `--reuse-server`

```bash
npx grunt --platform=android --liveview --reuse-server unit-test
```

When `--reuse-server` is passed:

1. If the liveview server is already running on port 8323, it is reused (no restart).
2. The app is not reinstalled -- it just relaunches the existing app on the device.
3. This skips the build and install steps entirely, making the feedback loop much faster.

**When to use `--reuse-server`:** When iterating on JS code on the same platform. The server survives between grunt runs because it is spawned as a detached process.

**When NOT to use it:** When switching platforms (e.g. Android to iOS), when `tiapp.xml` changes, or when native assets change. In those cases, omit `--reuse-server` to get a fresh build.

### Runtime Test Config (`--grep` and `--manual`)

`grunt unit-test` accepts two more options that are forwarded to the on-device spec runner at launch (no rebuild needed):

```bash
npx grunt --platform=android --simulator --liveview --reuse-server \
  --grep=SyncFeedback --manual unit-test
```

- `--grep=<pattern>` — Mocha grep filter on the fully-qualified test name. `--grep=SyncFeedback` runs only tests under `describe("SyncFeedback controller", …)`; `--grep="should render"` runs every `it("should render …")` across the suite.
- `--manual` — enables manual mode: no test timeout and the window stays open after the test finishes. On Android, tap the "Continue" menu item to dismiss. Useful for poking at a single screen after its setup has run.

**How this works**: the grunt `launch` task maps these options into launcher arguments — Android intent extras (`--es test_grep … --ez test_manual true`) or iOS `simctl launch` argv (`-test_grep … -test_manual true`). `walta-app/app/spec/index.js` reads them on startup via `Ti.Android.currentActivity.intent.getStringExtra(…)` or `Ti.App.arguments` and configures Mocha accordingly.

Combine freely with `--liveview --reuse-server` for sub-30-second iteration on a focused test.

### LiveView with Other Tasks

```bash
# Debug mode with liveview (keeps logs streaming)
npx grunt --platform=android --liveview debug
npx grunt --platform=android --liveview --reuse-server debug

# Acceptance tests with liveview
npx grunt --platform=android --liveview acceptance-test
```

### Verbose Vite Logs

By default, the `[vite]` HTTP request logs are suppressed. To see them:

```bash
VITE_LOG_LEVEL=trace npx grunt --platform=android --liveview unit-test
```

### Stopping the Server

The liveview server runs as a background process on port 8323. To stop it manually:

```bash
lsof -ti:8323 | xargs kill -9
```

Running without `--reuse-server` will automatically stop any existing server before starting a new one.

### Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `module not found: /@vite/client` | Device can't reach the vite server | Ensure iOS device is on the same WiFi as the Mac |
| `LiveView server exited with code 1` | Build failure during `ti serve` | Run without `--reuse-server` to see full build output |
| Tests fail intermittently | Device screen locked | Screen stays awake automatically on Android; unlock iOS manually |
| Stale code running on device | Server from different platform | Run without `--reuse-server` to force a fresh server |

## Device Unit Tests in Detail

Device unit tests run on the actual Titanium runtime (on a physical device or simulator). They are needed when testing code that uses `Ti.*` APIs which can't be mocked in Node.js.

### Test Structure

- **Spec files**: `walta-app/app/spec/*_spec.js`
- **Test runner**: `walta-app/app/spec/index.js` (loads all specs, runs ti-mocha)
- **Mocks**: `walta-app/app/spec/mocks/` (MockCamera, MockCerdiApi, MockKey, etc.)
- **Utilities**: `walta-app/app/spec/util/TestUtils.js`
- **Test fixtures**: `walta-app/app/spec/fixtures/` and `walta-app/app/spec/resources/`

### Mocking Ti.* APIs in Node.js Tests

When testing modules that use `Ti.Network.createHTTPClient`, inject a fake via the module's `ProxyCreateHTTPClient` export. See `test/CerdiApi_spec.js` for the canonical pattern.

Do **not** include `mocha-bootstrap.js` in Node tests -- it is only for on-device tests.

## Build Utility Tests

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

## Additional Options

| Option | Effect |
|--------|--------|
| `--platform=android\|ios` | Target platform |
| `--simulator` | Use emulator/simulator instead of physical device |
| `--liveview` | Use Vite-based liveview dev server |
| `--reuse-server` | Reuse existing liveview server (skip build/install) |
| `--preview` | Keep log streaming after tests complete |
| `--log-level=info\|debug\|trace` | App log verbosity |
