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

// In-memory ring buffer of recent log lines so the SyncFeedback
// "Show Logs" popup pane has something to display. Bugfender remains
// the long-term sink. See WB-45.
const LOG_CAP = 200;
const _logBuffer = [];
const _listeners = [];

function _append(tag, message) {
    _logBuffer.push("[" + tag + "] " + message);
    if (_logBuffer.length > LOG_CAP) _logBuffer.splice(0, _logBuffer.length - LOG_CAP);
    // Notify after the buffer is updated so listeners see the new line
    // when they call getLogLines(). See WB-45.
    for (let i = 0; i < _listeners.length; i++) _listeners[i]();
}

exports.getLogLines = function() {
    return _logBuffer.slice();
};

exports.clearLog = function() {
    _logBuffer.length = 0;
};

exports.addListener = function(cb) {
    _listeners.push(cb);
};

exports.removeListener = function(cb) {
    const idx = _listeners.indexOf(cb);
    if (idx >= 0) _listeners.splice(idx, 1);
};

exports.configure = function() {
    const Bugfender = getBugfender();
    if (!Bugfender) return;
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
    _append(tag, message);
};

exports.error = function(message, tag = "error") {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.e({ tag, message });
    if (typeof Ti !== 'undefined') Ti.API.error(message); else console.error(message);
    _append(tag, message);
};

exports.log = function(message, tag = "trace") {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.t({ tag, message });
    if (typeof Ti !== 'undefined') Ti.API.debug(message); else console.log(message);
    _append(tag, message);
};
