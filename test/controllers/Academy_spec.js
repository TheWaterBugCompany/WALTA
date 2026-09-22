require("mocha");
const { expect } = require("chai");
const createAcademyController = require("../../walta-app/app/lib/mvvm/controllers/Academy");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");
const Belts = require("../../walta-app/app/lib/logic/Belts");

// A widget that can take a mounted child, which makeWidget alone cannot.
function makeContainer() {
  const widget = makeWidget({ visible: false });
  widget.children = [];
  widget.add = (child) => widget.children.push(child);
  widget.remove = (child) => { widget.children = widget.children.filter((c) => c !== child); };
  return widget;
}

function makeView() {
  return {
    currentMessage: makeWidget({ text: "" }),
    currentBelt: makeContainer(),
    nextMessage: makeWidget({ text: "", visible: false }),
    nextBelt: makeContainer(),
    startButton: makeWidget({ enabled: null }),
    closeButton: makeBackboneTarget(),
    cancelButton: makeWidget({}),
  };
}

// Stands in for View.createComponent. The real factory binds the child to this
// view-model, so a null one is a failure on device however harmless it is here.
function makeComponentFactory(mounted) {
  return function (name, { rowVm }) {
    if (!rowVm) throw new Error(`component ${name} mounted with no view-model`);
    const handle = { name, rowVm, view: { name } };
    mounted.push(handle);
    return handle;
  };
}

describe("Academy controller", function () {
  let view, closed, ctl, training, fired, mounted;

  // Fake training service: records the started code and validates against the
  // courses actually written (the Academy gates Start on isValidCode).
  function fakeTraining(knownCodes) {
    return {
      startedWith: null,
      isValidCode(code) { return knownCodes.includes(code); },
      startTraining(code) { this.startedWith = code; return knownCodes.includes(code); },
    };
  }

  function build({ level = 0, written = ["101"] } = {}) {
    view = makeView();
    closed = 0;
    fired = [];
    mounted = [];
    training = fakeTraining(written);
    ctl = createAcademyController({
      view,
      close: () => closed++,
      services: {
        Training: training,
        belts: { currentLevel: () => level },
        topics: { TRAININGTRAY: "trainingtray", fireTopicEvent: (t, d) => fired.push({ t, d }) },
      },
      bindView: makeBinder(makeComponentFactory(mounted)),
    });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
  });

  it("tells a new trainee which belt they are starting from", function () {
    build({ level: 0 });
    expect(view.currentMessage.text).to.equal("You are currently a white belt:");
  });

  it("names the belt already earned", function () {
    build({ level: 1 });
    expect(view.currentMessage.text).to.equal("You are currently a white with yellow tip belt:");
  });

  it("offers the belt the next course earns", function () {
    build({ level: 0 });
    expect(view.nextMessage.text).to.equal("Complete your next course to earn a white with yellow tip belt:");
    expect(view.nextMessage.visible).to.equal(true);
    expect(view.nextBelt.visible).to.equal(true);
  });

  it("draws both belts", function () {
    build({ level: 0 });
    expect(mounted.map((m) => m.name)).to.deep.equal(["Belt", "Belt"]);
    expect(mounted[0].rowVm.color).to.equal(Belts.STARTING.color);
    expect(mounted[1].rowVm.tipColor).to.equal(Belts.at(1).tipColor);
  });

  it("drops the next-belt half of the screen once the highest belt is held", function () {
    build({ level: Belts.HIGHEST });
    expect(view.nextMessage.visible).to.equal(false);
    expect(view.nextBelt.visible).to.equal(false);
    expect(view.startButton.enabled).to.equal(false);
  });

  it("offers Start only for a course that has been written", function () {
    build({ level: 0 });
    expect(view.startButton.enabled).to.equal(true);
    build({ level: 1 });
    expect(view.startButton.enabled).to.equal(false);
  });

  it("Start launches the course for the next belt, then closes and opens the tray", function () {
    build({ level: 0 });
    view.startButton.fireEvent("click");
    expect(training.startedWith).to.equal("101");
    expect(closed).to.equal(1);
    // The session's tray and assessor are the route's business, not the modal's.
    expect(fired).to.deep.equal([{ t: "trainingtray", d: undefined }]);
  });

  it("does nothing when Start is tapped on an unwritten (disabled) course", function () {
    build({ level: 1 });
    view.startButton.fireEvent("click");
    expect(training.startedWith).to.equal(null);
    expect(closed).to.equal(0);
    expect(fired).to.have.length(0);
  });

  it("the ✕ (closeButton) asks the host to close", function () {
    build();
    view.closeButton.trigger("close");
    expect(closed).to.equal(1);
  });

  it("the Close button asks the host to close", function () {
    build();
    view.cancelButton.fireEvent("click");
    expect(closed).to.equal(1);
  });
});
