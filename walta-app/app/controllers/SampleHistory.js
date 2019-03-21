var moment = require("lib/moment");
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

$.samples.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NOT NULL ORDER BY dateCompleted DESC" } );
$.TopLevelWindow.addEventListener('close', function() {
    $.destroy();
});
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
function openSample(e) {
    var sample = $.samples.at(e.index);
    var sampleId = sample.get("sampleId");
    Alloy.Models.instance("sample").loadById(sampleId);
	Alloy.Collections.instance("taxa").load(sampleId);
    Alloy.createController("SiteDetails").open();
}