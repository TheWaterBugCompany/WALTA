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

module.exports = function bindView($, vm, bindings, palette) {
  validate($, vm, bindings);

  const eventTeardowns = [];

  function applyProps() {
    for (const widgetId in bindings) {
      const widget = $[widgetId];
      const widgetBindings = bindings[widgetId];
      for (const key in widgetBindings) {
        if (EVENT_KEY_RE.test(key)) continue;
        let value = vm[widgetBindings[key]];
        if (typeof value === "symbol" && palette) {
          value = palette[value.description];
        }
        // Only write on change: re-pushing an unchanged value into a text
        // input on every notify would reset the cursor mid-edit.
        if (widget[key] !== value) {
          widget[key] = value;
        }
      }
    }
  }

  // One-time event wiring.
  for (const widgetId in bindings) {
    const widget = $[widgetId];
    const widgetBindings = bindings[widgetId];
    for (const key in widgetBindings) {
      const m = key.match(EVENT_KEY_RE);
      if (!m) continue;
      const eventName = m[1].toLowerCase();
      const methodName = widgetBindings[key];
      const handler = function () { vm[methodName](); };
      eventTeardowns.push(attachEvent(widget, eventName, handler));
    }
  }

  applyProps();
  vm.addListener(applyProps);

  return function unbind() {
    vm.removeListener(applyProps);
    eventTeardowns.forEach(fn => fn());
  };
};

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
        if (!(ref in vm)) {
          throw new Error(`bindView: VM has no method "${ref}" (bound to ${widgetId}.${key})`);
        }
        if (typeof vm[ref] !== "function") {
          throw new Error(`bindView: VM property "${ref}" is not a function (bound to ${widgetId}.${key})`);
        }
        if (typeof widget.addEventListener !== "function" && typeof widget.on !== "function") {
          throw new Error(`bindView: widget "${widgetId}" has no event mechanism for ${key}`);
        }
      } else {
        if (!(ref in vm)) {
          throw new Error(`bindView: VM has no property "${ref}" (bound to ${widgetId}.${key})`);
        }
      }
    }
  }
}
