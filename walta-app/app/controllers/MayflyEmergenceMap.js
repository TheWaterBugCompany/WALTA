exports.baseController  = "TopLevelWindow";
$.name = "mayfly emergence";
$.TopLevelWindow.useUnSafeArea = true;
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.mapView.cleanUp();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

function cancelClick() { 
    $.MayflyEmergenceMap.hide();
    $.trigger("close");
}