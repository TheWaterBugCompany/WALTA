var Topics = require('ui/Topics');

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

// Residual Titanium. The Ti-free lib/mvvm/controllers/SampleHistory (built by
// View.openView) owns the view-model and binds the table via the collection
// binding; rows come through View.createComponent. This shell keeps only what
// needs Alloy models or Ti: the sample-history source, the Sync button and the
// SyncFeedback overlay. See docs/patterns/screen-controllers.md.
var userId = Alloy.Globals.CerdiApi.retrieveUserId();
$.samples = Alloy.createCollection("sample");

function toRowData(m) {
    var json = m.transform();
    return {
        serverId: m.get("serverSampleId"),
        sampleId: m.get("sampleId"),
        dateCompleted: json.dateCompleted,
        waterbodyName: json.waterbodyName,
        uploaded: json.uploaded
    };
}

// Alloy-model reads behind the source-adapter seam the view-model is built from.
$.sampleSource = {
    loadAll: function() {
        $.samples.loadSampleHistory(userId);
        return $.samples.map(toRowData);
    },
    loadOne: function(sampleId) {
        var m = Alloy.createModel("sample");
        m.loadById(sampleId);
        if (!m.get("sampleId")) return undefined;
        return toRowData(m);
    }
};

var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", syncNowClicked);
acb.addTool($.syncButton.getView());

// Session ended (manual logout, or a rejected token mid-sync dropping to
// login): tear down any open sync feedback so it doesn't linger behind.
Topics.subscribe(Topics.LOGGEDOUT, closeSyncFeedback);

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    Topics.unsubscribe(Topics.LOGGEDOUT, closeSyncFeedback);
    closeSyncFeedback();
    $.syncButton.cleanUp();
    $.TopLevelWindow.removeEventListener('close', cleanUp);
});

function syncNowClicked() {
    if ($.syncFeedback) return;
    $.syncFeedback = Alloy.createController("SyncFeedback");
    $.TopLevelWindow.add($.syncFeedback.getView());
    $.syncFeedback.on("close", closeSyncFeedback);
    $.syncFeedback.start();
}

function closeSyncFeedback() {
    if (!$.syncFeedback) return;
    $.TopLevelWindow.remove($.syncFeedback.getView());
    $.syncFeedback.cleanUp();
    $.syncFeedback = null;
}
