var Topics = require("ui/Topics");

var lastGpsPointEvent;

function activityPaused() {
    if (Alloy.Globals.GeoLocationState === "listening") {
        stopListening( "listening:paused" );
    }
}

function activityDestroyed() {
    if (Alloy.Globals.GeoLocationState === "listening") {
        stopListening();
    }
}

function activityResumed() {
    if (Alloy.Globals.GeoLocationState === "listening:paused") {
        startListening();
    }
}


function init() {
    Alloy.Globals.GeoLocationState = "stopped";
    if (Titanium.Platform.name == 'android')
    {    
        Ti.Android.currentActivity.addEventListener('pause', activityPaused);
        Ti.Android.currentActivity.addEventListener('destroy', activityDestroyed);
        Ti.Android.currentActivity.addEventListener('resume', activityResumed);
    }
}

function cleanup() {
    Ti.API.info("Stopping geolocation service...");
    activityDestroyed();
    if (Titanium.Platform.name == 'android')
    {
        Ti.Android.currentActivity.removeEventListener('pause', activityPaused);
        Ti.Android.currentActivity.removeEventListener('destroy', activityDestroyed);
        Ti.Android.currentActivity.removeEventListener('resume', activityResumed);
    }
}

function gotLocation(e) {
    if ( e.success && e.coords ) {
        Ti.API.info(`got GPS lock: lat = ${e.coords.latitude} lng = ${e.coords.longitude} accuracy=${e.coords.accuracy}`);
        lastGpsPointEvent = e;
        Topics.fireTopicEvent(Topics.GPSLOCK, e.coords);
    } else {
        //Ti.API.debug(`Ignoring error from location services: ${e.error}`);
    }
}

function startListening() {
    Ti.API.info("start listening for GPS events")
    Ti.Geolocation.addEventListener('location', gotLocation );
    Alloy.Globals.GeoLocationState = "listening";
}

function stopListening( state = "stopped" ) {
    Ti.Geolocation.removeEventListener('location', gotLocation);
    Alloy.Globals.GeoLocationState = state;
}

function start() {
    if ( Alloy.Globals.GeoLocationState === "stopped" ) {
        Ti.API.info("Starting geolocation service...");
        Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
        Ti.Geolocation.distanceFilter = 10;
        if (Ti.Geolocation.hasLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE)) {
            Ti.API.info("Got permissions");
            startListening();
        } else {
            Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE, (e) => {
                if ( e.success ) {
                    Ti.API.info("Got permissions");
                    startListening();
                } else {
                    Ti.API.info("Unable to get geolcation permissions");
                }
            });
        };
    }
}

function stop() {
    if ( Alloy.Globals.GeoLocationState !== "stopped" ) {
        Ti.API.info("Stopping geolocation service...");
        stopListening();
    }
}


function getCurrentPosition( callback ) {
    callback( lastGpsPointEvent );
}

exports.getCurrentPosition = getCurrentPosition;
exports.init = init;
exports.start = start;
exports.stop = stop;
exports.cleanup = cleanup;