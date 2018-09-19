


function init() {
    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
    Alloy.Globals.GeoLocationState = "stopped";
    if (Titanium.Platform.name == 'android')
    {
            //close tab group and remove location listener when pausing or destroying the app
            Ti.Android.currentActivity.addEventListener('pause', function(e) {            
                if (Alloy.Globals.GeoLocationState === "listening") {
                    Titanium.Geolocation.removeEventListener('location', gotLocation);
                    Alloy.Globals.GeoLocationState = "listening:paused";
                }
            });

        Ti.Android.currentActivity.addEventListener('destroy', function(e) {        
            if (Alloy.Globals.GeoLocationState === "listening") {
                Titanium.Geolocation.removeEventListener('location', gotLocation);
                Alloy.Globals.GeoLocationState = "stopped";
            }
        });


        var main_activity = Ti.Android.currentActivity;
        main_activity.addEventListener('resume', function() {     
        if (Alloy.Globals.GeoLocationState === "listening:paused") {
                Titanium.Geolocation.addEventListener('location', gotLocation);
                Alloy.Globals.GeoLocationState = "listening";
            }
        });
    }
}

function gotLocation(e) {
    Ti.API.info(`Got location event: ${JSON.stringify(e, null, 2)}`);
}

function start() {
    Ti.API.info("Starting gelocation service...");
    Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS, (e) => {
        if ( e.success ) {
            Ti.API.info("Got permissions");
            Ti.GeoLocation.addEventListener('location', gotLocation );
            Alloy.Globals.GeoLocationState = "listening";
        } else {
            Ti.API.info("Unable to get geolcation permissions");
        }
    });
}

function stop() {
    Ti.API.info("Stopping gelocation service...");
    Ti.Geolocation.removeEventListener('location', gotLocation );
    Alloy.Globals.GeoLocationState = "stopped";
}


exports.init = init;
exports.start = start;
exports.stop = stop;