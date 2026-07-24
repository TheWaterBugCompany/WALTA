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
  const view = {
    digit1: makeWidget({ title: "" }),
    digit2: makeWidget({ title: "" }),
    digit3: makeWidget({ title: "" }),
    digitPicker: makeWidget({ visible: null }),
    startButton: makeWidget({ enabled: null }),
    closeButton: makeBackboneTarget(),
    cancelButton: makeWidget({}),
  };
  for (let d = 0; d <= 9; d++) view["keypad" + d] = makeWidget({});
  return view;
}

describe("Academy controller", function () {
  let view, closed, ctl;

  beforeEach(function () {
    view = makeView();
    closed = 0;
    ctl = createAcademyController({ view, close: () => closed++, services: {} });
  });

  // Tap a box, then tap a digit key — the picker flow that replaces typing.
  function pick(boxIndex, digit) {
    view["digit" + (boxIndex + 1)].fireEvent("click");
    view["keypad" + digit].fireEvent("click");
  }

  function pickCode(a, b, c) {
    pick(0, a); pick(1, b); pick(2, c);
  }

  it("hides the picker until a box is tapped", function () {
    expect(view.digitPicker.visible).to.equal(false);
    view.digit1.fireEvent("click");
    expect(view.digitPicker.visible).to.equal(true);
  });

  it("fills the tapped box with the picked digit and hides the picker", function () {
    pick(0, 5);
    expect(view.digit1.title).to.equal("5");
    expect(view.digitPicker.visible).to.equal(false);
  });

  it("tapping the picker backdrop cancels editing without changing digits", function () {
    view.digit1.fireEvent("click");
    view.digitPicker.fireEvent("click");
    expect(view.digitPicker.visible).to.equal(false);
    expect(ctl.vm.code).to.equal("");
  });

  it("assembles the code from digits picked into each box", function () {
    pickCode(1, 2, 3);
    expect(ctl.vm.code).to.equal("123");
  });

  it("disables Start until the code is complete", function () {
    expect(view.startButton.enabled).to.equal(false);
    pickCode(1, 2, 3);
    expect(view.startButton.enabled).to.equal(true);
  });

  it("Start triggers the ViewModel start with the code", function () {
    pickCode(7, 8, 9);
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

  it("dispose stops further box→VM updates", function () {
    ctl.dispose();
    view.digit1.fireEvent("click");
    expect(ctl.vm.pickerVisible).to.equal(false);
  });
});
