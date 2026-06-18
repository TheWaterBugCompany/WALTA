---
name: fast-iteration
description: Run on-device Titanium tests (unit specs or cucumber acceptance scenarios) via LiveView fast-iteration. Use when iterating on Alloy controllers / view specs / `Ti.*` code, running a focused acceptance scenario, visual UI inspection in the simulator (`--manual`), or filtering with `--grep`. Skip for pure-JS logic — `npx grunt unit-test-node` is faster.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Monitor
  - TaskStop
---

# Fast on-device iteration loop (unit specs + cucumber, LiveView)

**You can run device specs yourself, in-session, in a tight loop.** This is not
a CI-only or human-only step — cold build ~1–2 min, warm reruns ~20–30 s (see
Timing below). `--manual` + `xcrun simctl io booted screenshot` even gives you a
visual layout check. Default to running the device spec; only stay in Node for
genuinely pure-JS logic. If you catch yourself thinking "I can't run this on a
device here," you can — reach for this skill.

Runs unit specs (`walta-app/app/spec/*_spec.js`) or cucumber scenarios
(`features/**/*.feature`) against the Titanium runtime with LiveView, so
subsequent iterations skip the rebuild+install step.

## When to invoke this skill

- **any time you write or touch a device spec and want to actually run it** —
  this is the default loop, not an exceptional one
- "show me how X looks in the simulator" / "see the new panel" / "verify the layout"
- worst-case visual checks ("seed 500 entries and see how the pane copes")
- iterating on a controller / TSS / view file and wanting fast feedback
- "run only the X spec" or "only the Y cucumber scenario" — use `--grep`,
  **not** `describe.only(...)` or feature-file edits
- "leave the screen open so I can interact" — use `--manual` (unit-test only)

Skip when:

- the code under test is pure JS with no `Ti.*` / Alloy dependency → `npx grunt unit-test-node`
- you need the full acceptance suite to pass/fail in CI — run the regular
  `acceptance-test` task without `--liveview` for the final pre-merge check
- the test is an extensive, mechanism-heavy full-stack flow (e.g. sync
  interrupt/resume) — that belongs in the Mocha+Appium E2E layer
  (`end-to-end-testing/`), not a cucumber feature. See docs/testing.md;
  revival tracked in WB-104.

## The command

iOS is the faster path on Mac hosts (no Android emulator boot tax, smaller
build). Default to iOS unless you're chasing an Android-specific bug.

```bash
# Unit specs (mocha)
npx grunt --platform=ios --simulator --liveview --reuse-server unit-test

# Cucumber acceptance scenarios
npx grunt --platform=ios --simulator --liveview --reuse-server acceptance-test
```

The Android variants are the same with `--platform=android`.

**What each flag does:**

| Flag | Effect |
|---|---|
| `--platform=ios` \| `--platform=android` | Target platform |
| `--simulator` | Use the iOS simulator / Android emulator rather than a physical device |
| `--liveview` | Serve JS over a local Vite dev server on port 8323 instead of baking it into the bundle |
| `--reuse-server` | Reuse the LiveView server on :8323 if it is already running; otherwise start a fresh one. Safe to pass every run — only skip it when you want to force-restart the server (e.g. a zombie process is holding the port but not responding, see common failure modes) |
| `--grep=<pattern>` | (optional) Test-name filter. For `unit-test`, maps to mocha's `--grep` (matches the fully-qualified `describe > it` title). For `acceptance-test`, maps to cucumber-js `--name` (matches the scenario name). |
| `--manual` | (optional, **unit-test only**) Manual mode — `mocha.timeout(0)`, window stays open after the test so you can interact with the screen. On Android tap the "Continue" menu when you're done; on iOS the grunt process hangs (treat as a background task and `pkill` when done). **Narrow `--grep` to a single `it` block** — manual mode pauses after the first matching test, so any further matches in the same `describe` never execute. The `acceptance-test` task doesn't honour `--manual`. |

**Typical focused invocations:**

```bash
# Manually inspect one screen
npx grunt --platform=ios --simulator --liveview --reuse-server \
  --grep=SyncFeedback --manual unit-test

# Run one cucumber scenario
npx grunt --platform=ios --simulator --liveview --reuse-server \
  --grep="user uploads a sample" acceptance-test
```

Note: grunt options must use the `--flag=value` form (not `--flag value`)
or the value gets parsed as a task name.

**Timing (rough, M-series Mac, simulator/emulator already booted):**

- iOS cold run: ~1–2 min (Xcode build + sim install).
- Android cold run: ~2–3 min (gradle build + emulator install).
- Subsequent runs with `--reuse-server` (either platform): ~20–30 s (JS bundle reload only).

## Filtering with `--grep`, not `.only()` or feature edits

Always prefer `--grep=<pattern>` over editing source:

- **Unit specs**: `--grep` matches the fully-qualified mocha title
  (`describe` titles concatenated with the `it` title). Any regex-safe
  substring works. `.only()` is an escape hatch when grep gets awkward
  — revert before pushing.
- **Cucumber scenarios**: `--grep` is forwarded as `cucumber-js --name`,
  which matches the scenario name with a regex. Same hygiene applies —
  prefer `--grep` over tagging-and-untagging `@only`.

In both cases the runner still loads every spec / feature; the saving is
in skipping non-matching tests at runtime.

```bash
# Run just the SyncFeedback unit describe
npx grunt --platform=ios --simulator --liveview --reuse-server --grep=SyncFeedback unit-test

# Run a specific mocha it
npx grunt --platform=ios --simulator --liveview --reuse-server --grep="tail-scrolls" unit-test

# Run one cucumber scenario by name
npx grunt --platform=ios --simulator --liveview --reuse-server --grep="user logs in" acceptance-test
```

## Common failure modes

- **`Fatal error: LiveView server exited with code 1 before becoming ready`** — Usually a build error inside `ti serve`. Re-run without `--reuse-server` to see the full build output.
- **`failed to load config from walta-app/vite.config.js` with an ESM complaint** — `node_modules/vite` got bumped to ≥5 (ESM-only), which breaks `require('vite')`. Pin `vite` to `^4.5.0` in `package.json`; `.github/dependabot.yml` should already be excluding vite>=5 (see WB-36).
- **Stale code running on device** — Server from a different platform is cached. Drop `--reuse-server` for one run to force a fresh server.
- **Port 8323 stuck** — `lsof -ti:8323 | xargs kill -9` then re-run without `--reuse-server`.
- **Zombie LiveView server (sim shows `Connection refused` for `:8323/@vite/client`)** — `--reuse-server` only checks whether *something* is listening on :8323; if a stale `titanium serve` is holding the port but no longer responding, runs will look like they launch fine and then the app hangs at `Requested module not found: /@vite/client`. Kill it (`pkill -f "titanium serve"; lsof -ti:8323 | xargs kill -9`) and re-run *without* `--reuse-server` for one run.
- **Acceptance run boots fine once, then every `--reuse-server` rerun fails at the *first* `waitFor` (`MenuScreen not present`)** — the LiveView server goes stale as soon as its first app session ends; reusing it leaves the freshly-launched app unable to fetch its JS, so it never reaches the menu (you'll see `opening controller="Menu"` in the sim log but Appium times out waiting for it). Distinct from a build error — the build succeeds and 3 hooks pass before the first step dies. **For the acceptance loop, do not pass `--reuse-server`: kill the server and start fresh every run** (`pkill -9 -f "titanium serve"; lsof -ti:8323 | xargs kill -9`, then plain `--liveview`). `--reuse-server` is reliable for the *unit-test* loop (each run opens a fresh window in the same session) but not across separate cucumber runs.
- **Acceptance suite degrades after many runs in a session (boot hangs, WDA/session weirdness even with a fresh server)** — the simulator accumulates TCC/WDA/session cruft. `xcrun simctl shutdown <udid> && xcrun simctl erase <udid> && xcrun simctl boot <udid>` (then `xcrun simctl bootstatus <udid> -b`) clears it; the next run rebuilds WDA (slower) but boots clean. Reach for this when a scenario that passed earlier in the session starts failing at boot for no code reason.
- **App hangs at `[vite] connected.` with no further output** — a LiveView vite plugin errored while serving a source file; the server returned HTTP 500 with an HTML error page, and the Titanium require path hangs trying to eval it as JS. Curl the server directly for a specific file to see the real error: `curl -s http://<serve-host>:8323/lib/<path>.js | head -40`. For the exact request the client was fetching, dump the sim log: `xcrun simctl spawn booted log show --last 1m --predicate 'process == "Waterbug"' | grep ':8323'`. Historical cause: a plain JS class placed under `app/lib/models/` was matched by the Alloy Model plugin regex and run through `compileModel`, which only understands Backbone-style model definitions (fixed in liveview `fix/android-emulator-unit-test-support` by anchoring the regex to `appDir`).

## Validating the UI visually (iOS simulator, unit-test only)

`--manual` leaves the window open after the spec finishes so you can
inspect the rendered layout. Combined with `--grep=<Controller>` this
gives a focused preview of a single screen:

```bash
npx grunt --platform=ios --simulator --liveview \
  --grep=SyncFeedback --manual unit-test
```

`--manual` is designed to hang so you can interact with the screen —
the grunt process never exits on its own. Treat it as a background
task you capture and then kill.

**One `it` at a time.** Manual mode disables the mocha timeout and
holds the window open as soon as the first matching test reaches its
final assertion, so any *other* matching tests in the same run never
execute. If your grep matches a whole describe with multiple `it`s
(e.g. `--grep="tail-scrolls"` against a describe with two `it`s) you
will only ever see the first one. Tighten the grep to a unique
substring of the specific `it` title.

Typical sequence:

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
PNG will look rotated 90° from in-app orientation. Rotate to upright:

```bash
sips -r 90 /tmp/shot.png --out /tmp/shot-landscape.png
```

If the result is upside-down (the sim was holding the device in the
opposite landscape orientation from what `sips -r 90` assumes), flip
the result another 180°:

```bash
sips -r 180 /tmp/shot-landscape.png --out /tmp/shot-final.png
```

A single `sips -r 270` (or `-r -90`) on the original would do the
same in one shot — pick whichever ends upright on your sim and stick
with it.

Useful for catching layout regressions the spec runner can't: widgets
clipped by parent bounds, children overflowing fixed-height containers,
or screens that haven't been touched since a shared TSS class changed
(e.g. the `.titlebar` class is shared across six screens — a change
there ripples everywhere). When in doubt, run each affected
`--grep=<name>` + screenshot to eyeball it — and remember to `pkill`
between runs.

The `acceptance-test` task ignores `--manual` (cucumber runs to
completion); for visual checks always use the unit-test path.

## Running before push

Before marking a PR ready-for-review, run the relevant suite **without**
`--liveview` as a final safety net — it builds a fresh APK/app and runs
against a clean bundle, catching anything the LiveView dev-time bundling
could paper over.

```bash
npx grunt --platform=android --simulator unit-test
npx grunt --platform=android --simulator acceptance-test
```

## When to prefer Node tests instead

Pure-JS code with no `Ti.*` or Alloy dependency belongs in
`test/**/*_spec.js` and runs in < 1 s with `npx grunt unit-test-node`.
Only drop down to the on-device loop when you actually need the device
runtime.

See `docs/testing.md` for the full LiveView story (prerequisites for real
devices, verbose vite logs, iOS-specific setup).
