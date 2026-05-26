const LEVEL_TO_METHOD = {
    trace: "t",
    debug: "d",
    info:  "i",
    warn:  "w",
    error: "e"
};

exports.create = function (Bugfender) {
    return {
        levels: ["trace", "debug", "info", "warn", "error"],
        write: function (entry) {
            if (!Bugfender) return Promise.resolve();
            const method = LEVEL_TO_METHOD[entry.level];
            if (method) Bugfender[method]({ tag: entry.facility, message: entry.message });
            return Promise.resolve();
        }
    };
};
