require("mocha");
const { expect } = require("chai");
const {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
} = require("../fixtures/tiFakes");

const FAST_RETRY = { baseDelayMs: 0, jitter: false, sleep: () => Promise.resolve() };

describe("CerdiApi: 429/5xx retry", function () {
    let CerdiApi;
    let scripted;
    let attempts;

    beforeEach(function () {
        scripted = [];
        attempts = [];
        installFakeTi({
            httpClient: makeScriptedHTTPClient(scripted, attempts),
            props: makeFakeProps({ userAccessTokenLive: { accessToken: 'fake-token' } }),
        });
        delete require.cache[require.resolve("../../walta-app/app/lib/logic/CerdiApi")];
        CerdiApi = require("../../walta-app/app/lib/logic/CerdiApi");
    });

    afterEach(uninstallFakeTi);

    it("retries a 429 response and resolves with the eventual 200 body", async function () {
        scripted.push(
            { status: 429, body: '{"message":"Too Many Attempts."}', headers: { 'Retry-After': '1' } },
            { status: 200, body: '[]' },
        );
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        const result = await cerdi.retrieveSamples();
        expect(result).to.deep.equal([]);
        expect(attempts).to.have.length(2);
    });

    it("retries on 5xx and resolves with the eventual 200 body", async function () {
        scripted.push(
            { status: 503, body: 'Service Unavailable' },
            { status: 200, body: '[]' },
        );
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        const result = await cerdi.retrieveSamples();
        expect(result).to.deep.equal([]);
        expect(attempts).to.have.length(2);
    });

    it("does not retry on 401", async function () {
        scripted.push({ status: 401, body: '{"message":"Unauthenticated."}' });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
        let rejected = null;
        try {
            await cerdi.retrieveSamples();
        } catch (err) {
            rejected = err;
        }
        expect(rejected).to.deep.equal({ message: "Unauthenticated." });
        expect(attempts).to.have.length(1);
    });

    it("truncates multi-KB HTML error bodies in the network trace log", async function () {
        const Logger = require("../../walta-app/app/lib/util/Logger");
        const captured = [];
        const unsub = Logger.subscribe({ facility: 'network' }, (e) => captured.push(e));
        try {
            const html = '<html><body>' + 'x'.repeat(5000) + '</body></html>';
            scripted.push(
                { status: 429, body: html },
                { status: 200, body: '[]' },
            );
            const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });
            await cerdi.retrieveSamples();
        } finally {
            unsub();
        }
        const errLine = captured.find((e) => / ERROR /.test(e.message));
        expect(errLine, "expected a network ERROR line").to.exist;
        expect(errLine.message).to.include('truncated');
        expect(errLine.message.length).to.be.lessThan(1000);
    });
});
