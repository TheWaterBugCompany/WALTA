require("mocha");
const { expect } = require("chai");
const { attemptLayout } = require("util/TiHacks");

describe("attemptLayout", function () {
    it("runs the layout work and reports done", function () {
        let ran = false;
        const done = attemptLayout(() => { ran = true; });
        expect(ran, "callback ran").to.be.true;
        expect(done, "reported done").to.be.true;
    });

    it("swallows the transient getWindow() null-activity error and reports not-done", function () {
        const done = attemptLayout(() => {
            throw new Error("Attempt to invoke virtual method 'android.view.Window android.app.Activity.getWindow()' on a null object reference");
        });
        expect(done, "reported not-done so the caller can retry").to.be.false;
    });

    it("rethrows any other error", function () {
        expect(() => attemptLayout(() => { throw new Error("boom"); })).to.throw("boom");
    });
});
