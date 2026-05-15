require("mocha");
const { expect } = require("chai");
const BaseScreen = require("../../features/support/base-screen");

// Build a webdriverio-shaped driver stub. The element store maps selector → behaviour
// (return true/false for isDisplayed, optionally count clicks). `waitUntil` runs the
// predicate once; if it returns truthy we resolve, otherwise we throw a timeout-style
// error — close enough for testing the pre-probe control flow.
function makeMockDriver(elements) {
    const state = { clicks: [], waitUntilCalls: 0 };
    return {
        state,
        $: async (sel) => {
            const handler = elements[sel] || { isDisplayed: false };
            return {
                isDisplayed: async () => typeof handler.isDisplayed === "function"
                    ? handler.isDisplayed()
                    : handler.isDisplayed,
                click: async () => { state.clicks.push(sel); if (handler.onClick) handler.onClick(); },
                waitForDisplayed: async () => { /* assume the post-click reverse-wait succeeds */ },
            };
        },
        waitUntil: async (predicate, opts) => {
            state.waitUntilCalls += 1;
            if (await predicate()) return;
            const err = new Error(opts && opts.timeoutMsg ? opts.timeoutMsg : "waitUntil timeout");
            throw err;
        },
    };
}

function makeScreen(driver, platform = "ios") {
    return new BaseScreen({ driver, platform });
}

describe("BaseScreen.waitForRaw — iOS Save Password recovery", function () {

    it("happy path: no dismiss clicks when only the target is visible", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: true },
        });
        const screen = makeScreen(driver);
        await screen.waitForRaw("~target.", "Target not present", 50);

        expect(driver.state.clicks).to.deep.equal([]);
        expect(driver.state.waitUntilCalls).to.equal(1);
    });

    it("pre-dismisses the Save Password sheet before waiting when it is up", async function () {
        let targetVisible = false;
        const driver = makeMockDriver({
            "~target.": { isDisplayed: () => targetVisible },
            "-ios predicate string:label == 'Not Now'": {
                isDisplayed: function () { return !this._dismissed; },
                // Dismissing the sheet uncovers the target underneath.
                onClick: function () { this._dismissed = true; targetVisible = true; },
                _dismissed: false,
            },
        });
        const screen = makeScreen(driver);
        await screen.waitForRaw("~target.", "Target not present", 50);

        expect(driver.state.clicks).to.deep.equal(["-ios predicate string:label == 'Not Now'"]);
        // Single waitUntil — dismiss happened pre-probe, no retry needed.
        expect(driver.state.waitUntilCalls).to.equal(1);
    });

    it("propagates the original timeout when neither the target nor the sheet appears", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: false },
            // 'Not Now' button absent — its handler defaults via the mock to isDisplayed:false
        });
        const screen = makeScreen(driver);
        let caught;
        try { await screen.waitForRaw("~target.", "Target not present", 50); }
        catch (e) { caught = e; }

        expect(caught).to.exist;
        expect(caught.message).to.equal("Target not present");
        expect(driver.state.clicks).to.deep.equal([]);
        expect(driver.state.waitUntilCalls).to.equal(1);
    });

    it("does not probe for Save Password on Android", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: false },
        });
        const screen = makeScreen(driver, "android");
        let caught;
        try { await screen.waitForRaw("~target.", "Target not present", 50); }
        catch (e) { caught = e; }

        expect(caught).to.exist;
        expect(caught.message).to.equal("Target not present");
        expect(driver.state.clicks).to.deep.equal([]);
        expect(driver.state.waitUntilCalls).to.equal(1);
    });

});
