# WALTA

This repository contains the source code for both the iOS and the Android versions of the Waterbug App.

## Licensing

The Waterbug App is dual-licensed:

- **Source code** is licensed under the [GNU Affero General Public License v3.0](LICENSE).
- **Media assets** — including photographs, illustrations, audio, video, and the taxonomy multimedia under `walta-app/app/assets/` and `walta-taxonomy/` — are licensed under [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](LICENSE-MEDIA).

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the people and organisations behind the project.

## Setup

See [INSTALLATION.md](INSTALLATION.md) for the full setup guide, including prerequisites, Titanium SDK, Android and iOS signing, environment variables, and API configuration.

## Seeing logs on device

```bash
adb logcat -s "TiAPI:*"
```

To also see SQLite statements:
```bash
adb shell setprop log.tag.SQLiteStatements VERBOSE
adb logcat -s "TiAPI:*,SQLiteStatements:*"
```

## Testing

See [TESTING.md](TESTING.md) for the full guide — test levels, quick-reference commands, single-test filtering, LiveView fast iteration, and device-test details.

## Building

Once the local development environment is configured, build a release with:

```bash
npx grunt --platform=android clean release && npx grunt --platform=ios clean release
```

This produces `builds/release/Waterbug.{apk,aab,ipa}`.

## Making a release

1. Bump the version numbers in `tiapp.xml.template` for both Android and iOS.
2. Build the release packages as described above.
3. Upload the resulting packages to the Google Play Store and Apple App Store.

