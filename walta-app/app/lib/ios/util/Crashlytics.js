
var FirebaseApp = require("FirebaseCore/FIRApp");
var FirebaseConfiguration = require("FirebaseCore/FIRConfiguration");
var Crashlytics = require("FirebaseCrashlytics/FIRCrashlytics");
var ExceptionModel = require("FirebaseCrashlytics/FIRExceptionModel");
//var GULAppEnvironmentUtil = require("GoogleUtilities/GULAppEnvironmentUtil")
exports.crash = function() {
    Crashlytics.crashlytics().crash();
}

exports.configure = function() {
    
    FirebaseApp.configure();
    FirebaseConfiguration.sharedInstance.setLoggerLevel(7); 
    //Ti.API.info( `isFromAppStore = ${GULAppEnvironmentUtil.isFromAppStore}`);
    Ti.API.info( `isCrashlyticsCollectionEnabled = ${Crashlytics.crashlytics().isCrashlyticsCollectionEnabled()}`);
}
exports.isAvailable = function() {
    return ( Crashlytics.crashlytics() != null );
}

exports.setCustomKey = function(name, value) {
    Crashlytics.crashlytics().setCustomValueForKey(value, name);
}

exports.recordException = function(e) {
    Crashlytics.crashlytics().recordExceptionModel(
        ExceptionModel.exceptionModelWithNameReason( e.title, `${e.message} in ${e.sourceName} at line ${e.line}`)
    );
}

exports.setUserId = function(userId) {
    Crashlytics.crashlytics().setUserID(userId);
}

exports.log = function( message ) {
    Ti.API.info( message );
    Crashlytics.crashlytics().log(message);
}