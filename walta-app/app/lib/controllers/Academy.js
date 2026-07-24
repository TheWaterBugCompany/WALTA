const AcademyViewModel = require("viewmodels/Academy");
const bindView = require("util/bindView");
const { twoWay } = bindView;

// Titanium-free screen controller for the Academy modal. View owns the Titanium
// widgets (the $ bag) and hands them in as `view`; this file owns everything
// non-Titanium: build the ViewModel, bind it, and route the ViewModel's named
// events to injected orchestration. `close` is injected so closing the overlay
// stays a Titanium concern (View.closeModal); `services` carries collaborators
// for when Start grows a real training-session flow.
const BINDINGS = {
  digit1:       { value: twoWay("digit1") },
  digit2:       { value: twoWay("digit2") },
  digit3:       { value: twoWay("digit3") },
  startButton:  { enabled: "startEnabled", onClick: "start" },
  closeButton:  { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton: { onClick: "close" },   // the "Close" text button
};

module.exports = function createAcademyController({ view, close, services }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);

  // Inert for now — the training-session flow the code launches isn't built yet.
  vm.on("start", function () {});
  vm.on("close", function () { close(); });

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};
