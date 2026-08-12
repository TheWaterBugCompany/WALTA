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

Releases happen in two stages, each a GitHub Action you run from the [Actions tab](https://github.com/TheWaterBugCompany/WALTA/actions).

### 1. Build and upload a candidate — **Upload build**

The [**Upload build**](https://github.com/TheWaterBugCompany/WALTA/actions/workflows/upload-build.yml) action builds signed packages and pushes them to the beta channels. Click **Run workflow** and choose:

- **Environment** — `test` (sandbox API, tagged `v<version>-test`) or `production` (real API, tagged `v<version>`).
- **Version** — e.g. `2.0.5.1`. Leave empty to auto-increment the build number from the latest `v*` git tag.
- **Platforms** — `both` (default), `android`, or `ios`.

The workflow will:

1. Build signed release packages for the selected platform(s).
2. Upload the Android `.aab` to Google Play — the **internal** track for `test`, **Open Testing** for `production`.
3. Upload the iOS `.ipa` to **TestFlight**.
4. Tag the commit with `v<version>` (or `v<version>-test`) on success.

### 2. Promote a tested build to the public stores — **Release to production**

Once a `production` build has been validated on the beta channels, the [**Release to production**](https://github.com/TheWaterBugCompany/WALTA/actions/workflows/release-to-production.yml) action promotes that exact build (no rebuild) to the public App Store and the Google Play **production** track. It is guarded so only a production-tagged build (`v<version>`, never a `-test` build) can be promoted, and requires typing `PROMOTE` to confirm. Run it with `dry_run` first to validate against the store APIs without publishing.

