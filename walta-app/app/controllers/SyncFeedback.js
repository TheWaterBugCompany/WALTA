var SyncFeedbackViewModel = require("logic/viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");

var FILL_TEAL = "#26849c";
var FILL_RED = "#c0392b";

var vm = new SyncFeedbackViewModel({ syncController: SampleSync });

function render(state) {
    $.offlineMessage.visible = state.status === "offline";

    var isError = state.status === "error";
    $.progressFill.backgroundColor = isError ? FILL_RED : FILL_TEAL;
    $.progressFill.width = state.percent + "%";

    var barText;
    if (state.status === "offline") {
        barText = "0%";
    } else if (state.status === "error") {
        barText = state.percent + "% " + (state.errorMessage || "Server Error");
    } else if (state.statusText) {
        barText = state.percent + "% " + state.statusText;
    } else {
        barText = state.percent + "%";
    }
    $.progressText.text = barText;

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
