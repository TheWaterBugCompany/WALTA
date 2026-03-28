let _Bugfender = undefined;
function getBugfender() {
    if (_Bugfender === undefined) {
        try {
            _Bugfender = require('be.aca.mobile.bugfender');
        } catch(e) {
            _Bugfender = null;
        }
    }
    return _Bugfender;
}

exports.configure = function() {
    const Bugfender = getBugfender();
    Bugfender.init({
        applicationToken: "KyWNoMFRIZsT0P3WZtH9XvNNNc3Juhrv",
        debug: true
    });

    Bugfender.enableCrashReporting();

    if (OS_ANDROID) {
        //Bugfender.enableLogcatLogging();
        Bugfender.disableReflection(true);
    } else {
        Bugfender.setPrintToConsole(true);
    }
    Bugfender.setMaximumLocalStorageSize(2*1024*1024);
}

exports.setCustomKey = function(name, value) {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.setDeviceString({ key: name, value: value});
}

exports.recordException = function(err) {
    const Bugfender = getBugfender();
    const ErrorUtils = require("util/ErrorUtils");
    let errorFormatted = ErrorUtils.formatError(err);
    if (Bugfender) Bugfender.e({ tag: "error", message: errorFormatted });
    if (typeof Ti !== 'undefined') Ti.API.error(`Unexpected error: ${errorFormatted}`);
    else console.error(`Unexpected error: ${errorFormatted}`);
}

exports.setUserId = function(userId) {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.setDeviceString({ key: "user.email", value: userId });
}

exports.debug = function(message) {
    if (typeof Ti !== 'undefined') Ti.API.debug(message); else console.log(message);
};

exports.warn = function(message, tag = "warn") {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.w({ tag, message });
    if (typeof Ti !== 'undefined') Ti.API.warn(message); else console.warn(message);
};

exports.error = function(message, tag = "error") {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.e({ tag, message });
    if (typeof Ti !== 'undefined') Ti.API.error(message); else console.error(message);
};

exports.log = function(message, tag = "trace") {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.t({ tag, message });
    if (typeof Ti !== 'undefined') Ti.API.debug(message); else console.log(message);
};
