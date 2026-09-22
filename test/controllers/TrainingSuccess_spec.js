require("mocha");
const { expect } = require("chai");
const createTrainingSuccessController = require("../../walta-app/app/lib/mvvm/controllers/TrainingSuccess");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");
const Topics = require("../../walta-app/app/lib/ui/Topics");

function makeView() {
  return {
    successMessage: makeWidget({ text: "" }),
    beltMessage: makeWidget({ text: "", visible: false }),
    beltHolder: makeContainer(),
    finishButton: makeWidget({}),
    closeButton: makeBackboneTarget(),
  };
}

// A widget that can take a mounted child, which makeWidget alone cannot.
function makeContainer(props) {
  const widget = makeWidget(Object.assign({ visible: false }, props));
  widget.children = [];
  widget.add = (child) => widget.children.push(child);
  widget.remove = (child) => { widget.children = widget.children.filter((c) => c !== child); };
  return widget;
}

// Stands in for View.createComponent, recording which component a screen asked
// for and the view-model it handed over.
function makeComponentFactory(mounted) {
  return function (name, { rowVm }) {
    // The real factory binds the child to this view-model, so a null one is a
    // failure on device however harmless it looks here.
    if (!rowVm) throw new Error(`component ${name} mounted with no view-model`);
    const handle = { name, rowVm, view: { name } };
    mounted.push(handle);
    return handle;
  };
}

describe("TrainingSuccess controller", function () {
  let view, closed, ctl, mounted;

  function build(args, belt = null) {
    view = makeView();
    closed = 0;
    mounted = [];
    ctl = createTrainingSuccessController({
      view,
      close: () => closed++,
      services: { topics: Topics, belts: { currentBelt: () => belt } },
      bindView: makeBinder(makeComponentFactory(mounted)),
      args,
    });
  }

  afterEach(function () {
    if (ctl) ctl.dispose();
    ctl = null;
    Topics.reset();
  });

  it("renders the congratulation message with the correct count", function () {
    build({ correctCount: 6 });
    expect(view.successMessage.text).to.equal("Well done! You've identified the 6 correct creatures!");
  });

  it("names the belt the session just earned and shows it", function () {
    build({ correctCount: 6 }, { color: "#FFFFFF", tipColor: "#FEFF46" });
    expect(view.beltMessage.text).to.equal("You've earned your white with yellow tip belt:");
    expect(view.beltMessage.visible).to.equal(true);
    expect(view.beltHolder.visible).to.equal(true);
    expect(mounted.map((m) => m.name)).to.deep.equal(["Belt"]);
    expect(mounted[0].rowVm.color).to.equal("#FFFFFF");
  });

  it("drops the belt half of the screen when the session carries none", function () {
    build({ correctCount: 6 }, null);
    expect(view.beltMessage.visible).to.equal(false);
    expect(view.beltHolder.visible).to.equal(false);
    expect(mounted[0].rowVm.color, "a hidden belt still has a view-model").to.equal(null);
  });

  it("Finish returns to the main menu and closes", function () {
    build({ correctCount: 4 });
    let home = false;
    Topics.subscribe(Topics.HOME, () => { home = true; });
    view.finishButton.fireEvent("click");
    expect(home).to.equal(true);
    expect(closed).to.equal(1);
  });

  it("the ✕ dismisses without navigating", function () {
    build({ correctCount: 4 });
    let home = false;
    Topics.subscribe(Topics.HOME, () => { home = true; });
    view.closeButton.trigger("close");
    expect(closed).to.equal(1);
    expect(home).to.equal(false);
  });

  it("stops responding after dispose", function () {
    build({ correctCount: 4 });
    ctl.dispose();
    ctl = null;
    let home = false;
    Topics.subscribe(Topics.HOME, () => { home = true; });
    view.finishButton.fireEvent("click");
    expect(home).to.equal(false);
  });
});
