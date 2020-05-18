
var Crashlytics = require("com.google.firebase.crashlytics.FirebaseCrashlytics")
var Exception = require("java.lang.Exception")

exports.configure = function() { 
    // do nothing on android ??
}

exports.isAvailable = function() {
    return ( Crashlytics.getInstance() != null );
}

exports.setCustomKey = function(name, value) {
    Crashlytics.getInstance().setCustomKey(name, value);
}

exports.recordException = function(e) {
    Crashlytics.getInstance().recordException( 
        new Exception(`${e.title}: ${e.message} in ${e.sourceName} at line ${e.line}`) 
    );
}

exports.setUserId = function(userId) {
    Crashlytics.getInstance().setUserId(userId);
}

exports.log = function( message ) {
    Ti.API.info( message );
    Crashlytics.getInstance().log(message);
}