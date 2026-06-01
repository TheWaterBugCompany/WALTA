const Logger = require('util/Logger');
const { withRetry } = require('util/PromiseUtils');
const { createPacer } = require('util/RateLimitPacer');
const log = (m, tag = "auth") => Logger.log(m, tag);
const trace = (m) => Logger.log(m, "network");
var { loadPhoto, savePhoto } = require('util/PhotoUtils');

const SENSITIVE_KEYS = ["password", "client_secret", "accessToken", "access_token"];
function redactBody(data) {
    if (!data || typeof data !== 'object') return data;
    const copy = Array.isArray(data) ? data.slice() : Object.assign({}, data);
    for (const k of SENSITIVE_KEYS) {
        if (k in copy) copy[k] = "[REDACTED]";
    }
    return copy;
}

const DEFAULT_RETRY_OPTS = {
    maxRetries: 3,
    baseDelayMs: 1000,
    capDelayMs: 30000,
    jitter: true,
};

const MAX_ERROR_BODY_CHARS = 500;
function truncate(s) {
    if (typeof s !== 'string' || s.length <= MAX_ERROR_BODY_CHARS) return s;
    return `${s.slice(0, MAX_ERROR_BODY_CHARS)}…[${s.length - MAX_ERROR_BODY_CHARS} more chars truncated]`;
}

const SENSITIVE_HEADER_NAMES = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-auth-token',
    'x-api-key',
    'x-csrf-token',
]);

function parseHeaders(raw) {
    if (typeof raw !== 'string' || !raw.length) return null;
    const out = {};
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
        if (!line) continue;
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const name = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        out[name] = value;
    }
    return Object.keys(out).length ? out : null;
}

function redactHeaders(headers) {
    if (!headers || typeof headers !== 'object') return headers;
    const out = {};
    for (const key of Object.keys(headers)) {
        out[key] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase()) ? '[REDACTED]' : headers[key];
    }
    return out;
}

function readResponseHeaders(client) {
    if (typeof client.getAllResponseHeaders !== 'function') return null;
    return parseHeaders(client.getAllResponseHeaders());
}

function formatHeadersForTrace(parsed) {
    if (!parsed) return '';
    return ` headers=${JSON.stringify(redactHeaders(parsed))}`;
}

function parseRetryAfter(raw) {
    if (raw == null) return undefined;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && String(n) === String(raw).trim()) return n * 1000;
    const at = Date.parse(raw);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
    return undefined;
}

function isRetryableHttpError(err) {
    if (!err || typeof err.status !== 'number') return false;
    return err.status === 429 || (err.status >= 500 && err.status < 600);
}

function sendOnce(method, url, contentType, acceptType, accessToken, sendDataFunction, onResponseHeaders) {
    return new Promise((resolve, reject) => {
        var client = Ti.Network.createHTTPClient({
            onload: function () {
                const parsedHeaders = readResponseHeaders(this);
                const headers = formatHeadersForTrace(parsedHeaders);
                if (onResponseHeaders) onResponseHeaders(parsedHeaders);
                if (acceptType === 'application/json') {
                    const parsed = JSON.parse(this.responseText);
                    trace(`<- ${this.status} ${method} ${url} ${JSON.stringify(redactBody(parsed))}${headers}`);
                    resolve(parsed);
                } else {
                    const bytes = this.responseData ? this.responseData.length : 0;
                    trace(`<- ${this.status} ${method} ${url} (${bytes} bytes)${headers}`);
                    resolve(this.responseData);
                }
            },
            onerror: function (err) {
                const status = this.status || '?';
                const parsedHeaders = readResponseHeaders(this);
                const headers = formatHeadersForTrace(parsedHeaders);
                if (onResponseHeaders) onResponseHeaders(parsedHeaders);
                let body = err;
                if (this.responseText) {
                    try {
                        body = JSON.parse(this.responseText);
                        trace(`<- ${status} ${method} ${url} ERROR ${JSON.stringify(redactBody(body))}${headers}`);
                    } catch (_) {
                        trace(`<- ${status} ${method} ${url} ERROR ${truncate(this.responseText)}${headers}`);
                    }
                } else {
                    trace(`<- ${status} ${method} ${url} ERROR (no body)${headers}`);
                }
                const retryAfterRaw = typeof this.getResponseHeader === 'function'
                    ? this.getResponseHeader('Retry-After')
                    : undefined;
                const wrapped = { status: this.status, body };
                const retryAfterMs = parseRetryAfter(retryAfterRaw);
                if (retryAfterMs !== undefined) wrapped.retryAfterMs = retryAfterMs;
                reject(wrapped);
            }
        });
        client.open(method, url);
        client.setRequestHeader('Accept', acceptType);
        if (contentType !== "multipart/form-data" && contentType !== null)
            client.setRequestHeader('Content-Type', contentType);
        if (accessToken)
            client.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        sendDataFunction(client);
    });
}

function buildHttp(retryOpts, pacer) {
    const onResponseHeaders = pacer ? (parsed) => pacer.observe(parsed) : null;
    function createHttpClient(method, url, contentType, acceptType, accessToken, sendDataFunction) {
        return withRetry(
            () => sendOnce(method, url, contentType, acceptType, accessToken, sendDataFunction, onResponseHeaders),
            { ...retryOpts, isRetryable: isRetryableHttpError }
        ).catch((err) => {
            if (err && typeof err === 'object' && 'body' in err && 'status' in err) {
                throw err.body;
            }
            throw err;
        });
    }

    function makeJsonGetRequest(serverUrl, accessToken = null) {
        trace(`GET ${serverUrl}`);
        return createHttpClient("GET", serverUrl, null, "application/json", accessToken,
            (client) => client.send());
    }

    function makeJsonDeleteRequest(serverUrl, accessToken = null) {
        trace(`DELETE ${serverUrl}`);
        return createHttpClient("DELETE", serverUrl, null, "application/json", accessToken,
            (client) => client.send());
    }

    function makeJsonPostRequest(serverUrl, data, accessToken = null) {
        trace(`POST ${serverUrl} ${JSON.stringify(redactBody(data))}`);
        return createHttpClient("POST", serverUrl, "application/json", "application/json", accessToken,
            (client) => client.send(JSON.stringify(data)));
    }

    function makeJsonPutRequest(serverUrl, data, accessToken = null) {
        trace(`PUT ${serverUrl} ${JSON.stringify(redactBody(data))}`);
        return createHttpClient("PUT", serverUrl, "application/json", "application/json", accessToken,
            (client) => client.send(JSON.stringify(data)));
    }

    function makeImagePostRequest(serverUrl, imageData, data, accessToken = null) {
        data.photo = imageData;
        trace(`POST ${serverUrl} (multipart, ${Object.keys(data).join(",")})`);
        return createHttpClient("POST", serverUrl, "multipart/form-data", "application/json", accessToken,
            (client) => client.send(data));
    }

    function makeImagePutRequest(serverUrl, imageData, data, accessToken = null) {
        data.photo = imageData;
        trace(`PUT ${serverUrl} (multipart, ${Object.keys(data).join(",")})`);
        return createHttpClient("PUT", serverUrl, "multipart/form-data", "application/json", accessToken,
            (client) => client.send(data));
    }

    function makeImageGetRequest(serverUrl, accessToken = null) {
        trace(`GET ${serverUrl} (image)`);
        return createHttpClient("GET", serverUrl, null, "image/jpeg", accessToken,
            (client) => client.send());
    }

    function fetchPhoto(photoId, serverUrl, accessToken, photoPath) {
        return makeImageGetRequest(`${serverUrl}/photos/${photoId}/view`, accessToken)
            .then((blob) => {
                savePhoto(blob, photoPath);
                return { id: photoId, photoPath: photoPath };
            });
    }

    function fetchPhotoFromMeta(serverUrl, photoUrl, accessToken, photoPath) {
        return makeJsonGetRequest(`${serverUrl}/${photoUrl}`, accessToken)
            .then((photos) => {
                if (photos.length > 0) {
                    const photo = photos[photos.length - 1];
                    return fetchPhoto(photo.id, serverUrl, accessToken, photoPath)
                        .then(() => photo);
                }
            });
    }

    return {
        makeJsonGetRequest,
        makeJsonDeleteRequest,
        makeJsonPostRequest,
        makeJsonPutRequest,
        makeImagePostRequest,
        makeImagePutRequest,
        makeImageGetRequest,
        fetchPhoto,
        fetchPhotoFromMeta,
    };
}

function createCerdiApi(serverUrl, client_secret, opts = {}) {
    log(`Using CERDI API server ${serverUrl}`);
    const pacer = createPacer(opts.rateLimit || {});
    const http = buildHttp({ ...DEFAULT_RETRY_OPTS, ...(opts.retry || {}) }, pacer);

    var cerdiApi = {
        acquire: pacer.acquire,

        retrieveUserToken() {
            return Ti.App.Properties.getObject('userAccessTokenLive');
        },

        _requireAccessToken() {
            const token = this.retrieveUserToken();
            if (!token) throw new Error("Not logged in");
            return token.accessToken;
        },

        retrieveUserId() {
            let token = this.retrieveUserToken();
            if (token) {
                return token.id;
            }
        },

        retrieveUsername() {
            return Ti.App.Properties.getObject("userAccessUsername");
        },

        storeUserToken(email, accessToken) {
            Ti.App.Properties.setObject("userAccessUsername", email);
            Ti.App.Properties.setObject('userAccessTokenLive', accessToken);
        },

        obtainServerAccessToken() {
            return Promise.resolve(Ti.App.Properties.getObject('appAccessTokenLive'))
                .then((cachedAppAccessToken) => {
                    if (cachedAppAccessToken) {
                        log(`Got existing access token retrieved_at = ${cachedAppAccessToken.retrieved_at} expires_in = ${cachedAppAccessToken.expires_in}`);
                        let tokenAge = Date.now() - cachedAppAccessToken.retrieved_at;
                        if (tokenAge < cachedAppAccessToken.expires_in * 1000)
                            return cachedAppAccessToken;
                        log("Expired token");
                    }
                    log("Requesting a new token");
                    return http.makeJsonPostRequest(this.serverUrl + '/token/create/server', {
                        "client_secret": this.client_secret,
                        "scope": this.scope
                    });
                })
                .then((appAccessToken) => {
                    appAccessToken.retrieved_at = Date.now();
                    Ti.App.Properties.setObject('appAccessTokenLive', appAccessToken);
                    return appAccessToken.access_token;
                });
        },

        registerUser(userInfo) {
            return this.obtainServerAccessToken()
                .then((accessToken) =>
                    http.makeJsonPostRequest(this.serverUrl + '/user/create', userInfo, accessToken))
                .then((resp) => ({ id: resp.id, accessToken: resp.accessToken }));
        },

        loginUser(email, password) {
            return this.obtainServerAccessToken()
                .then((accessToken) =>
                    http.makeJsonPostRequest(this.serverUrl + '/token/create', {
                        "password": password,
                        "email": email
                    }, accessToken))
                .then((resp) => {
                    resp.retrieved_at = Date.now();
                    this.storeUserToken(email, resp);
                    return resp;
                });
        },

        submitSitePhoto(serverSampleId, photoPath) {
            var photoBlob = loadPhoto(photoPath);
            let accessToken = this._requireAccessToken();
            return http.makeImagePostRequest(`${this.serverUrl}/samples/${serverSampleId}/photos`, photoBlob, {}, accessToken);
        },

        submitCreaturePhoto(serverSampleId, creatureId, photoPath) {
            var photoBlob = loadPhoto(photoPath);
            let accessToken = this._requireAccessToken();
            return http.makeImagePostRequest(`${this.serverUrl}/samples/${serverSampleId}/creatures/${creatureId}/photos`, photoBlob, {}, accessToken);
        },

        retrievePhoto(photoId, photoPath) {
            let accessToken = this._requireAccessToken();
            return http.fetchPhoto(photoId, this.serverUrl, accessToken, photoPath);
        },

        retrievePhotoMetadata(photoId) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonGetRequest(`${this.serverUrl}/photos/${photoId}`, accessToken);
        },

        retrieveSitePhoto(serverSampleId, photoPath) {
            let accessToken = this._requireAccessToken();
            return http.fetchPhotoFromMeta(this.serverUrl, `samples/${serverSampleId}/photos`, accessToken, photoPath);
        },

        retrieveCreaturePhoto(serverSampleId, creatureId, photoPath) {
            let accessToken = this._requireAccessToken();
            return http.fetchPhotoFromMeta(this.serverUrl, `samples/${serverSampleId}/creatures/${creatureId}/photos`, accessToken, photoPath);
        },

        submitSample(sample) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonPostRequest(this.serverUrl + '/samples', sample, accessToken);
        },

        retrieveSampleById(serverSampleId) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonGetRequest(`${this.serverUrl}/samples/${serverSampleId}`, accessToken);
        },

        updateSampleById(serverSampleId, sample) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonPutRequest(`${this.serverUrl}/samples/${serverSampleId}`, sample, accessToken);
        },

        updateUnknownCreature(unknownCreatureId, count, photoPath) {
            var photoBlob = loadPhoto(photoPath);
            let accessToken = this._requireAccessToken();
            return http.makeImagePutRequest(`${this.serverUrl}/unknownSampledCreatures/${unknownCreatureId}`, photoBlob, { count: count }, accessToken);
        },

        submitUnknownCreature(serverSampleId, count, photoPath) {
            var photoBlob = loadPhoto(photoPath);
            let accessToken = this._requireAccessToken();
            return http.makeImagePostRequest(`${this.serverUrl}/samples/${serverSampleId}/unknownCreatures`, photoBlob, { count: count }, accessToken);
        },

        deleteUnknownCreature(unknownCreatureId) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonDeleteRequest(`${this.serverUrl}/unknownSampledCreatures/${unknownCreatureId}`, accessToken);
        },

        retrieveUnknownCreatures(serverSampleId) {
            let accessToken = this._requireAccessToken();
            return http.makeJsonGetRequest(`${this.serverUrl}/samples/${serverSampleId}/unknownCreatures`, accessToken);
        },

        retrieveSamples() {
            let accessToken = this._requireAccessToken();
            return http.makeJsonGetRequest(this.serverUrl + '/samples', accessToken);
        },

        forgotPassword(email) {
            return this.obtainServerAccessToken()
                .then((accessToken) => http.makeJsonPostRequest(this.serverUrl + '/password/email', { "email": email }, accessToken));
        }
    };
    cerdiApi.client_secret = client_secret;
    cerdiApi.scope = 'create-users';
    cerdiApi.serverUrl = serverUrl;
    return cerdiApi;
}

exports.createCerdiApi = createCerdiApi;
