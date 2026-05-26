const Logger = require('util/Logger');

// iOS memory warnings trigger Titanium's KrollBridge/TableView-row proxy purge,
// which races in-flight JS proxy creation — the suspected WB-118 crash trigger.
// Log at warn so the breadcrumb reaches Bugfender (debug routing landed in #281).
exports.start = function (app) {
    let count = 0;
    function onWarning() {
        count += 1;
        Logger.warn(`iOS memory warning #${count}`, "memory");
    }
    app.addEventListener("memorywarning", onWarning);
    return function dispose() {
        app.removeEventListener("memorywarning", onWarning);
    };
};
