const MethodSelectViewModel = require("viewmodels/MethodSelect");

// Titanium-free screen controller for the MethodSelect modal. Builds the
// view-model from the caller's payload (allowAddToSample / surveyType / training)
// and binds each entry: a tap routes through the VM (which no-ops a disabled
// entry), and the VM's disabled getters grey the non-key options in training.
// See docs/patterns/screen-controllers.md.
module.exports = function createMethodSelectController({ view, close, services, bindView, args }) {
  const { training = false, allowAddToSample = false, surveyType = null } = args || {};
  const vm = new MethodSelectViewModel({ topics: services.topics, training, allowAddToSample, surveyType });

  const bindings = {
    keysearch:   { onClick: "keysearch" },
    speedbug:    { onClick: "speedbug",   disabled: "speedbugDisabled" },
    browselist:  { onClick: "browselist", disabled: "browseDisabled" },
    closeButton: { onClose: "close" },
  };
  if (view.unknownbug) {
    bindings.unknownbug = { onClick: "unknownbug", disabled: "unknownbugDisabled" };
  }

  const unbind = bindView(view, vm, bindings);
  vm.on("close", () => close());

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
