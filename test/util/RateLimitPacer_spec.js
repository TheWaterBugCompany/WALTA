require("mocha");
const { expect } = require("chai");
const { createPacer } = require("../../walta-app/app/lib/util/RateLimitPacer");

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

describe("RateLimitPacer", function () {
    describe("acquire() before any response has been observed", function () {
        it("resolves without sleeping (first-request-instant rule)", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });
    });

    describe("acquire() after observing a healthy bucket", function () {
        it("resolves without sleeping when remaining is above headroom", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "37",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 60_000),
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });
    });

    describe("acquire() with a near-empty bucket", function () {
        it("spreads remaining budget across remaining window when remaining <= headroom", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 60_000, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "2",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 10_000),
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });

        it("caps the voluntary wait at maxDelayMs", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "1",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 60_000),
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([2500]);
        });

        it("subtracts elapsed time since the last request from the spread", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 60_000, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "2",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 10_000),
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            clock.advance(1000);
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000, 1000]);
        });

        it("does not wait once elapsed time alone covers the spread", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 60_000, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "2",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 10_000),
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            clock.advance(10_000);
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });

    describe("clock-skew correction via Date header", function () {
        it("interprets x-ratelimit-reset in device time using the server's Date header", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 60_000, now: clock.now, sleep: sleeper.sleep });
            const serverAheadMs = 5000;
            pacer.observe({
                "x-ratelimit-remaining": "2",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, serverAheadMs + 10_000),
                "date": utcStringForDeviceTime(clock, serverAheadMs),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });

    describe("header-name handling", function () {
        it("looks up rate-limit headers case-insensitively", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "X-RateLimit-Remaining": "1",
                "X-RATELIMIT-RESET": epochSecondsForDeviceTime(clock, 60_000),
                "Date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([2500]);
        });
    });

    describe("graceful handling of missing or garbage headers", function () {
        it("ignores observe(null) and observe({}) and stays in fresh state", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            pacer.observe(null);
            pacer.observe({});
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });

        it("ignores non-numeric remaining and reset values", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "not-a-number",
                "x-ratelimit-reset": "garbage",
                "date": utcStringForDeviceTime(clock),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });

        it("falls back to device clock when the Date header is missing", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, maxDelayMs: 60_000, now: clock.now, sleep: sleeper.sleep });
            pacer.observe({
                "x-ratelimit-remaining": "2",
                "x-ratelimit-reset": epochSecondsForDeviceTime(clock, 10_000),
            });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });
});
