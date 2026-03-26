# Installation Guide

Steps to set up the WALTA project from a clean macOS system.

## Prerequisites

### Homebrew
Install [Homebrew](https://brew.sh) if not already present:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node.js 20
```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
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

The app requires Titanium SDK **12.1.2.GA**. Install it and set it as the default:

```bash
npx titanium sdk install 12.1.2.GA
npx titanium sdk select 12.1.2.GA
```

Verify:
```bash
npx titanium sdk list
```

> **Note:** If a newer SDK (e.g. 13.x) is installed and selected as default, builds will fail with an ESM/CommonJS error. Always ensure 12.1.2.GA is the selected default.

---

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
export PATH="$ANDROID_SDK_ROOT/platform-tools:$PATH"  # for adb
```

### Keystore (required for all Android builds)

The Titanium build always targets `dist-playstore`, so a keystore is required even for debug builds.

The keystore file and its password are stored in 1Password under the secure note **"The Waterbug App - Android Key Store"**. Retrieve them from there, then add the following to `~/.zshrc`:

```bash
export KEYSTORE="/path/to/thecodesharman.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEYSTORE_SUBKEY="thecodesharman"
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

#### Environment Variables (release/ad-hoc builds only)

Once profiles are created, set the following in `~/.zshrc`:

```bash
export DEVELOPER="Your Name (TEAMID)"       # Common Name from your signing certificate
export PROFILE="<app-store-profile-uuid>"
export PROFILE_ADHOC="<adhoc-profile-uuid>"
export PROFILE_DEV="<dev-profile-uuid>"
```

Profile UUIDs are visible in the developer portal or in Xcode → Settings → Accounts → Manage Certificates.

Debug builds use Xcode's automatic signing and do not require these.

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
| `ANDROID_SDK_ROOT` | Android builds | `$HOME/Library/Android/sdk` |
| `KEYSTORE` | All Android builds | `/path/to/your.keystore` |
| `KEYSTORE_PASSWORD` | All Android builds | — |
| `KEYSTORE_SUBKEY` | All Android builds | key alias |
| `DEVELOPER` | iOS release builds | `Name (TEAMID)` |
| `PROFILE` | iOS App Store builds | UUID |
| `PROFILE_ADHOC` | iOS ad-hoc builds | UUID |
| `PROFILE_DEV` | iOS dev builds | UUID |
| `NODE_PATH` | Node.js unit tests | `./walta-app/app/lib/` |

---

## API Configuration

Pass `--app-config=<value>` to any grunt build command to select the backend:

| Value | Points to |
|---|---|
| `mock` | Local stub server (offline development) |
| `development` | Development API |
| `production` | Production API (default for release builds) |

Example:
```bash
npx grunt --platform=android debug --app-config=mock
```
