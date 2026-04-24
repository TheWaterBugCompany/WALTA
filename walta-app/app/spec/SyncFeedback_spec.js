require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest } = require("spec/util/TestUtils");

describe("SyncFeedback controller", function () {
    var ctl, win;

    beforeEach(async () => {
        ctl = Alloy.createController("SyncFeedback");
        win = wrapViewInWindow(ctl.getView());
        await windowOpenTest(win);
    });

    afterEach(async () => {
        ctl.cleanUp();
        await closeWindow(win);
    });

    it("renders the initial view without errors", () => {
        expect(ctl.getView()).to.exist;
        expect(ctl.progressText.text).to.equal("0%");
        expect(ctl.logPane.visible).to.equal(false);
        expect(ctl.message.visible).to.equal(false);
    });

    it("shows the log pane and Diagnostics button after toggling the log", () => {
        ctl.logToggleButton.fireEvent("click");
        expect(ctl.logPane.visible).to.equal(true);
        expect(ctl.diagnosticsButton.visible).to.equal(true);
        expect(ctl.logToggleButton.title).to.equal("Hide Logs");
    });
});
