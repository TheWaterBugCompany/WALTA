const MethodSelectViewModel = require("viewmodels/MethodSelect");
// Marker for the module-scope BINDINGS; the binder itself is injected.
const { collection } = require("util/bindView");

// Titanium-free screen controller for the MethodSelect modal. Builds the
// view-model from the caller's payload and binds its entries as a collection of
// MenuButton components — each row-VM routes through the VM (no-op when disabled)
// and greys itself in training mode. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  content:     { entries: collection("entries", "MenuButton") },
  closeButton: { onClose: "close" },
};

module.exports = function createMethodSelectController({ view, close, services, bindView, args }) {
  const { training = false, allowAddToSample = false, surveyType = null, unknownBug = false, position = null } = args || {};
  const vm = new MethodSelectViewModel({
    topics: services.topics, training, allowAddToSample, surveyType, unknownBug, position,
  });
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
