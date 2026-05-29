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
    it("starts 'idle' with no progress, no headline, no error", function () {
      expect(store.status).to.equal("idle");
      expect(store.percent).to.equal(0);
      expect(store.statusText).to.equal("");
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
    it("transitions to 'syncing' and resets progress/error/headline", function () {
      store.recordError(new Error("boom"));
      store.recordStart();
      expect(store.status).to.equal("syncing");
      expect(store.percent).to.equal(0);
      expect(store.statusText).to.equal("");
      expect(store.errorMessage).to.equal(null);
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

    it("sets statusText from the publisher's terse step message", function () {
      store.recordProgress("Uploading site photo");
      expect(store.statusText).to.equal("Uploading site photo");
    });

    it("sets percent from the current/total work fraction", function () {
      store.recordProgress("downloading", { current: 1, total: 4 });
      expect(store.percent).to.equal(25);
      store.recordProgress("downloading", { current: 2, total: 4 });
      expect(store.percent).to.equal(50);
      store.recordProgress("downloading", { current: 3, total: 4 });
      expect(store.percent).to.equal(75);
    });

    it("caps percent below 100 until recordSuccess, even when all work is done", function () {
      store.recordProgress("last item", { current: 4, total: 4 });
      expect(store.percent).to.be.below(100);
      store.recordSuccess();
      expect(store.percent).to.equal(100);
    });

    it("advances percent without disturbing statusText for a percent-only tick (no message)", function () {
      store.recordProgress("Downloading samples", { current: 1, total: 4 });
      store.recordProgress(undefined, { current: 2, total: 4 });
      expect(store.percent).to.equal(50);
      expect(store.statusText).to.equal("Downloading samples");
    });

    it("is ignored when not in the 'syncing' state", function () {
      store.recordSuccess();
      store.recordProgress("stale", { current: 1, total: 4 });
      expect(store.status).to.equal("success");
      expect(store.percent).to.equal(100);
      expect(store.statusText).to.equal("");
    });
  });

  describe("recordSuccess()", function () {
    it("moves to 'success' with percent 100 and clears the step headline", function () {
      store.recordStart();
      store.recordProgress("Uploading taxa 12 photo", { current: 4, total: 4 });
      store.recordSuccess();
      expect(store.status).to.equal("success");
      expect(store.percent).to.equal(100);
      expect(store.statusText).to.equal("");
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
