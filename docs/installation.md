# Installation Guide

Steps to set up the WALTA project from a clean macOS system.

## Prerequisites

### Homebrew
Install [Homebrew](https://brew.sh) if not already present:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node.js 24
```bash
brew install node@24
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Java Development Kit (required for Android builds)

> **Note:** This installer requires `sudo` and a password prompt — run it in a real terminal, not a subprocess or script.

JDK **17** is required. The Gradle version bundled with Titanium SDK 12.1.2.GA does not support JDK 21 or later (you will get `Unsupported class file major version` errors).

```bash
brew install --cask temurin@17
```

After installation, add `JAVA_HOME` to `~/.zshrc`, pinned to version 17:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### iOS Deploy (required for iOS device deployment)
```bash
brew install ios-deploy
```

### libimobiledevice (required for iOS device log streaming)
```bash
brew install libimobiledevice
```

---

## Clone and Install

```bash
git clone <repo-url>
cd WALTA
npm install
```

`npm install` runs `install.sh` automatically, which copies test assets and bundles libraries via webpack.

---

## Titanium SDK

The required SDK version is whatever `walta-app/tiapp.xml.template` declares in its
`<sdk-version>` tag — currently **13.4.0.GA**. Install it and set it as the default:

```bash
npx titanium sdk install 13.4.0.GA
npx titanium sdk select 13.4.0.GA
```

Verify:
```bash
npx titanium sdk list
```

> If `npx titanium sdk install` exits early under Node 24 with "Detected unsettled
> top-level await" (exit code 13), download the SDK zip from the
> [titanium-sdk releases](https://github.com/tidev/titanium-sdk/releases) and unzip it
> into `~/Library/Application Support/Titanium/` (it extracts to `mobilesdk/osx/<ver>`).

### SDK Patches

**Required — run this after every SDK install or upgrade.** The build does *not* apply
these patches automatically; only CI does (via `npm run patch-sdk`). Skip them locally
and the build fails in ways that look like SDK bugs:

- an ioslib provisioning crash (`removeProfile` reading `undefined.length`) — fires even
  on Android builds, because environment detection scans iOS provisioning profiles;
- `Namespace not specified` on prebuilt Android modules (e.g. Bugfender) — the SDK's
  `lib.build.gradle` template omits the `namespace` the bundled Android Gradle Plugin
  now requires.
- LiveView (`--liveview`) failing to serve or start: `titanium serve` reporting an
  unknown command, or the app aborting at startup with `Requested module not found` for a
  module in a subdirectory (e.g. `sinks/ConsoleSink`). See the LiveView note below.

```bash
npm run patch-sdk      # apply — do this after installing/selecting the SDK
npm run unpatch-sdk    # reverse — do this before upgrading the SDK
```

The patches live in `patches/titanium-sdk/` and are safe to re-apply — the script skips
any already applied.

> **When upgrading the SDK, update the version in *two* places or CI breaks:**
> `walta-app/tiapp.xml.template` (`<sdk-version>`) **and** `patches/titanium-sdk/apply.sh`
> (`SDK_VERSION`). The patch script hard-codes the version and exits early if that SDK
> isn't installed, so a mismatch makes CI's "Apply SDK patches" step fail. Also confirm
> each patch still applies (`npm run patch-sdk`) — a new SDK may have moved the code.

LiveView is provided by our custom `liveview` fork (pinned in `package.json`). SDK 13.4.0+
loads it natively via the SDK's bundled `cli/hooks/liveview.js`, which re-exports
`liveview/hook/lvhook.js` from the fork — so the fork overrides the default package. No
patch is needed to disable the SDK's LiveView hook.

The `export * from 'liveview/hook/lvhook.js'` shim only works if `liveview` resolves to
the fork — but from `<sdk>/cli/hooks/` Node resolves it to the SDK's own bundled
`node_modules/liveview` (an old **1.5.6**) first, so the fork never loads. That 1.5.6 hook
injects a legacy client into `app.js` that (a) resolves relative requires against a global
*compile stack* rather than the calling module — correct at module load but wrong for a
`require()` in a deferred callback (e.g. `Logger.configure()` calling
`require("./sinks/ConsoleSink")` at startup drops the parent dir → app aborts with
`Requested module not found: sinks/ConsoleSink`), and (b) expects a separate file server on
a second port that the fork's single-port vite server never provides.

Two SDK-side symlinks (both applied by `npm run patch-sdk`, both needing `npm install`
first, both reversed by `npm run unpatch-sdk`) fix this:

- **`node_modules/liveview` → the fork.** Symlinking the SDK's bundled liveview to our
  fork makes the `lvhook` shim load the fork's **v2** hook, which injects the v2 client:
  single vite port, and relative requires resolved against the calling module (so the
  deferred-`require` bug simply doesn't exist). The real 1.5.6 is moved aside to
  `node_modules/liveview.sdk-bundled` and restored on reverse.
- **`cli/commands/serve.js` → the fork's `serve.js`.** The Titanium CLI (v9) hard-codes
  `serve` in its `sdkCommands` map, resolving it to `<sdk>/cli/commands/serve.js` and
  ignoring the fork's `paths.commands`; the SDK ships no `serve.js`.

The `liveview` fork declares `vite@^5`, but the project pins `vite` to `^4.5.0`
everywhere else (vite 5 is ESM-only and breaks `require('vite')` in the LiveView config —
see [security.md](security.md)). `package.json` carries an `overrides` entry forcing
liveview's transitive `vite` down to `^4.5.0`; without it a clean install nests vite 5
under liveview, which npm flags as `invalid` and which contradicts the documented pin.

## Android Setup

### Android SDK

> **Note:** Download and install Android Studio manually, then use its SDK Manager to install the required components.

Download and install [Android Studio](https://developer .android.com/studio), then open **Android Studio → Settings → Languages & Frameworks → Android SDK** and install:
- Android SDK Platform API 34
- Android SDK Build-Tools
- Android Emulator
- Android SDK Platform-Tools

Then add to `~/.zshrc`:
```bash
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$PATH"  # for adb
```

> **Note:** Both `ANDROID_SDK_ROOT` (used by Titanium/Gradle) and `ANDROID_HOME` (used by the integration test build scripts) point to the same location.

### Keystore (required for all Android builds)

The Titanium build always targets `dist-playstore`, so a keystore is required even for debug builds.

The keystore file and its password are stored in 1Password under the secure note **"The Waterbug App - Android Key Store"**. Retrieve them from there, then add the following to `~/.zshrc`:

```bash
export KEYSTORE="/path/to/thecodesharman.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEYSTORE_SUBKEY="thecodesharman"
```

### Google Maps API Key (required for all builds)

The Android Maps API key is stored in 1Password under **"The Waterbug App - Google Maps API Key"**. It is injected into `tiapp.xml` at build time — `tiapp.xml` is not committed to the repo.

Add to `~/.zshrc`:
```bash
export GOOGLE_MAPS_API_KEY="your-api-key"
```

Then run `source ~/.zshrc`.

---

## iOS Setup

### Xcode
Install Xcode from the Mac App Store, then install command line tools:
```bash
xcode-select --install
```

Then install the iOS platform SDK matching your test device's OS version: **Xcode → Settings → Components → iOS** and download the required version. Without this, builds will fail with "iOS x.x is not installed".

### Apple WWDR Intermediate Certificate

The Apple Worldwide Developer Relations (WWDR) intermediate certificate must be installed for iOS builds. The version bundled with macOS expires in 2023, so you need to install the current one manually.

```bash
curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
open AppleWWDRCAG3.cer
```

This opens Keychain Access. When prompted, add the certificate to the **System** keychain (not iCloud).

### Signing Certificates and Provisioning Profiles

iOS signing requires two things: a **distribution certificate** and **provisioning profiles**. Both expire (certificates after ~1 year, profiles after 1 year) and must be renewed when setting up on a new machine or after expiry.

#### Distribution Certificate

1. Open Xcode → **Settings → Accounts** → select your Apple ID
2. Click **Manage Certificates → + → Apple Distribution**
3. Xcode will create and install the certificate automatically

#### Provisioning Profiles

First, register any test devices (see Device Registration below). Then create the Ad Hoc profile:

1. Go to [developer.apple.com/account/resources/profiles](https://developer.apple.com/account/resources/profiles) → **+**
2. Select **Ad Hoc** under Distribution (not App Store or Development)
3. Select the explicit Waterbug App ID (not the wildcard)
4. Select your new distribution certificate
5. Select the devices to include
6. Name it (e.g. `Waterbug Ad Hoc`) and download it
7. In Xcode → **Settings → Accounts → Download Manual Profiles** to install it

> **Note:** Double-clicking the `.mobileprovision` file does not reliably install it on newer macOS — use Xcode's Download Manual Profiles instead.

After installing, note the profile UUID and update `PROFILE_ADHOC` and `PROFILE_DEV` in [Gruntfile.js](Gruntfile.js) (lines 20–21), or set them as environment variables.

Titanium CLI looks for profiles in `~/Library/MobileDevice/Provisioning Profiles` but newer Xcode stores them in a different path. Configure Titanium to use the correct location:

```bash
npx titanium config ios.profileDir "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
```

#### Device Registration

To include a test device in an Ad Hoc profile you need its UDID. With the device connected via USB:

```bash
xcrun xctrace list devices
```

Then register the UDID at [developer.apple.com/account/resources/devices](https://developer.apple.com/account/resources/devices) before creating the profile.

When connecting a device for the first time, iOS will prompt **"Trust This Computer?"** — tap Trust and enter your device PIN.

#### Environment Variables

Set the following in `~/.zshrc`:

```bash
export DEVELOPER="Your Name (TEAMID)"       # Common Name from your signing certificate
export PROFILE_DIST="<app-store-profile-uuid>"
export PROFILE_ADHOC="<adhoc-profile-uuid>"
export PROFILE_DEV="<dev-profile-uuid>"
export IOS_DEVICE_UDID="<device-udid>"      # Run: idevice_id -l
```

Profile UUIDs are visible in the developer portal. To find your device UDID:
```bash
idevice_id -l
```

> **Note:** These variables have no defaults — builds will fail with a clear error if they are not set.

---

## Testing Setup

### Appium (end-to-end and acceptance tests)
```bash
npx appium driver install xcuitest      # iOS
npx appium driver install uiautomator2  # Android
```

### Node.js unit tests
Node tests require `NODE_PATH` to resolve Titanium module stubs:
```bash
export NODE_PATH="./walta-app/app/lib/"   # add to ~/.zshrc, or set per-run
```

---

## Verify the Installation

Run the Node.js unit tests (no device required, fastest check):
```bash
npx grunt unit-test-node
```

Then attempt a debug build:
```bash
npx grunt --platform=android debug
npx grunt --platform=ios debug
```

---

## Environment Variables Summary

| Variable | Required for | Example |
|---|---|---|
| `JAVA_HOME` | Android builds | `/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home` |
| `ANDROID_SDK_ROOT` | Android builds (Titanium/Gradle) | `$HOME/Library/Android/sdk` |
| `ANDROID_HOME` | Android build scripts | `$HOME/Library/Android/sdk` |
| `GOOGLE_MAPS_API_KEY` | All builds | injected into `tiapp.xml` from `tiapp.xml.template` |
| `KEYSTORE` | All Android builds | `/path/to/your.keystore` |
| `KEYSTORE_PASSWORD` | All Android builds | — |
| `KEYSTORE_SUBKEY` | All Android builds | key alias |
| `DEVELOPER` | iOS builds | `Name (TEAMID)` |
| `PROFILE_DIST` | iOS App Store builds | UUID |
| `PROFILE_ADHOC` | iOS ad-hoc builds | UUID |
| `PROFILE_DEV` | iOS dev/debug builds | UUID |
| `IOS_DEVICE_UDID` | iOS device builds + acceptance | from `idevice_id -l` |
| `NODE_PATH` | Node.js unit tests | `./walta-app/app/lib/` |

---

## API Configuration

The build hook (`plugins/unittest/1.0/hooks/appconfig.js`) copies
`walta-app/app/app-config.<env>.json` into the build as
`app-config.json`. `app-config.*` is gitignored — each developer
creates the env file locally with their own secret.

Pass `--app-config=<value>` to any grunt build command to select the
backend:

| Value | Points to |
|---|---|
| `test` | Test sandbox (default for debug + acceptance/unit-test builds) |
| `production` | Production API (default for release builds) |

`install.sh` seeds `app-config.test.json` from
`app-config.test.json.template`. Open the seeded file and replace
`<<INSERT SECRET HERE>>` with the real `cerdiApiSecret` from
1Password ("The Waterbug App - CERDI API Secret"). To set up the
production config, copy the template manually and fill in the
production URL + secret.

Acceptance tests bake in the test sandbox URL but redirect to a
local mock CERDI server at runtime via the `cerdiServerUrlOverride`
Android intent extra (see [walta-app/app/alloy.js](walta-app/app/alloy.js)),
so the same APK can be used end-to-end against either backend
without rebuilding.

Example:
```bash
npx grunt --platform=android debug                       # uses test sandbox
npx grunt --platform=android debug --app-config=production
```
