const AcademyViewModel = require("viewmodels/Academy");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// call() is needed here at module scope to build BINDINGS.
const { call } = require("util/bindView");

// Titanium-free screen controller for the Academy modal.
// See docs/patterns/modals.md for the pattern.
const BINDINGS = {
  digit1:       { title: "digit1", onClick: call("startEditing", 0) },  // tap-to-edit box → open picker
  digit2:       { title: "digit2", onClick: call("startEditing", 1) },
  digit3:       { title: "digit3", onClick: call("startEditing", 2) },
  digitPicker:  { visible: "pickerVisible", onClick: "cancelPicker" },  // tap backdrop to dismiss
  startButton:  { enabled: "startEnabled", onClick: "start" },
  closeButton:  { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton: { onClick: "close" },   // the "Close" text button
};
for (let d = 0; d <= 9; d++) BINDINGS["keypad" + d] = { onClick: call("pickDigit", d) };

module.exports = function createAcademyController({ view, close, services, bindView }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);

  // Starting a session launches training for the entered code (loads the
  // exercise, opens a session, announces the tray on the bus). On a known code we
  // dismiss the modal and open the training tray — Navigation threads the session's
  // tray/assessor from the TRAINING_STARTED it just fired. An unknown code is a
  // no-op, leaving the modal up.
  vm.on("start", function (code) {
    if (services.Training.startTraining(code)) {
      close();
      services.topics.fireTopicEvent(services.topics.SAMPLETRAY, {});
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
