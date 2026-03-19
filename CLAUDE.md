# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WALTA (Waterbug App) is a cross-platform mobile app for iOS and Android that enables dichotomous key-based insect identification for water quality monitoring. It is built on the Titanium/Alloy MVC framework.

## Commands

### Setup

```bash
brew install node@20
brew install ios-deploy
npm install
npx appium driver install xcuitest
npx appium driver install uiautomator2
```

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

# Device unit tests (requires connected device/emulator)
npx grunt --platform=android unit-test
npx grunt --platform=ios unit-test

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

### Patterns & Conventions

**Controller communication:** Controllers communicate via `Topics` (a pub/sub event bus over Ti's global event system — see `lib/ui/Topics.js`). Use `Topics.fireTopicEvent(Topics.SOME_EVENT, payload)` to publish and `Topics.subscribe(Topics.SOME_EVENT, handler)` to listen. Direct function calls are used within a controller; Topics are used across controllers.

**Controller lifecycle:** Controllers receive injected dependencies via `$.args`. Always implement a `cleanUp()` function that unsubscribes Topics listeners and destroys child views — it is called by the navigation system when the screen is unloaded.

**Photo paths:** Photos taken by users are stored in `Ti.Filesystem.applicationDataDirectory` using relative paths (no leading `/`). Taxonomy reference images are in `Ti.Filesystem.resourcesDirectory` (absolute paths starting `/`). `PhotoUtils.absolutePath()` handles both conventions.

**Ti.App.Properties keys:** Persistent storage uses `Ti.App.Properties.setObject/getObject`. Key names in use: `userAccessTokenLive` (user auth token object), `appAccessTokenLive` (app-level OAuth token object), `userAccessUsername` (logged-in email).

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
2. **Device unit tests** (`walta-app/app/assets/unit-test/`) — run on device via Titanium; required when code uses `Ti.*` APIs that cannot be mocked
3. **End-to-end tests** (`end-to-end-testing/`) — Appium-driven
4. **Acceptance/BDD tests** (`features/`) — Cucumber + WebdriverIO (Appium), uses `@only` tag to filter

**Mocking `Ti.*` in Node.js tests:** The Node.js environment has no Titanium runtime. Mock `Ti.Network.createHTTPClient` by injecting a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical pattern. `mocha-bootstrap.js` is only loaded for on-device tests; do not include it in Node tests.

**Known test gaps:** No unit tests exist for controllers, `KeyLoaderInk.js`, `Navigation.js`, or `SampleSync.js`.

### Data Flow

The app loads taxonomy data from `walta-taxonomy/walta/key.ink.json` via `KeyLoaderInk.js`. `CerdiApi.js` handles all remote API communication for sample upload/download and user authentication. `SampleUploader` and `SampleDownloader` orchestrate bi-directional sync, fired by `SampleSync.js` on a timer.
