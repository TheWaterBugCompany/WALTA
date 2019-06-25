// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
function cleanUp() {
    $.destroy();
    $.off();
    if ( Ti.Platform.osname === 'android' )
        $.LeafletMap.release();
}
exports.cleanUp = cleanUp;