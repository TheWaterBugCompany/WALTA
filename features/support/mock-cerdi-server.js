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
function loggingHandler(hockServer) {
    const baseHandler = hockServer.handler.bind(hockServer);
    const logPath = process.env.MOCK_CERDI_LOG === '0'
        ? null
        : (process.env.MOCK_CERDI_LOG || '/tmp/mock-cerdi.log');
    if (logPath) {
        try { fs.writeFileSync(logPath, ''); } catch (_) { /* best-effort */ }
    }
    return function (req, res) {
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


    let server = http.createServer(loggingHandler(hockServer));
    server.listen(9999, callback);
    return { 
        hockServer: hockServer, 
        server: server,
        shutdown() {
            this.server.close();
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