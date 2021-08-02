function cancelClick() { 
    $.trigger("close");
}

$.mapView.addMayflyLayer();
function cleanUp() {
    $.destroy();
	$.off();
}
exports.cleanUp = cleanUp;