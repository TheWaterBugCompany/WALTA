require("mocha");
const { expect } = require("chai");
const SyncFeedbackViewModel = require("../../walta-app/app/lib/viewmodels/SyncFeedback");
const SyncStore = require("../../walta-app/app/lib/models/SyncStore");
const Logger = require("../../walta-app/app/lib/util/Logger");
const Palette = require("../../walta-app/app/lib/util/Palette");
const createSyncController = require("../../walta-app/app/spec/fixtures/SyncController_fixture");

describe("SyncFeedbackViewModel", function () {
  let syncController, store, forceUploadCalls, vm;

  beforeEach(function () {
    Logger.clearLog();
    ({ syncController, store, forceUploadCalls } = createSyncController(SyncStore));
    vm = new SyncFeedbackViewModel({ syncController });
  });

  describe("initial state", function () {
    it("mirrors the syncController's current state (idle by default)", function () {
      expect(vm.status).to.equal("idle");
      expect(vm.percent).to.equal(0);
      expect(vm.statusText).to.equal("");
      expect(vm.logVisible).to.equal(false);
      expect(vm.logLines).to.deep.equal([]);
    });

    it("reflects a sync already in progress when the popup opens", function () {
      store.recordStart();
      store.recordProgress("Uploading taxa 141 photo");
      const latecomer = new SyncFeedbackViewModel({ syncController });
      expect(latecomer.status).to.equal("syncing");
      // logLines comes from the Logger ring buffer now (WB-45) — the
      // sync progress message is already on screen as statusText.
      expect(latecomer.statusText).to.equal("Uploading taxa 141 photo");
    });
  });

  describe("logLines live updates (Logger subscription — WB-45)", function () {
    it("notifies vm listeners when Logger emits a new line", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.logLines.length));
      Logger.log("first", "sync");
      Logger.warn("second", "sync");
      expect(seen).to.deep.equal([1, 2]);
    });

    it("unsubscribes from Logger on dispose() — no further vm notifications", function () {
      let calls = 0;
      vm.addListener(() => { calls += 1; });
      Logger.log("before-dispose", "sync");
      expect(calls).to.equal(1);
      vm.dispose();
      Logger.log("after-dispose", "sync");
      expect(calls).to.equal(1);
    });
  });

  describe("logLines (sourced from Logger ring buffer — WB-45)", function () {
    it("returns whatever Logger has captured at read time", function () {
      Logger.log("starting upload", "sync");
      Logger.warn("rate limit hit", "sync");
      expect(vm.logLines).to.deep.equal([
        "[sync] starting upload",
        "[sync] rate limit hit",
      ]);
    });

    it("includes lines emitted after the popup was constructed", function () {
      expect(vm.logLines).to.deep.equal([]);
      Logger.error("upload failed", "sync");
      expect(vm.logLines).to.deep.equal(["[sync] upload failed"]);
    });

    it("does not surface syncController progress messages directly", function () {
      // Progress messages are the headline statusText — they shouldn't
      // also fill the Show Logs pane. Logger output is the source of
      // truth there.
      store.recordStart();
      store.recordProgress("Downloading samples");
      expect(vm.logLines).to.deep.equal([]);
    });
  });

  describe("start()", function () {
    it("forwards to syncController.forceUpload()", function () {
      vm.start();
      expect(forceUploadCalls()).to.equal(1);
    });
  });

  describe("state-change propagation", function () {
    it("re-notifies listeners when the store's state changes", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.status));
      store.recordStart();
      store.recordSuccess();
      expect(seen).to.deep.equal(["syncing", "success"]);
    });
  });

  describe("progressColor (semantic palette name)", function () {
    it("is Palette.primary when idle", function () {
      expect(vm.progressColor).to.equal(Palette.primary);
    });

    it("is Palette.primary while syncing", function () {
      store.recordStart();
      expect(vm.progressColor).to.equal(Palette.primary);
    });

    it("is Palette.primary on success", function () {
      store.recordStart();
      store.recordSuccess();
      expect(vm.progressColor).to.equal(Palette.primary);
    });

    it("is Palette.primary while offline", function () {
      store.recordOffline();
      expect(vm.progressColor).to.equal(Palette.primary);
    });

    it("is Palette.error on error", function () {
      store.recordStart();
      store.recordError(new Error("boom"));
      expect(vm.progressColor).to.equal(Palette.error);
    });
  });

  describe("progressText (presentation)", function () {
    it("is just the percent when idle", function () {
      expect(vm.progressText).to.equal("0%");
    });

    it("includes the statusText when syncing with a message", function () {
      store.recordStart();
      store.recordProgress("Uploading taxa 141 photo");
      expect(vm.progressText).to.equal("15% Uploading taxa 141 photo");
    });

    it("is just the percent when syncing with no statusText", function () {
      store.recordStart();
      expect(vm.progressText).to.equal("0%");
    });

    it("is 0% when offline regardless of percent", function () {
      store.recordStart();
      store.recordProgress("Uploading");
      store.recordOffline();
      expect(vm.progressText).to.equal("0%");
    });

    it("shows the error message on error", function () {
      store.recordStart();
      store.recordProgress("Uploading");
      store.recordError(new Error("upload failed"));
      expect(vm.progressText).to.equal("15% upload failed");
    });

    it("falls back to 'Server Error' when the error has no message", function () {
      store.recordStart();
      store.recordProgress("Uploading");
      store.recordError(new Error(""));
      expect(vm.progressText).to.equal("15% Server Error");
    });
  });

  describe("log visibility (VM-local)", function () {
    it("toggleLog() flips and notifies", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.logVisible));
      vm.toggleLog();
      vm.toggleLog();
      expect(seen).to.deep.equal([true, false]);
    });
  });

  describe("diagnosticsVisible (presentation)", function () {
    it("is false when the log pane is hidden", function () {
      expect(vm.diagnosticsVisible).to.equal(false);
    });

    it("is true after toggleLog() shows the log pane", function () {
      vm.toggleLog();
      expect(vm.diagnosticsVisible).to.equal(true);
    });
  });

  describe("logToggleLabel (presentation)", function () {
    it("is 'Show Logs' when the log pane is hidden", function () {
      expect(vm.logToggleLabel).to.equal("Show Logs");
    });

    it("is 'Hide Logs' when the log pane is visible", function () {
      vm.toggleLog();
      expect(vm.logToggleLabel).to.equal("Hide Logs");
    });
  });

  describe("message (presentation)", function () {
    it("is hidden and blank when idle", function () {
      expect(vm.messageVisible).to.equal(false);
      expect(vm.message).to.equal("");
    });

    it("is hidden and blank while syncing", function () {
      store.recordStart();
      expect(vm.messageVisible).to.equal(false);
      expect(vm.message).to.equal("");
    });

    it("shows the offline guidance when offline", function () {
      store.recordOffline();
      expect(vm.messageVisible).to.equal(true);
      expect(vm.message).to.match(/^The mobile network is unavailable/);
    });
  });

  describe("progressWidth (presentation)", function () {
    it("formats the percent as a CSS-style width string", function () {
      expect(vm.progressWidth).to.equal("0%");
      store.recordStart();
      store.recordProgress("Uploading");
      expect(vm.progressWidth).to.equal("15%");
    });
  });

  describe("logPaneHeight (presentation)", function () {
    it("is '0dp' when the log pane is hidden", function () {
      expect(vm.logPaneHeight).to.equal("0dp");
    });

    it("is '180dp' when the log pane is visible", function () {
      vm.toggleLog();
      expect(vm.logPaneHeight).to.equal("180dp");
    });
  });

  describe("logText (presentation)", function () {
    it("is an empty string when there are no log lines", function () {
      expect(vm.logText).to.equal("");
    });

    it("joins log lines with newlines", function () {
      Logger.log("first", "sync");
      Logger.log("second", "sync");
      expect(vm.logText).to.equal("[sync] first\n[sync] second");
    });
  });

  describe("discrete events", function () {
    it("close() emits a 'close' event to on() listeners", function () {
      let closed = false;
      vm.on("close", () => { closed = true; });
      vm.close();
      expect(closed).to.equal(true);
    });

    it("openDiagnostics() emits a 'diagnostics' event", function () {
      let count = 0;
      vm.on("diagnostics", () => { count++; });
      vm.openDiagnostics();
      expect(count).to.equal(1);
    });
  });

  describe("dispose()", function () {
    it("unsubscribes from the syncController", function () {
      let notifyCount = 0;
      vm.addListener(() => notifyCount++);
      vm.dispose();
      store.recordStart();
      expect(notifyCount).to.equal(0);
    });
  });

  describe("addListener()/removeListener()", function () {
    it("removeListener stops further notifications", function () {
      let calls = 0;
      const cb = () => calls++;
      vm.addListener(cb);
      store.recordStart();
      expect(calls).to.equal(1);
      vm.removeListener(cb);
      store.recordSuccess();
      expect(calls).to.equal(1);
    });
  });
});

