require("mocha");
const { expect } = require("chai");
const SyncFeedbackViewModel = require("../../walta-app/app/lib/logic/viewmodels/SyncFeedback");
const SyncStore = require("../../walta-app/app/lib/models/SyncStore");

describe("SyncFeedbackViewModel", function () {
  let syncController, store, forceUploadCalls, vm;

  beforeEach(function () {
    ({ syncController, store, forceUploadCalls } = createSyncController());
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
      expect(latecomer.logLines).to.deep.equal(["Uploading taxa 141 photo"]);
    });
  });

  describe("start()", function () {
    it("forwards to syncController.forceUpload()", function () {
      vm.start();
      expect(forceUploadCalls()).to.equal(1);
    });
  });

  describe("state-change propagation", function () {
    it("re-notifies subscribers when the store's state changes", function () {
      const seen = [];
      vm.subscribe(() => seen.push(vm.status));
      store.recordStart();
      store.recordSuccess();
      expect(seen).to.deep.equal(["syncing", "success"]);
    });
  });

  describe("progressColor (presentation)", function () {
    it("is teal when idle", function () {
      expect(vm.progressColor).to.equal("#26849c");
    });

    it("is teal while syncing", function () {
      store.recordStart();
      expect(vm.progressColor).to.equal("#26849c");
    });

    it("is teal on success", function () {
      store.recordStart();
      store.recordSuccess();
      expect(vm.progressColor).to.equal("#26849c");
    });

    it("is teal while offline", function () {
      store.recordOffline();
      expect(vm.progressColor).to.equal("#26849c");
    });

    it("is red on error", function () {
      store.recordStart();
      store.recordError(new Error("boom"));
      expect(vm.progressColor).to.equal("#c0392b");
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
      vm.subscribe(() => seen.push(vm.logVisible));
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
    it("is 'Show Log' when the log pane is hidden", function () {
      expect(vm.logToggleLabel).to.equal("Show Log");
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

  describe("logText (presentation)", function () {
    it("is an empty string when there are no log lines", function () {
      expect(vm.logText).to.equal("");
    });

    it("joins log lines with newlines", function () {
      store.recordStart();
      store.recordProgress("first");
      store.recordProgress("second");
      expect(vm.logText).to.equal("first\nsecond");
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
      vm.subscribe(() => notifyCount++);
      vm.dispose();
      store.recordStart();
      expect(notifyCount).to.equal(0);
    });
  });

  describe("subscribe()", function () {
    it("returns an unsubscribe function", function () {
      let calls = 0;
      const off = vm.subscribe(() => calls++);
      store.recordStart();
      expect(calls).to.equal(1);
      off();
      store.recordSuccess();
      expect(calls).to.equal(1);
    });
  });
});

function createSyncController() {
  const store = new SyncStore();
  let calls = 0;
  const syncController = {
    getState: () => store.getState(),
    subscribe: cb => store.subscribe(cb),
    forceUpload: () => { calls++; },
  };
  return { syncController, store, forceUploadCalls: () => calls };
}
