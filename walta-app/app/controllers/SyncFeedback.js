var SyncFeedbackViewModel = require("viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");
var Topics = require("ui/Topics");
var bindView = require("util/bindView");

var vm = new SyncFeedbackViewModel({ syncController: $.args.syncController || SampleSync });

bindView($, vm, {
    message:           { visible: "messageVisible", text: "message" },
    progressFill:      { backgroundColor: "progressColor", width: "progressWidth" },
    progressTextClip:  { width: "progressWidth" },
    progressText:      { text: "progressText" },
    progressTextDark:  { text: "progressText" },
    logPane:           { visible: "logVisible", height: "logPaneHeight" },
    diagnosticsButton: { visible: "diagnosticsVisible", onClick: "openDiagnostics" },
    logToggleButton:   { title: "logToggleLabel", onClick: "toggleLog" },
    logText:           { text: "logText" },
    closeBottomButton: { onClick: "close" },
    closeButton:       { onClose: "close" },
});

// Ti-layout glue (not VM state): the top light-text label lives
// inside a clip container sized to the fill. For the text to
// align with the bar's centre (not the clip's centre), the label
// has to be as wide as the bar itself. Ti's layout engine can't
// express "grandparent's width" declaratively, so we measure the
// bar via postlayout and push the width onto the light label
// each time it changes.
$.progressBar.addEventListener("postlayout", function () {
    $.progressText.width = $.progressBar.rect.width;
});

// Ti-layout glue (not VM state): `visible: false` hides the label
// but keeps its line-height reserved in the vertical layout. The
// VM can't return Ti.UI.SIZE without breaking its Node spec, so
// we translate the boolean here.
function applyMessageLayout() {
    $.message.height = vm.messageVisible ? Ti.UI.SIZE : 0;
    $.message.top    = vm.messageVisible ? "8dp"       : 0;
}
applyMessageLayout();
vm.addListener(applyMessageLayout);

vm.on("close", function () { $.trigger("close"); });
vm.on("diagnostics", function () { Topics.fireTopicEvent(Topics.DIAGNOSTICS); });

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
