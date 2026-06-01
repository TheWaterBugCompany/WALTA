function createHttpHeaders(obj) {
    return Object.keys(obj).map((k) => `${k}: ${obj[k]}`).join("\r\n");
}

exports.createHttpHeaders = createHttpHeaders;
