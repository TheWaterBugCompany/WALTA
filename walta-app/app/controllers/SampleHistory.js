var moment = require("lib/moment");
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";
$.samples.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NOT NULL ORDER BY dateCompleted DESC" } );
$.TopLevelWindow.addEventListener('close', function() {
    $.destroy();
});
function openErrorsClick(e) {
    var error = $.samples.at(e.index).get("lastError");
    if ( error ) {
        var dialog = Ti.UI.createAlertDialog({
            message: error,
            ok: 'Okay',
            title: 'Last server error'
        });
        dialog.show();
    }
}
function formatSample( model ) {
    var m = model.toJSON();
    m.dateCompleted = moment(m.dateCompleted).format("DD/MMM/YYYY h:mm:ss a");
    m.uploaded = (m.serverSampleId ? "Yes" : "No" );
    return m;
}