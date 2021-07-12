
var Crashlytics = require("com.google.firebase.crashlytics.FirebaseCrashlytics")
var Throwable = require("java.lang.Throwable");
/*var StackTraceElement = require("java.lang.StackTraceElement");
var { parseStackTrace } = require("util/ExceptionUtils");*/

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
    
    var ex = new Throwable(`${e.type}: ${e.stack}`);
    /* Currently not working in hyperloop 5.0.3
    var stack = parseStackTrace(e.stack);
    function makeClassFromFile(file) {
        return file.replace(/^ti:\/|^\/|\.js$/g,"").replace("/",".");
    }
    
    var stackNative = stack.map( 
        f => new StackTraceElement( makeClassFromFile(f.file), f.symbol, f.file, f.line ) 
    );
    ex.setStackTrace(stackNative);
    */
    Crashlytics.getInstance().recordException(ex);
}

exports.setUserId = function(userId) {
    Crashlytics.getInstance().setUserId(userId);
}

exports.log = function( message ) {
    Ti.API.info( message );
    Crashlytics.getInstance().log(message);
}