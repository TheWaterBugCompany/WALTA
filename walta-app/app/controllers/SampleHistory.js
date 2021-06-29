var Topics = require('ui/Topics');
var SampleSync = require('logic/SampleSync');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

Topics.subscribe( Topics.UPLOAD_PROGRESS, updateSampleList );
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    if ( $.sampleMenu ) {
        $.sampleMenu.cleanUp();
    }
    $.destroy();
    $.off();
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});
function updateSampleList() {
    try {
        $.samples.loadSampleHistory(Alloy.Globals.CerdiApi.retrieveUserId());
    } catch(e) {
        // FIXME: for some reason these errors are not being reported if there isn't a catch here
        Ti.API.info(`Error fetching sample list: ${JSON.stringify(e)}`);
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
Topics.fireTopicEvent(Topics.FORCE_UPLOAD);