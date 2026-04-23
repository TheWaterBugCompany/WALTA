# ViewModels — MVVM convention

This folder holds **ViewModels**: plain-JavaScript classes that own the state and
actions of a UI screen or component, independent of Alloy, Titanium, and the DOM.

Controllers stay thin plumbing: they instantiate a ViewModel, forward user input
to its methods, and render its state. The ViewModel has no Titanium imports and
can be unit-tested in Node in milliseconds.

## Why

- **Testability** — Node-speed unit tests for view logic, without a device or
  emulator.
- **Portability** — a future move off Titanium is easier when view logic isn't
  fused to Alloy.
- **Clarity** — one place to read and reason about a screen's state machine.

## Folder layout

```
walta-app/app/lib/logic/viewmodels/   # ViewModel classes
test/viewmodels/                      # Node-runnable specs (Mocha + Chai)
```

The Mocha glob in `Gruntfile.js` is `test/**/*_spec.js`, so specs in
`test/viewmodels/` are picked up by `npx grunt unit-test-node`.

## Convention

### Class shape

Each ViewModel is an ES6 class exported via CommonJS. Dependencies are injected
through the constructor so tests can fake them.

```js
class ExampleViewModel {
  constructor({ topics, network }) {
    this._topics = topics;
    this._network = network;
    this.state = { /* plain object, serialisable */ };
    this._listeners = [];
  }

  subscribe(cb) {
    this._listeners.push(cb);
    return () => {
      this._listeners = this._listeners.filter(l => l !== cb);
    };
  }

  // User actions — methods that mutate state and notify listeners.
  doSomething() {
    this._setState({ /* ... */ });
  }

  dispose() {
    // unsubscribe from Topics, clear timers, etc.
    this._listeners = [];
  }

  _setState(patch) {
    this.state = Object.assign({}, this.state, patch);
    this._listeners.forEach(cb => cb(this.state));
  }
}

module.exports = ExampleViewModel;
```

### State

- Plain object on `this.state` — no Backbone models, no `Alloy.Models`, no
  Titanium proxies. Anything that serialises with `JSON.stringify` is fine.
- Treat state as immutable: replace with `Object.assign({}, this.state, patch)`
  rather than mutating fields in place. This keeps subscribers' diffing simple
  if they ever need it.

### Actions

Public methods represent user intents. They mutate state (via `_setState`) and
optionally fire Topics. They do not touch Titanium UI directly — that's the
Controller's job.

### Events in / out

- **In**: `Topics.subscribe` through the injected `topics` service.
- **Out**: call `fireTopicEvent` through the same injected service, **or** emit
  via the subscribe/notify callback pattern (for view-only concerns like
  "please close the popup" that don't belong on the global event bus).

## Controllers hosting a ViewModel

The Alloy controller is the thinnest possible glue:

```js
// controllers/Example.js
const ExampleViewModel = require("logic/viewmodels/Example");
const Topics = require("ui/Topics");

const vm = new ExampleViewModel({ topics: Topics });
const unsubscribe = vm.subscribe(render);
render(vm.state);

$.someButton.addEventListener("click", () => vm.doSomething());

function render(state) {
  $.label.text = state.someField;
  $.container.visible = state.status !== "idle";
}

exports.cleanUp = function () {
  unsubscribe();
  vm.dispose();
};
```

The Controller owns the view binding; the ViewModel owns the state machine.

## Testing

Specs live in `test/viewmodels/` and use the existing Mocha + Chai setup
(`npx grunt unit-test-node`). Fake the injected services — no Titanium is
loaded.

```js
// test/viewmodels/Example_spec.js
require("mocha");
const { expect } = require("chai");
const ExampleViewModel = require("../../walta-app/app/lib/logic/viewmodels/Example");

describe("ExampleViewModel", function () {
  it("transitions to 'ready' when started", function () {
    const vm = new ExampleViewModel({ topics: fakeTopics() });
    vm.start();
    expect(vm.state.status).to.equal("ready");
  });
});

function fakeTopics() {
  return { subscribe() {}, unsubscribe() {}, fireTopicEvent() {} };
}
```

On-device rendering is still covered by a small controller spec under
`walta-app/app/spec/` that renders the view for each state and asserts the
visible output. The VM spec covers the state machine; the controller spec
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
matching spec for the state machine contract.
