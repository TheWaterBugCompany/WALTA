require("mocha");
const { expect } = require("chai");
const dismissPermissionAlert = require("../features/support/dismiss-permission-alert");

// Fakes the two IO seams: whether we've reached the target screen (alert gone),
// and a tap on the accept button. sleep is a no-op so the loop runs instantly.
function harness({ doneSequence, msPerRound = 0 }) {
    let i = 0;
    let taps = 0;
    let clock = 0;
    return {
        taps: () => taps,
        isDone: async () => doneSequence[Math.min(i++, doneSequence.length - 1)],
        tapAccept: async () => { taps++; },
        sleep: async () => { clock += msPerRound; },
        now: () => clock,
    };
}

describe("dismissPermissionAlert", function () {
    it("returns immediately without tapping when the target is already present", async function () {
        const h = harness({ doneSequence: [true] });
        const ok = await dismissPermissionAlert({ isDone: h.isDone, tapAccept: h.tapAccept, sleep: h.sleep });
        expect(ok).to.be.true;
        expect(h.taps()).to.equal(0);
    });

    // The fixed-timeout bug: a late-appearing alert or a tap that didn't
    // register left the alert up with nothing retrying. Polling re-taps until
    // the target is actually reached.
    it("keeps tapping until the target appears", async function () {
        const h = harness({ doneSequence: [false, false, false, true] });
        const ok = await dismissPermissionAlert({ isDone: h.isDone, tapAccept: h.tapAccept, sleep: h.sleep });
        expect(ok).to.be.true;
        expect(h.taps()).to.equal(3);
    });

    // Bounded by the clock, not by a round count: a round costs whatever the
    // device takes to answer, so counting rounds promises a budget it cannot
    // keep — on a degraded session the same 180 rounds outlive the step that
    // is waiting for them, and the caller's own message never gets to fire.
    it("gives up once the budget is spent, however few rounds that took", async function () {
        const h = harness({ doneSequence: [false], msPerRound: 10000 });
        const ok = await dismissPermissionAlert({
            isDone: h.isDone, tapAccept: h.tapAccept, sleep: h.sleep, now: h.now, timeoutMs: 30000 });
        expect(ok).to.be.false;
        expect(h.taps()).to.equal(3);
    });
});
