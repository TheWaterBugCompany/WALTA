var SyncFeedbackViewModel = require("logic/viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");

var vm = new SyncFeedbackViewModel({ syncController: SampleSync });

function render(state) {
    $.offlineMessage.visible = state.status === "offline";

    $.progressFill.backgroundColor = state.progressColor;
    $.progressFill.width = state.percent + "%";
    $.progressText.text = state.progressText;

    $.logPane.visible = state.logVisible;
    $.diagnosticsButton.visible = state.logVisible;
    $.logToggleButton.title = state.logVisible ? "Hide Logs" : "Show Log";
    $.logText.text = state.logLines.join("\n");
}

var unsubscribe = vm.subscribe(render);
render(vm.state);

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
