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
      expect(vm.state.status).to.equal("idle");
      expect(vm.state.percent).to.equal(0);
      expect(vm.state.statusText).to.equal("");
      expect(vm.state.logVisible).to.equal(false);
      expect(vm.state.logLines).to.deep.equal([]);
    });

    it("reflects a sync already in progress when the popup opens", function () {
      store.recordStart();
      store.recordProgress("Uploading taxa 141 photo");
      const latecomer = new SyncFeedbackViewModel({ syncController });
      expect(latecomer.state.status).to.equal("syncing");
      expect(latecomer.state.logLines).to.deep.equal(["Uploading taxa 141 photo"]);
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
      vm.subscribe(s => seen.push(s.status));
      store.recordStart();
      store.recordSuccess();
      expect(seen).to.deep.equal(["syncing", "success"]);
    });
  });

  describe("log visibility (VM-local)", function () {
    it("toggleLog() flips and notifies", function () {
      const seen = [];
      vm.subscribe(s => seen.push(s.logVisible));
      vm.toggleLog();
      vm.toggleLog();
      expect(seen).to.deep.equal([true, false]);
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
