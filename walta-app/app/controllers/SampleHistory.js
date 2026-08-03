var Topics = require('ui/Topics');

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

// Floor + one Titanium anchor-bar button. The Ti-free
// lib/mvvm/controllers/SampleHistory (built by View.openView) owns the
// view-model, the table binding and row lifecycle; data comes from
// services.sampleSource; the SyncFeedback modal owns starting the sync and
// closing itself on logout. All that remains here is the Sync NavButton —
// genuine anchor-bar view construction — which just fires the START_SYNC intent.
// Removing even this waits on the nav/anchor-bar seam. See
// docs/patterns/screen-controllers.md.
var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", function () { Topics.fireTopicEvent(Topics.START_SYNC); });
acb.addTool($.syncButton.getView());

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.syncButton.cleanUp();
    $.TopLevelWindow.removeEventListener('close', cleanUp);
});
