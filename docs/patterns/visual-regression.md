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
4. Collect + diff. The `visual-collect` grunt task streams the device log: on each `VISUAL_FRAMEBUFFER_READY` it screenshots the frame (iOS `simctl io`; Android `adb screencap`) and rotates it upright (see below), and on `VISUAL_CAPTURE_DONE` it pulls any `toimage` PNGs (iOS `simctl get_app_container`; Android `run-as` tar stream, since the app dir isn't world-readable). Each is diffed against the baseline with [`compareScreenshots`](../../build-utils/visual/compareScreenshots.js) (pixelmatch); mismatches get a baseline/actual diff image for the CI artifact.

## Rotating the frame upright

A simulator/emulator screenshots the device's *physical* framebuffer, which is portrait, while the app is landscape-locked — so the host has to rotate. Which way depends on which of the two landscape orientations the device settled in, and they are a half-turn apart: rotating by a fixed amount gets one of them upside down. (It did, for every iOS capture.)

The device knows, so the capture runner reports `Ti.Gesture.orientation` and the host rotates by [`rotationFor`](../../build-utils/visual/orientation.js). It travels in the handshake marker's **name** — `Menu.ready-landscape-left` — so the host reads it from the directory listing it already does, with no extra round trip into the app's private data dir.

## Why framebuffer by default (not `toImage()`)

`view.toImage()` snapshots the Alloy view tree, *not* the OS compositor — so it can't show the notch / Dynamic Island cutout, and it can't capture WebView / video / map content (those render out-of-process). The framebuffer includes all of it, which is what lets the suite verify the safe area is respected (content clears the cutout) and diff WebView screens like About/Help. The cost is a per-screen host↔app handshake (the app holds each screen while the host grabs the frame) and iOS rotation; `toImage()` remains available per-screen (`capture: "toimage"`) for native screens where the notch is irrelevant and the extra speed matters.

## Adding a screen

Add one entry to [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js), then `--update` to generate its baseline. An entry owns its whole world: `args()` seeds whatever the screen binds to and returns its open arguments, and `services()` contributes the collaborators its screen controller builds a view-model from. Reuse the setup from the screen's existing `*_spec.js`.

The app presents UI in three ways, and [`openEntry`](../../walta-app/app/spec/visual/openEntry.js) opens each the way the app does — the manifest spec and the capture runner share it, so the contract test exercises the real opening path:

| Entry | Shape | Opened as |
|---|---|---|
| Window | `{ name, args }` | Through the **View seam**, so a view-model-driven screen gets its screen controller. `Alloy.createController` alone builds the shell, and the window renders empty. |
| Modal | `{ name, args, host: "Menu" }` | The named host entry's window first, then the modal overlaid on it — so the capture shows the modal over the screen a user reaches it from. The host window is what gets captured. |
| Component | `{ name, args, wrap: true }` | Built directly and hosted in a full-size window, as its device spec does. For UI with no window of its own — the photo panel, the map, a question card. |

Other fields: `settle` (a longer frame-stability gate for lazy tiles / async photos), `loadMs` (time for WebView, map-tile or video content to render before the host grabs the frame), `capture: "toimage"` (in-app snapshot instead of the framebuffer), `screen` (the controller name, when it differs from the entry name), and `platform: "ios" | "android"` for a screen only one platform ever instantiates.

**Fixtures must be idempotent.** The runner opens every screen against one long-lived app and several entries share a fixture (three seed the sample history — the screen plus the two modals hosted on it). A fixture that only appends grows its data each time it runs and the capture drifts, so seed from a cleared state. `VisualManifest_spec.js` pins this.

## Baselines are renderer-specific

A baseline rendered on one simulator/emulator won't match a differently-rendered one (fonts, GPU), so baselines are generated in the environment that verifies them (CI) and committed under `visual/baselines/<platform>/<device>/`. Titanium has no runtime window resize — different screen sizes require different devices, so each device keeps its own baseline set.

CI runs a device matrix (advisory jobs in `.github/workflows/ci.yml`), one baseline set per device — currently iOS `iphone-17` / `iphone-17-pro-max` and Android `medium` / `small` (distinct logical widths). Each matrix leg uploads its captures/diffs as `visual-<platform>-<label>`. Add a device by adding a matrix entry (and committing that leg's first CI-rendered baselines).

## Why not Appium?

The acceptance suite already drives the UI. Visual regression only cares about the rendered pixels, so it renders each screen in isolation from a fixture — faster, and free of the navigation/network/GPS flake that made pixel diffs unstable before. (The app runs immersive with the status bar hidden, so the framebuffer has no clock to flake on.)
