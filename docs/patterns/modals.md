# Modal screens

How a modal (an overlay above the current window, e.g. the Academy training-session
screen) is opened and torn down. A modal shares the Titanium-free screen-controller
split with windows — see [screen-controllers.md](screen-controllers.md); this page
covers only the modal-specific overlay glue.

## Opening a modal

Fire a Topic; `Main.js` routes it to `Navigation.openModal`:

```js
// lib/viewmodels/Menu.js
academy() { this._topics.fireTopicEvent(this._topics.ACADEMY); }

// controllers/Main.js
routePromise(Topics.ACADEMY, () => Navigation.openModal("Academy"));
```

`Navigation.openModal(name, args)` names the concept and delegates the Titanium
work to `View.openModal` (`lib/logic/View.js`), which:

1. `Alloy.createController(name, args)` — builds the overlay's widgets (`$`).
2. adds the overlay view onto the current window.
3. looks the modal up in `lib/mvvm/controllers/registry.js` and, if present,
   instantiates its screen controller with the widgets plus a `close` callback.

`View.closeModal()` reverses it: remove the overlay, `dispose()` the screen
controller, destroy the Alloy controller. The `close` callback handed to the
screen controller *is* `View.closeModal`, so the modal asks to close without
touching Titanium itself.

Modals live **outside** the `Navigation` history stack — `openModal` /
`closeModal` don't push or truncate. That's the one thing that makes a modal a
modal rather than a window (which `View.openView` opens through the history
stack; see [screen-plumbing.md](screen-plumbing.md)).

## A modal that owns its own lifecycle

A modal's screen controller can own more than dismissal — it can start work on
open and close itself on a domain event. The `SyncFeedback` modal starts the sync
when it opens and closes itself when the session ends:

```js
// lib/mvvm/controllers/SyncFeedback.js
module.exports = function ({ view, close, services }) {
  view.start();                       // openModal built us after adding the overlay, so the view is ready
  const onLoggedOut = () => close();  // close === View.closeModal — no Titanium here
  services.topics.subscribe(services.topics.LOGGEDOUT, onLoggedOut);
  return { dispose() { services.topics.unsubscribe(services.topics.LOGGEDOUT, onLoggedOut); } };
};
```

The *opener* (SampleHistory) stays free of the modal's lifecycle — it just fires
`START_SYNC`; the modal handles its own start and teardown. (`SyncFeedback` is
mid-migration: this lib controller owns the lifecycle, while its Ti view + the
`bindView` for it still live in the Alloy shell, which exposes `start()`/`cleanUp()`.)

## The Alloy overlay shell

`controllers/<Name>.js` + `views/<Name>.xml` is the Alloy presenter. The view is
the overlay markup — reuse the `overlay` / `window` / `titlebar` classes and the
`CloseButton` `<Require>`. The decision logic lives in the Titanium-free screen
controller, not here (see [screen-controllers.md](screen-controllers.md)).

## Why

Modals used to be opened ad hoc inside controllers
(`$.TopLevelWindow.add(ctl.getView())`), so the navigation layer had no idea they
existed and each controller re-implemented open/close/teardown. Routing them
through `Navigation` makes "open a modal" a named, reusable step (and leaves room
to jump straight to one), while the screen-controller split keeps the decision
logic Titanium-free.

A modal **absent** from the registry still opens as a plain Alloy overlay — so
legacy modals (the identify `MethodSelect` overlay opened directly from
`Menu.js`) keep working and move onto this pattern one at a time.

## See also

- [screen-controllers.md](screen-controllers.md) — the Titanium-free screen-controller split (shared with windows).
- [screen-plumbing.md](screen-plumbing.md) — full-window navigation (Topics → Navigation → View).
- [viewmodels.md](viewmodels.md) — the ViewModel + `bindView` convention the screen controller hosts.
