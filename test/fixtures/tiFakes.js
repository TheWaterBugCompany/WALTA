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

function installFakeTi({ httpClient, props, filesystem } = {}) {
    global.Ti = {
        Network: {
            NETWORK_NONE: 0,
            createHTTPClient: httpClient || (() => ({})),
        },
        App: {
            Properties: props || makeFakeProps(),
        },
        API: { info() {}, error() {}, warn() {}, debug() {} },
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

module.exports = {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
};
