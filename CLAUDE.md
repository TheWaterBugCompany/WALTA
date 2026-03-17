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

### Testing Strategy

There are four levels of tests:
1. **Node.js unit tests** (`test/*_spec.js`) — run with Mocha directly, fastest
2. **Device unit tests** (`walta-app/app/assets/unit-test/`) — run on device via Titanium
3. **End-to-end tests** (`end-to-end-testing/`) — Appium-driven
4. **Acceptance/BDD tests** (`features/`) — Cucumber + WebdriverIO (Appium), uses `@only` tag to filter

### Data Flow

The app loads taxonomy data from `walta-taxonomy/walta/key.json` (or the Ink narrative format). `CerdiApi.js` handles all remote API communication for sample upload/download and user authentication.
