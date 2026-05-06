require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest } = require("spec/util/TestUtils");
var SyncStore = require("models/SyncStore");
var Logger = require("util/Logger");
var createSyncController = require("spec/fixtures/SyncController_fixture");

describe("SyncFeedback controller", function () {
    var ctl, win;

    afterEach(async () => {
        await closeWindow(win);
        ctl.cleanUp();
    });

    describe("initial (idle) state", function () {
        beforeEach(async () => {
            // Inject a fresh SyncStore-backed syncController so we test
            // the idle-state render in isolation, not whatever residual
            // state the module-level syncStore singleton in SampleSync.js
            // is left in by SampleSync_spec running earlier in the
            // suite (recordSuccess() leaves it at 100% Sync complete).
            // Same pattern as the mid-sync block below. See WB-48.
            var { syncController } = createSyncController(SyncStore);
            ctl = Alloy.createController("SyncFeedback", { syncController });
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

    describe("log pane populated from Logger ring buffer (WB-45)", function () {
        beforeEach(async () => {
            // Logger's ring buffer is module-level / process-global.
            // Earlier specs in the suite (SampleSync etc.) may have left
            // entries in it; clear so the assertion is deterministic.
            Logger.clearLog();
            Logger.log("starting upload", "sync");
            Logger.warn("rate limit hit", "sync");
            var { syncController } = createSyncController(SyncStore);
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("renders Logger lines in the log pane after toggling Show Log", () => {
            ctl.logToggleButton.fireEvent("click");
            expect(ctl.logPane.visible).to.equal(true);
            expect(ctl.logText.text).to.equal("[sync] starting upload\n[sync] rate limit hit");
        });

        it("live-updates the rendered text when Logger emits while the popup is open", () => {
            ctl.logToggleButton.fireEvent("click");
            Logger.error("upload failed", "sync");
            expect(ctl.logText.text).to.equal(
                "[sync] starting upload\n[sync] rate limit hit\n[sync] upload failed"
            );
        });
    });

    describe("mid-sync (injected syncController)", function () {
        beforeEach(async () => {
            var { syncController, store } = createSyncController(SyncStore);
            store.recordStart();
            store.recordProgress("Downloading samples");
            store.recordProgress("Uploading site photo");
            store.recordProgress("Uploading taxa 141 photo");
            // PROGRESS_STEP=15 → 3 increments puts percent at 45, status
            // text at the last message. Gives a clear mid-sync render.
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("shows the bar partially filled with the latest status text", () => {
            expect(ctl.progressText.text).to.equal("45% Uploading taxa 141 photo");
            expect(ctl.progressFill.width).to.equal("45%");
        });
    });

    describe("error state (injected syncController)", function () {
        beforeEach(async () => {
            var { syncController, store } = createSyncController(SyncStore);
            store.recordStart();
            store.recordProgress("Downloading samples");
            store.recordProgress("Uploading site photo");
            store.recordError(new Error("Server Error"));
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("renders the error message in the progress text with the error colour", () => {
            expect(ctl.progressText.text).to.equal("30% Server Error");
            expect(ctl.progressFill.backgroundColor).to.equal(Alloy.CFG.colors.error);
        });
    });
});
