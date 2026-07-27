# Visual regression tests

Catch layout regressions by rendering each screen on device, screenshotting it once the display has settled, and pixel-diffing against a committed baseline. Scoped **only** to what the rendered layout looks like — it does not drive the UI or assert behaviour (that's the acceptance/E2E layers).

## Running it

```bash
# Capture every screen, diff against baselines, fail on any difference.
npx grunt --platform=ios --simulator visual-test
npx grunt --platform=android --simulator visual-test

# Refresh baselines (commit the result) after an intended visual change.
npx grunt --platform=ios --simulator --update visual-test

# One screen, labelled baseline set, report-only (don't fail the build).
npx grunt --platform=ios --simulator --grep=Menu --device=iphone-16 --advisory visual-test
```

Flags: `--update` writes captures over the baselines, `--grep=<Name>` captures one screen, `--device=<label>` selects the baseline set (baselines are renderer-specific — see below), `--advisory` reports diffs without failing.

## How it works

1. A dedicated run mode. `index.js` dispatches on the `visual_capture` launch arg (set by `--visual`/the `visual-test` task) to [`VisualCapture.js`](../../walta-app/app/controllers/VisualCapture.js) instead of the app or the mocha runner — reusing the test-sim binary. See [`RuntimeMode`](../../walta-app/app/lib/util/RuntimeMode.js).
2. Capture. [`spec/visual/captureScreens.js`](../../walta-app/app/spec/visual/captureScreens.js) renders each entry in [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js) with its spec fixtures (no live GPS/network/navigation), waits for the display to settle, calls `view.toImage()`, and writes a PNG to `applicationDataDirectory/visual/`.
3. Settle gate. [`waitForStable`](../../walta-app/app/lib/util/waitForStable.js) re-captures until two consecutive `toImage()` blobs are the same size. This is essential: `postlayout` fires *before* lazy tiles (Speedbug) and async photos (TaxonDetails) finish drawing, so capturing on `postlayout` alone yields blank frames.
4. Pull + diff. The `visual-collect` grunt task streams the device log until the `VISUAL_CAPTURE_DONE` marker, pulls the PNGs (iOS: `simctl get_app_container`; Android: `run-as` tar stream, since the app dir isn't world-readable), and diffs each against the baseline with [`compareScreenshots`](../../build-utils/visual/compareScreenshots.js) (pixelmatch). Mismatches get a baseline/actual diff image for the CI artifact.

## Adding a screen

Add one entry to [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js) — `{ name, create, settle? }`, where `create()` builds the controller with its fixtures (reuse the setup from the screen's existing `*_spec.js`). Then `--update` to generate its baseline.

## Baselines are renderer-specific

A baseline rendered on one simulator/emulator won't match a differently-rendered one (fonts, GPU), so baselines are generated in the environment that verifies them (CI) and committed under `visual/baselines/<platform>/<device>/`. Titanium has no runtime window resize — different screen sizes require different devices, so each device keeps its own baseline set.

## Why not Appium?

The acceptance suite already drives the UI. Visual regression only cares about the rendered pixels, so it renders each screen in isolation from a fixture — faster, and free of the navigation/network/GPS flake that made pixel diffs unstable before. `view.toImage()` also excludes the OS status bar, removing the clock as a diff source.
