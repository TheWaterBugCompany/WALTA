
var FirebaseApp = require("FirebaseCore/FIRApp");
var Crashlytics = require("FirebaseCrashlytics/FIRCrashlytics");
var ExceptionModel = require("FirebaseCrashlytics/FIRExceptionModel");
var StackFrame = require("FirebaseCrashlytics/FIRStackFrame");
var { parseStackTrace } = require("util/ExceptionUtils");
exports.configure = function() {
    FirebaseApp.configure();
}
exports.isAvailable = function() {
    return ( Crashlytics.crashlytics() != null );
}

exports.setCustomKey = function(name, value) {
    Crashlytics.crashlytics().setCustomValueForKey(value, name);
}

exports.recordException = function(e) {
    var ex = ExceptionModel.exceptionModelWithNameReason( e.type, e.message);
    var stack = parseStackTrace(e.stack);
    ex.setStackTrace( stack.map( ({ file, symbol, line }) => StackFrame.alloc().initWithSymbolFileLine( symbol, file, line ) ) );
    Crashlytics.crashlytics().recordExceptionModel(ex);
}

exports.setUserId = function(userId) {
    Crashlytics.crashlytics().setUserID(userId);
}

exports.log = function( message ) {
    Ti.API.info( message );
    Crashlytics.crashlytics().log(message);
}