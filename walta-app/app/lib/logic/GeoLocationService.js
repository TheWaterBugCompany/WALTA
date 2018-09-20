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
    if ( e.success ) {
        Alloy.Models.sample.set('lat', e.coords.latitude);
        Alloy.Models.sample.set('lng', e.coords.longitude);
    } else {
        Ti.API.info(`Ignoring error from location services: ${e.error}`);
    }
}

function startListening() {
    Ti.Geolocation.addEventListener('location', gotLocation );
    Alloy.Globals.GeoLocationState = "listening";
}

function stopListening( state = "stopped" ) {
    Ti.Geolocation.removeEventListener('location', gotLocation);
    Alloy.Globals.GeoLocationState = state;
}

function start() {
    Ti.API.info("Starting geolocation service...");
    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
    Ti.Geolocation.distanceFilter = 10;
    if (Ti.Geolocation.hasLocationPermissions()) {
        Ti.API.info("Got permissions");
        startListening();
    } else {
        Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS, (e) => {
            if ( e.success ) {
                Ti.API.info("Got permissions");
                startListening();
            } else {
                Ti.API.info("Unable to get geolcation permissions");
            }
        });
    };
}

function stop() {
    Ti.API.info("Stopping geolocation service...");
    stopListening();
}


exports.init = init;
exports.start = start;
exports.stop = stop;
exports.cleanup = cleanup;