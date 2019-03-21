// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var mapPoint;
var sample = Alloy.Models.sample;

var { getCurrentPosition } = require("logic/GeoLocationService");
var { disableControl, enableControl } = require("ui/ViewUtils");

// to allow mocking getCurrentPoisition in unit tests
if ( $.args.getCurrentPosition ) {
    getCurrentPosition =  $.args.getCurrentPosition;
}

function updateLocation( lat, lng, accuracy ) {
    if ( isNaN(lat) || isNaN(lng) )
        return;

    mapPoint = { lat: lat, lng: lng, accuracy: accuracy };
    $.mapview.removeAllAnnotations();
    $.mapview.removeAllCircles();
    if ( accuracy ) {
        $.mapview.addCircle( Alloy.Globals.Map.createCircle({
            center: {
                latitude: lat,
                longitude: lng
            },
            radius: accuracy,
            strokeWidth: "4dp",
            strokeColor: "#aa26849c",
            fillColor: "#6626849c"
        }) );
    }
    $.mapview.addAnnotation(
        Alloy.Globals.Map.createAnnotation({
            latitude: lat,
            longitude: lng,
            title: "Survey Location"
        })
    );
    $.mapview.setRegion({ latitude:lat, longitude:lng, latitudeDelta:0.005, longitudeDelta:0.005});
}

function locateClick() {
    getCurrentPosition( function(e) {
        updateLocation( e.coords.latitude, e.coords.longitude, e.coords.accuracy );
    });
}

function saveClick() {
    sample.set(mapPoint);
    $.LocationEntry.hide();
    $.trigger("close");
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
    lng = parseFloat(sample.get("lng")),
    accuracy = parseFloat(sample.get("accuracy"));
updateLocation( lat, lng, accuracy );
exports.disable = disable; 
exports.enable = enable;