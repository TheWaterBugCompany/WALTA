require("mocha");
const { expect } = require("chai");
const SyncFeedbackViewModel = require("../../walta-app/app/lib/viewmodels/SyncFeedback");
const SyncStore = require("../../walta-app/app/lib/models/SyncStore");
const Palette = require("../../walta-app/app/lib/util/Palette");
const createSyncController = require("../../walta-app/app/spec/fixtures/SyncController_fixture");

// Fake LogRepository — only `query` and `close` are exercised by the
// viewmodel; tests can seed it with prior-run entries via the arg.
function fakeLogRepository(initialEntries = []) {
  return {
    query: (opts) => {
      const limit = (opts && opts.limit) || 200;
      return initialEntries.slice().sort((a, b) => b.ts - a.ts).slice(0, limit);
    },
    close: () => {}
  };
}

// Use the same Logger instance the viewmodel imports — the test's
// Logger.info(...) calls must hit the same module on which the vm
// registered its subscription.
const Logger = require("../../walta-app/app/lib/util/Logger");

describe("SyncFeedbackViewModel", function () {
  let syncController, store, forceUploadCalls, vm, repo;

  beforeEach(function () {
    ({ syncController, store, forceUploadCalls } = createSyncController(SyncStore));
    repo = fakeLogRepository();
    vm = new SyncFeedbackViewModel({ syncController, logRepository: repo });
  });

  afterEach(function () {
    // Releases the Logger subscription so it doesn't leak across tests.
    if (vm) vm.dispose();
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
      const latecomer = new SyncFeedbackViewModel({ syncController, logRepository: fakeLogRepository() });
      try {
        expect(latecomer.status).to.equal("syncing");
        expect(latecomer.statusText).to.equal("Uploading taxa 141 photo");
      } finally {
        latecomer.dispose();
      }
    });
  });

  describe("logLines initial render (LogRepository.query — cross-run history)", function () {
    it("seeds from the repository's prior-run entries, oldest-first", function () {
      const seeded = fakeLogRepository([
        { ts: 200, level: "info", facility: "sync", message: "second" },
        { ts: 100, level: "info", facility: "sync", message: "first" }
      ]);
      const vm2 = new SyncFeedbackViewModel({ syncController, logRepository: seeded });
      try {
        expect(vm2.logLines.map(e => e.message)).to.deep.equal(["first", "second"]);
      } finally {
        vm2.dispose();
      }
    });
  });

  describe("logLines live updates (Logger.subscribe with facility=sync, minLevel=info)", function () {
    it("notifies vm listeners when a matching entry is logged", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.logLines.length));
      Logger.info("milestone", "sync");
      Logger.warn("slow", "sync");
      expect(seen).to.deep.equal([1, 2]);
    });

    it("filters out entries below minLevel (trace, debug)", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.logLines.length));
      Logger.log("trace from sync", "sync");
      Logger.debug("debug from sync", "sync");
      expect(seen).to.deep.equal([]);
      expect(vm.logLines).to.deep.equal([]);
    });

    it("filters out entries from other facilities", function () {
      const seen = [];
      vm.addListener(() => seen.push(vm.logLines.length));
      Logger.info("info from auth", "auth");
      Logger.warn("warn from media", "media");
      expect(seen).to.deep.equal([]);
      expect(vm.logLines).to.deep.equal([]);
    });

    it("appends matching live entries to the end (newest-last)", function () {
      Logger.info("first", "sync");
      Logger.warn("second", "sync");
      expect(vm.logLines.map(e => e.message)).to.deep.equal(["first", "second"]);
    });

    it("unsubscribes from Logger on dispose()", function () {
      let calls = 0;
      vm.addListener(() => { calls += 1; });
      Logger.info("before-dispose", "sync");
      expect(calls).to.equal(1);
      vm.dispose();
      Logger.info("after-dispose", "sync");
      expect(calls).to.equal(1);
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

    it("joins log entries as '[facility] message' with newlines", function () {
      Logger.info("first", "sync");
      Logger.warn("second", "sync");
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
