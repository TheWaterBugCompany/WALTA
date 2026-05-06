# Device Spec Idioms

Device specs (`walta-app/app/spec/*_spec.js`) run on a real or simulated device via the Titanium runtime. Use them when you need real `Ti.*` APIs, real Alloy controller construction, or a quick controller-level smoke test that's faster than acceptance.

## Stack

- Test runner: **mocha** via `spec/lib/ti-mocha`
- Assertions: **chai 4.x** via `spec/lib/chai` — pinned at 4.x because chai 6 is ESM-only and breaks the device runner ([memory note](../README.md))
- Mocking: **simple-mock** via `spec/lib/simple-mock`

## Running

```bash
# Fastest loop (LiveView reuses the dev server across runs)
npx grunt --platform=android --simulator --liveview --reuse-server unit-test

# Filter to specs matching a mocha grep pattern (preferred — no tracked-file edits).
# IMPORTANT: use --grep=… (with `=`). Bare `--grep "..."` makes grunt treat the
# value as a task name and aborts with `Task "..." not found`.
npx grunt --platform=android --simulator --liveview --reuse-server unit-test --grep="error state"

# Open the matching spec in manual mode so the screen stays open for human poking:
npx grunt --platform=android --simulator --liveview --reuse-server --manual unit-test --grep="error state"

# Last-resort filter when --grep isn't enough — add .only in the spec file.
# Avoid committing this; it breaks the rest of the suite in CI.
describe.only("My test", function() { ... });
```

`--grep` and `--manual` are both forwarded from `grunt` → the on-device test runner via `launchArgs` (see `Gruntfile.js` and `walta-app/app/spec/index.js`).

### Editing `config.json` while LiveView is running

Editing `app/config.json` (e.g. tweaking the `Alloy.CFG.colors` palette) while a LiveView dev server is running will usually crash the next reload with:

```
Unexpected error: Uncaught Error: Requested module not found:
  /@fs/.../node_modules/alloy/Alloy/lib/alloy/underscore.js
```

This is a known interaction between Alloy's compiler and LiveView's Vite-based HMR — not a code bug. Mechanism:

- `node_modules/alloy/Alloy/template/lib/alloy.js` (the file that becomes the `Alloy` global) starts with `require('/alloy/underscore')`. `/alloy/*` is a virtual Titanium-runtime path, not a filesystem path.
- Under LiveView, `Module.liveViewRequire` forwards that require to Vite. Vite only serves modules from the dependency graph it built lazily when the dev server started — it has no "look on disk" fallback for virtual paths.
- A `config.json` edit makes Alloy regenerate `alloy.js` with a fresh dependency tree. The new file's *bytes* get HMR'd into Vite, but Vite's *resolver graph* is stale — it doesn't know to pre-index the new imports. Next require → 404.

Workaround: drop `--reuse-server` (and ideally `--liveview` too) on the next run after editing `config.json`. LiveView is fine for source/style edits *between* config changes.

See also the `fast-device-test` skill.

## TestUtils helpers

From `walta-app/app/spec/util/TestUtils.js` — the ones worth knowing:

| Helper | When to use |
|--------|-------------|
| `clearDatabase()` | `beforeEach` — wipes the samples + taxa tables and resets `Alloy.Models` / `Alloy.Collections` |
| `controllerOpenTest(ctl)` | Open a controller and await its `postlayout` event — returns a Promise |
| `closeWindow(win, done)` | `afterEach` — closes a window and resolves on the `close` event. Honors `--manual` mode (won't auto-close so a human can drive the UI) |
| `actionFiresTopicTest(actionObj, evtName, topic)` | Fire `evtName` on `actionObj`, assert `topic` is published, return the topic payload |
| `wrapViewInWindow(view)` | Wrap a bare view in a window so it can be opened |
| `makeTestPhoto(name)` | Copy `site-mock.jpg` into `applicationDataDirectory` and return its path |

## Asserting against child controllers

When a parent controller embeds a child via `Alloy.createController("Foo")` and assigns it to `$.thing`, the child's `$`-namespaced views are reachable from the parent test:

```js
ctl.syncButton                  // the child controller object
ctl.syncButton.NavButton        // the child's root view (Alloy convention: $.<ControllerName>)
ctl.syncButton.label            // an inner view by id (e.g. <Label id="label"/>)
ctl.syncButton.button.enabled   // properties of inner views
ctl.syncButton.NavButton.fireEvent("click")  // simulate a tap
```

`getView()` on the child returns the root view — same as `child.<ControllerName>`. Use whichever reads better in context; both appear in existing specs.

## Common gotchas

### Test pollution

Module-level state leaks across specs because Titanium loads modules once per test session:

- **Topics subscribers** — a controller that subscribes in its top-level (e.g. `Topics.subscribe(Topics.LOGGEDIN, ...)`) can leave the listener registered after the test that created it tears down. Later specs that fire the same topic will trigger that listener.
- **`Alloy.Globals.CerdiApi`** — different specs assign different mocks (some use `MockCerdiApi`, some build a real `createCerdiApi(...)`). Whatever ran last wins. If your spec calls into a code path that uses `Alloy.Globals.CerdiApi`, mock the methods you need explicitly — don't rely on what's already there.
- **`SyncStore` singleton** — `lib/logic/SampleSync.js` holds a module-level `var syncStore = new SyncStore()`. State persists across tests. The SyncFeedback spec has a known issue where prior runs leave `status === "complete"`.
- **Module-level `isSyncing` flag** in `SampleSync` — if a previous test left a sync mid-flight, subsequent `startSynchronise` calls early-return.

When in doubt, mock the leaf functions your code path will actually hit (`retrieveUserToken`, `forceUpload`, etc.) rather than trying to clean up upstream state.

### `--manual` mode

`closeWindow` deliberately does not auto-close the window when `--manual` is set, so a human can poke at the UI. Spec teardown that runs synchronous cleanup *before* the close handler fires can dead-lock the screen. Pattern:

```js
afterEach(async () => {
  await closeWindow(ctl.getView());  // wait for actual close
  ctl.cleanUp?.();                   // then dispose
});
```

### `mocha-bootstrap.js` is device-only

Don't `require` it from Node.js specs — Node specs use Mocha directly and don't load Titanium globals.

## Mocking `Ti.*` in Node specs

Node specs (`test/*_spec.js`) have no Titanium runtime. Mock `Ti.Network.createHTTPClient` by injecting a fake via the module's `ProxyCreateHTTPClient` export — see `test/CerdiApi_spec.js` for the canonical pattern.
