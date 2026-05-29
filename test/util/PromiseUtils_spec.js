require("mocha");
const { expect } = require("chai");
const { withRetry } = require("../../walta-app/app/lib/util/PromiseUtils");

const immediateSleep = () => Promise.resolve();

describe("PromiseUtils.withRetry", function () {
    it("returns the value when fn resolves first try", async function () {
        let calls = 0;
        const result = await withRetry(async () => { calls++; return "ok"; }, {
            maxRetries: 3,
            isRetryable: () => true,
            sleep: immediateSleep,
        });
        expect(result).to.equal("ok");
        expect(calls).to.equal(1);
    });

    it("retries until fn resolves and returns the eventual value", async function () {
        let calls = 0;
        const result = await withRetry(async () => {
            calls++;
            if (calls < 3) throw { status: 429 };
            return "ok";
        }, {
            maxRetries: 3,
            isRetryable: () => true,
            sleep: immediateSleep,
        });
        expect(result).to.equal("ok");
        expect(calls).to.equal(3);
    });

    it("throws the last error when retries are exhausted", async function () {
        let calls = 0;
        let thrown = null;
        try {
            await withRetry(async () => {
                calls++;
                throw { status: 429, attempt: calls };
            }, {
                maxRetries: 3,
                isRetryable: () => true,
                sleep: immediateSleep,
            });
        } catch (err) {
            thrown = err;
        }
        expect(calls).to.equal(4);
        expect(thrown).to.deep.equal({ status: 429, attempt: 4 });
    });

    it("does not retry when isRetryable returns false", async function () {
        let calls = 0;
        let thrown = null;
        try {
            await withRetry(async () => {
                calls++;
                throw { status: 401 };
            }, {
                maxRetries: 3,
                isRetryable: (err) => err.status === 429,
                sleep: immediateSleep,
            });
        } catch (err) {
            thrown = err;
        }
        expect(calls).to.equal(1);
        expect(thrown).to.deep.equal({ status: 401 });
    });

    it("sleeps for an exponentially growing delay between attempts", async function () {
        const slept = [];
        const sleep = async (ms) => { slept.push(ms); };
        let calls = 0;
        await withRetry(async () => {
            calls++;
            if (calls < 4) throw { status: 429 };
            return "ok";
        }, {
            maxRetries: 3,
            isRetryable: () => true,
            baseDelayMs: 1000,
            sleep,
        });
        expect(slept).to.deep.equal([1000, 2000, 4000]);
    });

    it("caps the delay at capDelayMs", async function () {
        const slept = [];
        const sleep = async (ms) => { slept.push(ms); };
        let calls = 0;
        await withRetry(async () => {
            calls++;
            if (calls < 5) throw { status: 429 };
            return "ok";
        }, {
            maxRetries: 4,
            isRetryable: () => true,
            baseDelayMs: 1000,
            capDelayMs: 3000,
            sleep,
        });
        expect(slept).to.deep.equal([1000, 2000, 3000, 3000]);
    });

    it("honours err.retryAfterMs in place of the computed backoff", async function () {
        const slept = [];
        const sleep = async (ms) => { slept.push(ms); };
        let calls = 0;
        await withRetry(async () => {
            calls++;
            if (calls === 1) throw { status: 429, retryAfterMs: 7000 };
            return "ok";
        }, {
            maxRetries: 1,
            isRetryable: () => true,
            baseDelayMs: 1000,
            sleep,
        });
        expect(slept).to.deep.equal([7000]);
    });

    it("adds up-to-25% jitter when jitter is enabled", async function () {
        const slept = [];
        const sleep = async (ms) => { slept.push(ms); };
        let calls = 0;
        await withRetry(async () => {
            calls++;
            if (calls < 4) throw { status: 429 };
            return "ok";
        }, {
            maxRetries: 3,
            isRetryable: () => true,
            baseDelayMs: 1000,
            jitter: true,
            random: () => 1,
            sleep,
        });
        expect(slept).to.deep.equal([1250, 2500, 5000]);
    });
});
