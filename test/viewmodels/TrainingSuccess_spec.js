require("mocha");
const { expect } = require("chai");
const TrainingSuccessViewModel = require("../../walta-app/app/lib/viewmodels/TrainingSuccess");
const Topics = require("../../walta-app/app/lib/ui/Topics");

describe("TrainingSuccessViewModel", function () {
  afterEach(function () { Topics.reset(); });

  function build(args) {
    return new TrainingSuccessViewModel(Object.assign({ topics: Topics }, args));
  }

  it("congratulates the trainee with the number of correct creatures", function () {
    expect(build({ correctCount: 6 }).message)
      .to.equal("Well done! You've identified the 6 correct creatures!");
  });

  it("uses the singular when only one creature was correct", function () {
    expect(build({ correctCount: 1 }).message)
      .to.equal("Well done! You've identified the 1 correct creature!");
  });

  it("returns to the main menu and closes when Finish is pressed", function () {
    const vm = build({ correctCount: 4 });
    let home = false;
    Topics.subscribe(Topics.HOME, () => { home = true; });
    let closed = 0;
    vm.on("close", () => closed++);
    vm.finish();
    expect(home).to.equal(true);
    expect(closed).to.equal(1);
  });

  it("just closes when the modal is dismissed — no navigation", function () {
    const vm = build({ correctCount: 4 });
    let home = false;
    Topics.subscribe(Topics.HOME, () => { home = true; });
    let closed = 0;
    vm.on("close", () => closed++);
    vm.close();
    expect(closed).to.equal(1);
    expect(home).to.equal(false);
  });
});
