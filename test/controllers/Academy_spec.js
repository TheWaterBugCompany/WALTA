require("mocha");
const { expect } = require("chai");
const createAcademyController = require("../../walta-app/app/lib/controllers/Academy");

// Fake Ti widget: settable props + addEventListener/fireEvent.
function makeWidget(props) {
  const listeners = {};
  return Object.assign({
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
  }, props);
}

// Fake Alloy <Require> sub-controller (CloseButton): Backbone-style on/off.
function makeBackboneTarget() {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    trigger(name, data) { (listeners[name] || []).forEach(cb => cb(data)); },
  };
}

function makeView() {
  return {
    digit1: makeWidget({ value: "" }),
    digit2: makeWidget({ value: "" }),
    digit3: makeWidget({ value: "" }),
    startButton: makeWidget({ enabled: null }),
    closeButton: makeBackboneTarget(),
    cancelButton: makeWidget({}),
  };
}

describe("Academy controller", function () {
  let view, closed, ctl;

  beforeEach(function () {
    view = makeView();
    closed = 0;
    ctl = createAcademyController({ view, close: () => closed++, services: {} });
  });

  function typeCode(a, b, c) {
    view.digit1.fireEvent("change", { value: a });
    view.digit2.fireEvent("change", { value: b });
    view.digit3.fireEvent("change", { value: c });
  }

  it("feeds typed digits into the ViewModel code", function () {
    typeCode("1", "2", "3");
    expect(ctl.vm.code).to.equal("123");
  });

  it("disables Start until the code is complete", function () {
    expect(view.startButton.enabled).to.equal(false);
    typeCode("1", "2", "3");
    expect(view.startButton.enabled).to.equal(true);
  });

  it("Start triggers the ViewModel start with the code", function () {
    typeCode("7", "8", "9");
    let started = null;
    ctl.vm.on("start", (code) => { started = code; });
    view.startButton.fireEvent("click");
    expect(started).to.equal("789");
  });

  it("the ✕ (closeButton) asks the host to close", function () {
    view.closeButton.trigger("close");
    expect(closed).to.equal(1);
  });

  it("the Close button asks the host to close", function () {
    view.cancelButton.fireEvent("click");
    expect(closed).to.equal(1);
  });

  it("dispose stops further widget→VM updates", function () {
    ctl.dispose();
    view.digit1.fireEvent("change", { value: "5" });
    expect(ctl.vm.code).to.equal("");
  });
});
