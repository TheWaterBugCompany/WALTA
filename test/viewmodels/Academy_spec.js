require("mocha");
const { expect } = require("chai");
const AcademyViewModel = require("../../walta-app/app/lib/mvvm/viewmodels/Academy");
const Palette = require("../../walta-app/app/lib/util/Palette");
const Belts = require("../../walta-app/app/lib/logic/Belts");

describe("AcademyViewModel", function () {

  // Courses run 101..110, one per belt level. Only the first is written, which
  // is what the default validator says.
  function build({ level = 0, written = ["101"] } = {}) {
    return new AcademyViewModel({
      level,
      isValidCode: (code) => written.indexOf(code) >= 0,
    });
  }

  it("names the belt a new trainee is starting from", function () {
    const vm = build({ level: 0 });
    expect(vm.currentMessage).to.equal("You are currently a white belt:");
    expect(vm.currentBeltVm.color).to.equal(Belts.STARTING.color);
  });

  it("names the belt already earned", function () {
    const vm = build({ level: 1 });
    expect(vm.currentMessage).to.equal("You are currently a white with yellow tip belt:");
    expect(vm.currentBeltVm.tipColor).to.equal(Belts.at(1).tipColor);
  });

  it("offers the belt the next course earns", function () {
    const vm = build({ level: 0 });
    expect(vm.nextMessage).to.equal("Complete your next course to earn a white with yellow tip belt:");
    expect(vm.nextBeltVm.tipColor).to.equal(Belts.at(1).tipColor);
  });

  it("starts the course that earns the next belt", function () {
    const vm = build({ level: 0 });
    let started = null;
    vm.on("start", (code) => { started = code; });
    vm.start();
    expect(started).to.equal("101");
  });

  it("offers Start only for a course that has been written", function () {
    expect(build({ level: 0 }).startEnabled).to.equal(true);
    expect(build({ level: 1 }).startEnabled).to.equal(false);
  });

  it("greys Start out when the next course is unwritten", function () {
    expect(build({ level: 0 }).startColor).to.equal(Palette.success);
    expect(build({ level: 1 }).startColor).to.equal(Palette.disabled);
  });

  it("does nothing when Start is pressed on an unwritten course", function () {
    const vm = build({ level: 1 });
    let started = null;
    vm.on("start", (code) => { started = code; });
    vm.start();
    expect(started).to.equal(null);
  });

  // Nothing above the last belt, so the screen has no next course to offer and
  // no belt to draw for one.
  it("has no next belt once the highest is held", function () {
    const vm = build({ level: Belts.HIGHEST });
    expect(vm.nextVisible).to.equal(false);
    expect(vm.startEnabled).to.equal(false);
  });

  it("shows the next belt while there is one to earn", function () {
    expect(build({ level: 0 }).nextVisible).to.equal(true);
  });

  it("closes when asked", function () {
    const vm = build();
    let closed = 0;
    vm.on("close", () => closed++);
    vm.close();
    expect(closed).to.equal(1);
  });

});
