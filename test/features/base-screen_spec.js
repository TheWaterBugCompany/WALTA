require("mocha");
const { expect } = require("chai");
const BaseScreen = require("../../features/support/base-screen");

// Build a webdriverio-shaped driver stub. The element store maps selector → behaviour
// (return true/false for isDisplayed, optionally count clicks). `waitUntil` runs the
// predicate once; if it returns truthy we resolve, otherwise we throw a timeout-style
// error — close enough for testing the retry-on-dismiss control flow.
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
                waitForDisplayed: async () => {
                    if (typeof handler.isDisplayed === "function"
                            ? !handler.isDisplayed()
                            : !handler.isDisplayed) {
                        // ok — element no longer displayed (used with reverse:true after dismiss)
                        return;
                    }
                },
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

    it("happy path: no retry and no dismiss when the target is visible first try", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: true },
        });
        const screen = makeScreen(driver);
        await screen.waitForRaw("~target.", "Target not present", 50);

        expect(driver.state.clicks).to.deep.equal([]);
        expect(driver.state.waitUntilCalls).to.equal(1);
    });

    it("retries once after dismissing the Save Password sheet when the target shows up", async function () {
        let targetShown = false;
        const driver = makeMockDriver({
            "~target.": { isDisplayed: () => targetShown },
            "-ios predicate string:label == 'Not Now'": {
                // sheet is displayed until we click Not Now, then it disappears AND the target becomes visible
                isDisplayed: function () { return !this._dismissed; },
                onClick: function () { this._dismissed = true; targetShown = true; },
                _dismissed: false,
            },
        });
        const screen = makeScreen(driver);
        await screen.waitForRaw("~target.", "Target not present", 50);

        expect(driver.state.clicks).to.deep.equal(["-ios predicate string:label == 'Not Now'"]);
        expect(driver.state.waitUntilCalls).to.equal(2); // first failed, retry succeeded
    });

    it("propagates the original timeout when the Save Password sheet is not present", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: false },
            // 'Not Now' button is absent — its handler defaults via the mock to isDisplayed:false
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

    it("fails loudly when retry still times out after dismiss", async function () {
        const driver = makeMockDriver({
            "~target.": { isDisplayed: false }, // never shows up
            "-ios predicate string:label == 'Not Now'": {
                isDisplayed: function () { return !this._dismissed; },
                onClick: function () { this._dismissed = true; },
                _dismissed: false,
            },
        });
        const screen = makeScreen(driver);
        let caught;
        try { await screen.waitForRaw("~target.", "Target not present", 50); }
        catch (e) { caught = e; }

        expect(caught).to.exist;
        expect(caught.message).to.equal("Target not present");
        expect(driver.state.clicks).to.deep.equal(["-ios predicate string:label == 'Not Now'"]);
        expect(driver.state.waitUntilCalls).to.equal(2); // tried, dismissed, retried, failed
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
