require("mocha");
const { expect } = require("chai");
const dismissPermissionAlert = require("../features/support/dismiss-permission-alert");

// Fakes the two IO seams: whether we've reached the target screen (alert gone),
// and a tap on the accept button. sleep is a no-op so the loop runs instantly.
function harness({ doneSequence }) {
    let i = 0;
    let taps = 0;
    return {
        taps: () => taps,
        isDone: async () => doneSequence[Math.min(i++, doneSequence.length - 1)],
        tapAccept: async () => { taps++; },
        sleep: async () => {},
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

    // Bounded, so an alert that never clears fails fast with a truthful result
    // rather than looping until the CI job hits its ceiling.
    it("gives up after maxRounds and reports the final state", async function () {
        const h = harness({ doneSequence: [false] });
        const ok = await dismissPermissionAlert({ isDone: h.isDone, tapAccept: h.tapAccept, sleep: h.sleep, maxRounds: 5 });
        expect(ok).to.be.false;
        expect(h.taps()).to.equal(5);
    });
});
