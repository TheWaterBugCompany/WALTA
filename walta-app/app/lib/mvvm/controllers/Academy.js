const AcademyViewModel = require("mvvm/viewmodels/Academy");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// these are needed here at module scope to build BINDINGS.
const { twoWay, command } = require("util/bindView");

// Titanium-free screen controller for the Academy modal.
// See docs/patterns/modals.md for the pattern.
// Each box takes the keyboard when the VM hands entry to it, so typing the code
// runs through all three boxes in one keyboard session; the last box gives the
// keyboard back once the code is complete, uncovering Start.
const BINDINGS = {
  digit1:       { value: twoWay("digit1"), takeKeyboard: command("focusDigit1", "focus") },
  digit2:       { value: twoWay("digit2"), takeKeyboard: command("focusDigit2", "focus") },
  digit3:       { value: twoWay("digit3"), takeKeyboard: command("focusDigit3", "focus"),
                  releaseKeyboard: command("codeComplete", "blur") },
  startButton:  { enabled: "startEnabled", backgroundColor: "startColor", borderColor: "startColor", onClick: "start" },
  closeButton:  { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton: { onClick: "close" },   // the "Close" text button
};

module.exports = function createAcademyController({ view, close, services, bindView }) {
  const vm = new AcademyViewModel({ isValidCode: (code) => services.Training.isValidCode(code) });
  const unbind = bindView(view, vm, BINDINGS);

  // On a known code, dismiss the modal and open the training tray. An unknown
  // code leaves the modal up.
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
