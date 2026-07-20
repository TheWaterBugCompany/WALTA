# ViewModels — MVVM convention

This folder holds **ViewModels**: plain-JavaScript classes that own the state and
actions of a UI screen or component, independent of Alloy, Titanium, and the DOM.

Controllers stay thin plumbing: they instantiate a ViewModel and declare a
widget-to-ViewModel binding. The ViewModel has no Titanium imports and can be
unit-tested in Node in milliseconds.

## Why

- **Testability** — Node-speed unit tests for view logic, without a device or
  emulator.
- **Portability** — a future move off Titanium is easier when view logic isn't
  fused to Alloy.
- **Clarity** — one place to read and reason about a screen's state machine.

## Folder layout

```
walta-app/app/lib/viewmodels/         # ViewModel classes
walta-app/app/lib/util/ChangeNotifier.js  # listener base class
walta-app/app/lib/util/bindView.js    # declarative controller glue
test/viewmodels/                      # Node-runnable specs (Mocha + Chai)
```

The Mocha glob in `Gruntfile.js` is `test/**/*_spec.js`, so specs in
`test/viewmodels/` are picked up by `npx grunt unit-test-node`.

## Convention

### Class shape

Each ViewModel is an ES6 class extending `ChangeNotifier` and exported via
CommonJS. Dependencies are injected through the constructor so tests can fake
them.

```js
const ChangeNotifier = require("../util/ChangeNotifier");

class ExampleViewModel extends ChangeNotifier {
  constructor({ syncController }) {
    super();
    this._syncController = syncController;
    this._logVisible = false;
  }

  // State is exposed as getters, computed from private fields and
  // injected dependencies.
  get status()     { return this._syncController.status; }
  get logVisible() { return this._logVisible; }
  get message()    { return this.status === "offline" ? OFFLINE_MSG : ""; }

  // User actions — methods that mutate private fields and notify.
  toggleLog() {
    this._logVisible = !this._logVisible;
    this.notifyListeners();
  }

  // One-shot view events (not state) — fire via trigger().
  close() {
    this.trigger("close");
  }

  dispose() {
    this._syncController.removeListener(this._onSyncChange);
    super.dispose();
  }
}

module.exports = ExampleViewModel;
```

### State

State is exposed as **getters**. Private fields (prefixed `_`) hold the
underlying values; getters compose them — often mixing locally-owned fields
with values read from an injected model or controller. Some useful properties
of this shape:

- **Derived values are cheap.** `get message()` can condition on other getters
  without keeping a denormalised copy in sync.
- **Consumers re-read from the ViewModel.** `notifyListeners()` is a plain signal
  with no payload; `bindView` re-pulls every bound getter on notify.
- **Composable.** A ViewModel can delegate getters to a model it holds — see how
  `SyncFeedbackViewModel` reads `status`/`percent`/etc. straight off the
  injected `syncController`, which is itself a `ChangeNotifier`.

### Actions

Public methods represent user intents. They mutate private fields and call
`notifyListeners()`. They do not touch Titanium UI directly — that's the
Controller's job.

### Events in / out

`ChangeNotifier` provides two distinct channels:

- **State-change broadcast** — `addListener(cb)` / `removeListener(cb)` /
  `notifyListeners()`. The callback takes no arguments; listeners re-read from
  the ViewModel's getters. This is what `bindView` subscribes to.
- **Named events** — `on(event, cb)` / `off(event, cb)` / `trigger(event, data)`.
  Use this for one-shot view concerns that don't belong in re-renderable state
  ("user asked to close", "navigate to diagnostics"). The controller forwards
  these to `Topics` or to its own `$` trigger as needed.

For external-model input, subscribe to an injected `ChangeNotifier` model in
the constructor and re-fire your own `notifyListeners` (see
`SyncFeedbackViewModel`). For `Topics` input, inject the `topics` service and
subscribe the same way.

## Controllers hosting a ViewModel

Use `bindView` from `app/lib/util/bindView.js`. It takes a declarative
widget-to-ViewModel bindings map and handles both property updates (re-applied on
`notifyListeners`) and one-time event wiring:

```js
// controllers/Example.js
var ExampleViewModel = require("viewmodels/Example");
var Topics = require("ui/Topics");
var bindView = require("util/bindView");

var vm = new ExampleViewModel({ syncController: $.args.syncController || SampleSync });

bindView($, vm, {
    message:           { visible: "messageVisible", text: "message" },
    progressFill:      { backgroundColor: "progressColor", width: "progressWidth" },
    logToggleButton:   { title: "logToggleLabel", onClick: "toggleLog" },
    closeBottomButton: { onClick: "close" },
    closeButton:       { onClose: "close" },    // Alloy <Require> sub-controller
});

// Named ViewModel events — forward to Topics or to the controller's own trigger.
vm.on("close",       function () { $.trigger("close"); });
vm.on("diagnostics", function () { Topics.fireTopicEvent(Topics.DIAGNOSTICS); });

exports.cleanUp = function () { vm.dispose(); };
```

### The bindings map

Each top-level key is an id from `$` (the Alloy widget map). Each nested key is
either:

- **A plain widget property** — value is the name of a ViewModel getter. The property
  is set once at bind time and re-set every time the ViewModel calls
  `notifyListeners()`.
- **An `on<Event>` key** (e.g. `onClick`, `onClose`) — value is the name of a
  ViewModel method. The event name is lower-cased (`onClick` → `click`) and bound
  once; the handler calls the method with no arguments.

Event wiring feature-detects the target:

- Titanium widgets — `addEventListener` / `removeEventListener`.
- Alloy `<Require>` sub-controllers — Backbone-style `.on` / `.off`.

`bindView` returns an `unbind()` function that removes both the
`ChangeNotifier` listener and every event handler it registered. Most
controllers don't need to call it — `vm.dispose()` in `cleanUp` is enough,
because it clears the ViewModel's listener list and the view is about to be
destroyed anyway.

### Bindings are applied twice: at setup and after first layout

iOS silently drops writes to some properties — `accessibilityLabel` is the
known one — when they are made before the view is realised. `bindView` runs at
controller construction, which is exactly that window, so it also re-applies
every bound property once the controller's view reports its first `postlayout`.

This matters because the failure is invisible on screen: the widget renders the
correct text and lays out at the correct width, and only the *accessibility
identifier* keeps its stale XML value. What breaks is acceptance and end-to-end
tests, which locate elements by that identifier (`~<label>.` — see
`features/support/base-screen.js`). A screen can look perfect in the simulator
and still fail every scenario that waits on it.

Controllers get this for free and need no `postlayout` handler of their own.
`bindView` finds the view via `$.getView()` and no-ops when there isn't one, so
it is safe for row and sub-view controllers too.

### Semantic palette colours

The colour palette lives in `app/config.json` under `global.colors` and is
exposed at runtime as `Alloy.CFG.colors`. ViewModels can't reference it
directly — `Alloy` doesn't exist in Node — but they can still own the *decision*
of which colour to use. The mechanism is `lib/util/Palette.js`: a plain object
whose values are Symbols, one per palette key.

```js
// lib/viewmodels/SyncFeedback.js
const Palette = require("../util/Palette");

get progressColor() {
  return this.status === "error" ? Palette.error : Palette.primary;
}
```

Each Symbol's `.description` matches the key in `config.json` (`"error"`,
`"primary"`, …). bindView accepts an optional 4th `palette` argument; when a
bound getter returns a Symbol, bindView resolves it through that palette.
Controllers pass `Alloy.CFG.colors`:

```js
// controllers/SyncFeedback.js
bindView($, vm, {
    progressFill: { backgroundColor: "progressColor", width: "progressWidth" },
    // ...
}, Alloy.CFG.colors);
```

The binding declaration looks the same as any other property binding — bindView
detects the Symbol and does the lookup. The ViewModel stays Titanium-free and
the only place that touches `Alloy.CFG.colors` is the controller.

Tests:

- ViewModel specs assert `expect(vm.progressColor).to.equal(Palette.error)` —
  semantic, no hex string.
- Controller / device specs assert
  `expect(ctl.progressFill.backgroundColor).to.equal(Alloy.CFG.colors.error)` —
  the rendered hex, which is the right level for a controller test.

To add a new palette colour, add the key to both `config.json` and `Palette.js`
in the same edit. The `.description` linkage is the contract; nothing enforces
it at compile time, so they have to be kept in step manually.

### When to step outside bindView

Not everything is declarative — and not everything belongs in the ViewModel in the
first place. The dividing line:

> **If the code exists only to work around a Titanium quirk — something you
> would throw away on a port to another framework — it belongs in the
> controller, not the ViewModel.**

The ViewModel describes *what the view should show*. The controller describes *how
Titanium is coerced into showing it*. Ti-specific workarounds pile up in the
controller alongside the `bindView` call, typically as a plain function
subscribed to the ViewModel:

- **Keyboard hacks** — wrapping content in a `ScrollView` on iOS, nudging
  layout on keyboard show/hide.
- **Postlayout measurements** — reading `rect.width` in a `postlayout`
  handler to size a sibling widget that can't express "my grandparent's
  width" in TSS.
- **Two-tone / clipped rendering tricks** — e.g. the overlapping
  dark/light progress text that relies on a clip container whose width
  tracks the fill.
- **Ti.UI.SIZE and other Ti-only values** — the ViewModel can't return
  `Ti.UI.SIZE` without breaking its Node spec, so a boolean getter
  (`messageVisible`) gets translated to a concrete height/top in the
  controller.

See `controllers/SyncFeedback.js` for worked examples of each.

## Testing

Specs live in `test/viewmodels/` and use the existing Mocha + Chai setup
(`npx grunt unit-test-node`). Fake the injected dependencies — no Titanium is
loaded. Read state via the ViewModel's getters.

```js
// test/viewmodels/Example_spec.js
require("mocha");
const { expect } = require("chai");
const ExampleViewModel = require("../../walta-app/app/lib/viewmodels/Example");
const ChangeNotifier = require("../../walta-app/app/lib/util/ChangeNotifier");

describe("ExampleViewModel", function () {
  it("flips logVisible when toggleLog is called", function () {
    const vm = new ExampleViewModel({ syncController: fakeSyncController() });
    expect(vm.logVisible).to.be.false;
    vm.toggleLog();
    expect(vm.logVisible).to.be.true;
  });
});

function fakeSyncController() {
  const ctl = new ChangeNotifier();
  ctl.status = "idle";
  return ctl;
}
```

On-device rendering is still covered by a small controller spec under
`walta-app/app/spec/` that renders the view for each state and asserts the
visible output. The ViewModel spec covers the state machine; the controller spec
covers only the state-to-DOM mapping.

## Toolchain support

ES6 classes work in both runtimes the project uses:

- **Node** (for unit tests): native since v6.
- **Titanium** (on-device): the Alloy 13.x compiler passes `class` syntax
  through untouched, and the vendored on-device mocha bundle at
  `walta-app/app/spec/lib/mocha.js` already uses `class Runner extends
  EventEmitter` successfully. No Babel config changes needed.

## First ViewModel

`SyncFeedback.js` — the sync-feedback popup for `SampleHistory`. See the
matching spec for the state machine contract and `controllers/SyncFeedback.js`
for the canonical `bindView` wiring.
