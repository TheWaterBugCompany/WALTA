// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
function locateClick() {

}

function cancelClick() { 
    $.MayflyEmergenceMap.hide();
    $.trigger("close");
}

function cleanUp() {
    $.mapView.cleanUp();
}

exports.cleanUp = cleanUp;