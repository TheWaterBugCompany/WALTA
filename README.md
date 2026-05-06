# WALTA

This repository contains the source code for both the iOS and the Android versions of the Waterbug App.

## Licensing

The Waterbug App is dual-licensed:

- **Source code** is licensed under the [GNU Affero General Public License v3.0](LICENSE).
- **Media assets** — including photographs, illustrations, audio, video, and the taxonomy multimedia under `walta-app/app/assets/` and `walta-taxonomy/` — are licensed under [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](LICENSE-MEDIA).

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the people and organisations behind the project.

## Setup

See [docs/installation.md](docs/installation.md) for the full setup guide, including prerequisites, Titanium SDK, Android and iOS signing, environment variables, and API configuration.

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

See [docs/testing.md](docs/testing.md) for the full guide — test levels, quick-reference commands, single-test filtering, LiveView fast iteration, and device-test details.

## Building

Once the local development environment is configured, build a release with:

```bash
npx grunt --platform=android clean release && npx grunt --platform=ios clean release
```

This produces `builds/release/Waterbug.{apk,aab,ipa}`.

## Making a release

Releases are built and published by the **Release** GitHub Action. From the [Actions tab](https://github.com/TheWaterBugCompany/WALTA/actions/workflows/release.yml), click **Run workflow** and choose:

- **Version** — e.g. `2.0.5.1`. Leave empty to auto-increment the build number from the latest `v*` git tag.
- **Platforms** — `both` (default), `android`, or `ios`.

The workflow will:

1. Build signed release packages for the selected platform(s).
2. Upload the Android `.aab` to the Google Play **internal** track.
3. Upload the iOS `.ipa` to **TestFlight**.
4. Tag the commit with `v<version>` on success.

Promotion from the internal track / TestFlight to production is done manually in the Play Console and App Store Connect.

