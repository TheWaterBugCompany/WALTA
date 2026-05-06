# Writing device specs

Device specs (`walta-app/app/spec/*_spec.js`) run on a real or simulated device via the Titanium runtime. Use them when you need real `Ti.*` APIs, real Alloy controller construction, or a quick controller-level smoke test that's faster than acceptance.

This page is about **writing** them — idioms, helpers, gotchas. For how to **run** them (commands, LiveView, `--grep`, `--manual`), see [testing.md](testing.md).

## Stack

- Test runner: **mocha** via `spec/lib/ti-mocha`
- Assertions: **chai 4.x** via `spec/lib/chai` — pinned at 4.x because chai 6 is ESM-only and breaks the device runner
- Mocking: **simple-mock** via `spec/lib/simple-mock`

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

### Writing an `afterEach` that survives `--manual` mode

`closeWindow` deliberately does not auto-close the window when `--manual` is set, so a human can poke at the UI. Spec teardown that runs synchronous cleanup *before* the close handler fires can dead-lock the screen. Pattern:

```js
afterEach(async () => {
  await closeWindow(ctl.getView());  // wait for actual close
  ctl.cleanUp?.();                   // then dispose
});
```
