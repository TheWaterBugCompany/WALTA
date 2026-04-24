var SyncFeedbackViewModel = require("logic/viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");
var bindView = require("util/bindView");

var vm = new SyncFeedbackViewModel({ syncController: SampleSync });

bindView($, vm, {
    message:           { visible: "messageVisible", text: "message" },
    progressFill:      { backgroundColor: "progressColor", width: "progressWidth" },
    progressText:      { text: "progressText" },
    logPane:           { visible: "logVisible" },
    diagnosticsButton: { visible: "diagnosticsVisible" },
    logToggleButton:   { title: "logToggleLabel" },
    logText:           { text: "logText" },
});

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
    vm.dispose();
    $.destroy();
    $.off();
}

exports.start = start;
exports.cleanUp = cleanUp;
