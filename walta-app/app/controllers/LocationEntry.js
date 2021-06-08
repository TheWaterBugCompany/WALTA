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
    var newRegion = { 
        latitude:lat, 
        longitude:lng, 
        bearing: $.mapview.region.bearing,
        latitudeDelta: $.mapview.region.latitudeDelta, 
        longitudeDelta: $.mapview.region.longitudeDelta
    };
    if ( newRegion.latitudeDelta > 0.05 || newRegion.longitudeDelta > 0.05 ) {
        newRegion.latitudeDelta = 0.05;
        newRegion.longitudeDelta = 0.05;
    } 
    $.mapview.region = newRegion;
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

$.mapview.addEventListener( "longclick", function(e) {
    if ( ! $.disabled ) {
        updateLocation( e.latitude, e.longitude );
    }
    e.cancelBubble = true;
});
let lat = parseFloat(sample.get("lat")),
    lng = parseFloat(sample.get("lng")),
    accuracy = parseFloat(sample.get("accuracy"));
updateLocation( lat, lng, accuracy );
exports.cleanUp = cleanUp;