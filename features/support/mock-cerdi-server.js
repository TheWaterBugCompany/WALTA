const http = require('http');
const hock = require('hock');
const path = require("path");
const { makeCerdiSampleData } = require('../../walta-app/app/spec/fixtures/SampleData_fixture.js');

// Wraps hock's handler to log every request and the response status —
// invaluable for diagnosing acceptance-test sync failures where an
// unstubbed endpoint or malformed body silently 500s and the test
// just sees "Sync complete not present". Writes to a file because
// cucumber-js's progress formatter swallows stdout `console.log`.
// Default path: /tmp/mock-cerdi.log (set MOCK_CERDI_LOG=0 to disable,
// or MOCK_CERDI_LOG=<path> to override).
const fs = require('fs');
function isSamplesFetch(req) {
    return req.method === 'GET' && (req.url === '/samples' || req.url.startsWith('/samples?'));
}

// The mock issues these fixed bearer tokens, so a fault can target one token
// type without touching the other: the server token gates login/register, the
// user token gates logged-in sync.
const SERVER_TOKEN_BEARER = 'Bearer secretaccesstoken';
const USER_TOKEN_BEARER = 'Bearer testusertoken';

function isServerTokenFetch(req) {
    return req.method === 'POST' && req.url === '/token/create/server';
}

function reply401(res) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Unauthenticated.' }));
}
function applyRateLimitHeaders(res, bucket) {
    if (!bucket) return;
    res.setHeader('X-RateLimit-Remaining', String(bucket.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + bucket.resetSecondsFromNow));
    res.setHeader('X-RateLimit-Limit', String(bucket.limit));
}

function loggingHandler(hockServer, faultState) {
    const baseHandler = hockServer.handler.bind(hockServer);
    const logPath = process.env.MOCK_CERDI_LOG === '0'
        ? null
        : (process.env.MOCK_CERDI_LOG || '/tmp/mock-cerdi.log');
    if (logPath) {
        try { fs.writeFileSync(logPath, ''); } catch (_) { /* best-effort */ }
    }
    return function (req, res) {
        // Lets a resilience test count history-download attempts and force them
        // to fail, so an interrupted full sync can be driven deterministically.
        if (isSamplesFetch(req)) {
            faultState.sampleFetches++;
            if (faultState.failing) {
                applyRateLimitHeaders(res, faultState.rateLimit);
                res.writeHead(500);
                res.end('injected sync fault');
                return;
            }
        }
        if (isServerTokenFetch(req)) faultState.serverTokenFetches++;
        const auth = req.headers.authorization || '';
        // One-shot 401 on a server-token-bearing request models a server that
        // invalidated the cached token: the client should refresh it and retry.
        if (faultState.rejectServerTokenOnce && auth === SERVER_TOKEN_BEARER) {
            faultState.rejectServerTokenOnce = false;
            reply401(res);
            return;
        }
        // A persistently-invalid user token models a password change the user
        // never re-logged-in for: every sync request 401s until they re-auth.
        if (faultState.userTokenInvalid && auth === USER_TOKEN_BEARER) {
            reply401(res);
            return;
        }
        applyRateLimitHeaders(res, faultState.rateLimit);
        if (!logPath) return baseHandler(req, res);
        const start = Date.now();
        const append = (line) => { try { fs.appendFileSync(logPath, line); } catch (_) { /* best-effort */ } };
        append(`[${new Date().toISOString()}] >> ${req.method} ${req.url}\n`);
        const writeHead = res.writeHead.bind(res);
        let statusCode = null;
        res.writeHead = function (code, ...rest) {
            statusCode = code;
            return writeHead(code, ...rest);
        };
        res.on('finish', () => {
            const ms = Date.now() - start;
            const bodyHint = (req.method === 'POST' || req.method === 'PUT')
                ? ` body=${(req.body || '').slice(0, 200)}` : '';
            append(`[${new Date().toISOString()}] << ${req.method} ${req.url} ${statusCode} (${ms}ms)${bodyHint}\n`);
        });
        res.on('close', () => {
            if (!res.writableEnded) {
                append(`[${new Date().toISOString()}] !! ${req.method} ${req.url} closed without finish\n`);
            }
        });
        return baseHandler(req, res);
    };
}

function createMockCerdiServer(callback) {
    // throwOnUnmatched=false: unmatched requests get a 500 with a stderr
    // log instead of crashing the http server. We want to see the bad
    // request, not silently die.
    let hockServer = hock.createHock({ throwOnUnmatched: false });
    hockServer
        .post('/token/create/server',{
            "client_secret":"hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
            "scope":"create-users"
        })
        .many()
        .reply(200, {
            "access_token": "secretaccesstoken",
            "expires_in": 31535997,
            "token_type": "Bearer"
        });


    const faultState = {
        failing: false,
        sampleFetches: 0,
        rejectServerTokenOnce: false,
        userTokenInvalid: false,
        serverTokenFetches: 0,
        rateLimit: { remaining: 50, resetSecondsFromNow: 60, limit: 60 },
    };
    let server = http.createServer(loggingHandler(hockServer, faultState));
    server.listen(9999, callback);
    return {
        hockServer: hockServer,
        server: server,
        shutdown() {
            this.server.close();
        },
        setSampleFetchFailing(value) {
            faultState.failing = !!value;
        },
        samplesFetchCount() {
            return faultState.sampleFetches;
        },
        // Reject the next server-token-bearing request once with a 401 (see WB-185).
        setServerTokenRejectOnce() {
            faultState.rejectServerTokenOnce = true;
        },
        // Count of /token/create/server fetches — a second fetch proves the
        // client refreshed a rejected server token rather than giving up.
        serverTokenFetchCount() {
            return faultState.serverTokenFetches;
        },
        // 401 every request bearing the user token (models a password change).
        setUserTokenInvalid(value) {
            faultState.userTokenInvalid = !!value;
        },
        setRateLimitBucket(bucket) {
            faultState.rateLimit = bucket
                ? { remaining: 50, resetSecondsFromNow: 60, limit: 60, ...bucket }
                : null;
        },
        registerAccount({ email, password }) {
            this.hockServer
                .post("/token/create", { password, email })
                .many()
                .reply(200, {
                    "id": 38,
                    "name": "Test User",
                    "email": email,
                    "created_at": "2018-09-07 08:55:30",
                    "updated_at": "2018-09-07 08:55:30",
                    "group": 0,
                    "survey_consent": 0,
                    "share_name_consent": 0,
                    "oauth_network": null,
                    "accessToken": "testusertoken"
                });
        },
        makeMockSample() {
            this.registerAccount({ email: "test@example.com", password: "password" });
            // set up samples response
            let sampleData = makeCerdiSampleData({
                photos: [{"id": 1}],
                sampled_creatures: [
                    {
                        "sample_id": 473,
                        "creature_id": 12,
                        "count": 2,
                        "photos_count": 1
                    },
                    {
                        "sample_id": 473,
                        "creature_id": 11,
                        "count": 6,
                        "photos_count": 1
                    }
                ]
            });
            // .many() allows the stub to match an unlimited number of
            // requests — auto-login's startup sync + the test's manual
            // Sync Now both fetch the same endpoints.
            this.hockServer
                .get("/samples")
                .many().reply(200,[sampleData]);
            this.hockServer
                .get(`/samples/${sampleData.id}/photos`)
                .many().reply(200,[{id:1}]);
            this.hockServer
                .get(`/samples/${sampleData.id}/unknownCreatures`)
                .many().reply(200,[]);
            this.hockServer
                .get('/photos/1/view')
                .many().replyWithFile(200, path.join(__dirname,'../../walta-app/app/spec/resources/site-mock.jpg'));
            this.hockServer
                .get(`/samples/${sampleData.id}/creatures/12/photos`)
                .many().reply(200,[{id:2}]);
            this.hockServer
                .get(`/samples/${sampleData.id}/creatures/11/photos`)
                .many().reply(200,[{id:3}]);
            this.hockServer
                .get('/photos/2/view')
                .many().replyWithFile(200, path.join(__dirname,'../../walta-app/app/spec/resources/simpleKey1/media/amphipoda_01.jpg'));
            this.hockServer
                .get('/photos/3/view')
                .many().replyWithFile(200, path.join(__dirname,'../../walta-app/app/spec/resources/simpleKey1/media/phreatoicidae.jpg'));
        }
    };
}

exports.createMockCerdiServer = createMockCerdiServer;