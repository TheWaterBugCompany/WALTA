require("mocha");
const { expect } = require("chai");
const {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
} = require("../fixtures/tiFakes");

const FAST_RETRY = { baseDelayMs: 0, jitter: false, sleep: () => Promise.resolve() };

describe("CerdiApi: network trace headers", function () {
    let CerdiApi;
    let Logger;
    let scripted;
    let attempts;
    let networkLogs;
    let unsubLogger;

    beforeEach(function () {
        scripted = [];
        attempts = [];
        installFakeTi({
            httpClient: makeScriptedHTTPClient(scripted, attempts),
            props: makeFakeProps({ userAccessTokenLive: { accessToken: 'fake-token' } }),
        });
        delete require.cache[require.resolve("../../walta-app/app/lib/logic/CerdiApi")];
        CerdiApi = require("../../walta-app/app/lib/logic/CerdiApi");
        Logger = require("../../walta-app/app/lib/util/Logger");
        networkLogs = [];
        unsubLogger = Logger.subscribe({ facility: 'network' }, (e) => networkLogs.push(e));
    });

    afterEach(function () {
        if (unsubLogger) unsubLogger();
        uninstallFakeTi();
    });

    it("includes response headers on a successful 200 trace", async function () {
        scripted.push({
            status: 200,
            body: '[]',
            headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '57' },
        });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        await cerdi.retrieveSamples();
        const responseLine = networkLogs.find((e) => /^<- 200/.test(e.message));
        expect(responseLine, "expected a 200 response trace").to.exist;
        expect(responseLine.message).to.include('content-type');
        expect(responseLine.message).to.include('application/json');
        expect(responseLine.message).to.include('x-ratelimit-remaining');
        expect(responseLine.message).to.include('57');
    });

    it("includes response headers on a 429 error trace", async function () {
        scripted.push(
            {
                status: 429,
                body: '{"message":"Too Many Attempts."}',
                headers: { 'Retry-After': '8', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1779937511' },
            },
            { status: 200, body: '[]' },
        );
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        await cerdi.retrieveSamples();
        const errorLine = networkLogs.find((e) => /^<- 429 .* ERROR/.test(e.message));
        expect(errorLine, "expected a 429 error trace").to.exist;
        expect(errorLine.message).to.include('retry-after');
        expect(errorLine.message).to.include('"8"');
        expect(errorLine.message).to.include('x-ratelimit-remaining');
        expect(errorLine.message).to.include('x-ratelimit-reset');
    });

    it("redacts the value of sensitive headers by name", async function () {
        scripted.push({
            status: 200,
            body: '[]',
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'session=abc123; Path=/; HttpOnly',
                'Authorization': 'Bearer eyJ-secret-payload',
            },
        });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        await cerdi.retrieveSamples();
        const responseLine = networkLogs.find((e) => /^<- 200/.test(e.message));
        expect(responseLine, "expected a 200 response trace").to.exist;
        expect(responseLine.message).to.include('set-cookie');
        expect(responseLine.message).to.include('authorization');
        expect(responseLine.message).to.not.include('session=abc123');
        expect(responseLine.message).to.not.include('eyJ-secret-payload');
        expect(responseLine.message).to.include('[REDACTED]');
    });
});
