function makeScriptedHTTPClient(scripted, attempts = []) {
    return function (params) {
        return {
            _headers: {},
            onload: params.onload,
            onerror: params.onerror,
            open(method, url) { this._method = method; this._url = url; },
            setRequestHeader(name, value) { this._headers[name] = value; },
            getResponseHeader(name) { return (this._responseHeaders || {})[name]; },
            send() {
                const next = scripted.shift();
                if (!next) throw new Error("No scripted response left");
                attempts.push({ method: this._method, url: this._url, headers: { ...this._headers } });
                this.status = next.status;
                this.responseText = next.body;
                this.responseData = Buffer.from(next.body || '');
                this._responseHeaders = next.headers || {};
                setImmediate(() => {
                    if (next.status >= 400) this.onerror.call(this, {});
                    else this.onload.call(this);
                });
            }
        };
    };
}

function makeFakeProps(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
        getObject(name) { return store.get(name); },
        setObject(name, value) { store.set(name, value); },
        hasProperty(name) { return store.has(name); },
        clear() { store.clear(); },
    };
}

function installFakeTi({ httpClient, props, filesystem, api } = {}) {
    global.Ti = {
        Network: {
            NETWORK_NONE: 0,
            createHTTPClient: httpClient || (() => ({})),
        },
        App: {
            Properties: props || makeFakeProps(),
        },
        API: api || { info() {}, error() {}, warn() {}, debug() {}, log() {} },
        Filesystem: filesystem || {
            getFile: () => ({ exists: () => false }),
            resourcesDirectory: "/tmp/r",
            applicationDataDirectory: "/tmp/d",
        },
    };
}

function uninstallFakeTi() {
    delete global.Ti;
}

function makeCapturingTiAPI() {
    const calls = [];
    const api = {
        debug(m) { calls.push({ method: "debug", m }); },
        info(m)  { calls.push({ method: "info",  m }); },
        warn(m)  { calls.push({ method: "warn",  m }); },
        error(m) { calls.push({ method: "error", m }); },
        log(level, message) { calls.push({ method: "log", level, message }); },
    };
    return { api, calls };
}

function makeCapturingConsole() {
    const orig = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
    };
    const calls = [];
    console.log   = function (m) { calls.push({ method: "log",   m }); };
    console.info  = function (m) { calls.push({ method: "info",  m }); };
    console.warn  = function (m) { calls.push({ method: "warn",  m }); };
    console.error = function (m) { calls.push({ method: "error", m }); };
    return {
        calls,
        restore() {
            console.log   = orig.log;
            console.info  = orig.info;
            console.warn  = orig.warn;
            console.error = orig.error;
        },
    };
}

module.exports = {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
    makeCapturingTiAPI,
    makeCapturingConsole,
};
