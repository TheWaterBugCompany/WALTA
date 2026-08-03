require("mocha");
const { expect } = require("chai");
const createSyncFeedback = require("../../walta-app/app/lib/mvvm/controllers/SyncFeedback");
const Topics = require("../../walta-app/app/lib/ui/Topics");

// The SyncFeedback modal's Titanium-free lib controller: it starts the sync when
// the modal opens, closes the modal when the user taps a close button (the Alloy
// shell fires the view's "close" event), and closes itself when the session
// ends. The Ti view + its bindView stay in the Alloy shell.
function makeView() {
  const listeners = {};
  return {
    started: 0,
    start() { this.started++; },
    on(e, cb) { (listeners[e] = listeners[e] || []).push(cb); },
    off(e, cb) { listeners[e] = (listeners[e] || []).filter(l => l !== cb); },
    trigger(e) { (listeners[e] || []).slice().forEach(cb => cb()); },
  };
}

describe("SyncFeedback modal controller", function () {
  afterEach(function () { Topics.reset(); });

  it("starts the sync when the modal opens", function () {
    const view = makeView();
    createSyncFeedback({ view, close: () => {}, services: { topics: Topics } });
    expect(view.started).to.equal(1);
  });

  it("closes the modal when a close button fires the view's close event", function () {
    const view = makeView();
    let closed = 0;
    createSyncFeedback({ view, close: () => { closed++; }, services: { topics: Topics } });
    view.trigger("close");
    expect(closed).to.equal(1);
  });

  it("stops closing on the view's close event after dispose", function () {
    const view = makeView();
    let closed = 0;
    const lib = createSyncFeedback({ view, close: () => { closed++; }, services: { topics: Topics } });
    lib.dispose();
    view.trigger("close");
    expect(closed).to.equal(0);
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
