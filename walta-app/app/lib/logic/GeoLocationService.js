var Topics = require("ui/Topics");
const Logger = require('util/Logger');
const log = (m, tag = "location") => Logger.log(m, tag);
const debug = (m, tag = "location") => Logger.debug(m, tag);

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
    log("Stopping geolocation service...");
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
        debug(`got GPS lock: lat = ${e.coords.latitude} lng = ${e.coords.longitude} accuracy=${e.coords.accuracy}`);
        lastGpsPointEvent = e;
        Topics.fireTopicEvent(Topics.GPSLOCK, e.coords);
    } else {
        //Ti.API.debug(`Ignoring error from location services: ${e.error}`);
    }
}

function startListening() {
    debug("start listening for GPS events")
    Ti.Geolocation.addEventListener('location', gotLocation );
    Alloy.Globals.GeoLocationState = "listening";
}

function stopListening( state = "stopped" ) {
    Ti.Geolocation.removeEventListener('location', gotLocation);
    Alloy.Globals.GeoLocationState = state;
}

function start() {
    if ( Alloy.Globals.GeoLocationState === "stopped" ) {
        debug("Starting geolocation service...");
        Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
        // distanceFilter 0 (was 10): a movement gate is wrong for a stationary
        // site — at 10m the OS stops delivering updates once you stop moving,
        // so the fix can't keep improving after the first (often poor) reading.
        // Sampling happens standing still, so take every fix and let the
        // accuracy settle. (The 10m default here was almost certainly a mistake.)
        Ti.Geolocation.distanceFilter = 0;
        if (Ti.Geolocation.hasLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE)) {
            debug("Got permissions");
            startListening();
        } else {
            Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE, (e) => {
                if ( e.success ) {
                    debug("Got permissions");
                    startListening();
                } else {
                    debug("Unable to get geolcation permissions");
                }
            });
        };
    }
}

function stop() {
    if ( Alloy.Globals.GeoLocationState !== "stopped" ) {
        debug("Stopping geolocation service...");
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