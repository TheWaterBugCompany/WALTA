// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

var sample = Alloy.Models.sample;
sample.on("change:lng change:lat", updateLocation );

function updateLocation() {
    let lat = parseFloat(sample.get("lat")),
        lng = parseFloat(sample.get("lng"));
    
    if ( isNaN(lat) || isNaN(lng) )
        return;

    $.mapview.setAnnotations( [
        Alloy.Globals.Map.createAnnotation({
            latitude: lat,
            longitude: lng,
            title: "Survey Location"
        })
    ] );
    $.mapview.setRegion({ latitude:lat, longitude:lng, latitudeDelta:0.005, longitudeDelta:0.005});
}

function closeEvent() { 
    $.LocationEntry.hide();
    $.trigger("close");
}

$.mapview.addEventListener( "mapclick", function(e) {
    sample.set({ "lat": e.latitude, "lng": e.longitude });
    e.cancelBubble = true;
});

