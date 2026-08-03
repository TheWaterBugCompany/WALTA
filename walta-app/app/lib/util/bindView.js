// Declarative glue between a ChangeNotifier-style ViewModel and
// Alloy-bound widgets. Takes a bindings map and wires both property
// updates (re-applied on notifyListeners) and one-time events:
//
//   bindView($, vm, {
//     message:         { visible: "messageVisible", text: "message" },
//     progressFill:    { backgroundColor: "progressColor", width: "progressWidth" },
//     logToggleButton: { title: "logToggleLabel", onClick: "toggleLog" },
//     closeButton:     { onClose: "close" },                // Alloy sub-ctl
//     ...
//   });
//
// Keys inside each widget entry:
//   <plain>          — widget property ← vm getter (re-applied on notify)
//   <plain>: twoWay("prop") — as above, plus the widget's `change` event
//                    writes back into the vm setter (two-way binding)
//   on<EventName>    — widget event  → vm method (camelCase → lowercase)
//
// Event wiring feature-detects the target:
//   - `addEventListener`/`removeEventListener` (Ti widgets) is preferred.
//   - `.on`/`.off` (Backbone-style, Alloy Require'd sub-controllers)
//     is the fallback.
//
// Initial values are applied immediately. Returns an unbind function
// that removes BOTH the ChangeNotifier listener and every event
// handler registered during setup.
//
// Optional 4th arg `palette`: when a bound getter returns a Symbol,
// bindView resolves it via palette[Symbol.description]. Used for
// Palette colour Symbols (see docs/patterns/viewmodels.md "Semantic
// palette colours"). bindView itself stays Titanium-free.

const EVENT_KEY_RE = /^on([A-Z].*)$/;

function twoWay(prop) {
  return { __twoWay: true, prop };
}

function isTwoWay(ref) {
  return ref !== null && typeof ref === "object" && ref.__twoWay === true;
}

// Event-handler marker that binds a VM method with fixed arguments, so the
// controller can wire e.g. onClick: call("pickDigit", 3) without reaching for
// Titanium's addEventListener itself. Keeps all Ti wiring behind bindView.
function call(method, ...args) {
  return { __call: true, method, args };
}

function isCall(ref) {
  return ref !== null && typeof ref === "object" && ref.__call === true;
}

// Children-binding marker: drives a container's child views from a VM getter
// that returns a keyed list. bindView owns the keyed diff (create new / retain
// existing / dispose gone). The second arg is either:
//   - a component NAME (string) — the zero-glue convention: bindView builds the
//     adapter itself (key = item.key, create via the injected createComponent
//     factory, dispose via the handle, render-vs-add/remove by feature-detecting
//     setData). This is the common list case.
//   - an explicit ADAPTER (object) — the escape hatch for the irreducible cases
//     (scroll-windowed lists need scrollEvent/onScroll; anything bespoke).
function collection(getter, adapterOrName) {
  if (typeof adapterOrName === "string") {
    return { __collection: true, getter, componentName: adapterOrName };
  }
  return { __collection: true, getter, adapter: adapterOrName };
}

function isCollection(ref) {
  return ref !== null && typeof ref === "object" && ref.__collection === true;
}

// The VM method name an on<Event> binding targets, whether it's a plain
// string handler or a call() marker.
function methodOf(ref) {
  return isCall(ref) ? ref.method : ref;
}

function propOf(ref) {
  return isTwoWay(ref) ? ref.prop : ref;
}

module.exports = function bindView($, vm, bindings, options) {
  validate($, vm, bindings);

  const palette = options && options.palette;
  const createComponent = options && options.createComponent;
  const eventTeardowns = [];

  function applyProps() {
    for (const widgetId in bindings) {
      const widget = $[widgetId];
      const widgetBindings = bindings[widgetId];
      for (const key in widgetBindings) {
        if (EVENT_KEY_RE.test(key) || isCollection(widgetBindings[key])) continue;
        let value = vm[propOf(widgetBindings[key])];
        if (typeof value === "symbol" && palette) {
          value = palette[value.description];
        }
        // Only write on change: re-pushing an unchanged value into a text
        // input on every notify would reset the cursor mid-edit. This same
        // guard closes the two-way feedback loop (setter → notify → applyProps).
        if (widget[key] !== value) {
          widget[key] = value;
        }
      }
    }
  }

  // One-time event wiring: on<Event> keys and two-way `change` write-back.
  for (const widgetId in bindings) {
    const widget = $[widgetId];
    const widgetBindings = bindings[widgetId];
    for (const key in widgetBindings) {
      const ref = widgetBindings[key];
      const m = key.match(EVENT_KEY_RE);
      if (m) {
        const eventName = m[1].toLowerCase();
        const handler = isCall(ref)
          ? function () { vm[ref.method](...ref.args); }
          : function () { vm[ref](); };
        eventTeardowns.push(attachEvent(widget, eventName, handler));
      } else if (isTwoWay(ref)) {
        const prop = ref.prop;
        const handler = function (e) { vm[prop] = e.value; };
        eventTeardowns.push(attachEvent(widget, "change", handler));
      } else if (isCollection(ref)) {
        eventTeardowns.push(setupCollection(vm, widget, ref, createComponent));
      }
    }
  }

  applyProps();
  vm.addListener(applyProps);
  eventTeardowns.push(reapplyOnFirstLayout($, applyProps));

  return function unbind() {
    vm.removeListener(applyProps);
    eventTeardowns.forEach(fn => fn());
  };
};

// Reconciles a container's children against vm[getter] by stable key, and
// re-runs on every notifyListeners (a collection add/remove). The scroll-driven
// window will trigger the same reconcile directly (not through notify) so the
// per-frame path stays a cheap delta. Returns a teardown that stops listening
// and disposes every child.
// The zero-glue convention: bindView builds the child adapter itself so a
// Titanium-free screen controller declares only collection(getter, name). key
// reads item.key; create goes through the injected createComponent factory —
// the single seam that must reach Titanium, kept in bindView's options and out
// of the controller. render vs add/remove is chosen by feature-detecting
// setData (TableView renders the whole ordered list; ScrollView adds/removes).
function conventionAdapter(name, container, createComponent) {
  if (typeof createComponent !== "function") {
    throw new Error(`bindView: collection("${name}") needs a createComponent factory in options`);
  }
  const usesSetData = typeof container.setData === "function";
  return {
    key: (item) => item.key,
    create: (item) => createComponent(name, { rowVm: item }),
    dispose: (handle) => handle.dispose(),
    render: usesSetData
      ? (c, handles) => c.setData(handles.map((h) => h.view))
      : undefined,
  };
}

function setupCollection(vm, container, marker, createComponent) {
  const adapter = marker.adapter || conventionAdapter(marker.componentName, container, createComponent);
  const handles = new Map();

  // Two container styles: incremental (ScrollView — add/remove each child) and
  // render (TableView — the adapter re-applies the whole ordered list via
  // setData). The keyed diff below is identical either way; only how the diff
  // reaches the container differs.
  function containerAdd(handle) {
    if (adapter.attach) adapter.attach(container, handle);
    else container.add(handle.view);
  }
  function containerRemove(handle) {
    if (adapter.detach) adapter.detach(container, handle);
    else container.remove(handle.view);
  }

  function reconcile() {
    const items = vm[marker.getter] || [];
    const desired = new Map(items.map((it) => [adapter.key(it), it]));
    for (const [k, handle] of handles) {
      if (!desired.has(k)) {
        if (!adapter.render) containerRemove(handle);
        if (adapter.dispose) adapter.dispose(handle);
        handles.delete(k);
      }
    }
    items.forEach((it) => {
      const k = adapter.key(it);
      if (!handles.has(k)) {
        const handle = adapter.create(it);
        handles.set(k, handle);
        if (!adapter.render) containerAdd(handle);
      } else if (adapter.update) {
        adapter.update(handles.get(k), it);
      }
    });
    if (adapter.render) {
      adapter.render(container, items.map((it) => handles.get(adapter.key(it))));
    }
  }

  reconcile();
  vm.addListener(reconcile);

  // Scroll-driven windows (the tray) reconcile from the container's own scroll
  // event, not through notifyListeners — so a fling never re-pulls every other
  // bound property. onScroll injects the Titanium offset read/convert.
  let detachScroll = () => {};
  if (adapter.scrollEvent) {
    const onScroll = (e) => {
      if (adapter.onScroll) adapter.onScroll(e, container);
      reconcile();
    };
    container.addEventListener(adapter.scrollEvent, onScroll);
    detachScroll = () => container.removeEventListener(adapter.scrollEvent, onScroll);
  }

  return function teardown() {
    vm.removeListener(reconcile);
    detachScroll();
    for (const handle of handles.values()) {
      if (!adapter.render) containerRemove(handle);
      if (adapter.dispose) adapter.dispose(handle);
    }
    handles.clear();
    if (adapter.render) adapter.render(container, []);
  };
}

// iOS silently drops writes to some properties — accessibilityLabel is the
// known one — when they are made before the view is realised. bindView runs at
// controller construction, which is exactly that window, so the values are
// re-applied once the view reports its first layout.
function reapplyOnFirstLayout($, applyProps) {
  const view = typeof $.getView === "function" ? $.getView() : null;
  if (!view || typeof view.addEventListener !== "function") return () => {};

  let detach = () => {
    view.removeEventListener("postlayout", onFirstLayout);
    detach = () => {};
  };
  function onFirstLayout() {
    detach();
    applyProps();
  }
  view.addEventListener("postlayout", onFirstLayout);
  return () => detach();
}

function attachEvent(target, eventName, handler) {
  if (typeof target.addEventListener === "function") {
    target.addEventListener(eventName, handler);
    return () => target.removeEventListener(eventName, handler);
  }
  if (typeof target.on === "function") {
    target.on(eventName, handler);
    return () => target.off && target.off(eventName, handler);
  }
  throw new Error(`bindView: target has no event mechanism (needs addEventListener or .on)`);
}

function validate($, vm, bindings) {
  for (const widgetId in bindings) {
    if (!(widgetId in $)) {
      throw new Error(`bindView: widget "${widgetId}" not found on $`);
    }
    const widget = $[widgetId];
    const widgetBindings = bindings[widgetId];
    for (const key in widgetBindings) {
      const ref = widgetBindings[key];
      if (EVENT_KEY_RE.test(key)) {
        const methodName = methodOf(ref);
        if (!(methodName in vm)) {
          throw new Error(`bindView: VM has no method "${methodName}" (bound to ${widgetId}.${key})`);
        }
        if (typeof vm[methodName] !== "function") {
          throw new Error(`bindView: VM property "${methodName}" is not a function (bound to ${widgetId}.${key})`);
        }
        if (typeof widget.addEventListener !== "function" && typeof widget.on !== "function") {
          throw new Error(`bindView: widget "${widgetId}" has no event mechanism for ${key}`);
        }
      } else if (isTwoWay(ref)) {
        if (!(ref.prop in vm)) {
          throw new Error(`bindView: VM has no property "${ref.prop}" (bound two-way to ${widgetId}.${key})`);
        }
        if (typeof widget.addEventListener !== "function" && typeof widget.on !== "function") {
          throw new Error(`bindView: widget "${widgetId}" has no event mechanism for two-way ${key}`);
        }
      } else if (isCollection(ref)) {
        if (!(ref.getter in vm)) {
          throw new Error(`bindView: VM has no collection getter "${ref.getter}" (bound to ${widgetId}.${key})`);
        }
        // A named-component marker's adapter is synthesised at setup (and its
        // createComponent requirement checked there); only an explicit adapter
        // is validated here.
        if (ref.adapter && (typeof ref.adapter.key !== "function" || typeof ref.adapter.create !== "function")) {
          throw new Error(`bindView: collection adapter for ${widgetId}.${key} needs key() and create()`);
        }
      } else {
        if (!(ref in vm)) {
          throw new Error(`bindView: VM has no property "${ref}" (bound to ${widgetId}.${key})`);
        }
      }
    }
  }
}

module.exports.twoWay = twoWay;
module.exports.call = call;
module.exports.collection = collection;
