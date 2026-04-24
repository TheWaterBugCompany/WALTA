var SyncFeedbackViewModel = require("viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");
var bindView = require("util/bindView");

var vm = new SyncFeedbackViewModel({ syncController: SampleSync });

bindView($, vm, {
    message:           { visible: "messageVisible", text: "message" },
    progressFill:      { backgroundColor: "progressColor", width: "progressWidth" },
    progressText:      { text: "progressText" },
    logPane:           { visible: "logVisible" },
    diagnosticsButton: { visible: "diagnosticsVisible", onClick: "openDiagnostics" },
    logToggleButton:   { title: "logToggleLabel", onClick: "toggleLog" },
    logText:           { text: "logText" },
    closeBottomButton: { onClick: "close" },
    closeButton:       { onClose: "close" },
});

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
