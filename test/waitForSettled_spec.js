require("mocha");
const { expect } = require("chai");
const waitForSettled = require("../features/support/wait-for-settled");

// Drives fake time and a scripted sequence of samples so the debounce logic is
// tested without an Appium driver or real delays.
function harness(samples) {
    let i = 0;
    const seen = [];
    const sample = async () => {
        const v = samples[Math.min(i, samples.length - 1)];
        i++;
        seen.push(v);
        return v;
    };
    const sleep = async () => {};
    return { sample, sleep, sampleCount: () => seen.length };
}

describe("waitForSettled", function () {
    it("returns once two consecutive samples match", async function () {
        const h = harness(["a", "b", "b"]);
        await waitForSettled(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(h.sampleCount()).to.equal(3);
    });

    it("keeps polling while the view is still changing", async function () {
        const h = harness(["a", "b", "c", "c"]);
        await waitForSettled(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(h.sampleCount()).to.equal(4);
    });

    it("returns immediately when the view is already stable", async function () {
        const h = harness(["x", "x"]);
        await waitForSettled(h.sample, { interval: 1, timeout: 1000, sleep: h.sleep });
        expect(h.sampleCount()).to.equal(2);
    });

    // A stale click is worse than a slow test, but a hang is worse than either:
    // a view that never settles must give up, not loop forever.
    it("gives up after the timeout rather than hanging", async function () {
        let now = 0;
        const clock = () => now;
        const h = { sample: async () => String(now), sleep: async () => { now += 50; } };
        // sample() returns a new value every tick, so it never settles.
        await waitForSettled(h.sample, { interval: 50, timeout: 200, sleep: h.sleep, clock });
        expect(now).to.be.at.least(200);
    });
});
