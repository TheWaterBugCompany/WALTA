const Bugfender = require('be.aca.mobile.bugfender');
const ErrorUtils = require("util/ErrorUtils")
exports.configure = function() {
  

    Bugfender.init({
        applicationToken: "KyWNoMFRIZsT0P3WZtH9XvNNNc3Juhrv",
        debug: true
    });

    Bugfender.enableCrashReporting();
    Bugfender.enableUIEventLogging();

    if (OS_ANDROID) {
        //Bugfender.enableLogcatLogging();
        Bugfender.disableReflection(true);
    } else {
        Bugfender.setPrintToConsole(true);
    }

    Bugfender.forceSendOnce();
    Bugfender.setForceEnabled(true);
    Bugfender.setMaximumLocalStorageSize(1024*1024);
}
exports.setCustomKey = function(name, value) {
    Bugfender.setDeviceString({ key: name, value: value});
}
exports.recordException = function(err) { 
    let errorFormatted = ErrorUtils.formatError(err);
    Bugfender.e({        
        tag: "error",
        message: errorFormatted
    });
    Ti.API.error(`Unexpected error: ${errorFormatted}`)
}
exports.setUserId = function(userId) {
    Bugfender.setDeviceString({ key: "user.email", value: userId });
}
exports.log = function( message, tag = "trace" ) { 
    Bugfender.t({
        tag: tag,
        message: message
    });
    Ti.API.info(message)
}