---
name: fast-device-test
description: Run on-device (Titanium) unit tests against the Android emulator with LiveView fast-iteration mode. Use when iterating on Alloy controllers, view specs, or any code that touches Ti.* APIs and needs device runtime to verify. Skip for pure-JS logic — `npx grunt unit-test-node` is faster.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Monitor
  - TaskStop
---

# Fast on-device test loop (Android emulator + LiveView)

Runs `walta-app/app/spec/*_spec.js` against the Titanium runtime with LiveView
so subsequent iterations skip the rebuild+install step. Use when working on
code that needs `Ti.*` APIs or Alloy controllers.

## The command

```bash
npx grunt --platform=android --simulator --liveview --reuse-server unit-test
```

**What each flag does:**

| Flag | Effect |
|---|---|
| `--platform=android` | Target Android |
| `--simulator` | Use the Android emulator (`Medium_Phone_API_36.1`) rather than a physical device |
| `--liveview` | Serve JS over a local Vite dev server on port 8323 instead of baking it into the APK |
| `--reuse-server` | If a LiveView server is already running on :8323, reuse it instead of a fresh rebuild |
| `--grep=<pattern>` | (optional) Mocha grep filter — only runs tests whose fully-qualified name matches, e.g. `--grep=SyncFeedback` |
| `--manual` | (optional) Enables manual mode — mocha.timeout(0), window stays open after the test so you can interact with the screen. On Android tap the "Continue" menu when you're done |

**Typical focused-manual-test invocation:**

```bash
npx grunt --platform=android --simulator --liveview --reuse-server \
  --grep=SyncFeedback --manual unit-test
```

Note: grunt options must use the `--flag=value` form (not `--flag value`) or the value gets parsed as a task name.

**Timing (rough, M-series Mac, emulator already booted):**

- Cold run (no existing server): ~2–3 min (includes APK build + install).
- Subsequent runs with `--reuse-server`: ~20–30 s (JS bundle reload only).

## Focusing on one spec with `.only()`

Mocha's `.only()` works but the on-device runner loads every spec in
`walta-app/app/spec/index.js` before filtering, so test *discovery* still
touches every file. The runtime saving comes from skipping the non-focused
tests, not from loading fewer files.

```js
describe.only("SyncFeedback controller", function () { ... });
```

Commit hygiene: remove the `.only()` before pushing — CI won't catch regressions in non-focused specs otherwise.

## Common failure modes

- **`Fatal error: LiveView server exited with code 1 before becoming ready`** — Usually a build error inside `ti serve`. Re-run without `--reuse-server` to see the full build output.
- **`failed to load config from walta-app/vite.config.js` with an ESM complaint** — `node_modules/vite` got bumped to ≥5 (ESM-only), which breaks `require('vite')`. Pin `vite` to `^4.5.0` in `package.json`; `.github/dependabot.yml` should already be excluding vite>=5 (see WB-36).
- **Stale code running on device** — Server from a different platform is cached. Drop `--reuse-server` for one run to force a fresh server.
- **Port 8323 stuck** — `lsof -ti:8323 | xargs kill -9` then re-run without `--reuse-server`.
- **App hangs at `[vite] connected.` with no further output** — a LiveView vite plugin errored while serving a source file; the server returned HTTP 500 with an HTML error page, and the Titanium require path hangs trying to eval it as JS. Curl the server directly for a specific file to see the real error: `curl -s http://<serve-host>:8323/lib/<path>.js | head -40`. For the exact request the client was fetching, dump the sim log: `xcrun simctl spawn booted log show --last 1m --predicate 'process == "Waterbug"' | grep ':8323'`. Historical cause: a plain JS class placed under `app/lib/models/` was matched by the Alloy Model plugin regex and run through `compileModel`, which only understands Backbone-style model definitions (fixed in liveview `fix/android-emulator-unit-test-support` by anchoring the regex to `appDir`).

## Validating the UI visually (iOS simulator)

`--manual` leaves the window open after the spec finishes so you can
inspect the rendered layout. Combined with `--grep=<Controller>`
this gives a focused preview of a single screen:

```bash
npx grunt --platform=ios --simulator --liveview \
  --grep=SyncFeedback --manual unit-test
```

`--manual` is designed to hang so you can interact with the screen —
the grunt process never exits on its own. Treat it as a background
task you capture and then kill. Typical sequence:

```bash
# 1. Kick off the run in the background (it will hang on purpose).
npx grunt --platform=ios --simulator --liveview \
  --grep=SyncFeedback --manual unit-test &

# 2. Wait until the spec opens the controller (tail the output
#    for the describe title), then give layout a moment to settle.
#    With the Bash tool: run in the background, poll the output
#    file for `SyncFeedback controller`, then sleep ~3s.

# 3. Take the screenshot.
xcrun simctl io booted screenshot /tmp/shot.png

# 4. Clean up the hung run — otherwise the next one can't start.
pkill -f "titanium serve"
```

The Waterbug app is landscape-locked, but the simulator screenshot
is captured in the device's physical portrait orientation — so the
PNG will look rotated 90° CCW. Rotate to the in-app orientation:

```bash
sips -r 90 /tmp/shot.png --out /tmp/shot-landscape.png
```

Useful for catching layout regressions the spec runner can't: widgets
clipped by parent bounds, children overflowing fixed-height containers,
or screens that haven't been touched since a shared TSS class changed
(e.g. the `.titlebar` class is shared across six screens — a change
there ripples everywhere). When in doubt, run each affected
`--grep=<name>` + screenshot to eyeball it — and remember to `pkill`
between runs.

## Running before push

Before marking a PR ready-for-review, run the command **without** `--liveview` as a final safety net — `npx grunt --platform=android --simulator unit-test` builds a fresh APK and runs the full spec bundle, which catches anything the LiveView dev-time bundling could paper over.

## When to prefer Node tests instead

Pure-JS code with no `Ti.*` or Alloy dependency belongs in `test/**/*_spec.js` and runs in < 1 s with `npx grunt unit-test-node`. Only drop down to the on-device loop when you actually need the device runtime.

See `docs/testing.md` for the full LiveView story (prerequisites for real devices, verbose vite logs, iOS-specific setup).
