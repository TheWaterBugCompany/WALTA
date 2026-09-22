const TrainingSuccessViewModel = require("mvvm/viewmodels/TrainingSuccess");
const { component } = require("util/bindView");

// Titanium-free screen controller for the training TrainingSuccess modal. Binds the
// congratulation message and routes Finish (→ main menu) / ✕ (dismiss).
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  successMessage: { text: "message" },
  beltMessage:    { text: "beltMessage", visible: "beltVisible" },
  beltHolder:     { visible: "beltVisible", belt: component("beltVm", "Belt") },
  finishButton:   { onClick: "finish" },
  closeButton:    { onClose: "close" },
};

module.exports = function createTrainingSuccessController({ view, close, services, bindView, args }) {
  const { correctCount = 0 } = args || {};
  // The session has already been awarded by the time this modal opens, so the
  // belt held now is the one it earned.
  const belt = services.belts && services.belts.currentBelt();
  const vm = new TrainingSuccessViewModel({ topics: services.topics, correctCount, belt });
  const unbind = bindView(view, vm, BINDINGS);
  vm.on("close", () => close());

  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
