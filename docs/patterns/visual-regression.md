# Visual regression tests

Catch layout regressions by rendering each screen on device, screenshotting it once the display has settled, and pixel-diffing against a committed baseline. Scoped **only** to what the rendered layout looks like — it does not drive the UI or assert behaviour (that's the acceptance/E2E layers). A key goal is verifying the **safe area is respected** — that nothing is occluded by the camera notch / Dynamic Island.

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
2. Capture. [`spec/visual/captureScreens.js`](../../walta-app/app/spec/visual/captureScreens.js) renders each entry in [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js) with its spec fixtures (no live GPS/network/navigation) and settles. By default the **host** then grabs the actual simulator/emulator **framebuffer** (the runner holds the screen and emits a `VISUAL_FRAMEBUFFER_READY` marker). A screen can opt into an in-app `view.toImage()` snapshot instead with `capture: "toimage"`.
3. Settle gate. [`waitForStable`](../../walta-app/app/lib/util/waitForStable.js) re-captures until two consecutive `toImage()` blobs are the same size. This is essential: `postlayout` fires *before* lazy tiles (Speedbug) and async photos (TaxonDetails) finish drawing, so capturing on `postlayout` alone yields blank frames. (`toImage()` is used only as the settle signal here — it reflects native layout cheaply.)
4. Collect + diff. The `visual-collect` grunt task streams the device log: on each `VISUAL_FRAMEBUFFER_READY` it screenshots the frame (iOS `simctl io`, rotated to landscape; Android `adb screencap`), and on `VISUAL_CAPTURE_DONE` it pulls any `toimage` PNGs (iOS `simctl get_app_container`; Android `run-as` tar stream, since the app dir isn't world-readable). Each is diffed against the baseline with [`compareScreenshots`](../../build-utils/visual/compareScreenshots.js) (pixelmatch); mismatches get a baseline/actual diff image for the CI artifact.

## Why framebuffer by default (not `toImage()`)

`view.toImage()` snapshots the Alloy view tree, *not* the OS compositor — so it can't show the notch / Dynamic Island cutout, and it can't capture WebView / video / map content (those render out-of-process). The framebuffer includes all of it, which is what lets the suite verify the safe area is respected (content clears the cutout) and diff WebView screens like About/Help. The cost is a per-screen host↔app handshake (the app holds each screen while the host grabs the frame) and iOS rotation; `toImage()` remains available per-screen (`capture: "toimage"`) for native screens where the notch is irrelevant and the extra speed matters.

## Adding a screen

Add one entry to [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js) — `{ name, create, settle?, loadMs?, capture? }`, where `create()` builds the controller with its fixtures (reuse the setup from the screen's existing `*_spec.js`). Give WebView/video/map screens a `loadMs` so their async content renders before the host grabs the frame. Then `--update` to generate its baseline.

## Baselines are renderer-specific

A baseline rendered on one simulator/emulator won't match a differently-rendered one (fonts, GPU), so baselines are generated in the environment that verifies them (CI) and committed under `visual/baselines/<platform>/<device>/`. Titanium has no runtime window resize — different screen sizes require different devices, so each device keeps its own baseline set.

CI runs a device matrix (advisory jobs in `.github/workflows/ci.yml`), one baseline set per device — currently iOS `iphone-17` / `iphone-17-pro-max` and Android `medium` / `small` (distinct logical widths). Each matrix leg uploads its captures/diffs as `visual-<platform>-<label>`. Add a device by adding a matrix entry (and committing that leg's first CI-rendered baselines).

## Why not Appium?

The acceptance suite already drives the UI. Visual regression only cares about the rendered pixels, so it renders each screen in isolation from a fixture — faster, and free of the navigation/network/GPS flake that made pixel diffs unstable before. (The app runs immersive with the status bar hidden, so the framebuffer has no clock to flake on.)
