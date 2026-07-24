require("mocha");
const { expect } = require("chai");
const AcademyViewModel = require("../../walta-app/app/lib/viewmodels/Academy");

describe("AcademyViewModel", function () {
  let vm;
  beforeEach(function () { vm = new AcademyViewModel(); });

  it("starts empty with Start disabled", function () {
    expect(vm.digit1).to.equal("");
    expect(vm.digit2).to.equal("");
    expect(vm.digit3).to.equal("");
    expect(vm.code).to.equal("");
    expect(vm.startEnabled).to.equal(false);
  });

  it("assembles the code from the three digits", function () {
    vm.digit1 = "1";
    vm.digit2 = "2";
    vm.digit3 = "3";
    expect(vm.code).to.equal("123");
  });

  it("enables Start only when all three digits are present", function () {
    vm.digit1 = "1";
    vm.digit2 = "2";
    expect(vm.startEnabled).to.equal(false);
    vm.digit3 = "3";
    expect(vm.startEnabled).to.equal(true);
  });

  it("keeps Start disabled when a box holds a non-digit", function () {
    vm.digit1 = "1";
    vm.digit2 = "x";
    vm.digit3 = "3";
    expect(vm.startEnabled).to.equal(false);
  });

  it("notifies listeners when a digit changes", function () {
    let notified = 0;
    vm.addListener(() => notified++);
    vm.digit1 = "1";
    expect(notified).to.equal(1);
  });

  it("does not notify when a digit is set to its current value", function () {
    vm.digit1 = "1";
    let notified = 0;
    vm.addListener(() => notified++);
    vm.digit1 = "1";
    expect(notified).to.equal(0);
  });

  it("triggers 'start' with the code when Start is enabled", function () {
    vm.digit1 = "4"; vm.digit2 = "5"; vm.digit3 = "6";
    let started = null;
    vm.on("start", (code) => { started = code; });
    vm.start();
    expect(started).to.equal("456");
  });

  it("does not trigger 'start' while the code is incomplete", function () {
    vm.digit1 = "4";
    let started = false;
    vm.on("start", () => { started = true; });
    vm.start();
    expect(started).to.equal(false);
  });

  it("triggers 'close' on close()", function () {
    let closed = false;
    vm.on("close", () => { closed = true; });
    vm.close();
    expect(closed).to.equal(true);
  });
});
