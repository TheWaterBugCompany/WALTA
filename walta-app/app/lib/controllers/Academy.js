const AcademyViewModel = require("viewmodels/Academy");
const bindView = require("util/bindView");

// Titanium-free screen controller for the Academy modal.
// See docs/patterns/modals.md for the pattern.
const BINDINGS = {
  digit1:       { text: "digit1" },   // display-only boxes; tapping one opens the picker
  digit2:       { text: "digit2" },
  digit3:       { text: "digit3" },
  digitPicker:  { visible: "pickerVisible", onClick: "cancelPicker" },  // tap backdrop to dismiss
  startButton:  { enabled: "startEnabled", onClick: "start" },
  closeButton:  { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton: { onClick: "close" },   // the "Close" text button
};

// A box tap carries which box (0-2), a key tap carries which digit — arguments
// bindView's arg-less event handlers can't pass, so wire them here.
function wireDigitPicker(view, vm) {
  const teardowns = [];
  function onClick(id, handler) {
    view[id].addEventListener("click", handler);
    teardowns.push(() => view[id].removeEventListener("click", handler));
  }
  [0, 1, 2].forEach((i) => onClick("digit" + (i + 1), () => vm.startEditing(i)));
  for (let d = 0; d <= 9; d++) onClick("keypad" + d, () => vm.pickDigit(d));
  return () => teardowns.forEach((fn) => fn());
}

module.exports = function createAcademyController({ view, close, services }) {
  const vm = new AcademyViewModel();
  const unbind = bindView(view, vm, BINDINGS);
  const unwire = wireDigitPicker(view, vm);

  // Inert for now — the training-session flow the code launches isn't built yet.
  vm.on("start", function () {});
  vm.on("close", function () { close(); });

  return {
    vm,
    dispose() {
      unwire();
      unbind();
      vm.dispose();
    },
  };
};
