const Logger = require('util/Logger');
const log = (m, tag = "sample") => Logger.log(m, tag);
var Topics = require('ui/Topics');
var SampleSync = require('logic/SampleSync');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", syncNowClicked);
acb.addTool( $.syncButton.getView() );

// UPLOAD_PROGRESS fires several times per sample during a sync; reloading the
// whole list on each tick rebuilds every TableView row and races Titanium's
// cell cleanup (WB-118 crash). Throttle to coalesce the burst, and take an
// authoritative reload when the sync finishes. WB-119 replaces this with
// per-row ViewModel updates.
var RELOAD_THROTTLE_MS = 1000;
var closed = false;
var reloadSampleList = _.throttle( updateSampleList, RELOAD_THROTTLE_MS );
Topics.subscribe( Topics.UPLOAD_PROGRESS, reloadSampleList );
Topics.subscribe( Topics.SYNC_FINISHED, updateSampleList );
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    closed = true;
    Topics.unsubscribe( Topics.UPLOAD_PROGRESS, reloadSampleList );
    Topics.unsubscribe( Topics.SYNC_FINISHED, updateSampleList );
    if ( $.sampleMenu ) {
        $.sampleMenu.cleanUp();
    }
    closeSyncFeedback();
    $.syncButton.cleanUp();
    $.destroy();
    $.off();
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});
function updateSampleList() {
    if ( closed ) return;
    try {
        $.samples.loadSampleHistory(Alloy.Globals.CerdiApi.retrieveUserId());
    } catch(e) {
        // FIXME: for some reason these errors are not being reported if there isn't a catch here
        log(`Error fetching sample list: ${JSON.stringify(e)}`);
        Logger.recordException(e);
    }
}

function openErrorsClick(e) {
    var error = $.samples.at(e.index).get("lastError");
    if ( error ) {
        var dialog = Ti.UI.createAlertDialog({
            message: error,
            ok: 'Ok',
            title: 'Last server error'
        });
        dialog.show();
    }
}

function syncNowClicked() {
    if ( $.syncFeedback ) return;
    $.syncFeedback = Alloy.createController("SyncFeedback");
    $.TopLevelWindow.add( $.syncFeedback.getView() );
    $.syncFeedback.on("close", closeSyncFeedback);
    $.syncFeedback.start();
}

function closeSyncFeedback() {
    if ( ! $.syncFeedback ) return;
    $.TopLevelWindow.remove( $.syncFeedback.getView() );
    $.syncFeedback.cleanUp();
    $.syncFeedback = null;
}

function rowSelected(e) {
    var sample = $.samples.at(e.index);
    var sampleId = sample.get("sampleId");
    function closeSelectMethod() {
          $.TopLevelWindow.remove($.sampleMenu.getView());
          $.sampleMenu.cleanUp();
    }
    $.sampleMenu = Alloy.createController("SampleEditMenu", { sampleId: sampleId });
    $.TopLevelWindow.add($.sampleMenu.getView());
    $.sampleMenu.on("close", closeSelectMethod);
}

updateSampleList();