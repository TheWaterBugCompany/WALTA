const AcademyViewModel = require("mvvm/viewmodels/Academy");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// these are needed here at module scope to build BINDINGS.
const { component } = require("util/bindView");

// Titanium-free screen controller for the Academy modal.
// See docs/patterns/modals.md for the pattern.
const BINDINGS = {
  currentMessage:  { text: "currentMessage" },
  currentBelt:     { belt: component("currentBeltVm", "Belt") },
  nextMessage:     { text: "nextMessage", visible: "nextVisible" },
  nextBelt:        { visible: "nextVisible", belt: component("nextBeltVm", "Belt") },
  startButton:     { enabled: "startEnabled", backgroundColor: "startColor", borderColor: "startColor", onClick: "start" },
  closeButton:     { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton:    { onClick: "close" },   // the "Close" text button
};

module.exports = function createAcademyController({ view, close, services, bindView }) {
  const vm = new AcademyViewModel({
    level: services.belts ? services.belts.currentLevel() : 0,
    isValidCode: (code) => services.Training.isValidCode(code),
  });
  const unbind = bindView(view, vm, BINDINGS);

  vm.on("start", function (code) {
    if (services.Training.startTraining(code)) {
      close();
      services.topics.fireTopicEvent(services.topics.TRAININGTRAY);
    }
  });
  vm.on("close", function () { close(); });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};
