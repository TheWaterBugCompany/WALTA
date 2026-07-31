require("mocha");
const { expect } = require("chai");
const createSampleEditMenuController = require("../../walta-app/app/lib/mvvm/controllers/SampleEditMenu");

// Fake Alloy controller: Backbone-style on/off/trigger.
function makeView() {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    trigger(name) { (listeners[name] || []).slice().forEach(cb => cb()); },
  };
}

describe("SampleEditMenu controller", function () {
  it("closes the modal when the overlay asks to close", function () {
    const view = makeView();
    let closed = 0;
    const ctl = createSampleEditMenuController({ view, close: () => closed++ });
    view.trigger("close");
    expect(closed).to.equal(1);
  });

  it("stops routing close after dispose", function () {
    const view = makeView();
    let closed = 0;
    const ctl = createSampleEditMenuController({ view, close: () => closed++ });
    ctl.dispose();
    view.trigger("close");
    expect(closed).to.equal(0);
  });
});
