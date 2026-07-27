require("mocha");
const { expect } = require("chai");
const waitForStable = require("../../walta-app/app/lib/util/waitForStable");

// Drives a scripted sequence of samples and fake time so the settle logic is
// tested without a real Ti view or real delays. Mirrors the host-side
// waitForSettled harness (features/support/wait-for-settled.js) — this is the
// on-device twin used to gate toImage() capture on "the display stopped changing".
function harness(samples) {
    let i = 0;
    const seen = [];
    const sample = () => {
        const v = samples[Math.min(i, samples.length - 1)];
        i += 1;
        seen.push(v);
        return v;
    };
    const sleep = () => Promise.resolve();
    return { sample, sleep, sampleCount: () => seen.length };
}

describe("waitForStable", function () {
    it("returns the value once two consecutive samples match", async function () {
        const h = harness(["a", "b", "b"]);
        const result = await waitForStable(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(result).to.equal("b");
        expect(h.sampleCount()).to.equal(3);
    });

    it("keeps polling while the value is still changing", async function () {
        const h = harness(["a", "b", "c", "c"]);
        await waitForStable(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(h.sampleCount()).to.equal(4);
    });

    it("returns immediately when the value is already stable", async function () {
        const h = harness(["x", "x"]);
        const result = await waitForStable(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(result).to.equal("x");
        expect(h.sampleCount()).to.equal(2);
    });

    // A never-settling view must give up and return its latest sample rather
    // than hang — a slightly-early capture beats a wedged suite.
    it("gives up after the timeout and returns the latest sample", async function () {
        let now = 0;
        const clock = () => now;
        const sample = () => String(now);
        const sleep = () => { now += 50; return Promise.resolve(); };
        const result = await waitForStable(sample, { interval: 50, timeout: 200, sleep, clock });
        expect(now).to.be.at.least(200);
        expect(result).to.equal(String(now));
    });
});
