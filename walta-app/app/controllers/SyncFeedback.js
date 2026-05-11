var SyncFeedbackViewModel = require("viewmodels/SyncFeedback");
var SampleSync = require("logic/SampleSync");
var LogRepository = require("repository/LogRepository");
var Topics = require("ui/Topics");
var bindView = require("util/bindView");

var logRepository = $.args.logRepository || LogRepository.open("waterbug_data");
var vm = new SyncFeedbackViewModel({
    syncController: $.args.syncController || SampleSync,
    logRepository
});

bindView($, vm, {
    message:           { visible: "messageVisible", text: "message" },
    progressFill:      { backgroundColor: "progressColor", width: "progressWidth" },
    progressTextClip:  { width: "progressWidth" },
    progressText:      { text: "progressText", accessibilityLabel: "progressText", accessibilityValue: "progressText" },
    progressTextDark:  { text: "progressText" },
    logPane:           { visible: "logVisible", height: "logPaneHeight" },
    diagnosticsButton: { visible: "diagnosticsVisible", onClick: "openDiagnostics" },
    logToggleButton:   { title: "logToggleLabel", onClick: "toggleLog" },
    logText:           { value: "logText" },
    closeBottomButton: { onClick: "close" },
    closeButton:       { onClose: "close" },
}, Alloy.CFG.colors);

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
function applyDynamicMargins() {
    $.message.height = vm.messageVisible ? Ti.UI.SIZE : 0;
    $.message.top    = vm.messageVisible ? "8dp"       : 0;
    $.logPane.bottom = vm.logVisible     ? "20dp"      : 0;
}
applyDynamicMargins();
vm.addListener(applyDynamicMargins);

let lastLogSeq = vm.logSeq;
let lastLogVisible = vm.logVisible;
function tailLogPane() {
    const justOpened = vm.logVisible && !lastLogVisible;
    const grew = vm.logSeq !== lastLogSeq;
    lastLogSeq = vm.logSeq;
    lastLogVisible = vm.logVisible;
    if (!justOpened && !grew) return;
    // setTimeout: defer until after the TextArea has re-laid-out, otherwise
    // scrollToBottom uses the pre-update content height. The TextArea
    // itself is `scrollable: false` so the wrapping ScrollView is what
    // actually scrolls the content (chosen over native TextArea scrolling
    // because Ti's setSelection isn't exposed on TextArea in our SDK).
    setTimeout(() => $.logScroll.scrollToBottom(), 0);
}
vm.addListener(tailLogPane);

vm.on("close", function () { $.trigger("close"); });
vm.on("diagnostics", function () { Topics.fireTopicEvent(Topics.DIAGNOSTICS); });

function start() {
    vm.start();
}

function cleanUp() {
    vm.dispose();
    if (!$.args.logRepository) logRepository.close();
    $.destroy();
    $.off();
}

exports.start = start;
exports.cleanUp = cleanUp;
