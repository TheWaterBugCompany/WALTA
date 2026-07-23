require("mocha");
const { expect } = require("chai");
const BaseScreen = require("../features/support/base-screen");

// Builds a BaseScreen over a fake driver whose $().isDisplayed() is scripted
// per call: each entry is either a boolean (displayed?) or an Error to throw.
function screenOver(sequence) {
    let i = 0;
    let lookups = 0;
    const driver = {
        $: async () => {
            lookups++;
            const step = sequence[Math.min(i, sequence.length - 1)];
            i++;
            return { isDisplayed: async () => { if (step instanceof Error) throw step; return step; } };
        },
    };
    const screen = new BaseScreen({ driver, platform: "ios" });
    screen.sleep = async () => {}; // don't wait real time between polls
    screen.lookups = () => lookups;
    return screen;
}

describe("BaseScreen.waitForRaw", function () {
    it("resolves once the element is displayed", async function () {
        const screen = screenOver([false, false, true]);
        await screen.waitForRaw("~Foo.", "Foo not present");
        expect(screen.lookups()).to.equal(3);
    });

    it("keeps polling past a not-yet-present element, then times out with the message", async function () {
        const notFound = new Error("no such element: unable to locate element ~Foo.");
        const screen = screenOver([notFound]);
        let threw;
        try {
            await screen.waitForRaw("~Foo.", "Foo not present", 30);
        } catch (e) { threw = e; }
        expect(threw.message).to.equal("Foo not present");
    });

    // The whole point: a dead session must abort the poll immediately, not
    // hammer the corpse for the full timeout (WB-200's 26-minute hang).
    it("bails immediately when the session is dead, without polling to timeout", async function () {
        const dead = new Error("A session is either terminated or not started when running \"element\"");
        const screen = screenOver([dead]);
        let threw;
        try {
            await screen.waitForRaw("~Foo.", "Foo not present", 90000);
        } catch (e) { threw = e; }
        expect(threw).to.equal(dead);
        expect(screen.lookups(), "should not have retried a dead session").to.equal(1);
    });
});
