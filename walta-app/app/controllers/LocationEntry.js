var mapPoint;
var sample = Alloy.Models.sample;

var { getCurrentPosition } = require("logic/GeoLocationService");
var { disableControl, enableControl } = require("ui/ViewUtils");

var readOnlyMode = $.args.readonly === true;

if ( readOnlyMode ) {
    disableControl( $.saveButton ); 
}

// to allow mocking getCurrentPoisition in unit tests
if ( $.args.getCurrentPosition ) {
    getCurrentPosition =  $.args.getCurrentPosition;
}

function cleanUp() {
    $.destroy();
	$.off();
}

function updateLocation( lat, lng, accuracy ) {
    mapPoint = { lat: lat, lng: lng, accuracy: accuracy };
   $.mapView.setLocation( lat, lng, accuracy );
}

function locateClick() {
    getCurrentPosition( function(e) {
        // if there hasn't been a GPS lock yet e will be null
        if ( e && e.coords ) {
            updateLocation( e.coords.latitude, e.coords.longitude, e.coords.accuracy );
        }
    });
}

function saveClick() {
    sample.set(mapPoint);
    $.trigger("close");
}

function cancelClick() { 
    $.trigger("close");
}

$.closeButton.on("close", () => $.trigger("close") );

$.mapView.onLongPress( function(data) {
    if ( ! $.disabled ) {
        updateLocation( data.lat, data.lng );
    }
});
$.mapView.removeMayflyLayer();

let lat = parseFloat(sample.get("lat")),
    lng = parseFloat(sample.get("lng")),
    accuracy = parseFloat(sample.get("accuracy"));
updateLocation( lat, lng, accuracy );

exports.cleanUp = cleanUp;