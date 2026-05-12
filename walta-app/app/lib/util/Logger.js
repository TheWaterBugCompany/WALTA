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

// see docs/patterns/logger-sinks.md
const _sinks = [];
const _subscribers = [];
const LEVEL_RANK = { debug: 0, trace: 1, info: 2, warn: 3, error: 4 };

exports.addSink = function (sink) {
    _sinks.push(sink);
};

exports.subscribe = function (filter, cb) {
    const sub = { filter: filter || {}, cb };
    _subscribers.push(sub);
    return function unsubscribe() {
        const idx = _subscribers.indexOf(sub);
        if (idx >= 0) _subscribers.splice(idx, 1);
    };
};

function _matches(filter, entry) {
    if (filter.facility && filter.facility !== entry.facility) return false;
    if (filter.minLevel && LEVEL_RANK[entry.level] < LEVEL_RANK[filter.minLevel]) return false;
    return true;
}

function _dispatch(level, facility, message) {
    const entry = { ts: Date.now(), level, facility, message };
    for (let i = 0; i < _sinks.length; i++) {
        const sink = _sinks[i];
        if (sink.levels && sink.levels.indexOf(level) === -1) continue;
        Promise.resolve(sink.write(entry)).catch(function (err) {
            const fallback = "Logger sink failed: " + (err && err.message) + " — original: " + message;
            if (typeof Ti !== 'undefined') Ti.API.log(level, fallback);
            else console.log(fallback);
        });
    }
    for (let i = 0; i < _subscribers.length; i++) {
        const sub = _subscribers[i];
        if (!_matches(sub.filter, entry)) continue;
        try { sub.cb(entry); }
        catch (e) {
            const msg = "Logger subscriber threw: " + (e && e.message);
            if (typeof Ti !== 'undefined') Ti.API.log("error", msg);
            else console.log(msg);
        }
    }
}

// Persistence retention policy — entries older than 14d or beyond
// the 5,000-row cap get pruned at startup. Tunable here.
const LOG_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const LOG_MAX_ROWS = 100000;

exports.configure = function() {
    _sinks.push(require("./sinks/ConsoleSink"));
    const Bugfender = getBugfender();
    _sinks.push(require("./sinks/BugfenderSink").create(Bugfender));
    try {
        if (typeof Ti !== 'undefined' && Ti.Database) {
            const repo = require("../repository/LogRepository").open("waterbug_data");
            repo.prune(LOG_MAX_AGE_MS, LOG_MAX_ROWS);
            _sinks.push(require("./sinks/SqlSink").create(repo));
        }
    } catch (e) {
        // Don't crash app startup on persistence init failure — fall back
        // to the other sinks. Re-dispatch through Logger.error so it lands
        // in ConsoleSink + BugfenderSink (already registered above); a bare
        // Ti.API.warn would never have reached Bugfender, which is how
        // WB-78 stayed invisible across releases.
        exports.error("LogRepository init failed: " + (e && e.message), "logger-init");
    }
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
    const ErrorUtils = require("util/ErrorUtils");
    const errorFormatted = ErrorUtils.formatError(err);
    exports.error(`Unexpected error: ${errorFormatted}`, "exception");
}

exports.setUserId = function(userId) {
    const Bugfender = getBugfender();
    if (Bugfender) Bugfender.setDeviceString({ key: "user.email", value: userId });
}

exports.debug = function(message, tag = "debug") {
    _dispatch("debug", tag, message);
};

exports.info = function(message, tag = "info") {
    _dispatch("info", tag, message);
};

exports.warn = function(message, tag = "warn") {
    _dispatch("warn", tag, message);
};

exports.error = function(message, tag = "error") {
    _dispatch("error", tag, message);
};

exports.log = function(message, tag = "trace") {
    _dispatch("trace", tag, message);
};
