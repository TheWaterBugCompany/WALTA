require("mocha");
const { expect } = require("chai");
const SyncFeedbackViewModel = require("../../walta-app/app/lib/logic/viewmodels/SyncFeedback");

const TOPICS = {
  FORCE_UPLOAD: "forceupload",
  UPLOAD_PROGRESS: "uploadprogress",
  SYNC_STARTED: "syncstarted",
  SYNC_FINISHED: "syncfinished",
};

describe("SyncFeedbackViewModel", function () {
  let topics, network, vm;

  beforeEach(function () {
    topics = createFakeTopics();
    network = { isOnline: () => true };
    vm = new SyncFeedbackViewModel({ topics, network });
  });

  describe("initial state", function () {
    it("starts in the 'idle' status with no progress", function () {
      expect(vm.state.status).to.equal("idle");
      expect(vm.state.percent).to.equal(0);
      expect(vm.state.statusText).to.equal("");
      expect(vm.state.logVisible).to.equal(false);
      expect(vm.state.logLines).to.deep.equal([]);
    });
  });

  describe("start()", function () {
    it("fires FORCE_UPLOAD when the network is online", function () {
      vm.start();
      expect(topics.fired).to.deep.include({ topic: TOPICS.FORCE_UPLOAD, data: undefined });
    });

    it("stays in 'idle' after start() until SYNC_STARTED is received", function () {
      vm.start();
      expect(vm.state.status).to.equal("idle");
    });

    it("transitions to 'offline' and does not fire FORCE_UPLOAD when network is offline", function () {
      network.isOnline = () => false;
      vm.start();
      expect(vm.state.status).to.equal("offline");
      expect(topics.fired.filter(f => f.topic === TOPICS.FORCE_UPLOAD)).to.be.empty;
    });
  });

  describe("when SYNC_STARTED is received", function () {
    it("transitions to 'syncing' and resets progress", function () {
      topics.publish(TOPICS.SYNC_STARTED);
      expect(vm.state.status).to.equal("syncing");
      expect(vm.state.percent).to.equal(0);
      expect(vm.state.logLines).to.deep.equal([]);
    });

    it("notifies state subscribers", function () {
      const seen = [];
      vm.subscribe(s => seen.push(s.status));
      topics.publish(TOPICS.SYNC_STARTED);
      expect(seen).to.deep.equal(["syncing"]);
    });
  });

  describe("when UPLOAD_PROGRESS arrives during a sync", function () {
    beforeEach(function () { topics.publish(TOPICS.SYNC_STARTED); });

    it("updates statusText from the event's message and appends to logLines", function () {
      topics.publish(TOPICS.UPLOAD_PROGRESS, { id: 2834, message: "Uploading site photo" });
      expect(vm.state.statusText).to.equal("Uploading site photo");
      expect(vm.state.logLines).to.deep.equal(["Uploading site photo"]);
    });

    it("increments percent as more events arrive (monotonic, capped below 100)", function () {
      const percents = [];
      for (let i = 0; i < 6; i++) {
        topics.publish(TOPICS.UPLOAD_PROGRESS, { id: 1, message: `step ${i}` });
        percents.push(vm.state.percent);
      }
      expect(percents[0]).to.be.greaterThan(0);
      for (let i = 1; i < percents.length; i++) expect(percents[i]).to.be.at.least(percents[i - 1]);
      expect(percents[percents.length - 1]).to.be.below(100);
    });
  });

  describe("when SYNC_FINISHED is received", function () {
    beforeEach(function () { topics.publish(TOPICS.SYNC_STARTED); });

    it("transitions to 'success' with percent 100 when success=true", function () {
      topics.publish(TOPICS.SYNC_FINISHED, { success: true });
      expect(vm.state.status).to.equal("success");
      expect(vm.state.percent).to.equal(100);
      expect(vm.state.statusText).to.equal("Sync complete");
    });

    it("transitions to 'error' and captures the error message when success=false", function () {
      topics.publish(TOPICS.SYNC_FINISHED, { success: false, error: new Error("boom") });
      expect(vm.state.status).to.equal("error");
      expect(vm.state.errorMessage).to.equal("boom");
    });
  });

  describe("log visibility", function () {
    it("starts hidden and toggleLog() flips it", function () {
      expect(vm.state.logVisible).to.equal(false);
      vm.toggleLog();
      expect(vm.state.logVisible).to.equal(true);
      vm.toggleLog();
      expect(vm.state.logVisible).to.equal(false);
    });
  });

  describe("discrete events", function () {
    it("close() emits a 'close' event to listeners registered with on()", function () {
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
    it("unsubscribes from topics so later events don't mutate state", function () {
      vm.dispose();
      topics.publish(TOPICS.SYNC_STARTED);
      expect(vm.state.status).to.equal("idle");
    });
  });

  describe("subscribe()", function () {
    it("returns an unsubscribe function", function () {
      let calls = 0;
      const off = vm.subscribe(() => calls++);
      topics.publish(TOPICS.SYNC_STARTED);
      expect(calls).to.equal(1);
      off();
      topics.publish(TOPICS.UPLOAD_PROGRESS, { id: 1, message: "m" });
      expect(calls).to.equal(1);
    });
  });
});

function createFakeTopics() {
  const subscribers = {};
  const fired = [];
  return {
    subscribe(topic, cb) {
      (subscribers[topic] = subscribers[topic] || []).push(cb);
    },
    unsubscribe(topic, cb) {
      if (subscribers[topic]) subscribers[topic] = subscribers[topic].filter(s => s !== cb);
    },
    fireTopicEvent(topic, data) {
      fired.push({ topic, data });
    },
    publish(topic, data) {
      (subscribers[topic] || []).forEach(cb => cb(data));
    },
    fired,
  };
}
