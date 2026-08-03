require("mocha");
const { expect } = require("chai");
const createSyncFeedback = require("../../walta-app/app/lib/mvvm/controllers/SyncFeedback");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// The SyncFeedback modal's Titanium-free lib controller: it starts the sync when
// the modal opens and closes itself when the session ends, so SampleHistory no
// longer owns any of that. The Ti view + its bindView stay in the Alloy shell.
function makeView() {
  return { started: 0, start() { this.started++; } };
}

describe("SyncFeedback modal controller", function () {
  afterEach(function () { Topics.reset(); });

  it("starts the sync when the modal opens", function () {
    const view = makeView();
    createSyncFeedback({ view, close: () => {}, services: { topics: Topics } });
    expect(view.started).to.equal(1);
  });

  it("closes itself when the session logs out", function () {
    const view = makeView();
    let closed = 0;
    createSyncFeedback({ view, close: () => { closed++; }, services: { topics: Topics } });
    Topics.fireTopicEvent(Topics.LOGGEDOUT, null);
    expect(closed).to.equal(1);
  });

  it("stops listening for logout after dispose", function () {
    const view = makeView();
    let closed = 0;
    const lib = createSyncFeedback({ view, close: () => { closed++; }, services: { topics: Topics } });
    lib.dispose();
    Topics.fireTopicEvent(Topics.LOGGEDOUT, null);
    expect(closed).to.equal(0);
  });
});
