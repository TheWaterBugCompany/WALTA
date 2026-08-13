require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, wrapViewInWindow, windowOpenTest, removeDatabase, waitFor } = require("spec/util/TestUtils");
var SyncStore = require("models/SyncStore");
var Logger = require("util/Logger");
var LogRepository = require("repository/LogRepository");
var Migrator = require("repository/Migrator");
var createSyncController = require("spec/fixtures/SyncController_fixture");
var { LOG_LIMIT } = require("mvvm/viewmodels/SyncFeedback");

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
            expect(ctl.logText.value).to.equal("starting upload\nrate limit hit");
        });

        it("live-updates the rendered text when Logger.error fires while the popup is open", () => {
            ctl.logToggleButton.fireEvent("click");
            Logger.error("upload failed", "sync");
            expect(ctl.logText.value).to.equal(
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

        async function buildController(seedCount) {
            logRepository = makeTestLogRepository(seedManyEntries(seedCount));
            var { syncController } = createSyncController(SyncStore);
            ctl = Alloy.createController("SyncFeedback", { syncController, logRepository });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        }

        it("scrolls past the top when the user opens the pane (seeded entries are at the bottom, buffer at cap)", async () => {
            // Seed at LOG_LIMIT so this also exercises the worst-case
            // render — the pane has to lay out a full buffer's worth.
            await buildController(LOG_LIMIT);
            ctl.logToggleButton.fireEvent("click");
            await waitFor(() => ctl.logScroll.contentOffset.y > 0);
            expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(0);
        });

        it("scrolls further down when a new log entry lands while the pane is open", async () => {
            // Seed below LOG_LIMIT so each append actually grows the
            // rendered content (no shift-off-the-top), letting us
            // observe contentOffset.y move further down. At the cap
            // this assertion isn't meaningful — see the cap-anchor
            // test below for that case.
            await buildController(Math.floor(LOG_LIMIT / 5));
            ctl.logToggleButton.fireEvent("click");
            await waitFor(() => ctl.logScroll.contentOffset.y > 0);
            const before = ctl.logScroll.contentOffset.y;
            for (let i = 0; i < 5; i++) Logger.info(`fresh line ${i}`, "sync");
            await waitFor(() => ctl.logScroll.contentOffset.y > before);
            expect(ctl.logScroll.contentOffset.y).to.be.greaterThan(before);
        });

        it("keeps the newest entry visible at the tail when appending at the cap", async () => {
            await buildController(LOG_LIMIT);
            ctl.logToggleButton.fireEvent("click");
            await waitFor(() => ctl.logScroll.contentOffset.y > 0);
            Logger.info("fresh tail line", "sync");
            await waitFor(() => ctl.logText.value.endsWith("fresh tail line"));
            expect(ctl.logText.value.endsWith("fresh tail line")).to.equal(true);
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

        it("falls back to '0% Syncing' so the bar isn't bare while we wait for the first step message", () => {
            expect(ctl.progressText.text).to.equal("0% Syncing");
        });
    });

    describe("mid-sync (injected syncController)", function () {
        beforeEach(async () => {
            var { syncController, store } = createSyncController(SyncStore);
            store.recordStart();
            store.recordProgress("Uploading taxon photo", { current: 3, total: 4 });
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("shows the bar partially filled with the publisher's step message", () => {
            expect(ctl.progressText.text).to.equal("75% Uploading taxon photo");
            expect(ctl.progressFill.width).to.equal("75%");
        });
    });

    describe("error state (injected syncController)", function () {
        beforeEach(async () => {
            var { syncController, store } = createSyncController(SyncStore);
            store.recordStart();
            store.recordProgress("Uploading site photo", { current: 1, total: 4 });
            store.recordError(new Error("Server Error"));
            ctl = Alloy.createController("SyncFeedback", { syncController });
            win = wrapViewInWindow(ctl.getView());
            await windowOpenTest(win);
        });

        it("renders the error message in the progress text with the error colour", () => {
            expect(ctl.progressText.text).to.equal("25% Server Error");
            expect(ctl.progressFill.backgroundColor).to.equal(Alloy.CFG.colors.error);
        });
    });
});
