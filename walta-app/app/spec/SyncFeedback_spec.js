require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest } = require("spec/util/TestUtils");
var SyncStore = require("models/SyncStore");

function makeFakeSyncController(store) {
    return {
        get status()       { return store.status; },
        get percent()      { return store.percent; },
        get statusText()   { return store.statusText; },
        get logLines()     { return store.logLines; },
        get errorMessage() { return store.errorMessage; },
        addListener: function (cb) { store.addListener(cb); },
        removeListener: function (cb) { store.removeListener(cb); },
        forceUpload: function () { /* no-op in tests */ },
    };
}

describe("SyncFeedback controller", function () {
    var ctl, win;

    afterEach(async () => {
        ctl.cleanUp();
        await closeWindow(win);
    });

    describe("initial (idle) state", function () {
        beforeEach(async () => {
            ctl = Alloy.createController("SyncFeedback");
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
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

    describe("mid-sync (injected syncController)", function () {
        var store;

        beforeEach(async () => {
            store = new SyncStore();
            store.recordStart();
            store.recordProgress("Downloading samples");
            store.recordProgress("Uploading site photo");
            store.recordProgress("Uploading taxa 141 photo");
            // PROGRESS_STEP=15 → 3 increments puts percent at 45, status
            // text at the last message. Gives a clear mid-sync render.
            ctl = Alloy.createController("SyncFeedback", {
                syncController: makeFakeSyncController(store)
            });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("shows the bar partially filled with the latest status text", () => {
            expect(ctl.progressText.text).to.equal("45% Uploading taxa 141 photo");
            expect(ctl.progressFill.width).to.equal("45%");
        });
    });
});
