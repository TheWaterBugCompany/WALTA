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

Without `--device` the label is **derived from the device that rendered the run** (`iPhone 17 Pro Max` → `iphone-17-pro-max`), so a local run lands in the same baseline set CI uses for that device and two simulators never share one. The OS version is deliberately dropped — a point release doesn't warrant a fresh baseline set.

The handshake directory is cleared by the **host, before the app is launched**. It outlives the app, so a previous run's markers are still there when the host starts polling — and a leftover `capture-done` reads as "this run has finished", making the host pull the previous run's screenshots, report them as this run's, and terminate the app part-way through capturing. The runner wipes the dir at startup too, but that can't prevent it on its own: the host can read the dir before the app gets to it, and does. Clearing it while nothing is running is the only race-free moment.

## How it works

1. A dedicated run mode. `index.js` dispatches on the `visual_capture` launch arg (set by `--visual`/the `visual-test` task) to [`VisualCapture.js`](../../walta-app/app/controllers/VisualCapture.js) instead of the app or the mocha runner — reusing the test-sim binary. See [`RuntimeMode`](../../walta-app/app/lib/util/RuntimeMode.js).
2. Capture. [`spec/visual/captureScreens.js`](../../walta-app/app/spec/visual/captureScreens.js) renders each entry in [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js) with its spec fixtures (no live GPS/network/navigation) and settles. By default the **host** then grabs the actual simulator/emulator **framebuffer** (the runner holds the screen and emits a `VISUAL_FRAMEBUFFER_READY` marker). A screen can opt into an in-app `view.toImage()` snapshot instead with `capture: "toimage"`.
3. Settle gate. [`waitForStable`](../../walta-app/app/lib/util/waitForStable.js) re-captures until two consecutive `toImage()` blobs are the same size. This is essential: `postlayout` fires *before* lazy tiles (Speedbug) and async photos (TaxonDetails) finish drawing, so capturing on `postlayout` alone yields blank frames. (`toImage()` is used only as the settle signal here — it reflects native layout cheaply.)
4. Collect + diff. The `visual-collect` grunt task streams the device log: on each `VISUAL_FRAMEBUFFER_READY` it screenshots the frame (iOS `simctl io`, rotated to landscape; Android `adb screencap`), and on `VISUAL_CAPTURE_DONE` it pulls any `toimage` PNGs (iOS `simctl get_app_container`; Android `run-as` tar stream, since the app dir isn't world-readable). Each is diffed against the baseline with [`compareScreenshots`](../../build-utils/visual/compareScreenshots.js) (pixelmatch); mismatches get a baseline/actual diff image for the CI artifact.
5. Report. The run is recorded as `results.json` and its baselines copied in beside the captures ([`persistRun`](../../build-utils/visual/persistRun.js)), then [`buildReport`](../../build-utils/visual/buildReport.js) renders `builds/visual/report.html` — see below.

## The review page

Every run writes `builds/visual/report.html` — pass or fail, since a failing run is the one whose report you want to open. It is a **gallery**: one row per screen, one column per platform/device, so a whole matrix can be scanned side by side for anything that looks odd rather than opened one PNG at a time.

- **Layer switch** — flip the whole gallery between Capture, Baseline and Diff. On the Diff layer only the screens that actually differ stay lit; the rest dim to their capture.
- **Column headers** carry the baseline set, the device that actually rendered it and when — so a run left over from an earlier session is obvious rather than read as part of the same matrix.
- **Needs a look** — hides rows where every device matched.
- **Click a cell** for baseline / capture / diff side by side, then `←` `→` across devices and `↑` `↓` across screens. The open cell goes in the URL hash, so a link points at exactly the cell you are asking about.
- Statuses are `pass`, `fail`, `new` (no baseline yet), `missing` (the run failed to capture it), `updated` (`--update` wrote it), and `absent` (that leg never captured this screen — a coverage gap, shown rather than hidden). Across one CI run `absent` should be rare; a wall of it means the columns come from different runs, which the capture times in the headers will show.

The page links its images by relative path and sits at the root of the captures tree, so it travels with them as one artifact; open the downloaded folder's `report.html`, not the file alone.

**In CI** each matrix leg renders its own page into its `visual-<platform>-<label>` artifact, and the `visual-report` job merges every leg into one tree and uploads the whole-matrix gallery as **`visual-review`** — that is the one to download to review a PR's rendering across both platforms and all screen sizes at once. The root-level `report.html` is also what pins each leg's artifact root at `builds/visual/`, which is what lets the legs merge back with their platform/device paths intact.

To re-render after unpacking artifacts by hand: `npx grunt visual-report`.

## Why framebuffer by default (not `toImage()`)

`view.toImage()` snapshots the Alloy view tree, *not* the OS compositor — so it can't show the notch / Dynamic Island cutout, and it can't capture WebView / video / map content (those render out-of-process). The framebuffer includes all of it, which is what lets the suite verify the safe area is respected (content clears the cutout) and diff WebView screens like About/Help. The cost is a per-screen host↔app handshake (the app holds each screen while the host grabs the frame) and iOS rotation; `toImage()` remains available per-screen (`capture: "toimage"`) for native screens where the notch is irrelevant and the extra speed matters.

## Adding a screen

**Every new screen gets an entry, in the same change that adds the screen** — and so does any state of it worth looking at, since a screen is only ever captured in the state the manifest puts it in. Add one entry to [`spec/visual/manifest.js`](../../walta-app/app/spec/visual/manifest.js), then `--update` to generate its baseline. An entry owns its whole world: `args()` seeds whatever the screen binds to and returns its open arguments, and `services()` contributes the collaborators its screen controller builds a view-model from. Reuse the setup from the screen's existing `*_spec.js`.

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

The devices CI covers are declared **once**, in [`visual/devices.json`](../../visual/devices.json) — currently iOS `iphone-17` / `iphone-17-pro-max` and Android `medium` / `small` (distinct logical widths). The `visual-devices` job publishes it, the two capture jobs build their matrices from it with `fromJSON`, and the report reads it to know which columns to expect. **Add a device there, not in the workflow** (then commit that leg's first CI-rendered baselines). Each leg uploads its captures/diffs as `visual-<platform>-<label>`.

That single declaration is what lets the report notice a leg that produced *nothing*: without it a dead leg's column would simply vanish, leaving a report that looked complete. Declared devices are always columns, so a leg that captured nothing reads as a column of gaps marked **no captures**. (A run on an undeclared device — a local capture on your own simulator — is still shown; it just isn't expected.)

## Why not Appium?

The acceptance suite already drives the UI. Visual regression only cares about the rendered pixels, so it renders each screen in isolation from a fixture — faster, and free of the navigation/network/GPS flake that made pixel diffs unstable before. (The app runs immersive with the status bar hidden, so the framebuffer has no clock to flake on.)
