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

// Inbound marker: on a widget event, read a named widget property and push it
// into a VM setter — the reverse of a property binding. The Titanium-specific
// read stays generic (bindView never knows what contentOffset/size mean); the
// VM converts units (e.g. system-px → dip) behind its own injected converters.
//   content: { onScroll: input("setScrollOffset", "contentOffset") }
function input(method, prop) {
  return { __input: true, method, prop };
}

function isInput(ref) {
  return ref !== null && typeof ref === "object" && ref.__input === true;
}

// Reads a widget property, following a dotted path (e.g. "contentOffset.x") so a
// scroll input can bind straight to the axis it needs.
function readPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Inbound measurement: on each layout event, read a laid-out widget property and
// push it into a VM setter once it is usable. Reading a laid-out property is a
// portable idea (Flutter's LayoutBuilder, CSS's ResizeObserver); the Titanium
// wrinkles are absorbed *here*, inside the binding, not in a screen's shell:
// Titanium emits several postlayouts as a frame settles (measured — on iOS and
// Android it fires twice), so measure re-reads on each and the last settled reading
// wins; and a `postlayout` can arrive before layout has converged (a zero-sized or
// throwing read), so an unsettled reading waits rather than pushing.
//   content: { onPostlayout: measure("setViewport", "size") }
const MEASURE_INTERVAL = 100;
const MEASURE_MAX_ATTEMPTS = 30;

function measure(method, prop) {
  return { __measure: true, method, prop };
}

function isMeasure(ref) {
  return ref !== null && typeof ref === "object" && ref.__measure === true;
}

// A reading is settled once it is present and, if it carries layout dimensions, has
// a non-zero height — the shape of a laid-out frame. Non-dimensional readings are
// settled as soon as they are present.
function isSettled(value) {
  if (value == null) return false;
  if (typeof value === "object" && "height" in value && !(value.height > 0)) return false;
  return true;
}

// Outbound command marker: when the VM fires a named event, reflectively call a
// widget method with fixed args — the inverse of onClick, and the outbound
// counterpart to input(). Args are literals or ref("vmProp") resolved off the VM
// at fire time; bindView stays Titanium-agnostic (it never knows the method).
//   content: { snap: command("scrollToRightEnd", "scrollTo", ref("scrollTargetX"), 0, { animate: true }) }
function command(vmEvent, method, ...args) {
  return { __command: true, vmEvent, method, args };
}

function isCommand(ref) {
  return ref !== null && typeof ref === "object" && ref.__command === true;
}

// A command argument sourced from the VM (vs a literal), resolved when the VM
// event fires.
function ref(prop) {
  return { __ref: true, prop };
}

function isRef(a) {
  return a !== null && typeof a === "object" && a.__ref === true;
}

function resolveArgs(vm, args) {
  return args.map(a => (isRef(a) ? vm[a.prop] : a));
}

// Children-binding marker: drives a container's child views from a VM getter
// that returns a keyed list. bindView owns the keyed diff (create new / retain
// existing / dispose gone). The second arg is either:
//   - a component NAME (string) — the zero-glue convention: bindView builds the
//     adapter itself (key = item.key, create via the injected createComponent
//     factory, dispose via the handle, render-vs-add/remove by feature-detecting
//     setData). This is the common list case.
//   - omitted — the polymorphic convention: each item names its own component
//     via item.component (the tray's slots: a SampleTaxaIcon or a SampleTrayPlus).
function collection(getter, componentName) {
  if (componentName === undefined) {
    return { __collection: true, getter, polymorphic: true };
  }
  return { __collection: true, getter, componentName };
}

function isCollection(ref) {
  return ref !== null && typeof ref === "object" && ref.__collection === true;
}

// Single fixed nested component — the arity-1 sibling of collection. Mounts one
// child (built via createComponent) bound to a sub-VM the parent exposes, with no
// keyed diff (the child owns its own updates). The tray's endcap uses this.
//   tray: { endcap: component("endcapVm", "SampleTrayEndcap") }
function component(getter, name) {
  return { __component: true, getter, componentName: name };
}

function isComponent(ref) {
  return ref !== null && typeof ref === "object" && ref.__component === true;
}

// Outbound setter binding: some Alloy sub-controllers take their state through a
// method rather than a property (PhotoSelect's photos arrive via setImage(urls)).
// apply() drives one from a VM getter — called on bind and whenever the value
// changes, so it reads like any other property binding at the call site.
//   photoSelect: { setImage: apply("photoUrls") }
function apply(getter) {
  return { __apply: true, getter };
}

function isApply(ref) {
  return ref !== null && typeof ref === "object" && ref.__apply === true;
}

// The VM method name an on<Event> binding targets — a plain string handler or a
// call()/input()/measure() marker.
function methodOf(ref) {
  if (isCall(ref) || isInput(ref) || isMeasure(ref)) return ref.method;
  return ref;
}

function propOf(ref) {
  return isTwoWay(ref) ? ref.prop : ref;
}

module.exports = function bindView($, vm, bindings, options) {
  validate($, vm, bindings);

  const palette = options && options.palette;
  const createComponent = options && options.createComponent;
  const eventTeardowns = [];
  // Last value pushed through each setter binding: unlike a property, a setter
  // can't be read back to see whether it would change anything.
  const applied = new Map();

  function applyProps() {
    for (const widgetId in bindings) {
      const widget = $[widgetId];
      const widgetBindings = bindings[widgetId];
      for (const key in widgetBindings) {
        const binding = widgetBindings[key];
        if (EVENT_KEY_RE.test(key) || isCollection(binding) || isCommand(binding) || isComponent(binding)) continue;
        if (isApply(binding)) {
          const next = vm[binding.getter];
          const seen = `${widgetId}.${key}`;
          if (applied.get(seen) !== next) {
            applied.set(seen, next);
            widget[key](next);
          }
          continue;
        }
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
        if (isMeasure(ref)) {
          eventTeardowns.push(attachMeasure(widget, eventName, vm, ref));
        } else {
          const handler = isCall(ref)
            ? function () { vm[ref.method](...ref.args); }
            : isInput(ref)
            ? function () { vm[ref.method](readPath(widget, ref.prop)); }
            : function () { vm[ref](); };
          eventTeardowns.push(attachEvent(widget, eventName, handler));
        }
      } else if (isTwoWay(ref)) {
        const prop = ref.prop;
        const handler = function (e) { vm[prop] = e.value; };
        eventTeardowns.push(attachEvent(widget, "change", handler));
      } else if (isCollection(ref)) {
        eventTeardowns.push(setupCollection(vm, widget, ref, createComponent));
      } else if (isComponent(ref)) {
        eventTeardowns.push(setupComponent(vm, widget, ref, createComponent));
      } else if (isCommand(ref)) {
        const handler = function () { widget[ref.method](...resolveArgs(vm, ref.args)); };
        vm.on(ref.vmEvent, handler);
        eventTeardowns.push(() => vm.off(ref.vmEvent, handler));
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
// re-runs on every notifyListeners (a collection add/remove). Returns a teardown
// that stops listening and disposes every child. A scroll-windowed list (the
// SampleTray) drives its own reconcile Ti-side by feeding vm.setScrollOffset(),
// which notifies — so it flows through this same path with no special casing.
// The zero-glue convention: bindView builds the child adapter itself so a
// Titanium-free screen controller declares only collection(getter, name). key
// reads item.key; create goes through the injected createComponent factory —
// the single seam that must reach Titanium, kept in bindView's options and out
// of the controller. render vs add/remove is chosen by feature-detecting
// setData (TableView renders the whole ordered list; ScrollView adds/removes).
function conventionAdapter(marker, container, createComponent) {
  if (typeof createComponent !== "function") {
    throw new Error(`bindView: collection("${marker.getter}") needs a createComponent factory in options`);
  }
  const usesSetData = typeof container.setData === "function";
  // A fixed-name list uses one component; a polymorphic list lets each item name
  // its own (item.component). A polymorphic list is also order-preserving: an item
  // can change component in place, so container order must track item order (a
  // fixed-name list's items keep their component, so append-only order is stable).
  const nameFor = marker.polymorphic ? (item) => item.component : () => marker.componentName;
  return {
    key: (item) => item.key,
    create: (item) => createComponent(nameFor(item), { rowVm: item }),
    dispose: (handle) => handle.dispose(),
    ordered: marker.polymorphic === true && !usesSetData,
    render: usesSetData
      ? (c, handles) => c.setData(handles.map((h) => h.view))
      : undefined,
  };
}

// A container takes its children either the ordinary way or, for a paged surface
// like ScrollableView, through addView/removeView. Feature-detected the same way
// setData is, so a pager is just another container rather than its own binding.
function attachTo(container) {
  return typeof container.addView === "function"
    ? (view) => container.addView(view)
    : (view) => container.add(view);
}

function detachFrom(container) {
  return typeof container.removeView === "function"
    ? (view) => container.removeView(view)
    : (view) => container.remove(view);
}

// Builds one fixed nested child from vm[getter] and adds it to the container;
// disposes + detaches it on teardown. No keyed diff — the sub-VM is stable and
// the child owns its own property updates.
function setupComponent(vm, container, marker, createComponent) {
  if (typeof createComponent !== "function") {
    throw new Error(`bindView: component("${marker.componentName}") needs a createComponent factory in options`);
  }
  const handle = createComponent(marker.componentName, { rowVm: vm[marker.getter] });
  attachTo(container)(handle.view);
  return function teardown() {
    detachFrom(container)(handle.view);
    if (typeof handle.dispose === "function") handle.dispose();
  };
}

function setupCollection(vm, container, marker, createComponent) {
  const adapter = conventionAdapter(marker, container, createComponent);
  const handles = new Map();
  const attach = attachTo(container);
  const detach = detachFrom(container);

  // Two container styles: incremental (ScrollView — add/remove each child) and
  // render (TableView — the adapter re-applies the whole ordered list via
  // setData). The keyed diff below is identical either way; only how the diff
  // reaches the container differs.
  function reconcile() {
    const items = vm[marker.getter] || [];
    const desired = new Map(items.map((it) => [adapter.key(it), it]));
    let membershipChanged = false;
    for (const [k, handle] of handles) {
      if (!desired.has(k)) {
        if (!adapter.render) detach(handle.view);
        adapter.dispose(handle);
        handles.delete(k);
        membershipChanged = true;
      }
    }
    items.forEach((it) => {
      const k = adapter.key(it);
      if (!handles.has(k)) {
        const handle = adapter.create(it);
        handles.set(k, handle);
        // An ordered adapter re-attaches everything below so a swapped child lands
        // in position, not appended; others attach here.
        if (!adapter.render && !adapter.ordered) attach(handle.view);
        membershipChanged = true;
      }
    });
    if (adapter.render) {
      adapter.render(container, items.map((it) => handles.get(adapter.key(it))));
    } else if (adapter.ordered && membershipChanged) {
      // Flow-laid children (the tray's polymorphic slots) must follow item order
      // even when a middle slot swaps component. Re-attach every child in order;
      // container.remove is a no-op on a not-yet-attached (freshly created) child.
      for (const it of items) detach(handles.get(adapter.key(it)).view);
      for (const it of items) attach(handles.get(adapter.key(it)).view);
    }
  }

  reconcile();
  vm.addListener(reconcile);

  return function teardown() {
    vm.removeListener(reconcile);
    for (const handle of handles.values()) {
      if (!adapter.render) detach(handle.view);
      adapter.dispose(handle);
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

// Re-reads the widget property on every layout event and pushes the reading into
// the VM setter once it is settled. Titanium emits several postlayouts as a frame
// settles, so the last (settled) one wins — a later layout that corrects the size
// simply overwrites the earlier reading. A settled read short-circuits; an
// unsettled or throwing one starts a bounded timer fallback for the rare case where
// a lone unsettled layout has no follow-up. Returns a teardown that cancels a
// pending retry and detaches the event.
function attachMeasure(widget, eventName, vm, ref) {
  let timer = null;
  function cancelTimer() { if (timer) { clearTimeout(timer); timer = null; } }
  function poll(attempt) {
    let value;
    try { value = readPath(widget, ref.prop); }
    catch (e) { value = undefined; }
    if (isSettled(value)) { vm[ref.method](value); return; }
    if (attempt < MEASURE_MAX_ATTEMPTS) {
      timer = setTimeout(function () { poll(attempt + 1); }, MEASURE_INTERVAL);
    }
  }
  const detachEvent = attachEvent(widget, eventName, function () {
    cancelTimer(); // a fresh layout supersedes any in-flight retry chain
    poll(0);
  });
  return function () {
    cancelTimer();
    detachEvent();
  };
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
      } else if (isApply(ref)) {
        if (!(ref.getter in vm)) {
          throw new Error(`bindView: VM has no property "${ref.getter}" (bound to setter ${widgetId}.${key})`);
        }
        if (typeof widget[key] !== "function") {
          throw new Error(`bindView: widget "${widgetId}" has no setter "${key}"`);
        }
      } else if (isCommand(ref)) {
        if (typeof widget[ref.method] !== "function") {
          throw new Error(`bindView: widget "${widgetId}" has no method "${ref.method}" (bound to command ${widgetId}.${key})`);
        }
        if (typeof vm.on !== "function") {
          throw new Error(`bindView: VM has no event mechanism for command ${widgetId}.${key}`);
        }
      } else if (isCollection(ref)) {
        if (!(ref.getter in vm)) {
          throw new Error(`bindView: VM has no collection getter "${ref.getter}" (bound to ${widgetId}.${key})`);
        }
        // The adapter is synthesised from the component name (or item.component
        // for a polymorphic list) at setup, where its createComponent requirement
        // is checked.
      } else if (isComponent(ref)) {
        if (!(ref.getter in vm)) {
          throw new Error(`bindView: VM has no component getter "${ref.getter}" (bound to ${widgetId}.${key})`);
        }
      } else {
        if (!(ref in vm)) {
          throw new Error(`bindView: VM has no property "${ref}" (bound to ${widgetId}.${key})`);
        }
      }
    }
  }
}

// Pre-bind the View-side dependencies (createComponent, palette) so a screen
// controller receives a ready binder from the View seam and never wires a
// Titanium dependency itself — keeping mvvm/controllers a pure DSL layer. The
// returned binder carries the markers, so a controller can `const { collection }
// = bindView` off it. A per-call options object still overrides the defaults.
function makeBinder(createComponent, palette) {
  const binder = function (view, vm, bindings, options) {
    return module.exports(view, vm, bindings, Object.assign({ createComponent, palette }, options));
  };
  binder.twoWay = twoWay;
  binder.call = call;
  binder.input = input;
  binder.measure = measure;
  binder.command = command;
  binder.ref = ref;
  binder.collection = collection;
  binder.component = component;
  return binder;
}

module.exports.twoWay = twoWay;
module.exports.call = call;
module.exports.input = input;
module.exports.measure = measure;
module.exports.command = command;
module.exports.apply = apply;
module.exports.ref = ref;
module.exports.collection = collection;
module.exports.component = component;
module.exports.makeBinder = makeBinder;
