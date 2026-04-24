// SPIKE: view attributes are bound declaratively to $.syncFeedback
// (the Alloy Model declared in the XML). The controller is pure
// plumbing: wire button events to VM actions, forward VM events
// to widget events, clean up on unload.

var vm = Alloy.Models.syncFeedback;

// Force an initial render — Alloy's data-binding code wires a
// `change` listener on this model *after* the model's `initialize`
// has already set its attrs, so without a manual kick the view
// never receives the initial values.
vm.trigger("change");

$.logToggleButton.addEventListener("click", function () { vm.toggleLog(); });
$.diagnosticsButton.addEventListener("click", function () { vm.openDiagnostics(); });
$.closeBottomButton.addEventListener("click", function () { vm.close(); });
$.closeButton.on("close", function () { vm.close(); });

vm.on("close", function () { $.trigger("close"); });
vm.on("diagnostics", function () { $.trigger("diagnostics"); });

function start() {
    vm.start();
}

function cleanUp() {
    // NOTE: the VM is a singleton (Alloy.Models.syncFeedback) — we
    // must NOT call vm.dispose()/off() here, that would blow away
    // Alloy's own binding listener *and* the VM's internal
    // `change:*` listeners (wired in initialize(), which only runs
    // once per singleton lifetime). Let Alloy's generated
    // $.destroy() handle unbinding this controller's widgets.
    $.destroy();
    $.off();
}

exports.start = start;
exports.cleanUp = cleanUp;
