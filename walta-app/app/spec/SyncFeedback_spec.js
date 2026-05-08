require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, removeDatabase, waitForTick } = require("spec/util/TestUtils");
var SyncStore = require("models/SyncStore");
var Logger = require("util/Logger");
var LogRepository = require("repository/LogRepository");
var Migrator = require("repository/Migrator");
var createSyncController = require("spec/fixtures/SyncController_fixture");

const TEST_LOG_DB = "waterbug_data_syncfeedback_test";

// Build a fresh LogRepository against an isolated test db so the spec
// doesn't read from / write to the real `logs.db`. Migrate explicitly
// since LogRepository.open() expects the schema to already exist.
function makeTestLogRepository(seedEntries) {
    removeDatabase(TEST_LOG_DB);
    Migrator.migrate(TEST_LOG_DB);
    const repo = LogRepository.open(TEST_LOG_DB);
    if (seedEntries) for (const e of seedEntries) repo.append(e);
    return repo;
}

describe("SyncFeedback controller", function () {
    var ctl, win, logRepository;

    afterEach(async () => {
        await closeWindow(win);
        ctl.cleanUp();
        if (logRepository) {
            logRepository.close();
            removeDatabase(TEST_LOG_DB);
            logRepository = null;
        }
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
            logRepository = makeTestLogRepository();
            ctl = Alloy.createController("SyncFeedback", { syncController, logRepository });
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

    describe("log pane populated from LogRepository + Logger.subscribe (WB-64)", function () {
        beforeEach(async () => {
            // Seed the test log repository with prior-run entries; the
            // pane's initial render reads from here. Live updates land
            // via Logger.subscribe and the controller appends them.
            logRepository = makeTestLogRepository([
                { ts: 100, level: "info", facility: "sync", message: "starting upload" },
                { ts: 200, level: "warn", facility: "sync", message: "rate limit hit" },
            ]);
            var { syncController } = createSyncController(SyncStore);
            ctl = Alloy.createController("SyncFeedback", { syncController, logRepository });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("renders prior-run entries in the log pane after toggling Show Log", () => {
            ctl.logToggleButton.fireEvent("click");
            expect(ctl.logPane.visible).to.equal(true);
            expect(ctl.logText.text).to.equal("starting upload\nrate limit hit");
        });

        it("live-updates the rendered text when Logger.error fires while the popup is open", () => {
            ctl.logToggleButton.fireEvent("click");
            Logger.error("upload failed", "sync");
            expect(ctl.logText.text).to.equal(
                "starting upload\nrate limit hit\nupload failed"
            );
        });
    });

    describe("tail-scrolls the log pane", function () {
        // Seed enough entries that the rendered text overflows the
        // pane's viewport — otherwise scrollToBottom is a no-op and
        // contentOffset.y stays 0, so we can't tell the trigger fired.
        function seedManyEntries(count) {
            const entries = [];
            for (let i = 0; i < count; i++) {
                entries.push({ ts: 1000 + i, level: "info", facility: "sync", message: `line ${i}` });
            }
            return entries;
        }

        beforeEach(async () => {
            logRepository = makeTestLogRepository(seedManyEntries(40));
            var { syncController } = createSyncController(SyncStore);
            ctl = Alloy.createController("SyncFeedback", { syncController, logRepository });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("scrolls past the top when the user opens the pane (seeded entries are at the bottom)", async () => {
            ctl.logToggleButton.fireEvent("click");
            await waitForTick(400)();
            expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(0);
        });

        it("scrolls further down when a new log entry lands while the pane is open", async () => {
            ctl.logToggleButton.fireEvent("click");
            await waitForTick(400)();
            const before = ctl.logScroll.contentOffset.y;
            for (let i = 0; i < 5; i++) Logger.info(`fresh line ${i}`, "sync");
            await waitForTick(400)();
            expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(before);
        });
    });

    describe("just started (no progress yet)", function () {
        beforeEach(async () => {
            var { syncController, store } = createSyncController(SyncStore);
            store.recordStart();
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("shows the seeded statusText so the bar isn't bare while we wait for the first milestone", () => {
            expect(ctl.progressText.text).to.equal("0% Starting sync");
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
