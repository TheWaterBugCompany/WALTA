# Screen controllers

A **screen controller** (`lib/mvvm/controllers/<Name>.js`) is the Titanium-free
composition root for a screen: it builds the screen's ViewModel, `bindView`s it
to the widgets it is handed, and routes the ViewModel's named events out to
orchestration. `View` instantiates one for any window *or* modal whose name is
registered — the same split serves both.

## The factory

```js
// lib/mvvm/controllers/Academy.js
module.exports = function createAcademyController({ view, close, services, bindView }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());
  return { vm, dispose() { unbind(); vm.dispose(); } };
};
```

The factory receives its context and returns `{ vm, dispose() }`:

- **`view`** — the Alloy controller (`$`), the widget map to bind against.
- **`close`** — a Titanium-free way to dismiss the screen. For a window it closes
  the window; for a modal it calls `View.closeModal()`. The screen controller asks
  to close without ever touching `Ti.*`.
- **`services`** — the services bag (for a window, `View`'s own; for a modal, the
  bag passed to `openModal`).
- **`bindView`** — the binder, **pre-bound by `View`** (via `makeBinder`) with its
  Titanium-side dependencies: the component factory for lists and the colour
  palette for Symbol getters. The controller calls `bindView(view, vm, BINDINGS)`
  and threads no Ti wiring of its own. The markers hang off it
  (`const { collection } = bindView`); import them statically from `util/bindView`
  only when a *module-scope* `BINDINGS` const needs one (Academy builds `call()`
  markers at load time). See [architecture-vision.md](../architecture-vision.md)
  "The presentation DSL".
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

## Data sources

A screen's data comes through an injected **source**, not from the window shell or
inline model access. The Alloy-model reads live in a lib module registered in the
services bag; the screen controller builds its ViewModel from `services.<source>`:

```js
// lib/logic/SampleHistorySource.js  — Alloy models are allowed here, Ti views are not
module.exports = ({ cerdiApi }) => ({
  loadAll() { const c = Alloy.createCollection("sample"); c.loadSampleHistory(cerdiApi.retrieveUserId()); return c.map(toRowData); },
  loadOne(id) { /* Alloy.createModel("sample")... */ },
});

// index-app.js — wired into the bag
services.sampleSource = SampleHistorySource({ cerdiApi: services.cerdiApi });

// lib/mvvm/controllers/SampleHistory.js — builds the VM from the injected source
new SampleHistoryViewModel({ sampleSource: services.sampleSource, topics: services.topics });
```

Model access (`Alloy.createCollection` / `createModel`) *is* allowed in the mvvm
layer — only Ti **views** are off-limits — but concentrating it in one injected
source keeps the controller Node-testable (fake the source), gives a future model
abstraction a single place to swap, and maps directly to a Flutter repository
injected via DI.

## Lists — the collection convention

Bind a list container with `collection(getter, "ComponentName")`. `bindView` owns
the keyed diff (create new / retain / dispose gone) **and** the row lifecycle: from
a component name it synthesises the adapter — `key = item.key`, create via the
injected component factory, dispose via the handle, and TableView `setData` vs
ScrollView add/remove chosen by feature detection. The screen controller declares
one line and no Titanium:

```js
// lib/mvvm/controllers/SampleHistory.js
const { collection } = bindView;
bindView(view, vm, { sampleTable: { rows: collection("rows", "SampleHistoryRow") } });
```

Each row is a **first-class component** (`lib/mvvm/controllers/SampleHistoryRow`)
that binds its own row view-model and **fires its own intent** — a tap fires the
`EDIT_SAMPLE` topic directly, so the list needs no per-row wiring. The per-row
click ownership (which fixes dropped click dispatch on reused/reordered Android row
proxies) lives in the row, not the list.

The row VM exposes a `key` getter — the identity the keyed diff reconciles on
(the convention, mirroring a Flutter `ValueKey`).

The explicit `collection(getter, adapter)` form — an object with
`{ key, create, render, dispose }` — remains as the **escape hatch** for cases a
name convention can't cover. Reach for it only there; anything the convention
covers stays in the convention.

### Polymorphic lists and single fixed children

Two arity variants cover the tray:

- **`collection(getter)`** with *no* name is **polymorphic** — each item names its
  own component via an `item.component` getter, so one list can mix component
  types. The tray's cells use this: a slot is a `SampleTaxaIcon` (taxon/blank) or a
  `SampleTrayPlus` (add), swapped by kind. The item `key` carries the component
  (`"0:SampleTaxaIcon"`) so a slot that changes type is recreated, not wrongly
  retained. A polymorphic list is also **order-preserving** — because an item can
  change component in place, `bindView` re-attaches children in item order rather
  than appending, so a flow-laid grid stays correctly ordered after a swap.
- **`component(getter, "Name")`** mounts **one fixed child** bound to a sub-VM — the
  arity-1 sibling of `collection`, no keyed diff. The tray's endcap uses it (there
  is always exactly one), instead of a fake single-item collection.

```js
// tray: one endcap + a windowed list of tiles — both the same SampleTrayTile
// component (the endcap is just a tile whose spec caps it); each holds polymorphic slots
tray:          { endcap: component("endcapVm", "SampleTrayTile"),
                 tiles:  collection("visibleTiles", "SampleTrayTile") },
holeContainer: { taxa:  collection("taxa") },   // slots pick their own component
```

## Inbound Titanium & commands

`bindView` is not only outbound (VM → widget property). A screen with genuine
Titanium *input* — a scroll offset, a measured viewport — or an imperative *output
effect* declares those through `bindView` too, so the Alloy shell holds no
view-model and no wiring. The scroll-windowed SampleTray is driven this way:

```js
content: {
  onPostlayout: measure("setViewport", "size"),
  onScroll:     input("setScrollOffset", "contentOffset.x"),
  snapRight:    command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }),
}
```

- **`input(vmMethod, propPath)`** — on a widget event, read a widget property
  (dotted paths allowed) and push it into a VM setter. The reverse of a property
  binding.
- **`measure(vmMethod, propPath)`** — on each layout event, read a laid-out
  property and push it into a VM setter once it is usable. Measuring a laid-out
  view is portable (Flutter's `LayoutBuilder`, CSS's `ResizeObserver`); the
  Titanium wrinkles are encapsulated *inside* the binding, not in a shell — see
  below.
- **`command(vmEvent, widgetMethod, ...args)`** + **`ref("vmProp")`** — when the
  VM fires a named event, reflectively call a widget method with literal /
  VM-derived args. The inverse of `onClick`.

`bindView` stays Titanium-agnostic — it only reads/writes properties and calls
named methods; it never knows what `contentOffset` or `scrollTo` mean. Unit
conversion (system-px ↔ dip) lives in the **view-model** behind injected
converters, so the VM is still Node-testable with fakes. These bindings retire the
inbound shell seam a hand-off method (`attachViewModel`) would otherwise need — the
default is to grow `bindView`, not to escape it.

### A framework quirk lives inside the binding, not beside it

Why the viewport measurement is a `measure` *binding* and not a shell hack: the
distinction that matters is **interface vs implementation**, not "portable feature
vs Titanium wart." Reading a laid-out size is a portable idea, so `measure` earns a
place in the DSL. Titanium's wrinkles behind it — verified on device: `postlayout`
fires *twice* as a frame settles, and can fire early with a zero-sized or throwing
read — are absorbed inside `measure`'s implementation: it **re-reads on each layout
so the last settled reading wins**, and waits out an unsettled one (with a bounded
timer fallback for a lone unsettled layout). The screen controller writes only
`measure("setViewport", "size")` and the VM's `setViewport` is a plain setter with
no readiness signal. A Flutter port swaps `measure`'s implementation for a
`LayoutBuilder` and keeps the same binding and the same `setViewport`. So the rule
is *grow the portable binding and hide the framework quirk in its implementation* —
not "push the quirk into the shell."

## Three tiers (MVVMC)

A screen is split so all logic is Titanium-free and portable, with the residual
Titanium concentrated in one place:

| Tier | File | Holds |
|---|---|---|
| Alloy presenter | `controllers/<Name>.js` + `views/<Name>.xml` | **residual Titanium only** — the view tree, plus keyboard hacks, `Ti.UI.SIZE`, sub-controller creation. Not inert, but holds no decision logic. (Layout measurement is a `measure` binding now, not shell code.) |
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

`bindView` is **one implementation** of the binder DSL: on a Flutter port its
collection reconciler is *deleted*, because Flutter's Element reconciler already
does the keyed diff, and the injected component factory dissolves into constructing
a widget. See [architecture-vision.md](../architecture-vision.md) "The presentation
DSL" for the portability test that keeps a controller transcribable to `build()`.

## Testing

Node spec with fake widgets — no device, no emulator:

```js
// test/controllers/Academy_spec.js
const create = require("../../walta-app/app/lib/mvvm/controllers/Academy");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const lib = create({ view: fakeWidgets(), close: () => {}, services: {}, bindView: makeBinder() });
// A list controller passes the fake factory: makeBinder(fakeCreateComponent).
```

The device-level rendering is covered separately by `walta-app/app/spec/`
controller specs and by `View_spec.js` (which pins that the registry resolves the
real factory, not the Alloy shell).

## See also

- [viewmodels.md](viewmodels.md) — the ViewModel + `bindView` convention the screen controller hosts.
- [modals.md](modals.md) — the modal-specific overlay open/close glue.
- [screen-plumbing.md](screen-plumbing.md) — Topics → Navigation → View, and where `openView` sits.
