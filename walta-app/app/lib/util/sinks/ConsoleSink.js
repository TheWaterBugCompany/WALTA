const LEVEL_TO_TI = {
    trace: "debug",
    debug: "debug",
    info:  "info",
    warn:  "warn",
    error: "error"
};

const LEVEL_TO_CONSOLE = {
    trace: "log",
    debug: "log",
    info:  "info",
    warn:  "warn",
    error: "error"
};

exports.write = function (entry) {
    if (typeof Ti !== 'undefined') {
        const method = LEVEL_TO_TI[entry.level] || "debug";
        Ti.API[method](entry.message);
    } else {
        const method = LEVEL_TO_CONSOLE[entry.level] || "log";
        console[method](entry.message);
    }
    return Promise.resolve();
};
