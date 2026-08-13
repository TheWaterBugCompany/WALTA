const TrainingSuccessViewModel = require("mvvm/viewmodels/TrainingSuccess");

// Titanium-free screen controller for the training TrainingSuccess modal. Binds the
// congratulation message and routes Finish (→ main menu) / ✕ (dismiss).
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  successMessage: { text: "message" },
  finishButton:   { onClick: "finish" },
  closeButton:    { onClose: "close" },
};

module.exports = function createTrainingSuccessController({ view, close, services, bindView, args }) {
  const { correctCount = 0 } = args || {};
  const vm = new TrainingSuccessViewModel({ topics: services.topics, correctCount });
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
