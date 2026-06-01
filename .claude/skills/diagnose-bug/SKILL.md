---
name: diagnose-bug
description: Diagnose a bug — a user-reported defect, a failing/hanging test, an unexpected on-device behaviour, or a production crash. Forces diagnostics-first discipline (pull logs, screenshots, runtime state before forming a hypothesis) and reminds you that persisted dumps are snapshots, not tapes. Load whenever the next move is "figure out what's wrong" rather than "build the next thing".
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Diagnosing a bug (WALTA)

## The discipline: collect before you guess

The biggest failure mode is hypothesising before the evidence is in hand. A premature guess narrows the search; you head down one branch while a single log line would have pointed at the answer.

**Always, in this order:**

1. Capture the actual report verbatim — failing assertion, stack trace, stderr; or the user's exact words plus device + version + reproducible steps.
2. Pull the layer-appropriate runtime evidence (sim log, adb logcat, Appium log, diagnostic email, Bugfender capture, screenshot).
3. If the failure is visual / layout / scroll-related, screenshot the sim state.
4. *Only now* form hypotheses — aim for 2-3 distinct candidates ranked by likelihood, not one. One hypothesis is how the rabbit-hole starts: confirmation bias pulls evidence toward the guess and away from the truth. (Escape valve: if steps 1–3 make a single cause unambiguous, skip straight to the fix.)
5. Design a *discriminating experiment* — a single check whose result tells you which candidate is right (or that none are), not just "did my favourite one fail." Prefer reading specific code or running one targeted observation; not an edit.

If you catch yourself typing "I bet the issue is…" before step 3 is done, stop and finish the diagnostics. If you catch yourself with only one hypothesis at step 4, generate the next two before testing.

## Where evidence comes from

Pick the layers that match what's broken:

- **Persisted diagnostic dumps** (`.eml` from the device's Email Diagnostics button) — snapshot of `waterbug-log.txt` + `sample.csv` + `taxa.csv` + `photos.csv` at the moment the user pressed send. **A snapshot, not a tape.** Will routinely miss transient in-flight corruption that lives in the seconds between an edit and the next sync.
- **Bugfender** — captures every network call eagerly in the cloud, regardless of when the user emailed the diagnostic. Time-bound: **FREE plan retention is 1 day**, so respond within ~24h of the report before the logs roll off. Lookup via `mcp__bugfender__search_logs`; device UDID from the diagnostic email metadata. Filter by API host (`api-sandbox.waterbugblitz.org.au` for the sandbox).
- **Test runner output** — `npx grunt unit-test-node`, `npx grunt build-test`, or the on-device wrappers. Read the full failing assertion + stack trace verbatim.
- **OS-level device logs** — iOS sim and Android emulator both expose `Ti.API.*` output; see the per-layer playbook below.
- **Screenshots / page source** — for UI / layout / Appium element-not-found classes.
- **User narrative** — often steered by their mental model of where the bug must be. Verify, don't anchor. (See "Two paths" below.)

## Two paths when in-flight state is missing

Persisted dumps will miss any corruption that lives in a window of seconds. When you have a dump but it doesn't cover the corruption window, two complementary paths:

1. **Bugfender for the same window** — captures every network call regardless of when the user emailed. Respond inside 24h while the logs are still retained.
2. **Ask for another diagnostic dump with controlled timing** — when you suspect a specific window (e.g. "between the edit-save and the next sync"), ask the reporter to email diagnostics *at that exact moment*. The original dump's timing was driven by their mental model of the bug; if that model was off, the dump will be too.

WB-143 was diagnosable purely because Bugfender still had the logs. If the report had been a week old we'd have escalated to path 2. Both paths beat guessing.

## When the bug is user-reported (no failing test yet)

1. Capture the report verbatim and pull all available evidence (diagnostic email + Bugfender). Re-read the `project_diagnostic_capture_strategy` memory if the dump's coverage seems off.
2. **Reproduce as a unit spec first** before fixing. Write the failing test at the smallest layer that exhibits the bug (usually a Node spec or on-device unit spec). This is the WB-143 pattern: write a handful of RED specs spanning the suspected layers, run them, watch which fail; the failing one names the layer.
3. The RED spec becomes the lock against regression and the artefact you ship — see [tdd](../tdd/SKILL.md).
4. *Then* fix. Re-run; specs go green. Commit RED specs and the fix as separate commits for a clean red→green history (or together if scope is small — ask).

## When the bug surfaces as a test failure

### Node unit tests (`test/**/*_spec.js`)

Mocha output is usually sufficient — read the full stack trace, file paths and line numbers point at real code. No extra logs needed in 90% of cases.

If the test passes in isolation but fails in suite: shared-state leak. Re-run with `--grep` to isolate, then inspect global state that earlier tests touched.

### Device unit tests (`walta-app/app/spec/`, iOS sim)

1. Grunt output — failing test name + assertion message.
2. iOS simulator log — captures `Ti.API.*`, JS errors, native errors:
   ```bash
   xcrun simctl spawn booted log show --last 2m --predicate 'process == "Waterbug"' | head -200
   ```
3. Visual failure (layout, scroll, what's rendered) — screenshot:
   ```bash
   xcrun simctl io booted screenshot /tmp/shot.png \
     && sips -r 90 /tmp/shot.png --out /tmp/shot-landscape.png
   ```
4. Test hangs at `[vite] connected` or shows `Requested module not found: /@vite/client` — LiveView zombie-server. Confirm with:
   ```bash
   curl -s http://127.0.0.1:8323/ | head -5
   ```
   See [fast-iteration](../fast-iteration/SKILL.md) common failure modes.

### Device unit tests (Android emulator)

1. Grunt output.
2. logcat for TiAPI plus all errors:
   ```bash
   adb logcat -d -s "TiAPI:*" "*:E" | tail -200
   ```
3. Visual — screenshot:
   ```bash
   adb exec-out screencap -p > /tmp/shot.png
   ```

### Cucumber acceptance scenarios

1. Cucumber output — which `Given/When/Then` failed, expected vs actual.
2. Appium server log — path printed in the build output (or grep recent files in `/tmp` and the project root). Look for the failing element selector and what Appium thinks is on screen.
3. Screenshot at the moment of failure — check whether the harness auto-captures (look in `features/screenshots/` and similar) before adding one manually.
4. Page source dump — `driver.getPageSource()` shows the Appium element tree. The element you expected may not even be on screen.
5. OS-level logs per the device-unit playbook above — the JS-side error is usually in the sim/emulator log, not the Appium log.

If the cucumber run *hangs*: the previous scenario probably left the app in a state the current one doesn't expect. Look at the previous scenario's teardown / Given setup. Stale auth tokens or partially-uploaded samples are common culprits — see `project_app_config_runtime_override` memory.

### LiveView / build (when `npx grunt` itself fails before any test runs)

1. Re-run *without* `--reuse-server` to force a fresh build and surface the real error.
2. For ESM-related vite errors, check the `vite` version pin (must be `^4.5.0` — see fast-iteration common failure modes).
3. For "module not found" against your own source: curl the LiveView path directly to see if vite returned an HTML error page instead of JS:
   ```bash
   curl -s http://127.0.0.1:8323/lib/<your-file>.js | head -40
   ```

## Common red herrings

- **"It worked yesterday"** → first suspect: LiveView serving stale code. Drop `--reuse-server` for one run before going deeper.
- **`Connection refused` on :8323** → zombie LiveView server (port bound, process not responding). See fast-iteration.
- **Random intermittent failures** → almost always a race / hardcoded delay. Replace `waitForTick(N)()` with `waitFor(predicate)` polling.
- **"Assertion is right but the test shouldn't fail"** → re-read the assertion. Often you've misremembered what the code under test does. Re-derive the expected value from the source, not from intent.
- **Bugfender doesn't show new logs** → device-name search lags new hardware (see `project_bugfender_device_naming` memory). Search by raw device identifier.
- **iOS spec passes locally, fails in CI** → simulator UDID / device caps differ. Check the relWidth/relHeight printed at test start.
- **The reporter's diagnostic dump shows the "wrong" state** → their mental model steered the capture timing. The bug may live in a window the dump doesn't cover — fall back to Bugfender or ask for a re-capture timed precisely.

## When diagnostics don't show the cause

After steps 1–3, if the cause still isn't obvious:

- Re-read the test setup. The bug is more often in the fixture / mock / seed data than in the code under test.
- Look at what's *missing* from the logs — a milestone you expect but don't see means the code never got there.
- Compare against a passing run of an adjacent test. The diff is usually the cause.
- For a user-reported bug, **diagnose from both ends of every state transition**, not just the suspected one. WB-143 looked like a download bug; the real corruption was on the edit-save → upload side. Asking "what moment does this snapshot actually cover?" before settling on a hypothesis prevents anchoring on the first piece of evidence in hand.
- Then escalate: tell the user what you've checked and what you found, before going on a long expedition.

## See also

- [fast-iteration](../fast-iteration/SKILL.md) — LiveView failure modes in detail.
- [tdd](../tdd/SKILL.md) — turning a reproduction into a regression-locking spec.
- [/Users/msharman/Projects/WALTA/docs/testing.md](../../docs/testing.md) — the five test layers and what each catches.
