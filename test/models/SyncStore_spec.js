require("mocha");
const { expect } = require("chai");
const SyncStore = require("../../walta-app/app/lib/models/SyncStore");

describe("SyncStore", function () {
  let store;

  beforeEach(function () {
    store = new SyncStore();
  });

  describe("initial state", function () {
    it("starts 'idle' with no progress, no log, no error", function () {
      const s = store.getState();
      expect(s.status).to.equal("idle");
      expect(s.percent).to.equal(0);
      expect(s.statusText).to.equal("");
      expect(s.logLines).to.deep.equal([]);
      expect(s.errorMessage).to.equal(null);
    });
  });

  describe("recordStart()", function () {
    it("transitions to 'syncing' and resets progress/log/error", function () {
      store.recordError(new Error("boom"));
      store.recordStart();
      const s = store.getState();
      expect(s.status).to.equal("syncing");
      expect(s.percent).to.equal(0);
      expect(s.logLines).to.deep.equal([]);
      expect(s.errorMessage).to.equal(null);
    });

    it("notifies subscribers", function () {
      const seen = [];
      store.subscribe(s => seen.push(s.status));
      store.recordStart();
      expect(seen).to.deep.equal(["syncing"]);
    });
  });

  describe("recordProgress()", function () {
    beforeEach(function () { store.recordStart(); });

    it("appends a log line and updates statusText", function () {
      store.recordProgress("Uploading site photo");
      const s = store.getState();
      expect(s.statusText).to.equal("Uploading site photo");
      expect(s.logLines).to.deep.equal(["Uploading site photo"]);
    });

    it("increments percent monotonically, capped below 100", function () {
      const percents = [];
      for (let i = 0; i < 10; i++) {
        store.recordProgress("step " + i);
        percents.push(store.getState().percent);
      }
      for (let i = 1; i < percents.length; i++) {
        expect(percents[i]).to.be.at.least(percents[i - 1]);
      }
      expect(percents[percents.length - 1]).to.be.below(100);
      expect(percents[0]).to.be.greaterThan(0);
    });

    it("is ignored when not in the 'syncing' state", function () {
      store.recordSuccess();
      store.recordProgress("stale event");
      const s = store.getState();
      expect(s.status).to.equal("success");
      expect(s.logLines).to.deep.equal([]);
    });

    it("trims log lines past the cap so memory stays bounded", function () {
      for (let i = 0; i < 300; i++) store.recordProgress("line " + i);
      const s = store.getState();
      expect(s.logLines.length).to.be.at.most(200);
      expect(s.logLines[s.logLines.length - 1]).to.equal("line 299");
    });

    it("skips the log entry (but still notifies) when the message is empty", function () {
      store.recordProgress("");
      expect(store.getState().logLines).to.deep.equal([]);
    });
  });

  describe("recordSuccess()", function () {
    it("moves to 'success' with percent 100 and 'Sync complete' text", function () {
      store.recordStart();
      store.recordSuccess();
      const s = store.getState();
      expect(s.status).to.equal("success");
      expect(s.percent).to.equal(100);
      expect(s.statusText).to.equal("Sync complete");
    });
  });

  describe("recordError()", function () {
    it("moves to 'error' and captures the error message", function () {
      store.recordStart();
      store.recordError(new Error("server exploded"));
      const s = store.getState();
      expect(s.status).to.equal("error");
      expect(s.errorMessage).to.equal("server exploded");
    });

    it("tolerates a null/undefined error", function () {
      store.recordStart();
      store.recordError(null);
      expect(store.getState().status).to.equal("error");
      expect(store.getState().errorMessage).to.equal("");
    });
  });

  describe("recordOffline()", function () {
    it("moves to 'offline'", function () {
      store.recordOffline();
      expect(store.getState().status).to.equal("offline");
    });
  });

  describe("subscribe()", function () {
    it("returns an unsubscribe function that stops further notifications", function () {
      let calls = 0;
      const off = store.subscribe(() => calls++);
      store.recordStart();
      expect(calls).to.equal(1);
      off();
      store.recordSuccess();
      expect(calls).to.equal(1);
    });
  });
});
