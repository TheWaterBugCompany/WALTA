# Modal screens

How a modal (an overlay above the current window, e.g. the Academy training-session
screen) is opened, wired, and torn down — as a first-class navigation concept with
the Titanium-specific glue kept in one place.

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
3. looks the modal up in `lib/mvvm/controllers/registry.js` and, if present, hands its
   Titanium-free screen controller the widgets plus a `close` callback.

`View.closeModal()` reverses it: remove the overlay, `dispose()` the screen
controller, destroy the Alloy controller. The `close` callback injected into the
screen controller *is* `View.closeModal`, so the modal asks to close without
touching Titanium itself.

## The two halves of a modal

A modal is split so that all logic is Titanium-free and portable:

- **`controllers/<Name>.js` + `views/<Name>.xml`** — the Alloy presenter shell. The
  view is the overlay markup (reuse the `overlay` / `window` / `titlebar` classes and
  the `CloseButton` `<Require>`); the controller holds no logic.
- **`lib/mvvm/controllers/<Name>.js`** — a Titanium-free screen controller. It builds the
  ViewModel, `bindView`s it to the widgets it was handed, and routes the ViewModel's
  named events to injected orchestration. No `Ti.*` / `Alloy.*`. Node-testable with
  fake widgets (see `test/controllers/Academy_spec.js`).

```js
// lib/mvvm/controllers/Academy.js
module.exports = function createAcademyController({ view, close, services }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());
  return { vm, dispose() { unbind(); vm.dispose(); } };
};
```

## Registry and incremental migration

`lib/mvvm/controllers/registry.js` maps modal name → screen-controller factory. A modal
**absent** from the registry still opens as a plain Alloy overlay — so legacy modals
(the identify `MethodSelect` overlay opened directly from `Menu.js`) keep working and
move onto this pattern one at a time.

## Why

Modals used to be opened ad hoc inside controllers (`$.TopLevelWindow.add(ctl.getView())`),
so the navigation layer had no idea they existed and each controller re-implemented
open/close/teardown. Routing them through `Navigation` makes "open a modal" a named,
reusable step (and leaves room to jump straight to one), while the `lib/mvvm/controllers`
split keeps the decision logic Titanium-free — the north-star from
[viewmodels.md](viewmodels.md) and [../architecture-vision.md](../architecture-vision.md).

## See also

- [screen-plumbing.md](screen-plumbing.md) — full-window navigation (Topics → Navigation → View).
- [viewmodels.md](viewmodels.md) — the ViewModel + `bindView` convention the screen controller uses.
