require("mocha");
const { expect } = require("chai");
const { createPacer } = require("../../walta-app/app/lib/util/RateLimitPacer");
const { HttpHeaders } = require("../../walta-app/app/lib/util/HttpHeaders");
const { createHttpHeaders } = require("../fixtures/createHttpHeaders");

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
        it("fires the first request instantly even without headers — one request can't burst a server", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ fallbackDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });

        it("paces subsequent acquires by fallbackDelayMs when header data still hasn't arrived", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ fallbackDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            clock.advance(1000);
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([1500]);
        });
    });

    describe("acquire() after observing a healthy bucket", function () {
        it("resolves without sleeping when remaining is above headroom", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "37",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 60_000),
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([]);
        });
    });

    describe("acquire() with a near-empty bucket", function () {
        it("spreads remaining budget across remaining window when remaining <= headroom", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire(); // first request is instant; observe + acquire below exercises pacing
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 10_000),
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });

        it("trusts the headers fully — no upper cap on the voluntary wait", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "1",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 60_000),
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([60_000]);
        });

        it("subtracts elapsed time since the last request from the spread", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 10_000),
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            clock.advance(1000);
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000, 1000]);
        });

        it("does not wait once elapsed time alone covers the spread", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 10_000),
                "Date": utcStringForDeviceTime(clock),
            })));
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
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            const serverAheadMs = 5000;
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, serverAheadMs + 10_000),
                "Date": utcStringForDeviceTime(clock, serverAheadMs),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });

    describe("header-name handling", function () {
        it("looks up rate-limit headers case-insensitively", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RATELIMIT-RESET": epochSecondsForDeviceTime(clock, 10_000),
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });

    describe("graceful handling of missing or garbage headers", function () {
        it("falls back to fallbackDelayMs on the second acquire when observe({}) leaves no state", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ fallbackDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            pacer.observe(HttpHeaders.parse(""));
            await pacer.acquire();
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([2500]);
        });

        it("falls back to fallbackDelayMs on the second acquire when remaining and reset don't parse", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ fallbackDelayMs: 2500, now: clock.now, sleep: sleeper.sleep });
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "not-a-number",
                "X-RateLimit-Reset": "garbage",
                "Date": utcStringForDeviceTime(clock),
            })));
            await pacer.acquire();
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([2500]);
        });

        it("falls back to device clock when the Date header is missing", async function () {
            const clock = makeClock();
            const sleeper = makeSleepRecorder(clock);
            const pacer = createPacer({ headroom: 10, now: clock.now, sleep: sleeper.sleep });
            await pacer.acquire();
            pacer.observe(HttpHeaders.parse(createHttpHeaders({
                "X-RateLimit-Remaining": "2",
                "X-RateLimit-Reset": epochSecondsForDeviceTime(clock, 10_000),
            })));
            await pacer.acquire();
            expect(sleeper.calls).to.deep.equal([5000]);
        });
    });
});
