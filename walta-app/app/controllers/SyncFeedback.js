var SyncFeedbackViewModel = require("logic/viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");

var vm = new SyncFeedbackViewModel({ syncController: SampleSync });

function render() {
    $.offlineMessage.visible = vm.status === "offline";

    $.progressFill.backgroundColor = vm.progressColor;
    $.progressFill.width = vm.percent + "%";
    $.progressText.text = vm.progressText;

    $.logPane.visible = vm.logVisible;
    $.diagnosticsButton.visible = vm.logVisible;
    $.logToggleButton.title = vm.logVisible ? "Hide Logs" : "Show Log";
    $.logText.text = vm.logLines.join("\n");
}

var unsubscribe = vm.subscribe(render);
render();

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
    unsubscribe();
    vm.dispose();
    $.destroy();
    $.off();
}

exports.start = start;
exports.cleanUp = cleanUp;
