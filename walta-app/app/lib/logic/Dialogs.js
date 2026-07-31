// Titanium native dialogs behind a seam, so screen controllers can ask for a
// confirmation without touching Ti. Injected via the services bag; fake it in
// tests. See docs/patterns/screen-controllers.md.

// Show a native confirm alert. Resolves true if the confirm button (index 0)
// was chosen, false otherwise.
function confirm({ title, message, confirmLabel, cancelLabel = "Cancel" }) {
  return new Promise(function (resolve) {
    var dialog = Ti.UI.createAlertDialog({
      title: title,
      message: message,
      persistent: true,
      cancel: 1,
      buttonNames: [confirmLabel, cancelLabel],
    });
    dialog.addEventListener("click", function onClick(e) {
      dialog.removeEventListener("click", onClick);
      dialog.hide();
      resolve(e.index === 0);
    });
    dialog.show();
  });
}

exports.confirm = confirm;
