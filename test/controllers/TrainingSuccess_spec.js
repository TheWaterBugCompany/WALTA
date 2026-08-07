require("mocha");
const { expect } = require("chai");
const createTrainingSuccessController = require("../../walta-app/app/lib/mvvm/controllers/TrainingSuccess");
const { makeBinder } = require("../../walta-app/app/lib/util/bindView");
const { makeWidget, makeBackboneTarget } = require("../fixtures/fakeWidgets");
const Topics = require("../../walta-app/app/lib/ui/Topics");

function makeView() {
  return {
    successMessage: makeWidget({ text: "" }),
    finishButton: makeWidget({}),
    closeButton: makeBackboneTarget(),
  };
}

describe("TrainingSuccess controller", function () {
  let view, closed, ctl;

  function build(args) {
    view = makeView();
    closed = 0;
    ctl = createTrainingSuccessController({
      view,
      close: () => closed++,
      services: { topics: Topics },
      bindView: makeBinder(),
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
