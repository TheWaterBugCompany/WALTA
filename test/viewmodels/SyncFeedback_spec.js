require("mocha");
const { expect } = require("chai");
const SyncFeedbackViewModel = require("../../walta-app/app/lib/logic/viewmodels/SyncFeedback");

describe("SyncFeedbackViewModel", function () {
  describe("initial state", function () {
    it("starts in the 'idle' status with no progress", function () {
      const vm = new SyncFeedbackViewModel({ topics: fakeTopics() });
      expect(vm.state.status).to.equal("idle");
      expect(vm.state.percent).to.equal(0);
      expect(vm.state.statusText).to.equal("");
      expect(vm.state.logVisible).to.equal(false);
      expect(vm.state.logLines).to.deep.equal([]);
    });
  });
});

function fakeTopics() {
  return {
    subscribe() {},
    unsubscribe() {},
    fireTopicEvent() {},
  };
}
