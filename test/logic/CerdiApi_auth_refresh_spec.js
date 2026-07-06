require("mocha");
const { expect } = require("chai");
const {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
} = require("../fixtures/tiFakes");

const FAST_RETRY = { baseDelayMs: 0, jitter: false, sleep: () => Promise.resolve() };
const YEAR_SECONDS = 31536000;

describe("CerdiApi: server-token 401 refresh", function () {
    let CerdiApi;
    let scripted;
    let attempts;
    let props;

    beforeEach(function () {
        scripted = [];
        attempts = [];
        // A cached server token that the local clock still considers valid, but
        // which the server has invalidated (e.g. after a backend redeploy).
        props = makeFakeProps({
            appAccessTokenLive: {
                access_token: "stale-server-token",
                retrieved_at: Date.now(),
                expires_in: YEAR_SECONDS,
            },
        });
        installFakeTi({
            httpClient: makeScriptedHTTPClient(scripted, attempts),
            props,
        });
        delete require.cache[require.resolve("../../walta-app/app/lib/logic/CerdiApi")];
        CerdiApi = require("../../walta-app/app/lib/logic/CerdiApi");
    });

    afterEach(uninstallFakeTi);

    it("refreshes the server token and retries the login once when it is rejected with 401", async function () {
        scripted.push(
            { status: 401, body: '{"message":"Unauthenticated."}' },
            { status: 200, body: '{"access_token":"fresh-server-token","expires_in":31536000}' },
            { status: 200, body: '{"id":5,"accessToken":"user-token"}' },
        );
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });

        const resp = await cerdi.loginUser("testlogin@example.com", "tstPassw0rd!");

        expect(resp.accessToken).to.equal("user-token");
        expect(attempts).to.have.length(3);
        expect(attempts[0].url).to.equal("http://test.example/token/create");
        expect(attempts[1].url).to.equal("http://test.example/token/create/server");
        expect(attempts[2].url).to.equal("http://test.example/token/create");
        expect(attempts[2].headers.Authorization).to.equal("Bearer fresh-server-token");
    });

    it("propagates the error when the retry with a fresh server token still fails", async function () {
        scripted.push(
            { status: 401, body: '{"message":"Unauthenticated."}' },
            { status: 200, body: '{"access_token":"fresh-server-token","expires_in":31536000}' },
            { status: 401, body: '{"message":"Wrong password."}' },
        );
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", { retry: FAST_RETRY });

        let rejected = null;
        try {
            await cerdi.loginUser("testlogin@example.com", "wrong");
        } catch (err) {
            rejected = err;
        }

        expect(rejected).to.deep.equal({ message: "Wrong password." });
        expect(attempts).to.have.length(3);
    });
});
