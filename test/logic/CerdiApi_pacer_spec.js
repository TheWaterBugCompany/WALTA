require("mocha");
const { expect } = require("chai");
const {
    makeScriptedHTTPClient,
    makeFakeProps,
    installFakeTi,
    uninstallFakeTi,
} = require("../fixtures/tiFakes");

const FAST_RETRY = { baseDelayMs: 0, jitter: false, sleep: () => Promise.resolve() };

function makeClock(initial = 1_700_000_000_000) {
    let t = initial;
    return {
        now: () => t,
        advance: (ms) => { t += ms; },
    };
}

function makeSleepRecorder(clock) {
    const calls = [];
    return {
        sleep: (ms) => {
            calls.push(ms);
            clock.advance(ms);
            return Promise.resolve();
        },
        calls,
    };
}

function epochSecondsForDeviceTime(clock, offsetMs = 0) {
    return String(Math.floor((clock.now() + offsetMs) / 1000));
}

function utcStringForDeviceTime(clock, offsetMs = 0) {
    return new Date(clock.now() + offsetMs).toUTCString();
}

describe("CerdiApi: rate-limit pacing wiring", function () {
    let CerdiApi;
    let scripted;

    beforeEach(function () {
        scripted = [];
        installFakeTi({
            httpClient: makeScriptedHTTPClient(scripted),
            props: makeFakeProps({ userAccessTokenLive: { accessToken: 'fake-token' } }),
        });
        delete require.cache[require.resolve("../../walta-app/app/lib/logic/CerdiApi")];
        CerdiApi = require("../../walta-app/app/lib/logic/CerdiApi");
    });

    afterEach(function () {
        uninstallFakeTi();
    });

    it("waits between requests when the server reports a near-empty bucket", async function () {
        const clock = makeClock();
        const sleeper = makeSleepRecorder(clock);
        scripted.push({
            status: 200,
            body: '[]',
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': '1',
                'X-RateLimit-Reset': epochSecondsForDeviceTime(clock, 10_000),
                'Date': utcStringForDeviceTime(clock),
            },
        });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", {
            retry: FAST_RETRY,
            rateLimit: { headroom: 10, now: clock.now, sleep: sleeper.sleep },
        });
        await cerdi.acquire();
        await cerdi.retrieveSamples();
        await cerdi.acquire();
        expect(sleeper.calls).to.deep.equal([10_000]);
    });

    it("does not wait between requests while the bucket stays healthy", async function () {
        const clock = makeClock();
        const sleeper = makeSleepRecorder(clock);
        scripted.push({
            status: 200,
            body: '[]',
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': '57',
                'X-RateLimit-Reset': epochSecondsForDeviceTime(clock, 60_000),
                'Date': utcStringForDeviceTime(clock),
            },
        });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", {
            retry: FAST_RETRY,
            rateLimit: { headroom: 10, now: clock.now, sleep: sleeper.sleep },
        });
        await cerdi.acquire();
        await cerdi.retrieveSamples();
        await cerdi.acquire();
        expect(sleeper.calls).to.deep.equal([]);
    });

    it("falls back to conservative pacing when the response omits rate-limit headers", async function () {
        const clock = makeClock();
        const sleeper = makeSleepRecorder(clock);
        scripted.push({
            status: 200,
            body: '[]',
            headers: { 'Content-Type': 'application/json' },
        });
        const cerdi = CerdiApi.createCerdiApi("http://test.example", "secret", {
            retry: FAST_RETRY,
            rateLimit: { fallbackDelayMs: 2500, now: clock.now, sleep: sleeper.sleep },
        });
        await cerdi.acquire();
        await cerdi.retrieveSamples();
        await cerdi.acquire();
        expect(sleeper.calls).to.deep.equal([2500]);
    });
});
