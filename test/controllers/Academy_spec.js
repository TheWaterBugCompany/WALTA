require("mocha");
const { expect } = require("chai");
const createAcademyController = require("../../walta-app/app/lib/mvvm/controllers/Academy");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");

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
  let view, closed, ctl, training, fired, services;

  // Fake training service: records the started code and validates against a known
  // set (the Academy gates Start on isValidCode).
  function fakeTraining(knownCodes) {
    return {
      startedWith: null,
      isValidCode(code) { return knownCodes.includes(code); },
      startTraining(code) { this.startedWith = code; return knownCodes.includes(code); },
    };
  }

  beforeEach(function () {
    view = makeView();
    closed = 0;
    fired = [];
    training = fakeTraining(["789"]);
    services = {
      Training: training,
      topics: { SAMPLETRAY: "sampletray", fireTopicEvent: (t, d) => fired.push({ t, d }) },
    };
    ctl = createAcademyController({ view, close: () => closed++, services, bindView: makeBinder() });
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

  it("keeps Start disabled until the code is a valid exercise", function () {
    expect(view.startButton.enabled).to.equal(false);
    pickCode(1, 2, 3);   // not a known exercise
    expect(view.startButton.enabled).to.equal(false);
    pickCode(7, 8, 9);   // known
    expect(view.startButton.enabled).to.equal(true);
  });

  it("Start triggers the ViewModel start with the code", function () {
    pickCode(7, 8, 9);
    let started = null;
    ctl.vm.on("start", (code) => { started = code; });
    view.startButton.fireEvent("click");
    expect(started).to.equal("789");
  });

  it("Start launches training for a known code, then closes and opens the tray", function () {
    pickCode(7, 8, 9);
    view.startButton.fireEvent("click");
    expect(training.startedWith).to.equal("789");
    expect(closed).to.equal(1);
    expect(fired).to.deep.equal([{ t: "sampletray", d: {} }]);
  });

  it("does nothing when Start is tapped on an invalid (disabled) code", function () {
    pickCode(1, 2, 3);   // invalid → Start stays disabled, start() is a no-op
    view.startButton.fireEvent("click");
    expect(training.startedWith).to.equal(null);
    expect(closed).to.equal(0);
    expect(fired).to.have.length(0);
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
