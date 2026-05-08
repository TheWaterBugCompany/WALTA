require("mocha");
const { expect } = require("chai");
const SyncStore = require("../../walta-app/app/lib/models/SyncStore");
const Logger = require("../../walta-app/app/lib/util/Logger");

describe("SyncStore", function () {
  let store;

  beforeEach(function () {
    store = new SyncStore();
  });

  afterEach(function () {
    if (store) store.dispose();
  });

  describe("initial state", function () {
    it("starts 'idle' with no progress, no log, no error", function () {
      expect(store.status).to.equal("idle");
      expect(store.percent).to.equal(0);
      expect(store.statusText).to.equal("");
      expect(store.logLines).to.deep.equal([]);
      expect(store.errorMessage).to.equal(null);
      expect(store.hasErrors).to.equal(false);
    });
  });

  describe("hasErrors (Logger error during syncing window)", function () {
    it("flips to true when Logger.error fires on facility=sync while syncing", function () {
      store.recordStart();
      Logger.error("Failed to download photo", "sync");
      expect(store.hasErrors).to.equal(true);
    });

    it("ignores Logger.error before recordStart (stale errors don't poison the next run)", function () {
      Logger.error("Failed to download photo", "sync");
      expect(store.hasErrors).to.equal(false);
    });

    it("ignores errors on other facilities", function () {
      store.recordStart();
      Logger.error("Network down", "auth");
      expect(store.hasErrors).to.equal(false);
    });

    it("ignores warn-level entries (only error counts as a sync failure)", function () {
      store.recordStart();
      Logger.warn("Missing photo on server", "sync");
      expect(store.hasErrors).to.equal(false);
    });

    it("recordStart resets hasErrors so a fresh sync starts clean", function () {
      store.recordStart();
      Logger.error("boom", "sync");
      expect(store.hasErrors).to.equal(true);
      store.recordStart();
      expect(store.hasErrors).to.equal(false);
    });

    it("recordSuccess preserves hasErrors so the UI can flag a partial-success run", function () {
      store.recordStart();
      Logger.error("boom", "sync");
      store.recordSuccess();
      expect(store.hasErrors).to.equal(true);
    });
  });

  describe("dispose()", function () {
    it("unsubscribes from Logger so post-dispose entries don't flip hasErrors", function () {
      store.recordStart();
      store.dispose();
      Logger.error("late", "sync");
      expect(store.hasErrors).to.equal(false);
      store = null;
    });
  });

  describe("recordStart()", function () {
    it("transitions to 'syncing' and resets progress/log/error", function () {
      store.recordError(new Error("boom"));
      store.recordStart();
      expect(store.status).to.equal("syncing");
      expect(store.percent).to.equal(0);
      expect(store.logLines).to.deep.equal([]);
      expect(store.errorMessage).to.equal(null);
    });

    it("seeds statusText so the UI isn't bare before the first progress milestone", function () {
      store.recordStart();
      expect(store.statusText).to.equal("Starting sync");
    });

    it("notifies listeners", function () {
      const seen = [];
      store.addListener(() => seen.push(store.status));
      store.recordStart();
      expect(seen).to.deep.equal(["syncing"]);
    });
  });

  describe("recordProgress()", function () {
    beforeEach(function () { store.recordStart(); });

    it("appends a log line and updates statusText", function () {
      store.recordProgress("Uploading site photo");
      expect(store.statusText).to.equal("Uploading site photo");
      expect(store.logLines).to.deep.equal(["Uploading site photo"]);
    });

    it("increments percent monotonically, capped below 100", function () {
      const percents = [];
      for (let i = 0; i < 10; i++) {
        store.recordProgress("step " + i);
        percents.push(store.percent);
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
      expect(store.status).to.equal("success");
      expect(store.logLines).to.deep.equal([]);
    });

    it("trims log lines past the cap so memory stays bounded", function () {
      for (let i = 0; i < 300; i++) store.recordProgress("line " + i);
      expect(store.logLines.length).to.be.at.most(200);
      expect(store.logLines[store.logLines.length - 1]).to.equal("line 299");
    });

    it("skips the log entry (but still notifies) when the message is empty", function () {
      store.recordProgress("");
      expect(store.logLines).to.deep.equal([]);
    });
  });

  describe("recordSuccess()", function () {
    it("moves to 'success' with percent 100 and 'Sync complete' text", function () {
      store.recordStart();
      store.recordSuccess();
      expect(store.status).to.equal("success");
      expect(store.percent).to.equal(100);
      expect(store.statusText).to.equal("Sync complete");
    });
  });

  describe("recordError()", function () {
    it("moves to 'error' and captures the error message", function () {
      store.recordStart();
      store.recordError(new Error("server exploded"));
      expect(store.status).to.equal("error");
      expect(store.errorMessage).to.equal("server exploded");
    });

    it("tolerates a null/undefined error", function () {
      store.recordStart();
      store.recordError(null);
      expect(store.status).to.equal("error");
      expect(store.errorMessage).to.equal("");
    });
  });

  describe("recordOffline()", function () {
    it("moves to 'offline'", function () {
      store.recordOffline();
      expect(store.status).to.equal("offline");
    });
  });

  describe("addListener()/removeListener()", function () {
    it("removeListener stops further notifications", function () {
      let calls = 0;
      const cb = () => calls++;
      store.addListener(cb);
      store.recordStart();
      expect(calls).to.equal(1);
      store.removeListener(cb);
      store.recordSuccess();
      expect(calls).to.equal(1);
    });
  });
});
