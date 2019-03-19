// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var mapPoint;
var sample = Alloy.Models.sample;
var { disableControl, enableControl } = require("ui/ViewUtils");
function updateLocation( lat, lng ) {
    if ( isNaN(lat) || isNaN(lng) )
        return;
    mapPoint = { lat: lat, lng: lng };
    $.mapview.setAnnotations( [
        Alloy.Globals.Map.createAnnotation({
            latitude: lat,
            longitude: lng,
            title: "Survey Location"
        })
    ] );
    $.mapview.setRegion({ latitude:lat, longitude:lng, latitudeDelta:0.005, longitudeDelta:0.005});
}

function saveClick() {
    if ( ! $.disabled ) {
        sample.set(mapPoint);
    }
}

function cancelClick() { 
    $.LocationEntry.hide();
    $.trigger("close");
}

$.mapview.addEventListener( "mapclick", function(e) {
    if ( ! $.disabled ) {
        updateLocation( e.latitude, e.longitude );
    }
    e.cancelBubble = true;
});

function disable() {
    $.disabled = true;
    disableControl( $.saveButton );
}

function enable() {
    $.disabled = false;
    enableControl( $.saveButton );
}
let lat = parseFloat(sample.get("lat")),
lng = parseFloat(sample.get("lng"));
updateLocation( lat, lng );
exports.disable = disable; 
exports.enable = enable;