const SuccessViewModel = require("viewmodels/Success");

// Titanium-free screen controller for the training Success modal. Binds the
// congratulation message and routes Finish (→ main menu) / ✕ (dismiss).
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  successMessage: { text: "message" },
  finishButton:   { onClick: "finish" },
  closeButton:    { onClose: "close" },
};

module.exports = function createSuccessController({ view, close, services, bindView, args }) {
  const { correctCount = 0 } = args || {};
  const vm = new SuccessViewModel({ topics: services.topics, correctCount });
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
