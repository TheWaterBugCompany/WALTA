// Declarative glue between a ChangeNotifier-style ViewModel and
// Alloy-bound widgets. Replaces a hand-written `render()` function
// with a bindings map:
//
//   bindView($, vm, {
//     message:      { visible: "messageVisible", text: "message" },
//     progressFill: { backgroundColor: "progressColor", width: "progressWidth" },
//     progressText: { text: "progressText" },
//     ...
//   });
//
// Applies initial values immediately, then re-applies on every
// `vm.notifyListeners()` call. Returns an unbind function that
// stops further updates (typically called from the controller's
// cleanUp).

module.exports = function bindView($, vm, bindings) {
  validate($, vm, bindings);

  function apply() {
    for (const widgetId in bindings) {
      const widget = $[widgetId];
      const widgetBindings = bindings[widgetId];
      for (const widgetProp in widgetBindings) {
        widget[widgetProp] = vm[widgetBindings[widgetProp]];
      }
    }
  }

  apply();
  vm.addListener(apply);
  return function unbind() { vm.removeListener(apply); };
};

function validate($, vm, bindings) {
  for (const widgetId in bindings) {
    if (!(widgetId in $)) {
      throw new Error(`bindView: widget "${widgetId}" not found on $`);
    }
    const widgetBindings = bindings[widgetId];
    for (const widgetProp in widgetBindings) {
      const vmProp = widgetBindings[widgetProp];
      if (!(vmProp in vm)) {
        throw new Error(`bindView: VM has no property "${vmProp}" (bound to ${widgetId}.${widgetProp})`);
      }
    }
  }
}
