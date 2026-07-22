require("mocha");
const { expect } = require("chai");
const recoverSession = require("../features/support/recover-session");

// Fakes the two IO seams: whether the current session answers, and a reconnect
// that may or may not revive it.
function harness({ aliveSequence, reconnectRevives }) {
    let i = 0;
    let reconnects = 0;
    return {
        reconnects: () => reconnects,
        isAlive: async () => {
            const v = aliveSequence[Math.min(i, aliveSequence.length - 1)];
            i++;
            return v;
        },
        reconnect: async () => { reconnects++; if (reconnectRevives) aliveSequence = [true]; },
    };
}

describe("recoverSession", function () {
    it("does nothing and reports no reconnect when the session is alive", async function () {
        const h = harness({ aliveSequence: [true] });
        const reconnected = await recoverSession({ isAlive: h.isAlive, reconnect: h.reconnect });
        expect(reconnected).to.be.false;
        expect(h.reconnects()).to.equal(0);
    });

    it("reconnects and reports it when the session had died but recovers", async function () {
        // dead on first check, alive after the reconnect.
        const h = harness({ aliveSequence: [false], reconnectRevives: true });
        const reconnected = await recoverSession({ isAlive: h.isAlive, reconnect: h.reconnect });
        expect(reconnected).to.be.true;
        expect(h.reconnects()).to.equal(1);
    });

    // The whole point: an unrecoverable runner collapse must fail fast, not
    // loop until the CI job hits its ceiling.
    it("throws after the attempt cap when reconnect never revives the session", async function () {
        const h = harness({ aliveSequence: [false] }); // stays dead forever
        let threw;
        try {
            await recoverSession({ isAlive: h.isAlive, reconnect: h.reconnect, maxAttempts: 3 });
        } catch (e) { threw = e; }
        expect(threw, "expected recoverSession to throw").to.be.an("error");
        expect(threw.message).to.match(/unrecoverable/i);
        expect(h.reconnects()).to.equal(3);
    });
});
