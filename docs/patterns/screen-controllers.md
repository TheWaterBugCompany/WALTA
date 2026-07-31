# Screen controllers

A **screen controller** (`lib/mvvm/controllers/<Name>.js`) is the Titanium-free
composition root for a screen: it builds the screen's ViewModel, `bindView`s it
to the widgets it is handed, and routes the ViewModel's named events out to
orchestration. `View` instantiates one for any window *or* modal whose name is
registered — the same split serves both.

## The factory

```js
// lib/mvvm/controllers/Academy.js
module.exports = function createAcademyController({ view, close, services, palette }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());
  return { vm, dispose() { unbind(); vm.dispose(); } };
};
```

The factory receives four things and returns `{ vm, dispose() }`:

- **`view`** — the Alloy controller (`$`), the widget map to bind against.
- **`close`** — a Titanium-free way to dismiss the screen. For a window it closes
  the window; for a modal it calls `View.closeModal()`. The screen controller asks
  to close without ever touching `Ti.*`.
- **`services`** — the services bag (for a window, `View`'s own; for a modal, the
  bag passed to `openModal`).
- **`palette`** — `Alloy.CFG.colors`, forwarded to `bindView` so Symbol-valued
  getters resolve (see [viewmodels.md](viewmodels.md) "Semantic palette colours").
- **`args`** — the open payload (`View.openView`/`openModal`'s `args`), so a modal
  can read what it was opened with. `MethodSelect` reads `allowAddToSample` /
  `surveyType` from here.

No `Ti.*` / `Alloy.*` — it is Node-testable with fake widgets (see
`test/controllers/Academy_spec.js`).

## Routing intents out

The screen controller keeps its view-model Titanium-free by routing intents to
injected seams, never reaching for `Ti.*` itself:

- **Navigation** — the view-model fires a `Topics` event (`Main.js` routes it to
  `Navigation`); e.g. `MenuViewModel.identify()` fires `SELECT_METHOD`, which opens
  the MethodSelect modal. Screen controllers don't import `Navigation`.
- **Native dialogs** — inject the `Dialogs` seam (`lib/logic/Dialogs.js`) and
  `await services.dialogs.confirm(...)`; the view-model owns the decision. Menu's
  logout is `if (await services.dialogs.confirm(...)) vm.logOut();`. Fake the seam
  in tests.

## Three tiers (MVVMC)

A screen is split so all logic is Titanium-free and portable, with the residual
Titanium concentrated in one place:

| Tier | File | Holds |
|---|---|---|
| Alloy presenter | `controllers/<Name>.js` + `views/<Name>.xml` | **residual Titanium only** — the view tree, plus keyboard hacks, `postlayout` measurements, `Ti.UI.SIZE`, sub-controller creation. Not inert, but holds no decision logic. |
| Screen controller | `lib/mvvm/controllers/<Name>.js` | builds the VM, `bindView`s it, routes VM events. No `Ti.*`. |
| ViewModel | `lib/viewmodels/<Name>.js` | screen state + actions, framework-free. |

The screen controller is deliberately **not** merged into the ViewModel: that
would couple the VM to the widgets and the binder and break its portability and
Node-testability.

## How `View` drives it

Both entry points look the screen up in `lib/mvvm/controllers/registry.js` and, if
present, instantiate its factory:

- **Windows** — `View.openView(name, args)` builds the Alloy controller, then
  `attachScreenController` instantiates the factory and disposes it on the
  window's `close` event (windows have no `closeView`, so `close` is the teardown
  hook).
- **Modals** — `View.openModal(name, args, services)` overlays the Alloy
  controller on the current window and instantiates the factory; `View.closeModal`
  disposes it. See [modals.md](modals.md).

A name **absent** from the registry still opens as a plain Alloy window/overlay —
so a screen moves onto this pattern one at a time.

## The port story

The Titanium coupling is concentrated into exactly two seams — `View`
(orchestration: open/close, lifecycle) and `bindView` (the binder). To port off
Titanium (e.g. to Flutter) you rewrite `View` + `bindView` and reimplement the
residual Ti left in the Alloy presenters; the ViewModels and screen controllers
come across untouched. That is the point of keeping the screen controller
`Ti.*`-free.

## Testing

Node spec with fake widgets — no device, no emulator:

```js
// test/controllers/Academy_spec.js
const create = require("../../walta-app/app/lib/mvvm/controllers/Academy");
const lib = create({ view: fakeWidgets(), close: () => {}, services: {}, palette: {} });
```

The device-level rendering is covered separately by `walta-app/app/spec/`
controller specs and by `View_spec.js` (which pins that the registry resolves the
real factory, not the Alloy shell).

## See also

- [viewmodels.md](viewmodels.md) — the ViewModel + `bindView` convention the screen controller hosts.
- [modals.md](modals.md) — the modal-specific overlay open/close glue.
- [screen-plumbing.md](screen-plumbing.md) — Topics → Navigation → View, and where `openView` sits.
