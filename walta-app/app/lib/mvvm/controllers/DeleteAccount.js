const DeleteAccountViewModel = require("mvvm/viewmodels/DeleteAccount");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// these are needed here at module scope to build BINDINGS.
const { twoWay } = require("util/bindView");

// Titanium-free screen controller for the Delete Account modal.
// See docs/patterns/modals.md for the pattern.
const BINDINGS = {
  passwordField: { value: twoWay("password") },
  deleteButton:  { enabled: "deleteEnabled", backgroundColor: "deleteColor", onClick: "confirmDelete" },
  // The outline lives on a frame around the button, with white between the two,
  // so the body colour and the outline colour never meet.
  deleteButtonFrame: { borderColor: "deleteOutlineColor" },
  closeButton:   { onClose: "close" },   // the ✕ (CloseButton Require)
  cancelButton:  { onClick: "close" },   // the "Close" text button
};

module.exports = function createDeleteAccountController({ view, close, services, bindView }) {
  const vm = new DeleteAccountViewModel({
    cerdiApi: services.cerdiApi,
    topics: services.topics,
  });
  const unbind = bindView(view, vm, BINDINGS);

  // Both failures leave the account exactly as it was, so both are told
  // through the dialog seam and leave the modal up to try again.
  vm.on("passwordIncorrect", () => services.dialogs.alert({
    title: "Password Incorrect",
    message: "That password was not correct. Please try again.",
  }));

  vm.on("deleteFailed", () => services.dialogs.alert({
    title: "Account Not Deleted",
    message: "Your account could not be deleted. Please check your connection and try again.",
  }));

  vm.on("close", () => close());

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};
