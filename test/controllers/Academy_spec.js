require("mocha");
const { expect } = require("chai");
const createAcademyController = require("../../walta-app/app/lib/mvvm/controllers/Academy");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");

// A code box: a text field the keyboard can be handed to, recording the focus
// and blur the controller drives it with.
function makeCodeBox(keyboard, name) {
  return makeWidget({
    value: "",
    focus() { keyboard.push(name); },
    blur() { keyboard.push("dismissed"); },
  });
}

function makeView(keyboard) {
  return {
    digit1: makeCodeBox(keyboard, "digit1"),
    digit2: makeCodeBox(keyboard, "digit2"),
    digit3: makeCodeBox(keyboard, "digit3"),
    startButton: makeWidget({ enabled: null }),
    closeButton: makeBackboneTarget(),
    cancelButton: makeWidget({}),
  };
}

describe("Academy controller", function () {
  let view, closed, ctl, training, fired, services, keyboard;

  // Fake training service: records the started code, validates against a known set
  // (the Academy gates Start on isValidCode), and owns the session's tray/assessor
  // that the controller threads into the tray it opens.
  function fakeTraining(knownCodes) {
    const tray = { length: 0, taxa: () => [] };
    const assessor = { assess: () => ({}) };
    return {
      startedWith: null,
      tray, assessor,
      isValidCode(code) { return knownCodes.includes(code); },
      startTraining(code) { this.startedWith = code; return knownCodes.includes(code); },
      currentTray() { return tray; },
      currentAssessor() { return assessor; },
    };
  }

  beforeEach(function () {
    keyboard = [];
    view = makeView(keyboard);
    closed = 0;
    fired = [];
    training = fakeTraining(["789"]);
    services = {
      Training: training,
      topics: { TRAININGTRAY: "trainingtray", fireTopicEvent: (t, d) => fired.push({ t, d }) },
    };
    ctl = createAcademyController({ view, close: () => closed++, services, bindView: makeBinder() });
  });

  // A digit typed into a box: the native keyboard writes it and fires change.
  function typeInto(boxIndex, digit) {
    const box = view["digit" + (boxIndex + 1)];
    box.value = String(digit);
    box.fireEvent("change", { value: box.value });
  }

  function typeCode(a, b, c) {
    typeInto(0, a); typeInto(1, b); typeInto(2, c);
  }

  it("assembles the code from the digits typed into each box", function () {
    typeCode(1, 2, 3);
    expect(ctl.vm.code).to.equal("123");
  });

  it("hands the keyboard to the next box as each digit is typed", function () {
    typeInto(0, 1);
    typeInto(1, 2);
    expect(keyboard).to.deep.equal(["digit2", "digit3"]);
  });

  it("hands the keyboard back a box when a digit is deleted", function () {
    typeCode(1, 2, 3);
    keyboard.length = 0;
    typeInto(1, "");
    expect(keyboard).to.deep.equal(["digit1"]);
  });

  it("dismisses the keyboard once the last box is filled", function () {
    typeCode(1, 2, 3);
    expect(keyboard).to.deep.equal(["digit2", "digit3", "dismissed"]);
  });

  it("keeps Start disabled until the code is a valid exercise", function () {
    expect(view.startButton.enabled).to.equal(false);
    typeCode(1, 2, 3);   // not a known exercise
    expect(view.startButton.enabled).to.equal(false);
    typeCode(7, 8, 9);   // known
    expect(view.startButton.enabled).to.equal(true);
  });

  it("Start triggers the ViewModel start with the code", function () {
    typeCode(7, 8, 9);
    let started = null;
    ctl.vm.on("start", (code) => { started = code; });
    view.startButton.fireEvent("click");
    expect(started).to.equal("789");
  });

  it("Start launches training for a known code, then closes and opens the tray", function () {
    typeCode(7, 8, 9);
    view.startButton.fireEvent("click");
    expect(training.startedWith).to.equal("789");
    expect(closed).to.equal(1);
    // The session's tray and assessor are the route's business, not the modal's.
    expect(fired).to.deep.equal([{ t: "trainingtray", d: undefined }]);
  });

  it("does nothing when Start is tapped on an invalid (disabled) code", function () {
    typeCode(1, 2, 3);   // invalid → Start stays disabled, start() is a no-op
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
    typeInto(0, 7);
    expect(ctl.vm.code).to.equal("");
  });
});
